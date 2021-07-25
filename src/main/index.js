import { app, BrowserWindow, ipcMain, webContents, nativeTheme, dialog, screen, TouchBar, Menu, MenuItem, shell } from 'electron'
import { create } from 'domain'
const menu = require('./menu.js').menu
const log = require('electron-log')
const moment = require('moment')
const { exec } = require('child_process')
const axios = require('axios')
var compareVersions = require('compare-versions')
const Store = require('electron-store')
const Nucleus = require('nucleus-nodejs')
var nodeStatic = require('node-static')
const { networkInterfaces } = require('os')
const fs = require('fs')
const path = require('path')

const store = new Store()
var config = store.get('VTKounterConfig', getDefaultConfig())
if (config.apps === undefined || config.webserver === undefined) {
  config = getDefaultConfig()
  log.info('Resetting config as structure has changed: Lazy migration...')
}

const callback = {
  onReceiveSuccess: appSuccess,
  onReceiveError: appError,
}

const appsFolder = path.join(__dirname,'./apps')
var apps = {}
var appControls = {}

fs.readdirSync(appsFolder).forEach(file => {
  let name = path.parse(file).name
  let vtApp = require(`./apps/${name}`)
  apps[name] = new vtApp(config.apps[name].config, callback)

  appControls[name] = {
    name: apps[name].name,
    longName: apps[name].longName,
    notes: apps[name].notes,
    controls: apps[name].controls
  }
})

console.log(appControls)

const OBSWebSocket = require('obs-websocket-js')
const obs = new OBSWebSocket()

if (process.env.NODE_ENV !== 'development') {
  global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\')
  log.info('Running in production mode')
}

process.on('uncaughtException', function (error) {
  if (process.env.NODE_ENV === 'development') {
    dialog.showErrorBox('Unexpected Error', error + '\r\n\r\n' + JSON.stringify(error))
  }
  log.warn('Error: ', error)
})

let controlWindow

function createWindow () {
  log.info('Showing control window')
  const winURL = process.env.NODE_ENV === 'development' ? `http://localhost:9080` : `file://${__dirname}/index.html`

  controlWindow = new BrowserWindow({ show: false, height: 450, resizable: false, maximizable: false, useContentSize: true, width: 540, webPreferences: { nodeIntegration: true } })

  if (process.platform == 'darwin') {
    Menu.setApplicationMenu(menu)
  } else {
    Menu.setApplicationMenu(null)
  }
  
  controlWindow.loadURL(winURL)

  controlWindow.once('ready-to-show', () => {
    controlWindow.show()
  })

  controlWindow.on('closed', (event) => { 
    if (child != null) {
      child.kill()
      log.verbose('killing old process')
    }
    event.preventDefault()
    app.quit()
   })
}

app.on('ready', function() {
  log.info('Launching VT Kounter')
  createWindow()

  if (!store.has('VTKounterInstallID')) {
    let newId = UUID()
    log.info('First Runtime and created Install ID: ' + newId)
    store.set('VTKounterInstallID', newId)
  }
  Nucleus.setUserId(store.get('VTKounterInstallID'))
  log.info('Install ID: ' + store.get('VTKounterInstallID'))
  Nucleus.init('60a11e942bb3f447cc2a48a0', { disableInDev: false })
  Nucleus.appStarted()

})

app.on('activate', () => {
  if (controlWindow === null) {
    createWindow()
  }
})

function getDefaultConfig() {
  let defaultConfig = require('./defaultConfig.json')
  return defaultConfig
}


//========================//
//       IPC Handlers     //
//========================//
ipcMain.on('controlResize', (event, w, h) => {
  controlWindow.setContentSize(540, h)
})

ipcMain.on('openLogs', (event, w, h) => {
  const path = log.transports.file.findLogPath()
  shell.showItemInFolder(path)
  Nucleus.track('Open Logs')
})

ipcMain.on('getConfig', (event) => {
  controlWindow.webContents.send('config', config)
  controlWindow.webContents.send('appControls', appControls)
  controlWindow.webContents.send('darkMode', nativeTheme.shouldUseDarkColors)
})

ipcMain.on('factoryReset', () => {
  controlWindow.webContents.send('config', getDefaultConfig())
  Nucleus.track('Factory Reset')
})

ipcMain.on('networkInfo', (event) => {
  const nets = networkInterfaces()
  const results = []
  for (const name of Object.keys(nets)) {
      for (const net of nets[name]) {
          if (net.family === 'IPv4' && !net.internal) {
              results.push(net.address)
          }
      }
  }
  controlWindow.webContents.send('networkInfo', results)
})

//========================//
//       VT Kounter       //
//========================//
var lastSet = ""
var ConnectedToOBS = false
var showMode = false

// Send Requests
setInterval(function() {
  if (showMode) {
    apps[config.appChoice].send()

    if( (new Date()).getTime() > apps[config.appChoice].timer.lastUpdated + config.timeout * 1000) {
      // the app hasn't responded for a while
      appError(new Error(`Timeout (${config.timeout}) reached`))
    }
  }

  if (!ConnectedToOBS && showMode && config.obs.enabled) {
      obsConnect()
  }
}, 1000)

/**
 * Callback from successful response from selected app
 */
function appSuccess() {
  //log.info(apps[config.appChoice].timer)

  // show successful connection to the app
  controlWindow.webContents.send('vtStatus', true)

  if(apps[config.appChoice].timer.noVT) {
    // clear the timer when no VT is playing and stop
    clearTimer()
    return
  }

  // update the GUI
  updateCueName(apps[config.appChoice].timer.cueName)
  setTimerInSeconds(apps[config.appChoice].timer.seconds.remaining)
  setTimerProgress(apps[config.appChoice].timer.progress)
}

/**
 * Callback from unsuccessful response from selected app
 * @param {Error} error - Reported error from the app
 */
function appError(error) {
  // show unsuccessful connection to the app
  controlWindow.webContents.send('vtStatus', false)

  // clear the current running VT from the timer
  clearTimer()

  // log the error
  log.warn(`${config.appChoice}: ${error.message ? error.message : 'undefined'}`)
}

ipcMain.on('configMode', (event) => {
  // stop all services and disconnect
  log.info('Going into config mode')
  obs.disconnect()
  showMode = false

  // inform current app
  apps[config.appChoice].onShowModeStop()

  controlWindow.webContents.send('vtStatus', false)
  controlWindow.webContents.send('obsStatus', false)
})

ipcMain.on('showMode', (event, cfg) => {
  // start connections based on config
  log.info('Going into show mode with config: ', cfg)

  config = cfg

  // inform current app
  apps[config.appChoice].config = config.apps[config.appChoice]
  apps[config.appChoice].onShowModeStart()

  if (config.obs.enabled) {
    obsConnect()
  }

  showMode = true
  store.set('VTKounterConfig', config)
  clearTimer()

  Nucleus.track('Show Mode', {
    app: config.appChoice,
    showPercentage: config.showPercentage,
    showCueName: config.showCueName,
    obs: config.obs.enabled
  })
})


// OBS connection
function obsConnect() {
  if (config.obs.password != '') {
    log.info('Attempting to connect to OBS ' + ' - ', config.obs.ip + ':'+ config.obs.port, config.obs.password)
    obs.connect({ address: config.obs.ip + ':'+ config.obs.port, password: config.obs.password }).catch(err => { // Promise convention dicates you have a catch on every chain.
        log.error('OBS connection error: ', err.description)
    })
  } else {
    controlWindow.webContents.send('obsStatus', false, 'No Password')
  }
}

obs.on('AuthenticationSuccess', function(data) {
  log.info('Connected to OBS & Authenticated')
  ConnectedToOBS = true
  controlWindow.webContents.send('obsStatus', true)
})

obs.on('AuthenticationFailure', function(data) {
  log.warning('Connected to OBS but there was an authentication error', data)
  ConnectedToOBS = false
  controlWindow.webContents.send('obsStatus', false, 'Auth Fail')
})

obs.on('ConnectionClosed', function(data) {
  ConnectedToOBS = false
  controlWindow.webContents.send('obsStatus', false)
})

// Updating Timer
function setTimerInSeconds(seconds) {
  updateTimer(moment().startOf('day').seconds(seconds).format(config.timerFormat))

  if (seconds <= 30 && seconds > 10) {
    controlWindow.webContents.send('warning', 'close')
  } else if (seconds <= 10) {
    controlWindow.webContents.send('warning', 'closer')
  } else {
    controlWindow.webContents.send('warning', false)
  }
}

function setTimerProgress(fraction) {
  controlWindow.webContents.send('percentage', fraction*100)
}

function clearTimer() {
  updateTimer(config.noVTText)
  controlWindow.webContents.send('warning', false)
  controlWindow.webContents.send('percentage', 0)
  controlWindow.webContents.send('cueName', '')
  cueName = ''
}

let obsPlatformIsMac = false

function updateTimer(time = '-') {
  if (showMode) {
    if (time != lastSet) {
      controlWindow.webContents.send('timer', time)
      io.emit('timer', time)

      if (ConnectedToOBS) {
        var type = 'SetTextGDIPlusProperties'
        if (obsPlatformIsMac) {
          type = 'SetTextFreetype2Properties'
        }
        obs.send(type, {
            'source': config.obs.source,
            'text': time
        }).catch(err => { // Promise convention dicates you have a catch on every chain.
            if (err.error == 'not a text gdi plus source') {
              obsPlatformIsMac = true
              log.info('OBS is running on a mac, setting source type to Freetype Text')
            } else {
              obsPlatformIsMac = false
              log.error(err)
            }
        })
      }
      lastSet = time
    }
  }
}

let cueName = ''
function updateCueName(name) {
  if (name != cueName) {
    controlWindow.webContents.send('cueName', name)
    cueName = name
  }
}




// Web Server Stuff and things
  var timerServer = new nodeStatic.Server('./static')
  const httpServer = require('http').createServer(function (request, response) {
      request.addListener('end', function () {
          timerServer.serve(request, response, function (err, result) {
            if (err) { // There was an error serving the file
                log.error("Error serving " + request.url + " - " + err.message)
 
                // Respond to the client
                response.writeHead(err.status, err.headers)
                response.end()
            }
          })
      }).resume()
  })
  const io = require("socket.io")(httpServer, {})

  io.on("connection", socket => { 
    console.log('Socket IO Connection!')
   })
  
  httpServer.listen(56868)




// AUTO UPDATE
setTimeout(function() {
  let current = require('./../../package.json').version
axios.get('https://api.github.com/repos/alteka/vtkounter/releases/latest')
  .then(function (response) {
    let status = compareVersions(response.data.tag_name, current, '>')
    if (status == 1) { 

      let link = ''
      for (const asset in response.data.assets) {
        if (process.platform == 'darwin' && response.data.assets[asset].name.includes('.pkg')) {
          link = response.data.assets[asset].browser_download_url
        }
        if (process.platform != 'darwin' && response.data.assets[asset].name.includes('.exe')) {
          link = response.data.assets[asset].browser_download_url
        }
      }
      dialog.showMessageBox(controlWindow, {
        type: 'question',
        title: 'An Update Is Available',
        message: 'Would you like to download version: ' + response.data.tag_name,
        buttons: ['Cancel', 'Yes']
      }).then(function (response) {
        if (response.response == 1) {
          shell.openExternal(link)
        }
      })
    } else if (status == 0) {
      // running current/latest version.
      log.info('Auto Update check -- Running latest version: ' + current)
    } else if (status == -1) {
      log.info('Auto Update check -- Running version newer (' + current + ') than release: ' + response.data.tag_name)
    }
  })
  .catch(function (error) {
    log.error(error)
  })
}, 3000)

function UUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}
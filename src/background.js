'use strict'

import { app, protocol, BrowserWindow, Menu, ipcMain, dialog, shell, nativeTheme } from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import installExtension, { VUEJS_DEVTOOLS } from 'electron-devtools-installer'
import { compareVersions } from 'compare-versions'
const log = require('electron-log')
const axios = require('axios').default
const Store = require('electron-store')
const path = require('path')
const menu = require('./menu.js').menu

const storeName = 'VTKounterConfig-v1.0.0'

// Project Specific includes
let nodeStatic = require('node-static')
const { networkInterfaces } = require('os')
const OBSWebSocket = require('obs-websocket-js').default
const obs = new OBSWebSocket()
const moment = require('moment')
const { Client, Server } = require('node-osc')

const store = new Store()

//======================================//
//      BOILER PLATE ELECTRON STUFF     //
//======================================//
const isDevelopment = process.env.NODE_ENV !== 'production'

protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } }
])

process.on('uncaughtException', function (error) {
  if (isDevelopment) {
    dialog.showErrorBox('Unexpected Error', error + '\r\n\r\n' + JSON.stringify(error))
  }
  log.warn('Error: ', error)
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

app.on('ready', async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    try {
      await installExtension(VUEJS_DEVTOOLS)
    } catch (e) {
      console.error('Vue Devtools failed to install:', e.toString())
    }
  }
  createWindow()
})

if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', (data) => {
      if (data === 'graceful-exit') {
        app.quit()
      }
    })
  } else {
    process.on('SIGTERM', () => {
      app.quit()
    })
  }
}



//==========================//
//       WINDOW HANDLER     //
//==========================//
let controlWindow
async function createWindow() {
  log.info('Showing control window')
  controlWindow = new BrowserWindow({
    width: getDefaultConfig().window.width,
    height: getDefaultConfig().window.height,
    minWidth: 600,
    minHeight: 240,
    show: false,
    useContentSize: true,
    maximizable: true,
    resizable: false,
    webPreferences: {
      nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION,
      contextIsolation: !process.env.ELECTRON_NODE_INTEGRATION,
      preload: path.join(__dirname, 'preload.js')
    }
  })

  controlWindow.once('ready-to-show', () => {
    controlWindow.show()
  })

  if (process.platform == 'darwin') {
    Menu.setApplicationMenu(menu)
  } else {
    Menu.setApplicationMenu(null)
  }

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    await controlWindow.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
    if (!process.env.IS_TEST) controlWindow.webContents.openDevTools()
  } else {
    createProtocol('app')
    controlWindow.loadURL('app://./index.html')
  }
}

//========================//
//       IPC Handlers     //
//========================//
ipcMain.on('controlResize', (_, data) => {
  config.window.width = data.width
  config.window.height = data.height
  // console.log('setting window size', config.window)
})

ipcMain.on('getConfig', (event) => {
  controlWindow.webContents.send('config', config)
  controlWindow.webContents.send('appControls', appControls)
})

ipcMain.on('factoryReset', () => {
  console.log('Performing Factory Reset')
  config = getDefaultConfig()
  controlWindow.webContents.send('config', config)
  store.set(storeName, config)
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


//====================================//
//       Config Store & VT Apps       //
//====================================//
// ! let apps = requireDir(path.join(__static,'vtApps')) -- kinda works but fails to webpack properly - workaround below
let apps = {
  Mitti: require('./vtApps/Mitti.js'),
  Ppp: require('./vtApps/Ppp.js'),
  PVP: require('./vtApps/PVP.js'),
  Qlab: require('./vtApps/Qlab.js'),
  Vmix: require('./vtApps/Vmix.js'),
  //Hyperdeck: require('./vtApps/Hyperdeck.js'),
  VLC: require('./vtApps/VLC.js'),
}
console.log('APPS', apps)
let appControls = {}
let appDefaults = {}

for(const name in apps) {
  // create instances of each app
  apps[name] = new apps[name]()

  // keep track of the UI controls each app requires
  appControls[name] = {
    name: apps[name].name,
    longName: apps[name].longName,
    notes: apps[name].notes,
    controls: apps[name].controls
  }

  // keep track of the default values for each control
  appDefaults[name] = {}
  Object.entries(apps[name].controls).forEach(([controlID, control]) => {
    appDefaults[name][controlID] = control.default
  })
}

let config = store.get(storeName, getDefaultConfig())
if (Object.keys(config.apps).length !== Object.keys(apps).length) {
  config = getDefaultConfig()
  log.info('Resetting config as structure has changed: Lazy migration...')
}
store.set(storeName, config)

function getDefaultConfig() {
  let defaultConfig = require('./defaultConfig.json')
  defaultConfig.apps = appDefaults
  return defaultConfig
}


/* -------------------------------------------------------------------------- */
/*                                 VT Kounter                                 */
/* -------------------------------------------------------------------------- */
let lastSet = ""
let ConnectedToOBS = false
let showMode = false

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
}, 250)

/* ----------- Callback from successful response from selected app ---------- */
function appSuccess() {
  controlWindow.webContents.send('vtStatus', true)
  
  updateCueName(apps[config.appChoice].timer.cueName)
  updateCueNameHTML(apps[config.appChoice].timer.cueNameHTML)

  if(apps[config.appChoice].timer.noVT) {
    // clear the timer when no VT is playing and stop
    clearTimer()
    return
  }
  
  // update the GUI
  setTimerInSeconds(apps[config.appChoice].timer.seconds.remaining)
  setTimerProgress(apps[config.appChoice].timer.progress)
}

/* ---------- Callback from unsuccessful response from selected app --------- */
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
  apps[config.appChoice].removeAllListeners()

  controlWindow.webContents.send('vtStatus', false)
  controlWindow.webContents.send('obsStatus', false)
  controlWindow.setContentSize(getDefaultConfig().window.width,getDefaultConfig().window.height)
  controlWindow.resizable = false

  updateCueName('')
  updateCueNameHTML(false)

  io.emit('cueName', 'Setup Mode')
  io.emit('cueNameHTML', false)
  io.emit('warning', false)
})

ipcMain.on('showMode', (event, cfg) => {
  // start connections based on config
  log.info('Going into show mode with config: ', cfg)
  controlWindow.resizable = true
  controlWindow.setMinimumSize(600, 280)
  // console.log(config.window)
  controlWindow.setContentSize(config.window.width,config.window.height)

  config = cfg

  // inform current app
  apps[config.appChoice].config = config.apps[config.appChoice]
  apps[config.appChoice].onShowModeStart()

  // add listeners to current app
  apps[config.appChoice].on('success',appSuccess)
  apps[config.appChoice].on('error',appError)

  if (config.obs.enabled) {
    obsConnect()
  }

  showMode = true
  store.set(storeName, config)
  clearTimer()
})


// Updating Timer
function setTimerInSeconds(seconds) {
  updateTimer(moment().startOf('day').seconds(seconds).format(config.timerFormat))

  controlWindow.webContents.send('secondsLeft', seconds)

  if (config.textWarningColors) {
    if (seconds <= 30 && seconds > 10) {
      controlWindow.webContents.send('warning', 'close')
      io.emit('warning', 'close')
    } else if (seconds <= 10) {
      controlWindow.webContents.send('warning', 'closer')
      io.emit('warning', 'closer')
    } else {
      controlWindow.webContents.send('warning', false)
      io.emit('warning', false)
    }
  }
}

let progress = null
function setTimerProgress(fraction) {
  controlWindow.webContents.send('percentage', fraction*100)
  progress = fraction*100
}

function clearTimer() {
  updateTimer(config.noVTText)
  controlWindow.webContents.send('warning', false)
  controlWindow.webContents.send('percentage', 0)
  // controlWindow.webContents.send('cueName', '')
  // controlWindow.webContents.send('cueNameHTML', false)
  // cueName = ''
  // cueNameHTML = false
}

function updateTimer(time = '-') {
  if (showMode) {
    if (time != lastSet) {
      controlWindow.webContents.send('timer', time)
      io.emit('timer', time)
      if (time == config.noVTText) {
        io.emit('cueName', 'VT Finished')
        io.emit('cueNameHTML', false)
      }

      if (ConnectedToOBS) {
        let type = 'SetTextGDIPlusProperties'
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

     sendOSC(time)

      lastSet = time
    }
  }
}

let cueName = ''
function updateCueName(name) {
  if (name != cueName) {
    controlWindow.webContents.send('cueName', name)
    cueName = name
    io.emit('cueName', name)
    sendOSCName(name)
  }
}

let cueNameHTML = ''
function updateCueNameHTML(name) {
  if (name != cueNameHTML) {
    controlWindow.webContents.send('cueNameHTML', name)
    cueNameHTML = name
    io.emit('cueNameHTML', name)
  }
}



/* -------------------------------------------------------------------------- */
/*                               OBS Connection                               */
/* -------------------------------------------------------------------------- */
let obsPlatformIsMac = false
function obsConnect() {
  if (config.obs.password != '') {
    log.info('Attempting to connect to OBS ' + ' - ', config.obs.ip + ':'+ config.obs.port, config.obs.password)
    obs.connect({ address: config.obs.ip + ':'+ config.obs.port, password: config.obs.password }).catch(err => {
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



/* -------------------------------------------------------------------------- */
/*                               OSC Connection                               */
/* -------------------------------------------------------------------------- */
function sendOSC(time) {
  if (config.osc.enabled) {
    const client = new Client(config.osc.ip, config.osc.port);
    client.send(config.osc.address, time, () => {
      client.close();
    })
  }
}
function sendOSCName(name) {
  if (config.osc.enabled) {
    const client = new Client(config.osc.ip, config.osc.port);
    client.send(config.osc.nameAddress, name, () => {
      client.close();
    })
  }
}

/* -------------------------------------------------------------------------- */
/*                             Web Server and API                             */
/* -------------------------------------------------------------------------- */
let timerServer = new nodeStatic.Server(path.join(__static, 'static'))
const httpServer = require('http').createServer(function (request, response) {
  request.addListener('end', () => {

    // data to return
    let data = {
      name: apps[config.appChoice].timer.cueName,
      timer: lastSet,

      remaining: {
        hours: Math.floor(apps[config.appChoice].timer.remaining / 1000 / 3600),
        minutes: Math.floor((apps[config.appChoice].timer.remaining / 1000 / 60) % 60),
        seconds: Math.floor((apps[config.appChoice].timer.remaining / 1000) % 60)
      },
      elapsed: {
        hours: Math.floor(apps[config.appChoice].timer.elapsed / 1000 / 3600),
        minutes: Math.floor((apps[config.appChoice].timer.elapsed / 1000 / 60) % 60),
        seconds: Math.floor((apps[config.appChoice].timer.elapsed / 1000) % 60)
      },
      total: {
        hours: Math.floor(apps[config.appChoice].timer.total / 1000 / 3600),
        minutes: Math.floor((apps[config.appChoice].timer.total / 1000 / 60) % 60),
        seconds: Math.floor((apps[config.appChoice].timer.total / 1000) % 60)
      },

      seconds: apps[config.appChoice].timer.seconds,
      noVT: apps[config.appChoice].timer.noVT,
      app: {
        name: apps[config.appChoice].name,
        longName: apps[config.appChoice].longName,
        config: apps[config.appChoice].config
      },
      progress: apps[config.appChoice].timer.progress,
      showMode: showMode
    }

    switch (request.url) {
      case '/api':
      case '/api/v1':
        response.writeHead(200, { 'Content-Type': 'application/json' })
        response.end(JSON.stringify({
          data: {url: 'api/v1/data', description: 'JSON: Our full api data endpoint as an object'},
          array: {url: 'api/v1/data/array', description: 'JSON: Our full api endpoint as an array - as required by vMix'},
          vmix: {url: 'api/v1/vmix', description: 'JSON: The bare essentials for adding as a data source in vMix'},
          progress: {url: 'api/v1/progress', description: 'Text: Float from 0 to 1 representing progress through the cue'},
          timer: {url: 'api/v1/timer', description: 'Text: A formatted string representing the time remaining'},
          name: {url: 'api/v1/name', description: 'Text: The current cue name/number'},
          seconds: {url: 'api/v1/seconds', description: 'Text: The number of seconds remaining'}
        }), 'utf-8')
        break;
        
      case '/api/v1/data':
        response.writeHead(200, { 'Content-Type': 'application/json' })
        response.end(JSON.stringify(data), 'utf-8')
        break;
      
      case '/api/v1/data/array':
        response.writeHead(200, { 'Content-Type': 'application/json' })
        response.end(JSON.stringify([data]), 'utf-8')
        break;

      case '/api/v1/vmix':
        response.writeHead(200, { 'Content-Type': 'application/json' })
        let vmix = {
          vt_name: data.name,
          timeRemaining: data.timer
        }
        response.end(JSON.stringify([vmix]), 'utf-8')
        break;
    
      case '/api/v1/progress':
        response.writeHead(200)
        response.end(JSON.stringify(apps[config.appChoice].timer.progress), 'utf-8')
        break;

      case '/api/v1/timer':
        response.writeHead(200)
        response.end(lastSet, 'utf-8')
        break;

      case '/api/v1/name':
        response.writeHead(200)
        response.end(apps[config.appChoice].timer.cueName, 'utf-8')
        break;

      case '/api/v1/seconds':
        response.writeHead(200)
        response.end(JSON.stringify(apps[config.appChoice].timer.seconds.remaining), 'utf-8')
        break;
    
      default:
        timerServer.serve(request, response, function (err, result) {
          if (err) { // There was an error serving the file
            log.error("Error serving " + request.url + " - " + err.message)

            // Respond to the client
            response.writeHead(err.status, err.headers)
            response.end()
          }
        })
        break;
    }
  }).resume()
})
const io = require("socket.io")(httpServer, {})

io.on("connection", socket => { 
  console.log('Socket IO Connection!')
  if (showMode) {
    io.emit('cueName', cueName)
    io.emit('cueNameHTML', cueNameHTML)
  } else {
    io.emit('cueName', 'Config Mode')
    io.emit('cueNameHTML', false)
  }
  if (lastSet != '') {
    io.emit('timer', lastSet)
  }
})
httpServer.listen(56868)

//========================//
//     Update Checker     //
//========================//
setTimeout(function() {
  axios.get('https://api.github.com/repos/alteka/vtkounter/releases/latest')
      .then(function (response) {
        let status = compareVersions(response.data.tag_name, require('./../package.json').version)
        if (status == 1) {
          dialog.showMessageBox(controlWindow, {
            type: 'question',
            title: 'An Update Is Available',
            message: 'Would you like to download version: ' + response.data.tag_name,
            buttons: ['Cancel', 'Yes']
          }).then(function (response) {
            if (response.response == 1) {
              shell.openExternal('https://alteka.solutions/vt-kounter')
            }
          });
        } else if (status == 0) {
          log.info('Running latest version')
        } else if (status == -1) {
          log.info('Running version newer than release')
        }
      })
      .catch(function (error) {
        console.log(error);
      })
}, 10000)
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

const store = new Store()
var config = {}

const { Client, Server } = require('node-osc');
var qlab = null;
var mitti = null;
const OBSWebSocket = require('obs-websocket-js');
const obs = new OBSWebSocket();

var oscServer = new Server(53001, '0.0.0.0', () => {
  console.log('OSC Server is listening');
})

var mittiOscServer = new Server(5151, '0.0.0.0', () => {
  console.log('Mitti OSC Server is listening');
})

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

  config = store.get('VTKounterConfig', getDefaultConfig())

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
  controlWindow.webContents.send('darkMode', nativeTheme.shouldUseDarkColors)
})

ipcMain.on('factoryReset', () => {
  controlWindow.webContents.send('config', getDefaultConfig())
  Nucleus.track('Factory Reset')
})


//========================//
//       VT Kounter       //
//========================//
var currentDuration
var matchingCues = []
var lastSet = ""
var ConnectedToOBS = false
var showMode = false


setInterval(function() {
  if (showMode && config.appChoice == 'QLab') {
    qlab.send('/cue/active/currentDuration', 200, () => { })
    qlab.send('/cue/active/actionElapsed', 200, () => { })
    qlab.send('/runningCues', 200, () => { })
  }

  if (showMode && config.appChoice == 'Mitti') {
    mitti.send('/mitti/cueTimeLeft', 200, () => { })
  }

  if (!ConnectedToOBS && showMode && config.obs.enabled) {
      obsConnect()
  }
}, 1000)

ipcMain.on('configMode', (event) => {
  // stop all services and disconnect
  log.info('Going into config mode')
  obs.disconnect()
  showMode = false
  if (config.appChoice == 'QLab') {
    qlab.close()
    qlab = null
  }
  if (config.appChoice == 'Mitti') {
    mitti.close()
    mitti = null
  }
  controlWindow.webContents.send('vtStatus', false)
  controlWindow.webContents.send('obsStatus', false)
})

ipcMain.on('showMode', (event, cfg) => {
  // start connections based on config
  log.info('Going into show mode with config: ', cfg)
  config = cfg;
  if (config.appChoice == 'QLab') {
    qlab = new Client(config.qlab.ip, 53000)
  }

  if (config.appChoice == 'Mitti') {
    mitti = new Client(config.mitti.ip, 51000)
    mitti.send('/mitti/resendOSCFeedback', 200, () => { })
  }

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

oscServer.on('message', function (msg) {
  var cmd = msg[0].split('/')[4]
  var data = JSON.parse(msg[1])
  var cue = msg[0].split('/')[3]

  if (cmd == 'runningCues') {
    controlWindow.webContents.send('vtStatus', true)
    matchingCues = [];
    if (data.data.length > 1) {
        for (var i = 1; i < data.data.length; i++) {
            if (config.qlab.filterColour.includes(data.data[i].colorName) || config.qlab.filterColour.length == 0) {
              if (config.qlab.filterCueType.includes(data.data[i].type) || config.qlab.filterCueType.length == 0) {
                matchingCues.push(data.data[i].uniqueID)
              }                
            }
        }
    }  else {
      clearTimer()
    }
    if (matchingCues.length == 1) {
      updateCueName(data.data[1].listName)
    }
    if (matchingCues.length == 0) {
      clearTimer()
    }
    if (matchingCues.length > 1) {
      log.warn('Multiple matching QLab Cues are running')
    }
  }
  if (cmd == 'currentDuration' && matchingCues[0] == cue) {
    if (currentDuration !== data.data) {
        log.info('--==--  QLab VT Started with Duration ' + data.data + '  --==--')
    }
    currentDuration = data.data
  }
  if (cmd == 'actionElapsed' && matchingCues[0] == cue) {
    var remaining = Math.round(currentDuration - data.data)
    if (remaining <0) { remaining = 0 }

    setTimerInSeconds(remaining)
    setTimerProgress(remaining/currentDuration)
  }
})

let mittiTimeElapsed = 0
mittiOscServer.on('message', function(msg) {
  controlWindow.webContents.send('vtStatus', true)
  if (msg[0] == '/mitti/cueTimeLeft' && config.appChoice == 'Mitti') {
    let rem = msg[1].split(':')
    let seconds = parseInt(rem[0]*60*-60) + parseInt((rem[1]*60)) + parseInt(rem[2])
    if (seconds < 1) {
      clearTimer()
    } else {
      setTimerInSeconds(seconds)
      setTimerProgress(seconds/(mittiTimeElapsed+seconds))
    }
  } else if (msg[0] == '/mitti/cueTimeElapsed' && config.appChoice == 'Mitti') {
    let rem = msg[1].split(':')
    mittiTimeElapsed = parseInt(rem[0]*60*-60) + parseInt((rem[1]*60)) + parseInt(rem[2])
  } else if (msg[0] == '/mitti/currentCueName' && config.appChoice == 'Mitti') {
    updateCueName(msg[1])
  }
})

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
  controlWindow.webContents.send('percentage', 100-(fraction*100))
}

function clearTimer() {
  updateTimer(config.noVTText)
  controlWindow.webContents.send('warning', false)
  controlWindow.webContents.send('percentage', 0)
  controlWindow.webContents.send('cueName', '')
  cueName = ''
}

let obsPlatformIsMac = false;

function updateTimer(time = '-') {
  if (showMode) {
    if (time != lastSet) {
      controlWindow.webContents.send('timer', time)

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
              obsPlatformIsMac = true;
              log.info('OBS is running on a mac, setting source type to Freetype Text')
            } else {
              obsPlatformIsMac = false;
              console.log(err);
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
    log.info('Cue Name: ', name)
    cueName = name
  }
}

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
      });
    } else if (status == 0) {
      // running current/latest version.
      log.info('Running latest version')
    } else if (status == -1) {
      log.info('Running version newer than release')
    }
  })
  .catch(function (error) {
    console.log(error);
  })
}, 3000)

function UUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  })
}
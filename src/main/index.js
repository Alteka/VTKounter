import { app, BrowserWindow, ipcMain, webContents, nativeTheme, dialog, screen, TouchBar, Menu, MenuItem, shell } from 'electron'
import { create } from 'domain'
const menu = require('./menu.js').menu
const log = require('electron-log')
const { exec } = require('child_process')
const axios = require('axios')
var compareVersions = require('compare-versions')
const Store = require('electron-store')

const store = new Store()
var config = {}

const { Client, Server } = require('node-osc');
var qlab = null;
const OBSWebSocket = require('obs-websocket-js');
const obs = new OBSWebSocket();

var oscServer = new Server(53001, '0.0.0.0', () => {
  console.log('OSC Server is listening');
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
})

app.on('activate', () => {
  if (controlWindow === null) {
    createWindow()
  }
})

function getDefaultConfig() {
  return {
    qlab: {
      ip: '127.0.0.1',
      port: '53000',
      filter: ['red']
    },
    obs: {
      ip: '127.0.0.1',
      port: '4444',
      password: 'password',
      source: 'QLab Time',
      platformIsMac: false
    }
  }
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
})

ipcMain.on('getConfig', (event) => {
  controlWindow.webContents.send('config', config)
})


//========================//
//       VT Kounter       //
//========================//
var currentDuration
var redCues = []
var lastSet = ""
var ConnectedToOBS = false
var showMode = false


setInterval(function() {
  if (showMode) {
    log.info('sending messages to qlab')
    qlab.send('/cue/active/currentDuration', 200, () => { })
    qlab.send('/cue/active/actionElapsed', 200, () => { })
    qlab.send('/runningCues', 200, () => { })
  }

  if (!ConnectedToOBS && showMode) {
      obsConnect()
  }
}, 1000)

ipcMain.on('configMode', (event) => {
  // stop all services and disconnect
  obs.disconnect()
  showMode = false
  qlab.close()
  qlab = null
  controlWindow.webContents.send('vtStatus', false)
  controlWindow.webContents.send('obsStatus', false)
})

ipcMain.on('showMode', (event, cfg) => {
  // start connections based on config
  config = cfg;
  qlab = new Client(config.qlab.ip, config.qlab.port);
  obsConnect()
  showMode = true

  store.set('VTKounterConfig', config)
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
    redCues = [];
    if (data.data.length > 1) {
        for (var i = 1; i < data.data.length; i++) {
            if (config.qlab.filter.includes(data.data[i].colorName)) {
                redCues.push(data.data[i].uniqueID)
            }
        }
    }   else {
        updateTimer('No VT')
    }
    if (redCues.length == 0) {
        updateTimer('No VT')
    }
}
if (cmd == 'currentDuration' && redCues.includes(cue)) {
    if (currentDuration !== data.data) {
        log.info('--==--  VT Started with Duration ' + data.data + '  --==--')
    }
    currentDuration = data.data
}
if (cmd == 'actionElapsed' && redCues.includes(cue)) {
    var remaining = Math.round(currentDuration - data.data)
    if (remaining <0) { remaining = 0 }
    var s = remaining % 60
    var m = Math.floor(remaining / 60)
    updateTimer(pad(m,2) + ':' + pad(s,2))
}
})

function updateTimer(time = '-') {
  if (showMode) {
    if (time != lastSet && ConnectedToOBS) {
      var type = 'SetTextGDIPlusProperties'
      if (config.obs.platformIsMac) {
        type = 'SetTextFreetype2Properties'
      }
        obs.send(type, {
            'source': config.obs.source,
            'text': time
        }).catch(err => { // Promise convention dicates you have a catch on every chain.
            console.log(err);
        })

        controlWindow.webContents.send('timer', time)

        lastSet = time
        if (time == 'No VT') {
          log.info('--==##==--  VT Finished  --==##==--')
        } else {
          log.info('Time Remaining:' + ' ' + time)
        }
    }
  }
}

setTimeout(function() {
  let current = require('./../../package.json').version

// Make a request for a user with a given ID
// axios.get('https://api.github.com/repos/alteka/vtkounter/releases/latest')
//   .then(function (response) {
//     let status = compareVersions(response.data.tag_name, current, '>')
//     if (status == 1) { 

//       let link = ''
//       for (const asset in response.data.assets) {
//         if (process.platform == 'darwin' && response.data.assets[asset].name.includes('.pkg')) {
//           link = response.data.assets[asset].browser_download_url
//         }
//         if (process.platform != 'darwin' && response.data.assets[asset].name.includes('.exe')) {
//           link = response.data.assets[asset].browser_download_url
//         }
//       }
//       dialog.showMessageBox(controlWindow, {
//         type: 'question',
//         title: 'An Update Is Available',
//         message: 'Would you like to download version: ' + response.data.tag_name,
//         buttons: ['Cancel', 'Yes']
//       }).then(function (response) {
//         if (response.response == 1) {
//           shell.openExternal(link)
//         }
//       });
//     } else if (status == 0) {
//       // running current/latest version.
//       log.info('Running latest version')
//     } else if (status == -1) {
//       log.info('Running version newer than release')
//     }
//   })
//   .catch(function (error) {
//     console.log(error);
//   })
}, 3000)

function pad(num, size) {
  var s = num+"";
  while (s.length < size) s = "0" + s;
  return s;
}
'use strict'

import { app, protocol, BrowserWindow, Menu, ipcMain, dialog, shell } from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import installExtension, { VUEJS3_DEVTOOLS } from 'electron-devtools-installer'
import compareVersions from 'compare-versions'
import { v4 as uuidv4 } from 'uuid'
import Analytics from 'analytics'
import googleAnalytics from '@analytics/google-analytics'
const log = require('electron-log')
const axios = require('axios')
const Store = require('electron-store')
const path = require('path')
const menu = require('./menu.js').menu

const store = new Store()

const isDevelopment = process.env.NODE_ENV !== 'production'


//======================================//
//      BOILER PLATE ELECTRON STUFF     //
//======================================//
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
      await installExtension(VUEJS3_DEVTOOLS)
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
    width: 460,
    height: 450,
    show: false,
    useContentSize: true,
    maximizable: false,
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



//=====================//
//       Analytics     //
//=====================//
const analytics = Analytics({
  app: 'DeviceKontrol',
  version: 100,
  plugins: [
    googleAnalytics({
      trackingId: 'UA-183734846-3',
      tasks: {
        // Set checkProtocolTask for electron apps & chrome extensions
        checkProtocolTask: null,
      }
    })
  ]
})
app.on('ready', async () => {
  if (!store.has('DeviceKontrolInstallID')) {
    let newId = uuidv4()
    log.info('First Runtime and created Install ID: ' + newId)
    store.set('DeviceKontrolInstallID', newId)
  } else {
    log.info('Install ID: ' + store.get('DeviceKontrolInstallID'))
  }

  analytics.identify(store.get('DeviceKontrolInstallID'), {
    firstName: 'Version',
    lastName: require('./../package.json').version
  }, () => {
    console.log('do this after identify')
  })

  analytics.track('AppLaunched')
})



//========================//
//       IPC Handlers     //
//========================//
ipcMain.on('controlResize', (_, data) => {
  controlWindow.setContentSize(460, data.height)
})

ipcMain.on('openLogs', () => {
  const path = log.transports.file.findLogPath()
  shell.showItemInFolder(path)
  analytics.track('Open Logs')
})



//========================//
//     Device Control     //
//========================//
// var child = null

// ipcMain.on('controlDevice', (_, device) => {
//   log.info('Control Device: ', device)
//   analytics.track('Launch FFMPEG')

//   var cmd = path.join(__static, 'ffmpeg/ffmpeg.exe') + ' -hide_banner -f dshow -show_video_device_dialog true -i video="' + device + '"'

//   log.info('Executing ffmpeg: ' + cmd)

//   if (child != null) {
//     child.kill()
//     log.verbose('killing old process')
//   }

//   child = exec(cmd, (error) => {
//     if (error) {
//       log.error(error)
//       if (error.message.includes('requested filter does not have a property page')) {
//         controlWindow.webContents.send('message', 'Device does not have any editable properties')
//         dialog.showErrorBox('Oops', device + ' does not have any editable properties')
//       } else if (error.message.includes('Failure showing property pages for')) {
//         controlWindow.webContents.send('message', 'Can not access properties for device')
//         dialog.showErrorBox('Oops', device + ' does not have any editable properties')
//       }
//       return
//     }
//   })
// })


//========================//
//     Update Checker     //
//========================//
setTimeout(function() {
axios.get('https://api.github.com/repos/alteka/devicekontrol/releases/latest')
  .then(function (response) {
    let status = compareVersions(response.data.tag_name, require('./../package.json').version, '>')
    if (status == 1) { 
      dialog.showMessageBox(controlWindow, {
        type: 'question',
        title: 'An Update Is Available',
        message: 'Would you like to download version: ' + response.data.tag_name,
        buttons: ['Cancel', 'Yes']
      }).then(function (response) {
        if (response.response == 1) {
          shell.openExternal('https://alteka.solutions/device-kontrol')
          analytics.track("Open Update Link")
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
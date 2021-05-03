import { app, BrowserWindow, ipcMain, webContents, nativeTheme, dialog, screen, TouchBar, Menu, MenuItem, shell } from 'electron'
import { create } from 'domain'
const menu = require('./menu.js').menu
const log = require('electron-log')
const { exec } = require('child_process')
const axios = require('axios')
var compareVersions = require('compare-versions')

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

  controlWindow = new BrowserWindow({ show: false, height: 450, resizable: false, maximizable: false, useContentSize: true, width: 460, webPreferences: { nodeIntegration: true } })

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
  log.info('Launching Device Kontrol')
  createWindow()
})

app.on('activate', () => {
  if (controlWindow === null) {
    createWindow()
  }
})


//========================//
//       IPC Handlers     //
//========================//
ipcMain.on('controlResize', (event, w, h) => {
  controlWindow.setContentSize(460, h)
})

ipcMain.on('openLogs', (event, w, h) => {
  const path = log.transports.file.findLogPath()
  shell.showItemInFolder(path)
})


//========================//
//     Device Control     //
//========================//
var child = null

ipcMain.on('controlDevice', (event, device) => {
  log.info('Control Device: ', device)

  var pathToFfmpeg = '"' + require('ffmpeg-static').replace('app.asar', 'app.asar.unpacked') + '"'
  var cmd = pathToFfmpeg + ' -hide_banner -f dshow -show_video_device_dialog true -i video="' + device + '"'

  log.info('Executing ffmpeg: ' + cmd)

  if (child != null) {
    child.kill()
    log.verbose('killing old process')
  }

  child = exec(cmd, (error, stdout, stderr) => {
    if (error) {
      log.error(error)
      if (error.message.includes('requested filter does not have a property page')) {
        controlWindow.webContents.send('message', 'Device does not have any editable properties')
        dialog.showErrorBox('Oops', device + ' does not have any editable properties')
      } else if (error.message.includes('Failure showing property pages for')) {
        controlWindow.webContents.send('message', 'Can not access properties for device')
        dialog.showErrorBox('Oops', device + ' does not have any editable properties')
      }
      return
    }
  })
  
})




setTimeout(function() {
  let current = require('./../../package.json').version

// Make a request for a user with a given ID
axios.get('https://api.github.com/repos/alteka/devicekontrol/releases/latest')
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
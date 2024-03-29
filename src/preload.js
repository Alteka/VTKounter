console.log('Preload.js Loaded')

import { contextBridge, ipcRenderer } from 'electron'

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('ipcRenderer', {
  send: (channel, data) => {
    // whitelist channels
    let validChannels = ['controlResize', 'getConfig', 'showMode', 'configMode', 'factoryReset', 'networkInfo']
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data)
      // console.debug('IPC Send:', channel)
    } else {
      console.warn('Ignoring IPC Request', channel)
    }
  },
  receive: (channel, func) => {
    // console.log('ipc rec', channel)
    let validChannels = ['darkMode', 'config', 'appControls', 'networkInfo', 'vtStatus', 'obsStatus', 'timer', 'percentage', 'warning', 'cueName', 'cueNameHTML','secondsLeft']
    if (validChannels.includes(channel)) {
      // Deliberately strip event as it includes `sender`
      ipcRenderer.on(channel, (event, ...args) => func(...args))
    }
  }
})
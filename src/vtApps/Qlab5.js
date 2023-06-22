const vtApp = require('../vtApp')
const { Client, Server } = require('node-osc')
const log = require('electron-log')

class vtAppQlab5 extends vtApp {
  constructor(...args) {
    super(...args)

    this.name = "QLab5"

    this.controls = {
      ...this.controls,
      passcode: {
        label: "OSC Passcode",
        type: 'string',
        default: ''
      },
      filterColour: {
        label: "Filter by Colour",
        type: "checkbox-group",
        default: [],
        values: [
          {value: "red", label: "Red"},
          {value: "yellow", label: "Yellow"},
          {value: "green", label: "Green"},
          {value: "blue", label: "Blue"},
          {value: "purple", label: "Purple"},
        ]
      },
      filterCueType: {
        label: "Filter by Type",
        type: "checkbox-group",
        default: [],
        values: [
          {value: "Video"},
          {value: "Audio"},
          {value: "Text"},
          {value: "Camera"},
          {value: "Mic"},
        ]
      },
    }
    
    // create server & client objects
    this.server = null
    this.client = null

    // create storage variables
    this.workspaceId = null
    this.authenticatedWorkspaceId = null

    // to store filtered cues
    this.matchingCues = []
  }

  send() {
    if(this.config.passcode &&
        (!this.authenticatedWorkspaceId ||
            this.authenticatedWorkspaceId !== this.workspaceId)){
      return
    }

    //this.client.send('/cue/selected', 200, () => { })
    //this.client.send('/cue/active/currentDuration', 200, () => { })
    //this.client.send('/cue/active/actionElapsed', 200, () => { })
    this.client.send('/runningOrPausedCues', 200, () => { })
  }

  receive(msg) {
    return new Promise((resolve,reject) => {


      let commandArray = msg[0].split('/')
      let cmd = commandArray[commandArray.length-1]
      let data = JSON.parse(msg[1])

      /**
       * Check if we have a reply to auth to handle
       */
      if(cmd == 'connect ' + this.config.passcode){
        this.authenticatedWorkspace(data)
        return
      }

      /**
       * Check if we need to auth
       */
      if(this.config.passcode &&
          data.workspace_id &&
          (!this.authenticatedWorkspaceId ||
          this.authenticatedWorkspaceId !== this.workspaceId)){
        this.authenticateWorkspace(data.workspace_id)
        return
      }

      /**
       * A cue is selected
       */
      if(cmd == 'selected'){
        this.selectedCue(data)
      }

      if (cmd == 'runningOrPausedCues') {
        log.debug('runningOrPausedCues', data)
        this.matchingCues = [];

        if (data.data.length > 0) {
          for (var i = 0; i < data.data.length; i++) {
            if (this.config.filterColour.includes(data.data[i].colorName) || this.config.filterColour.length == 0) {
              if (this.config.filterCueType.includes(data.data[i].type) || this.config.filterCueType.length == 0) {
                if (data.data[i].type != 'Group') {
                  this.matchingCues.push({
                    uniqueId: data.data[i].uniqueID,
                    listName: data.data[i].listName,
                  })
                }
              }
            }
          }
        }  else {
          this.timer.reset()
        }

        if (this.matchingCues.length == 1) {
          this.timer.cueName = this.matchingCues[0].cueName,
          this.timer.noVT = false
        }
        if (this.matchingCues.length == 0) {
          this.timer.reset()
        }
        if (this.matchingCues.length > 1) {
          log.warn('Multiple matching QLab Cues are running', this.matchingCues)
        }
      }

      if (cmd == 'currentDuration') {
        if (this.timer.total !== Math.round(data.data*1000)) {
          log.info('--==--  QLab VT Started with Duration ' + data.data + '  --==--')
        }
        this.timer.total = Math.round(data.data * 1000)
      }
      if (cmd == 'actionElapsed') {
        this.timer.elapsed = Math.round(data.data * 1000)
      }

      resolve()
    })
  }

  authenticateWorkspace(workspaceId){
    this.workspaceId = workspaceId

    log.debug('Running OSC authentication, ' + '/workspace/' + this.workspaceId + '/connect ' + this.config.passcode)
    this.client.send('/workspace/' + this.workspaceId + '/connect ' + this.config.passcode,200,()=>{})
  }

  authenticatedWorkspace(data){
    log.debug('Reply from OSC authentication',data)
    this.authenticatedWorkspaceId = this.workspaceId
  }

  selectedCue(data){
    let workspaceId = data.workspace_id
    //console.log('Selected cue', data, workspaceId)
  }

  onShowModeStart() {
    super.onShowModeStart()

    try {
      this.server = new Server(53001, '0.0.0.0', () => {
        log.info('QLab5 OSC Server Receiver is listening on port 53001');
      })

      // accept response
      this.server.on('message', (msg) => {
        this.receive(msg).then(this.onSuccess,this.onError)
      })

      // configure client
      this.client = new Client(this.config.ip, 53000)

      this.client.send('/cue/selected', 200, () => { })
    }
    catch (err) {
      this.onError(err)
    }
  }

  onShowModeEnd() {
    super.onShowModeEnd()

    // close server and client
    this.server.close()
    this.server = null

    this.client.close()
    this.client = null
  }
}

module.exports = vtAppQlab5
const vtApp = require('../vtApp')
const { Client, Server } = require('node-osc')
const log = require('electron-log')
const {forEach} = require('lodash-es')

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
      info: {
        label: 'Info',
        notes: '! Cues must have numbers for Qlab5 integration to work correctly !'
      },
    }
    
    // create server & client objects
    this.server = null
    this.client = null

    // create storage variables
    this.workspaceId = null
    this.authenticatedWorkspaceId = null
    this.authenticationFailed = false

    // to store filtered cues
    this.matchingCues = []
  }

  send() {
    if(this.config.passcode &&
        (!this.authenticatedWorkspaceId ||
            this.authenticatedWorkspaceId !== this.workspaceId)){
      return
    }

    if(this.workspaceId){
      this.client.send('/workspace/' + this.workspaceId + '/selectedCues', 200, () => { })
    }

    this.client.send('/runningOrPausedCues', 200, () => { })
  }

  getPlayingCueStatus(){
    this.client.send('/cue/' + this.matchingCues[0].number + '/currentDuration', 200, () => { })
    this.client.send('/cue/' + this.matchingCues[0].number + '/actionElapsed', 200, () => { })
  }

  receive(msg) {
    return new Promise((resolve,reject) => {
      let commandArray = msg[0].split('/')
      let cmd = commandArray[commandArray.length-1]
      let data = JSON.parse(msg[1])

      console.log(msg)

      if(data.status == 'denied'){
        if(this.workspaceId == data.workspace_id && !this.authenticationFailed){
          this.authenticationFailed = true
        } else {
          this.authenticateWorkspace(data.workspace_id)
        }
      }

      /**
       * Check if we have a reply to auth to handle
       */
      if(cmd == 'connect ' + this.config.passcode){
        this.authenticatedWorkspace(data)
        return
      }

      /**
       * A cue is selected
       */
      if(cmd == 'selectedCues'){
        this.selectedCue(data)
      }

      if (cmd == 'runningOrPausedCues') {
        this.runningOrPausedCues(data)
      }

      if (cmd == 'currentDuration') {
        this.currentDuration(data)
      }

      if (cmd == 'actionElapsed') {
        this.actionElapsed(data)
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
    let selectedCues = this.matchCues(data.data)

    if (selectedCues.length == 1) {
      //log.debug('selectedCue: 1 match', selectedCues[0])
      this.timer.armedCueName = selectedCues[0].listName
    } else if(selectedCues.length == 0){
      this.timer.armedCueName = null
    }
  }

  runningOrPausedCues(data){
    this.workspaceId = data.workspace_id

    this.matchingCues = this.matchCues(data.data)

    if (this.matchingCues.length == 1) {
      //log.debug('runningOrPausedCues: 1 match', this.matchingCues[0])
      this.timer.cueName = this.matchingCues[0].listName,
      this.getPlayingCueStatus()
    }
    if (this.matchingCues.length == 0) {
      if(!this.timer.noVT){
        log.info('--==--  QLab5 VT stopped  --==--')
        this.timer.noVT = true
      }

      this.timer.reset()
    }
    if (this.matchingCues.length > 1) {
      log.warn('Multiple matching QLab Cues are running', this.matchingCues)
    }
  }

  currentDuration(data) {
    //log.debug('currentDuration',data)
    if (this.timer.total !== Math.round(data.data*1000)) {
      log.info('--==--  QLab5 VT Started with Duration ' + data.data + '  --==--')
    }
    this.timer.noVT = false
    this.timer.total = Math.round(data.data * 1000)
  }

  matchCues(data){
    let matchingCues = [];

    forEach(data, (cue) => {
      if ((this.config.filterColour.includes(cue.colorName) || this.config.filterColour.length == 0) &&
          (this.config.filterCueType.includes(cue.type) || this.config.filterCueType.length == 0)) {
        matchingCues.push({
          uniqueId: cue.uniqueID,
          listName: cue.listName,
          number: cue.number,
        })
      }
    })

    return matchingCues
  }

  actionElapsed(data){
    //log.debug('actionElapsed',data)
    this.timer.elapsed = Math.round(data.data * 1000)
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

      this.client.send('/runningOrPausedCues', 200, () => { })
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
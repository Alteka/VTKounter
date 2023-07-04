const vtApp = require('../vtApp')
const { Client, Server } = require('node-osc')
const log = require('electron-log')

class vtAppQlab extends vtApp {
  constructor(...args) {
    super(...args)

    this.name = "QLab"

    this.controls = {
      ...this.controls,
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
      filterCueNumber: {
        label: "Filter by Cue Number",
        type: "string",
        default: ''
      },
      showCueNumber: {
        label: "Show Cue Number",
        type: "boolean",
        default: true,
      },
      showPlayheadCue: {
        label: "Show Selected Cue",
        type: "boolean",
        default: true,
      },
    }

    // create server & client objects
    this.server = null
    this.client = null

    // to store filtered cues
    this.matchingCues = []
    this.cueWeCareAbout

    this.isPaused = false

    this.timeSinceLastListName
    this.playheadCueNumber
  }

  send() {
    this.client.send('/runningOrPausedCues')

    if (this.config.showPlayheadCue && this.timer.noVT) {
      this.client.send('/cue/playhead/number')
      this.client.send('/cue/playhead/listName')
    }

    if (this.timeSinceLastListName < (new Date() - 600)) {
      this.timer.cueNameHTML = false
      this.timer.cueName = ''
      this.playheadCueNumber = false
    }
  }

  receive(msg) {
    return new Promise((resolve,reject) => {
      let replyAddress = msg[0].split('/')

      let cmd = replyAddress.pop()
      let data = JSON.parse(msg[1])

      if (cmd == 'runningOrPausedCues') {
        
        this.matchingCues = [];
        if (data.data.length > 0) {
          for (let i = 0; i < data.data.length; i++) {
            if (data.data[i].number.includes(this.config.filterCueNumber) || this.config.filterCueNumber == '') {
              if (this.config.filterColour.includes(data.data[i].colorName) || this.config.filterColour.length == 0) {
                if (this.config.filterCueType.includes(data.data[i].type) || this.config.filterCueType.length == 0) {
                  if (data.data[i].type != 'Group') {
                    this.matchingCues.push(data.data[i])
                  }
                }
              }
            }
          }
        }  else {
          this.timer.reset()
        }
        if (this.matchingCues.length > 0) {

          this.cueWeCareAbout = this.matchingCues[0]

          let icon = '<i class="fa-solid fa-play" style="margin-right:10px;"></i>'
          if (this.isPaused) {
            icon = '<i class="fa-solid fa-pause orange" style="margin-right:10px;"></i>'
          }
          if (this.config.showCueNumber) {
            this.timer.cueName = '[Cue: ' + this.cueWeCareAbout.number + '] - ' + this.cueWeCareAbout.listName  
            this.timer.cueNameHTML = icon + '<b style="color:#999;margin-right:10px;">' + this.cueWeCareAbout.number + "</b>" + this.cueWeCareAbout.listName
          } else {
            this.timer.cueName = this.cueWeCareAbout.listName
            this.timer.cueNameHTML = icon + this.cueWeCareAbout.listName
          }
          this.timer.noVT = false

          this.client.send('/cue_id/' + this.cueWeCareAbout.uniqueID + '/currentDuration')
          this.client.send('/cue_id/' + this.cueWeCareAbout.uniqueID + '/actionElapsed')
          this.client.send('/cue_id/' + this.cueWeCareAbout.uniqueID + '/isPaused')
        }
        if (this.matchingCues.length == 0) {
          this.timer.reset()
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

      if (cmd == 'isPaused') {
        this.isPaused = data.data
      }

      if (cmd == 'number') {
        this.playheadCueNumber = data.data
      }

      if (cmd == 'listName') {
        this.timeSinceLastListName = new Date()
        
        if (data.data !== '') {
          if (this.config.showCueNumber) {
            this.timer.cueNameHTML = '<i class="fa-solid fa-forward-step orange" style="margin-right: 10px;"></i><b style="margin-right: 10px;">' + this.playheadCueNumber + '</b>' + data.data
            this.timer.cueName = 'STBY: [' + this.playheadCueNumber + '] ' + data.data
          } else {
            this.timer.cueNameHTML = '<i class="fa-solid fa-forward-step orange" style="margin-right: 10px;"></i>' + data.data
            this.timer.cueName = 'STBY: ' + data.data
          }
        } else {
          if (this.config.showCueNumber) {
            this.timer.cueNameHTML = '<i class="fa-solid fa-forward-step orange" style="margin-right: 10px;"></i><b style="margin-right: 10px;">' + this.playheadCueNumber + '</b><i>Cue name not set</i>'
            this.timer.cueName = '<Cue name not set>'
          } else {
            this.timer.cueNameHTML = '<i class="fa-solid fa-forward-step orange" style="margin-right: 10px;"></i><Cue name not set>'
            this.timer.cueName = '<Cue name not set>'
          }
        }
      }

      resolve()
    })
  }

  onShowModeStart() {
    super.onShowModeStart()

    this.timer.reset()
    this.cueWeCareAbout = null
    this.matchingCues = []

    try {
      this.server = new Server(53001, '0.0.0.0', () => {
        log.info('QLab OSC Server is listening on port 53001');
      })

      // accept response
      this.server.on('message', (msg) => {
        this.receive(msg).then(this.onSuccess,this.onError)
      })

      // configure client
      this.client = new Client(this.config.ip, 53000)
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

module.exports = vtAppQlab
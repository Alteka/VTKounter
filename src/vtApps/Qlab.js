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
          {value: "Group"},
        ]
      },
      showSelectedCue: {
        label: "Show selected cue when VT Idle",
        type: "boolean",
        default: true,
      },

    }
    
    // create server & client objects
    this.server = null
    this.client = null

    // to store filtered cues
    this.matchingCues = []
    this.selectedCue = null
  }

  send() {
    this.client.send('/cue/active/currentDuration', 200, () => { })
    this.client.send('/cue/active/actionElapsed', 200, () => { })
    this.client.send('/runningOrPausedCues', 200, () => { })
    this.client.send('/selectedCues', 200, () => { })
    this.client.send('/cue/' + this.selectedCue + '/currentDuration', 200, () => { })
  }

  receive(msg) {
    return new Promise((resolve,reject) => {
      var cmd = msg[0].split('/')[4]
      var data = JSON.parse(msg[1])
      var cue = msg[0].split('/')[3]

      if(cmd == 'selectedCues'){
        if(!data.data[0]){
          //We wait 1.5 second to clear the armedCueName to avoid a brief flash of "No VT" text
          setTimeout(()=>{
            this.timer.armedCueName = null
          },2500)

          return
        }
        
        let cueNumber = data.data[0].number
        let listName = data.data[0].listName

        this.selectedCue = cueNumber

        if(this.timer.armedCueName == listName){
          return
        }

        this.timer.armedCueName = listName
      }

      if (cmd == 'runningOrPausedCues') {
        this.matchingCues = []

        if(data.data.length){
          for (let i = 0; i < data.data.length; i++) {
            if (this.config.filterColour.includes(data.data[i].colorName) || this.config.filterColour.length == 0) {
              if (this.config.filterCueType.includes(data.data[i].type) || this.config.filterCueType.length == 0) {
                this.matchingCues.push(data.data[i])
              }
            }
          }

          if (this.matchingCues.length >= 1) {
            this.timer.cueName = this.matchingCues[0].listName
          } else if (this.matchingCues.length == 0) {
            console.log('resetting because no cues matched')
            this.timer.reset()
          }
        } else {
          this.timer.reset()
        }
      }

      if (cmd == 'currentDuration' && this.matchingCues[0] && this.matchingCues[0].uniqueID == cue) {
        this.timer.noVT = false
        if (this.timer.total !== Math.round(data.data*1000) - 500) {
          log.info('--==--  QLab VT Started with Duration ' + data.data + '  --==--')
          this.timer.elapsed = 1
        }
        this.timer.total = Math.round(data.data * 1000) - 500 //we cheat and subtract 500ms because we'd rather have the count be a little early than late
      }

      if (cmd == 'actionElapsed' && this.matchingCues[0] && this.matchingCues[0].uniqueID == cue) {
        this.timer.elapsed = Math.min(Math.round(data.data * 1000),this.timer.total)
      }

      resolve()
    })
  }

  onShowModeStart() {
    super.onShowModeStart()

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
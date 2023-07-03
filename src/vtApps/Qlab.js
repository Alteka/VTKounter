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
    }

    // create server & client objects
    this.server = null
    this.client = null

    // to store filtered cues
    this.matchingCues = []

    this.timeSinceLastListName
  }

  send() {
    this.client.send('/runningOrPausedCues')
    this.client.send('/cue/playhead/listName')

    if (this.timeSinceLastListName < (new Date() - 600)) {
      this.timer.armedCueName = null
    }
  }

  receive(msg) {
    return new Promise((resolve,reject) => {

      let replyAddress = msg[0].split('/')

      let cmd = replyAddress.pop()
      let data = JSON.parse(msg[1])
      let cue = replyAddress.pop()

      if (cmd == 'runningOrPausedCues') {
        this.matchingCues = [];
        if (data.data.length > 0) {
          for (let i = 0; i < data.data.length; i++) {
            if (this.config.filterColour.includes(data.data[i].colorName) || this.config.filterColour.length == 0) {
              if (this.config.filterCueType.includes(data.data[i].type) || this.config.filterCueType.length == 0) {
                if (data.data[i].type != 'Group') {
                  this.matchingCues.push(data.data[i].uniqueID)
                }
              }
            }
          }
        }  else {
          this.timer.reset()
        }
        if (this.matchingCues.length > 0) {
          let i=0;
          while (data.data[i].type == 'Group') {
            i++;
          }
          this.timer.cueName = data.data[i].listName
          this.timer.noVT = false
        }
        if (this.matchingCues.length == 0) {
          this.timer.reset()
        }

        this.client.send('/cue_id/' + this.matchingCues[0] + '/currentDuration')
        this.client.send('/cue_id/' + this.matchingCues[0] + '/actionElapsed')
      }



      if (cmd == 'currentDuration' && this.matchingCues[0] == cue) {
        if (this.timer.total !== Math.round(data.data*1000)) {
          log.info('--==--  QLab VT Started with Duration ' + data.data + '  --==--')
        }
        this.timer.total = Math.round(data.data * 1000)
      }

      if (cmd == 'actionElapsed' && this.matchingCues[0] == cue) {
        this.timer.elapsed = Math.round(data.data * 1000)
      }

      if (cmd == 'listName' && this.matchingCues.length == 0) {
        this.timeSinceLastListName = new Date()
        // log.debug(data)
        if (data.data != '') {
          this.timer.armedCueName = data.data
        } else {
          this.timer.armedCueName = "<Cue name not set>"
        }
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
const vtApp = require('../vtApp')
const dgram = require('dgram')
const net = require('net')
//const log = require('electron-log')

class vtAppPpp extends vtApp {
  constructor(...args) {
    super(...args)

    this.name = "PP+"
    this.longName = "PlaybackPro Plus"

    this.controls = {
      ...this.controls,
      port: {
        label: "Port",
        type: "radio-group",
        default: 7000,
        values: [
          {value: 4647, label: "4647 (TCP)"},
          {value: 7000, label: "7000 (UDP)"}
        ]
      }
    }

    // commands to be sent
    // (from https://www.dtvideolabs.com/user-guide-playbackproplus/#6.2)
    this.commands = [
      'GD', // program clip duration
      'GN', // program clip name
      'TE', // program time elapsed
    ]

    // create client
    this.client = null

    // used to store last time stamp received
    this.lastReceivedTime = 0

    // keep track of the next command to sent via TCP
    this._nextTCPCommand = 0

    this.UDP = 7000
    this.TCP = 4647
  }

  send() {
    // send each command to PlaybackPro Plus

    if(this.client.send && this.config.port == this.UDP)
      this.commands.forEach(command => {
        this.client.send(command, this.config.port, this.config.ip, (err) => {
          if(err)
            this.onError(err)
        })
      })
  }

  receive(response) {
    //log.info(response)

    response = response.toString()

    this.timer.noVT = false

    switch(true) {
      case (response == 'N/A'):
        // returns 'N/A' when no video is playing
        this.timer.reset()
        break
      
      case (/(\d{2}:){3}\d{2}/.test(response)):
        // response is a timestamp - could be either remaining or total duration

        const responseTime = this.timestampToMs(response)

        if(responseTime >= this.timer.total) {
          // if greater must be a new video
          this.timer.total = responseTime
        }
        else if(responseTime < this.lastReceivedTime) {
          // if less than the last time then must be elapsed
          this.timer.elapsed = responseTime
          this.timer.total = this.lastReceivedTime
        }

        // update the last received time
        this.lastReceivedTime = responseTime
        break

      default:
        // otherwise assume it's the cue name
        this.timer.cueName = response
    }

    // update the GUI
    this.onSuccess()
  }

  onShowModeStart() {
    super.onShowModeStart()

    try {
      switch(this.config.port) {
        case this.UDP:
          this.client = dgram.createSocket('udp4')

          this.client.on('message', (response) => {
            this.receive(response)
          })
          break
        
        case this.TCP:
          this.client = new net.Socket()
          this.nextTCPCommand = 0

          this.client.connect(this.config.port, this.config.ip, () => {
            this.onSuccess()
            // send the next command
            this.client.write(this.commands[this.nextTCPCommand++])
          })

          this.client.on('data', (response) => {
            this.receive(response)
            // now send the next one
            this.client.write(this.commands[this.nextTCPCommand++])
          })
          break

        default:
          // otherwise throw an error
          this.onError(new Error(`Port '${this.config.port}' not supported`))
          return
      }

      this.client.on('error', this.onError)
    }
    catch(err) {
      this.onError(err)
    }
  }

  onShowModeStop() {
    super.onShowModeStop()

    this.lastReceivedTime = 0

    switch(this.config.port) {
      case this.UDP:
        if(this.client.close)
          this.client.close()
        break
      case this.TCP:
        if(this.client.destroy)
          this.client.destroy()
        break
    }
    
    this.client = null
  }

  get nextTCPCommand() {
    return this._nextTCPCommand
  }

  set nextTCPCommand(index) {
    if(index >= this.commands.length)
      index = 0
    
    this._nextTCPCommand = index
  }
}

module.exports = vtAppPpp
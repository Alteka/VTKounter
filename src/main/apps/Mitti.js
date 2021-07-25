const vtApp = require('../vtApp')
const { Client, Server } = require('node-osc')
const log = require('electron-log')

class vtAppMitti extends vtApp {
  constructor(...args) {
    super(...args)
    
    // create server & client objects
    this.server = null
    this.client = null

    this.name = "Mitti"
    this.notes = `In Mitti preferences, select 'OSC/UDP Controls' in the left side-bar.<br />
    Set 'Feedback' to Custom. Set the port to 1234.`

    // to store filtered cues
    this.matchingCues = []
  }

  send() {
    this.client.send('/mitti/resendOSCFeedback', 200, () => { })
  }

  receive(msg) {
    return new Promise((resolve,reject) => {
      // TODO: add support for frames

      switch(msg[0]) {
        case '/mitti/cueTimeLeft':
          if (this.timestampToMs(msg[1]) == 0)
            this.timer.reset()
          else
            this.timer.noVT = false
          break

        case '/mitti/cueTimeElapsed':
          let elap = msg[1].split(':')
          this.timer.elapsed = this.timestampToMs(msg[1])
          break

        case '/mitti/currentCueName':
          this.timer.cueName = msg[1]
          break

        case '/mitti/currentCueTRT':
          this.timer.total = this.timestampToMs(msg[1])
          break
      }

      resolve()
    })
  }

  onShowModeStart() {
    super.onShowModeStart()

    try {
      this.server = new Server(1234, '0.0.0.0', () => {
        log.info('Mitti OSC Server is listening on port 1234');
      })

      // accept response
      this.server.on('message', (msg) => {
        this.receive(msg).then(this.callback.onReceiveSuccess,this.callback.onReceiveError)
      })

      // configure client
      this.client = new Client(this.config.ip, 51000)
    }
    catch (err) {
      this.callback.onReceiveError(err)
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

module.exports = vtAppMitti
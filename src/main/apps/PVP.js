const vtApp = require('../vtApp')
const axios = require('axios')
//const log = require('electron-log')

class vtAppPVP extends vtApp {
  constructor(...args) {
    super(...args)

    this.name = "PVP"
    this.longName = "ProVideoPlayer"
    this.controls = {
      ...this.controls,
      port: {
        label: "Port",
        type: "number",
        default: 8080
      },
      https: {
        label: "Use HTTPS",
        type: "boolean",
        default: true
      },
      token: {
        label: "Authenication Token",
        type: "string",
        default: "",
        notes: "Leave blank to disbale authentication"
      },
      layer: {
        label: "Layer Name",
        type: "string",
        default: "",
        notes: "Leave blank to use first layer with video playing"
      }
    }
  }

  send() {
    let headers = {}
    if(this.config.token)
      headers = {
        headers: {
          'Authentication': `Bearer ${this.config.token}`
        }
      }

    axios.get(
      `http${this.config.https ? 's' : ''}://${this.config.ip}:${this.config.port}/api/0/transportState/workspace`, headers)
    .then(this.receive.bind(this))
    .then(this.onSuccess,this.onError)
  }

  receive(response) {
    return new Promise((resolve,reject) => {
      // check the reponse status
      if(response.status < 200 || response.status >= 300)
        reject(new Error(`HTTP status ${response.status}`))

      try {
        // parse the returned JSON
        const {data: layers} = response.data

        // loop through all the layers
        const found = layers.some(layer => {
          // either a layer hasn't been picked and this layer is playing
          // or this is the selected layer
          if((!this.config.layer || this.config.layer == layer.transportState.layer.name)
          && layer.transportState.isPlaying) {
            this.timer.elapsed = layer.transportState.timeElapsed * 1000
            this.timer.remaining = layer.transportState.timeRemaining * 1000
            //this.timer.cueName = input.title //TODO do a separate query
            this.timer.noVT = false

            // stop there
            return true
          }
        })

        // otherwise no matching has been found
        if(!found)
          this.timer.reset()
        resolve()
      }
      catch(err) {
        reject(err)
      }
    })
  }
}

module.exports = vtAppPVP
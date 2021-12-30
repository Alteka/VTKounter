const vtApp = require('../vtApp')
const axios = require('axios')
const https = require('https')
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
        label: "Auth Token",
        type: "string",
        default: "",
        notes: "Leave blank to disable authentication"
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
    let options = {}

    if(this.config.https) {
      // HTTPS returns 'certificate has expired' so this ignores that
      const agent = new https.Agent({  
        rejectUnauthorized: false
      })

      options = {
        ...options,
        httpsAgent: agent
      }
    }

    if(this.config.token) {
      // add the authentication token if it's been configured
      options = {
        ...options,
        headers: {
          'Authorization': `Bearer ${this.config.token}`
        }
      }
    }

    axios.get(
      `http${this.config.https ? 's' : ''}://${this.config.ip}:${this.config.port}/api/0/transportState/workspace`, options)
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
          if((!this.config.layer || this.config.layer == layer.transportState.layer.name)
          && layer.transportState.isPlaying) {
            // either a layer hasn't been picked and this layer is playing
            // or this is the selected layer
            this.timer.elapsed = layer.transportState.timeElapsed * 1000
            this.timer.remaining = layer.transportState.timeRemaining * 1000
            this.timer.cueName = layer.transportState.layer.name // cannot get name of cue
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
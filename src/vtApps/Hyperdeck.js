const vtApp = require('../vtApp')
const log = require('electron-log')
var HyperdeckLib = require("hyperdeck-js-lib")

class vtAppMitti extends vtApp {
  constructor(...args) {
    super(...args)
    
    // create server & client objects
    this.hyperdeck = null

    this.name = "Hyperdeck"

    this.controls = {
      ip: {
        label: "IP Address",
        type: 'string',
        default: '127.0.0.1'
      }
    }
  }

  send() {
    this.hyperdeck.transportInfo().then(function(response) {
      console.log("Got response with code "+response.code+".")
      console.log("Hyperdeck unique id: "+response.params["unique id"])
    }).catch(function(errResponse) {
      if (!errResponse) {
        console.error("The request failed because the hyperdeck connection was lost.")
      }
      else {
        console.error("The hyperdeck returned an error with status code "+errResponse.code+".")
      }
    })
    
  }

  receive(msg) {
   console.log("Receive", msg) 
  }

  onShowModeStart() {
    super.onShowModeStart()

    this.hyperdeck = new HyperdeckLib.Hyperdeck(this.config.ip)
    
    this.hyperdeck.onConnected().then(function() {

      this.hyperdeck.makeRequest("device info").then(function(response) {
        console.log("Got response with code "+response.code+".")
        console.log("Hyperdeck unique id: "+response.params["unique id"])
      }).catch(function(errResponse) {
        if (!errResponse) {
          console.error("The request failed because the hyperdeck connection was lost.")
        }
        else {
          console.error("The hyperdeck returned an error with status code "+errResponse.code+".")
        }
      })
   
      hyperdeck.getNotifier().on("asynchronousEvent", function(response) {
        console.log("Got an asynchronous event with code "+response.code+".")
      })
   
      hyperdeck.getNotifier().on("connectionLost", function() {
        console.error("Connection lost.")
      })
  }).catch(function() {
      console.error("Failed to connect to hyperdeck.")
  })

  }

  onShowModeEnd() {
    super.onShowModeEnd()
  }
}

module.exports = vtAppMitti
const vtApp = require('../vtApp')
const axios = require('axios').default
const parseString = require('xml2js').parseString

class vtAppVmix extends vtApp {
  constructor(...args) {
    super(...args)

    this.name = "vMix"
    this.controls = {
      ...this.controls,
      input: {
        label: "Input #",
        type: "string",
        default: "",
        notes: "Leave blank to use the active input"
      },
    }
  }

  send() {
    axios.get(`http://${this.config.ip}:8088/api`)
    .then(this.receive.bind(this))
    .then(this.onSuccess,this.onError)
  }

  receive(response) {
    return new Promise((resolve,reject) => {
      // check the reponse status
      if(response.status < 200 || response.status >= 300)
        reject(new Error(`HTTP status ${response.status}`))

      // parse the returned XML
      parseString(response.data, (err, xml) => {   
        // stop if invalid XML
        if(err)
          reject(new Error(`API XML parse error: ${err}`))
    
        // set the input number to either the active input or the number selected
        try {
          var inputNumber = parseInt(this.config.input ? this.config.input : xml.vmix.active)
        }
        catch (err) {
          reject(new Error(`Could not parse the input number: ${err}`))
        }

        var found = false

        // loop through inputs in vMix
        xml.vmix.inputs[0].input.forEach((input, index) => {
  
          input = input.$
  
          // found the selected input 
          if(input.number == inputNumber) {
  
            // selected input has a run time (VT / audio / etc.)
            if(input.duration > 0) {
              found = true

              this.timer.total = input.duration
              this.timer.elapsed = input.position
              this.timer.cueName = input.title
              this.timer.noVT = false
            }
          }
        })
        
        // if the input wasn't found then no VT playing
        if(!found)
          this.timer.reset()

        resolve()
      })
    })
  }
}

module.exports = vtAppVmix
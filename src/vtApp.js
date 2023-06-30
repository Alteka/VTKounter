const log = require('electron-log') // remove
const EventEmitter = require('events')

class vtApp extends EventEmitter {
  /**
   * Logic and behaviour of each app supported by VT Kounter
   * @param {Object} config - Config for this app
   * @param {Object} callback - Includes callbacks: {onReceiveSuccess(), onReceiveError()}
   */
  constructor() {
    super()

    // initialise config object to be filled onShowModeStart()
    this.config = {}

    // how the  appears in the GUI
    this.name = 'App Name'
    this.longName = ''
    this.notes = ''
    this.controls = {
      ip: {
        label: "IP Address",
        type: 'string',
        default: '127.0.0.1'
      }
    }


    // info for the current running VT
    this._timer = new vtTimer()
    this.timer = new Proxy(this._timer,updateLastUpdated)

    // to be called when there is a successful response from the app
    // (wrapper for emitter)
    this.onSuccess = () => {
      this.emit('success')
    }

    // to be call when there is an unsuccessful response from the app
    // (wrapper for emitter)
    this.onError = (err = null) => {
      this.emit('error',err ? err : new Error('Undefined error'))
    }
  }

  /**
   * Send function to request information from the app
   * This could include a call to the receive()
   */
  send() {
    return
  }

  /**
   * Receiver for the app's response to the send()
   * Could use a promise with resolve & reject functions
   * this.onSuccess & this.onError respectively
   */
  receive() {
    return
  }

  /**
   * Called when the app leaves config mode and enters show mode
   * e.g. override with OSC server start
   */
  onShowModeStart() {
    this.timer.reset()
  }

  /**
   * Called when the app leaves show mode and enters config mode
   */
  onShowModeStop() {
    return
  }

  /**
   * Convert timestamp string to time integer (in ms)
   * @param {string} timestamp - string of format "hh:mm:ss:ff"
   * @param {*} frameRate - frame rate to interpret the frames as (optonal)
   */
  timestampToMs(timestamp,frameRate = 0) {
    let units = timestamp.split(':')
    units = units.map(x => parseInt(x))

    // duration of one frame in ms
    const frame = frameRate ? (1000 / frameRate) : 0

    return ( (units[0] * 60 * 60) + (units[1] * 60) + units[2]) * 1000 + (units[3] * frame)
  }
}

module.exports = vtApp

// handler for updating objects last updated time
const updateLastUpdated = {
  set(target, property, value) {
    // update last updated time to now
    target.lastUpdated = (new Date()).getTime()
    // update the requested value
    target[property] = value

    return true
  }
}

class vtTimer {
  /**
   * Store for current VT info (in ms)
   * Used in show mode GUI
   */
  constructor() {
    this.reset()
    // set last updated to now
    this.lastUpdated = (new Date()).getTime()
  }

  get remaining() {
    let remaining = this.total - this.elapsed
    return remaining >= 0 ? remaining : 0
  }

  set remaining(remaining) {
    if(!this.elapsed)
      this.elapsed = this.total - remaining
    else
      this.total = this.elapsed + remaining
  }

  get seconds() {
    return {
      elapsed: Math.round(this.elapsed/1000),
      remaining: Math.round(this.remaining/1000),
      total: Math.round(this.total/1000)
    }
  }

  get progress() {
    return this.elapsed / this.total
  }

  /**
   * Reset the timer to defaults
   */
  reset() {
    this.elapsed = this.total = 0
    this.cueName = ""
    this.noVT = true
  }
}
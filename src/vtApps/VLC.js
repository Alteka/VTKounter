const vtApp = require('../vtApp')
const log = require('electron-log')
const {Server, Client} = require('node-osc')
const axios = require('axios').default

class vtAppVLC extends vtApp {
    constructor(...args) {
        super(...args)

        // create server & client objects
        this.vlc = null

        this.name = 'VLC'

        this.controls = {
            ip: {
                label: 'IP Address',
                type: 'string',
                default: '127.0.0.1',
                required: true,
            },
            port: {
                label: 'Port',
                type: 'string',
                default: '8080',
                required: true,
            },
            password: {
                label: 'Password',
                type: 'string',
                default: '',
                required: true,
            }
        }
        this.notes = 'Enable the Web server in "Main Interfaces" in settings,<br /> and set a password in the LUA HTTP section.<br /><br />A Password is required'
    }

    send() {
        axios.get('http://' + this.config.ip + ':' + this.config.port + '/requests/status.json',{
            auth: {
                username: '',
                password: this.config.password,
            },
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(response => {
           this.receive(response.data).then(this.onSuccess,this.onError)
        }).catch(error => {
            console.log(error)
        })
    }

    receive(msg) {
        return new Promise((resolve,reject) => {
            let duration = msg.length
            let progress = msg.time
            if(duration){
                this.timer.total = Math.round(duration * 1000)
                this.timer.elapsed = Math.round(progress * 1000)
                this.timer.cueName = msg.information.category.meta.filename
                this.timer.noVT = false
            } else {
                this.timer.reset()
            }
            resolve()
        })
    }

    onShowModeStart() {
        super.onShowModeStart()
    }

    onShowModeEnd() {
        super.onShowModeEnd()
    }
}

module.exports = vtAppVLC
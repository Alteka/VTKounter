var app = new Vue({
    el: '#app',
    data: {
      timer: 'Hello Vue!',
      fs: 48,
      fg: "0000ff"
    },
    mounted: function() {
      console.log('setting up socket connection')
      const socket = io();

      socket.on("connect", () => { console.log('connected to socket server') })
      socket.on("disconnect", () => { console.log('disconnected from socket server') })

      socket.on("timer", (msg) => { this.timer = msg })


      const urlParams = new URLSearchParams(window.location.search)
      this.fs = urlParams.get('fs')
      this.fg = urlParams.get('fg')
      

    }
  })
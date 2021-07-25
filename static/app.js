var app = new Vue({
    el: '#app',
    data: {
      timer: 'VT Kounter',
      fs: 48,
      fg: "0000ff",
      a: "center"
    },
    mounted: function() {
      console.log('setting up socket connection')
      const socket = io();

      socket.on("connect", () => { console.log('connected to socket server') })
      socket.on("disconnect", () => { console.log('disconnected from socket server') })

      socket.on("timer", (msg) => { this.timer = msg })


      const urlParams = new URLSearchParams(window.location.search)
      if (urlParams.has('fs')) {
        this.fs = urlParams.get('fs')
        console.log('Override default font size to ', this.fs)
      } else {
        console.log('Font size is using the default of ', this.fs)
      }
      if (urlParams.has('fg')) {
        this.fg = urlParams.get('fg')
        console.log('Override default text colour to ', this.fg)
      } else {
        console.log('Text colour is using the default value of ', this.fg)
      }
      if (urlParams.has('a')) {
        this.a = urlParams.get('a')
        console.log('Override default text alignment to ', this.a)
      } else {
        console.log('Text alignment is using the default of ', this.fs)
      }


    }
  })
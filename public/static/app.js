var app = new Vue({
    el: '#app',
    data: {
      timer: 'VT Kounter',
      cueName: '',
      nameSize: 0.2,
      showName: false,
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
      socket.on("cueName", (msg) => { this.cueName = msg })

      const urlParams = new URLSearchParams(window.location.search)
      if (urlParams.has('fs')) {
        this.fs = urlParams.get('fs')
        console.log('Override default font size to ', this.fs)
      }
      if (urlParams.has('fg')) {
        this.fg = urlParams.get('fg')
        console.log('Override default text colour to ', this.fg)
      } 
      if (urlParams.has('a')) {
        this.a = urlParams.get('a')
        console.log('Override default text alignment to ', this.a)
      } 
      if (urlParams.has('ns')) {
        this.nameSize = urlParams.get('ns')
        console.log('Override cue name size to ', this.nameSize)
      } 
      if (urlParams.get('sn') == 'true') {
        this.showName = true
      }        
      


      var vm = this
      Mousetrap.bind(['+', 'i', '='], function() { 
        vm.fs++
       })
       Mousetrap.bind(['-', 'd'], function() { 
        vm.fs--
       })
       Mousetrap.bind('l', function() { 
        vm.a = 'left'
       })
       Mousetrap.bind('r', function() { 
        vm.a = 'right'
       })
       Mousetrap.bind(['m', 'c'], function() { 
        vm.a = 'center'
       })
       Mousetrap.bind(['n', 'q'], function() { 
        vm.showName = !vm.showName
       })
       Mousetrap.bind('w', function() { 
        vm.fg = 'ffffff'
       })
       Mousetrap.bind('b', function() { 
        vm.fg = '000000'
       })

    }
  })
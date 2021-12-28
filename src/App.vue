<template>
  <el-row style="padding-top: 10px;">
      <el-col :span="17" style="font-size: 36px; padding-left: 10px;">
        <img src="~@/assets/bug.png" height="26" @click="openLogs()" /> VT Kounter
      </el-col>
      <el-col :span="7">
        <el-switch style="display: block" v-model="showMode" active-color="#6ab42f" active-text="Show" inactive-text="Setup"></el-switch>
      </el-col>
    </el-row>
    <div style="position: absolute; top: 40px; right: 10px; font-size: 80%;" v-if="showMode">Size&nbsp;
      <el-button-group>
        <el-button round type="success" size="mini" @click="size-=25">-</el-button>
        <el-button round type="success" size="mini" @click="size+=25">+</el-button>
      </el-button-group>
    </div>
    <div style="font-size: 70%; position: absolute; top: 50px; right: 18px;" v-if="!showMode">v{{ version }}</div>

    <el-divider content-position="center" v-if="showMode">Time Remaining</el-divider>
    
    <show-mode v-if="showMode" :config="config" :appControls="appControls" :size="size"></show-mode>
    <config-mode v-else :config="config" :appControls="appControls"></config-mode>

    <resize-observer @notify="handleResize" />
</template>

<script>
import ShowMode from './components/ShowMode.vue'
import ConfigMode from './components/ConfigMode.vue'

export default {
  name: 'App',
  components: { ShowMode, ConfigMode },
  data: function () {
      return {
        showMode: false,
        config: require('./defaultConfig.json'),
        appControls: null,
        darkMode: false,
        size: 400,
        version: require('./../package.json').version
      }
    },
    mounted: function(){
      this.$nextTick(function () {
        let h = document.getElementById('app').clientHeight
        let w = document.getElementById('app').clientWidth
        window.ipcRenderer.send('controlResize', {width: w, height: h})
      })
      let vm = this
      window.ipcRenderer.receive('darkMode', function(val) {
        vm.darkMode = val
      })
      window.ipcRenderer.receive('config', function(cfg) {
        vm.config = cfg
      })
      window.ipcRenderer.receive('appControls', function(appControls) {
        vm.appControls = appControls
      })
      window.ipcRenderer.send('getConfig')
    },
    watch: {
      showMode: function(newVal) {
        if (newVal) {
          // going into config mode
          window.ipcRenderer.send('showMode', this.config)
        } else {
          // going into show mode
          window.ipcRenderer.send('configMode')
        }
      }
    },
    methods: {
      handleResize: function({ width, height }) {
        window.ipcRenderer.send('controlResize', {width: width, height: height})
      },
      openLogs: function() {
        window.ipcRenderer.send('openLogs')
      }
    }
  }
</script>

<style>
#app {
  font-family: Sansation, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}
body {
  font-family: Sansation, Helvetica, sans-serif;
  overflow: hidden !important;
  margin: 0;
}
@font-face {
  font-family: Sansation;
  src: url("~@/assets/Sansation-Regular.ttf");
}
</style>

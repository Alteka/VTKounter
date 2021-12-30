<template>
<div style="position: relative;" :class="{ darkMode : darkMode }">
  <el-row style="padding-top: 10px;">
    <el-col :span="17" class="title" >
      <img src="~@/assets/bug.png" height="26" @click="openLogs()" /> VT Kounter
    </el-col>
    <el-col :span="7">
      <el-switch style="display: block" v-model="showMode" active-color="#6ab42f" active-text="Show" inactive-text="Setup"></el-switch>
    </el-col>
  </el-row>
  <div class="sizeControls" v-if="showMode">Size&nbsp;
    <el-button-group>
      <el-button round type="success" size="mini" @click="size-=25">-</el-button>
      <el-button round type="success" size="mini" @click="size+=25">+</el-button>
    </el-button-group>
  </div>
  <div class="version" v-if="!showMode">v{{ version }}</div>


  <el-divider content-position="center" v-if="showMode">Time Remaining</el-divider>
  
  <show-mode v-if="showMode" :config="config" :appControls="appControls" :size="size"></show-mode>
  
  
  <el-tabs v-if="!showMode" v-model="tab" style="padding-left: 10px; padding-right: 10px;">
      <el-tab-pane label="Core Settings" name="core">
        <core-controls v-model="config" :appControls="appControls"></core-controls>
      </el-tab-pane>

      <el-tab-pane v-if="appControls" :label="(appControls[config.appChoice].longName ? appControls[config.appChoice].longName : appControls[config.appChoice].name)">
        <app-controls v-model="config.apps[config.appChoice]" :appControl="appControls[config.appChoice]"></app-controls>
      </el-tab-pane>

      <el-tab-pane label="OBS" name="obs">
        <obs-controls v-model="config.obs"></obs-controls>
      </el-tab-pane>

      <el-tab-pane label="Web Server" name="webserver">
        <webserver-controls v-model="config.webserver"></webserver-controls>
      </el-tab-pane>
    </el-tabs>

  <resize-observer @notify="handleResize" :showTrigger="true" />
  </div>
</template>

<script>
import ShowMode from './components/ShowMode.vue'
import ObsControls from './components/ObsControls'
import AppControls from './components/AppControls'
import CoreControls from './components/CoreControls'
import WebserverControls from './components/WebserverControls'

export default {
  name: 'App',
  components: { ShowMode, ObsControls, AppControls, CoreControls, WebserverControls },
  data: function () {
      return {
        showMode: false,
        config: require('./defaultConfig.json'),
        appControls: null,
        darkMode: false,
        size: 400,
        version: require('./../package.json').version,
        tab: 'core'
      }
    },
    mounted: function(){
      this.$nextTick(function () {
        window.ipcRenderer.send('controlResize', document.getElementById('app').clientHeight)
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
          // console.log(JSON.parse(JSON.stringify(this.config)))
          window.ipcRenderer.send('showMode', JSON.parse(JSON.stringify(this.config)))
        } else {
          // going into show mode
          window.ipcRenderer.send('configMode')
        }
      }
    },
    methods: {
      handleResize: function() {
        window.ipcRenderer.send('controlResize', document.getElementById('app').clientHeight)
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

.green {
  color: #6ab42f;
  margin-right: 5px;
}
.red {
  color: #ff3333;
}

.title {
  font-size: 36px;
  padding-left: 10px;
  text-align: left;
}
.version {
  font-size: 70%; 
  position: absolute;
  top: 50px;
  right: 18px;
}
.sizeControls {
  position: absolute;
  top: 40px;
  right: 10px;
  font-size: 80%;
}

.darkMode {
  background: #222;
  color: #aaa;
}
.darkMode .el-divider {
  background: #555;
}
.darkMode .el-progress-bar__outer {
  background: #555;
}
.darkMode .el-divider__text {
  background: #222;
  color: #aaa;
}
.darkMode label {
  color: #bbb;
}
.darkMode .el-tabs__item {
  color: #bbb;
}
.darkMode .el-switch__label {
  color: #bbb;
}
.darkMode .el-tabs--border-card {
  background: #333;
  border: 1px solid #111;
}
.darkMode .el-tabs--border-card>.el-tabs__header {
  background: #292929;
  border-bottom: 1px solid #111;
}
.darkMode .el-tabs--border-card>.el-tabs__header .el-tabs__item.is-active {
  background: #333;
  border-right: 1px solid #111;
  border-left: 1px solid #111;
}
.darkMode .el-radio-button__inner {
  background: #3d3d3d;
  color: #ddd;
  border: 1px solid #666;
}
.darkMode .el-radio-button:first-child .el-radio-button__inner {
  border-left: 1px solid #666;
}
.darkMode .el-button {
  background: #3d3d3d;
  color: #ddd;
  border: 1px solid #666;
}
.darkMode .el-input__inner {
  background: #3d3d3d;
  color: #ddd;
  border: 1px solid #666;
}
.darkMode .el-input-number__decrease {
  background: #3d3d3d;
  color: #ddd;
}
.darkMode .el-input-number__increase {
  background: #3d3d3d;
  color: #ddd;
}
.darkMode .el-checkbox-button__inner {
  background: none;
}
</style>

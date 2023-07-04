<template>
<div style="position: relative; min-height:100vh; display:flex; flex-direction: column;" :class="{ darkMode : config.darkMode, showMode : showMode }">
  <el-row style="padding-top: 10px;">
    <el-col :span="18" class="title" >
      <img src="~@/assets/bug.png" height="32" style="margin-bottom: -5px;"/> VT Kounter
    </el-col>
    <el-col :span="6">
      <transition name="fade">
        <el-switch v-model="showMode" v-if="mouseIsAround || !showMode" active-color="#6ab42f" active-text="Show" inactive-text="Setup"></el-switch>
      </transition>
      </el-col>
    <transition name = "fade">
      <div class="sizeControls" v-if="showMode && mouseIsAround">Size&nbsp;
        <el-button-group>
          <el-button round type="success" size="small" @click="size-=25">-</el-button>
          <el-button round type="success" size="small" @click="size+=25">+</el-button>
        </el-button-group>
      </div>
    </transition>
    <div class="version" v-if="!showMode">v{{ version }}</div>
  </el-row>

  
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

      <el-tab-pane label="OSC Output" name="osc">
        <o-s-c-controls v-model="config.osc"></o-s-c-controls>
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
import OSCControls from './components/OSCControls'

export default {
  name: 'App',
  components: { ShowMode, ObsControls, AppControls, CoreControls, WebserverControls, OSCControls },
  data: function () {
      return {
        showMode: false,
        config: require('./defaultConfig.json'),
        appControls: null,
        size: 400,
        version: require('./../package.json').version,
        tab: 'core',
        mouseIsAround: false
      }
    },
    mounted: function(){
      this.$nextTick(function () {
        if (this.showMode) {
          window.ipcRenderer.send('controlResize', {width: document.getElementById('app').clientWidth, height: document.getElementById('app').clientHeight})
        }
      })
      let vm = this
      window.ipcRenderer.receive('config', function(cfg) {
        vm.config = cfg
      })
      window.ipcRenderer.receive('appControls', function(appControls) {
        vm.appControls = appControls
      })
      window.ipcRenderer.send('getConfig')
           
      document.addEventListener('mouseenter', () => {
        vm.mouseIsAround = true
      });
      document.addEventListener('mouseleave', () => {
        vm.mouseIsAround = false
      });
    },
    watch: {
      showMode: function(newVal) {
        if (newVal) {
          // going into show mode
          // console.log(JSON.parse(JSON.stringify(this.config)))
          window.ipcRenderer.send('showMode', JSON.parse(JSON.stringify(this.config)))
        } else {
          // going into config mode
          window.ipcRenderer.send('configMode')
        }
      }
    },
    methods: {
      handleResize: function() {
        if (this.showMode) {
          window.ipcRenderer.send('controlResize', {width: document.getElementById('app').clientWidth, height: document.getElementById('app').clientHeight})
        }
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
  user-select: none;
}
@font-face {
  font-family: Sansation;
  src: url("~@/assets/Sansation-Regular.ttf");
}

.green {
  color: #6ab42f;
  margin-right: 5px;
}
.orange {
  color: #E28806;
}
.red {
  color: #ff3333;
}
.blue {
  color: #2236ce;
}

.title {
  font-size: 32px;
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
  top: 48px;
  right: 10px;
  font-size: 80%;
  z-index:5;
}

.darkMode {
  background: #222;
  color: #aaa;
}

.darkMode.showMode {
  background:#000;
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
.darkMode .el-input__wrapper {
  background: #3d3d3d;
}
.darkMode .el-input__inner {
  background: #3d3d3d;
  color: #ddd;
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

.darkMode .el-input-group__append button.el-button {
  background: #3d3d3d;
  border: 1px solid #ddd;
}

.darkMode #timer {
  color:#fff;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity .5s;
}
.fade-enter, .fade-leave-to  {
  opacity: 0;
}

</style>
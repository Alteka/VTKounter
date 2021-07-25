<template>
  <div id="wrapper" style="position: relative; padding-bottom: 5px" :class="{ darkMode : darkMode }">

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
    <el-row v-if="showMode" style="font-family: SansationMono; font-size: 400%; text-align: center;" :style="{ color: warningColour, 'font-size': size + '%'}">
      {{timer}}
    </el-row>
    <el-row v-if="showMode && config.showPercentage" style="padding: 10px; text-align: center;">
      <el-progress :percentage="percentage" :color="warningColour" :show-text="false"></el-progress>
    </el-row>
    <el-row v-if="showMode && config.showCueName" style="padding: 10px; text-align: center;">
      {{ cueName }}
    </el-row>
    <el-row v-if="showMode" style="padding: 10px; text-align: center;">
      <el-col :span="6" v-if="!config.obs.enabled">&nbsp;</el-col>
      <el-col :span="12">
        <span v-if="vtStatus">{{appControls[config.appChoice].name}} <i class="fas fa-link green"></i> Connected</span>
        <span v-if="!vtStatus">{{appControls[config.appChoice].name}} <i class="fas fa-link red"></i> Not Connected</span>
      </el-col>
      <el-col :span="12" v-if="config.obs.enabled">
        <span v-if="obsStatus">OBS <i class="fas fa-link green"></i> Connected</span>
        <span v-if="!obsStatus">OBS <i class="fas fa-link red"></i> Not Connected: {{obsMessage}}</span>
      </el-col>
    </el-row>
    
    <el-tabs v-model="tab" style="padding-left: 10px; padding-right: 10px;" v-if="!showMode">
      <el-tab-pane label="Core Settings" name="core">
        <core-controls :config="config" :appControls="appControls"></core-controls>
      </el-tab-pane>

      <el-tab-pane :label="(appControls[config.appChoice].longName ? appControls[config.appChoice].longName : appControls[config.appChoice].name)">
        <app-controls :app="config.apps[config.appChoice]" :appControl="appControls[config.appChoice]"></app-controls>
      </el-tab-pane>

      <el-tab-pane label="OBS" name="obs">
        <obs-controls :obs="config.obs"></obs-controls>
      </el-tab-pane>

      <el-tab-pane label="Web Server" name="webserver">
        <webserver-controls :webserver="config.webserver"></webserver-controls>
      </el-tab-pane>
    </el-tabs>

    <resize-observer @notify="handleResize" />
  </div>
</template>

<script>
const { ipcRenderer } = require('electron')
import ObsControls from './Control/ObsControls'
import AppControls from './Control/AppControls'
import CoreControls from './Control/CoreControls'
import WebserverControls from './Control/WebserverControls'

  export default {
    name: 'control',
    components: { ObsControls, AppControls, CoreControls, WebserverControls },
    data: function () {
      return {
        tab: 'core',
        showMode: false,
        config: require('../../main/defaultConfig.json'),
        appControls: {},
        vtStatus: false,
        obsStatus: false,
        obsMessage: '',
        percentage: 0,
        cueName: '',
        timer: 'No VT',
        warning: false,
        darkMode: false,
        size: 400,
        version: require('./../../../package.json').version
      }
    },
    mounted: function(){
      this.$nextTick(function () {
        let h = document.getElementById('wrapper').clientHeight
        let w = document.getElementById('wrapper').clientWidth
        ipcRenderer.send('controlResize', w, h)
      })
      let vm = this
      ipcRenderer.on('vtStatus', function(event, status) {
        vm.vtStatus = status
      })
      ipcRenderer.on('obsStatus', function(event, status, msg) {
        vm.obsStatus = status
        vm.obsMessage = msg
      })
      ipcRenderer.on('timer', function(event, timer) {
        vm.timer = timer
      })
      ipcRenderer.on('percentage', function(event, data) {
        vm.percentage = data
      })
      ipcRenderer.on('darkMode', function(event, val) {
        vm.darkMode = val
      })
      ipcRenderer.on('warning', function(event, val) {
        vm.warning = val
      })
      ipcRenderer.on('cueName', function(event, val) {
        vm.cueName = val
      })
      ipcRenderer.on('config', function(event, cfg) {
        vm.config = cfg
      })
      ipcRenderer.on('appControls', function(event, appControls) {
        vm.appControls = appControls
      })

      ipcRenderer.send('getConfig')
    },
    watch: {
      showMode: function(newVal) {
        if (newVal) {
          // going into config mode
          ipcRenderer.send('showMode', this.config)
        } else {
          // going into show mode
          ipcRenderer.send('configMode')
        }
      }
    },
    methods: {
      handleResize: function({ width, height }) {
        ipcRenderer.send('controlResize', width, height)
      },
      openLogs: function() {
        ipcRenderer.send('openLogs')
      }
    },
    computed: {
      warningColour: function() {
        if (this.warning == 'close') {
          return '#E28806'   
        } else if (this.warning == 'closer') {
          return '#ff3333'
        } else {
          return '#6ab42f'
        }
      }
    }
  }
</script>

<style>
 body {
  font-family: Sansation, Helvetica, sans-serif;
  overflow: hidden !important;
}
@font-face {
  font-family: Sansation;
  src: url("~@/assets/Sansation-Regular.ttf");
}
@font-face {
  font-family: SansationMono;
  src: url("~@/assets/SansationMonoNumbers2.ttf");
}
.green {
  color: #6ab42f;
  margin-right: 5px;
}
.red {
  color: #ff3333;
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

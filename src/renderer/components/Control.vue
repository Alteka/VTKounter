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
    <el-row v-if="showMode" style="font-family: SansationMono; font-size: 400%; text-align: center;" class="timer" :style="{ color: warningColour, 'font-size': size + '%'}">
      {{timer}}
    </el-row>
    <el-row v-if="showMode && showPercentage" style="padding: 10px; text-align: center;">
      <el-progress :percentage="percentage" :color="warningColour" :show-text="false"></el-progress>
    </el-row>
    <el-row v-if="showMode" style="padding: 10px; text-align: center;">
      <el-col :span="6" v-if="!config.obs.enabled">&nbsp;</el-col>
      <el-col :span="12">
        <span v-if="vtStatus">{{config.appChoice}} <i class="fas fa-link green"></i> Connected</span>
        <span v-if="!vtStatus">{{config.appChoice}} <i class="fas fa-link"></i> Not Connected</span>
      </el-col>
      <el-col :span="12" v-if="config.obs.enabled">
        <span v-if="obsStatus">OBS <i class="fas fa-link green"></i> Connected</span>
        <span v-if="!obsStatus">OBS <i class="fas fa-link"></i> Not Connected: {{obsMessage}}</span>
      </el-col>
    </el-row>

    <el-form v-if="!showMode" label-width="100px" size="small">
    <el-tabs v-model="tab" style="padding-left: 10px; padding-right: 10px;">

      <el-tab-pane label="Core Settings" name="core">
         <el-row >
          <el-col :span="18">
            <el-form-item label="Timer Format" label-width="125px">
              <el-input v-model="config.timerFormat"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="6" style="text-align: right;">
            <el-button round size="small" @click="factoryReset" type="info"><i class="fas fa-undo green"></i> Full Reset</el-button>
          </el-col>
        </el-row>
        <el-row>
            <el-form-item label="Text for no VT" label-width="125px">
              <el-input v-model="config.noVTText"></el-input>
            </el-form-item>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="App Choice" label-width="125px">
              <el-radio-group v-model="config.appChoice" size="small">
                <el-radio-button label="QLab"></el-radio-button>
                <el-radio-button label="Mitti"></el-radio-button>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Progress Bar" label-width="125px">
              <el-switch v-model="showPercentage"></el-switch>            
            </el-form-item>
          </el-col>
        </el-row>
      </el-tab-pane>

      <el-tab-pane label="QLab" name="qlab" v-if="config.appChoice=='QLab'">
        <el-row>
          <el-col>
            <el-form-item label="IP Address">
              <el-input v-model="config.qlab.ip"></el-input>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-form-item label="Filter by Colour" label-width="125px">
            <el-checkbox-group v-model="config.qlab.filterColour" size="small">
              <el-checkbox-button v-for="filter in qlabFilters" :label="filter" :key="filter">{{filter}}</el-checkbox-button>
            </el-checkbox-group>
          </el-form-item>
        </el-row>
        <el-row>
          <el-form-item label="Filter by Type" label-width="125px">
            <el-checkbox-group v-model="config.qlab.filterCueType" size="small">
              <el-checkbox-button v-for="filter in qlabCueTypes" :label="filter" :key="filter">{{filter}}</el-checkbox-button>
            </el-checkbox-group>
          </el-form-item>
        </el-row>
      </el-tab-pane>
      <el-tab-pane label="Mitti" name="mitti" v-if="config.appChoice=='Mitti'">
        <el-row>
          <el-form-item label="IP Address">
            <el-input v-model="config.mitti.ip"></el-input>
          </el-form-item>
        </el-row>
        <el-row style="text-align: center;">
          Feedback port must be set to 5151
        </el-row>
      </el-tab-pane>
      <el-tab-pane label="OBS" name="fourth">
        <el-row>
          <el-col :span="24">
            <el-form-item label="Enable OBS Output" label-width="160px">
              <el-switch v-model="config.obs.enabled"></el-switch>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row v-if="config.obs.enabled">
          <el-col :span="12">
            <el-form-item label="IP Address">
              <el-input v-model="config.obs.ip"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Port">
              <el-input v-model="config.obs.port"></el-input>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row v-if="config.obs.enabled">
          <el-col :span="12">
            <el-form-item label="Password">
              <el-input v-model="config.obs.password"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="OBS is on a Mac" label-width="140px">
              <el-switch v-model="config.obs.platformIsMac"></el-switch>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row v-if="config.obs.enabled">
          <el-form-item label="Name of text source to update" label-width="240px">
            <el-input v-model="config.obs.source"></el-input>
          </el-form-item>
        </el-row>
        <el-row style="text-align: center;" v-if="config.obs.enabled">
          OBS Needs to have the WebSocket Server enabled.<br />The socket server must have a password set. 
        </el-row>
      </el-tab-pane>
    </el-tabs>
    </el-form>

    <resize-observer @notify="handleResize" />
  </div>
</template>

<script>
const { ipcRenderer } = require('electron')
import Device from './Control/Device.vue'
import { Notification } from 'element-ui'

  export default {
    name: 'control',
    components: { Device },
    data: function () {
      return {
        tab: 'core',
        showMode: false,
        config: require('../../main/defaultConfig.json'),
        qlabFilters: ['red', 'yellow', 'green', 'blue', 'purple'],
        qlabCueTypes: ['Video', 'Audio', 'Text', 'Camera', 'Mic', 'Group'],
        vtStatus: false,
        obsStatus: false,
        obsMessage: '',
        percentage: 0,
        showPercentage: true,
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

      ipcRenderer.on('config', function(event, cfg) {
        vm.config = cfg
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
      },
      factoryReset: function() {
        this.config = require('../../main/defaultConfig.json')
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
.timer {
  font-weight: bold;
  color: black;
}

.darkMode .timer {
  color: white;
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
.darkMode .el-progress__text {
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
.darkMode .el-color-picker__trigger {
  border: 1px solid #666;
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
.darkMode .el-input-number__increase {
  background: #292929;
  color: #ddd;
}
.darkMode .el-input-number__decrease {
  background: #292929;
  color: #ddd;
}
.darkMode .el-drawer {
  background: #292929;
  border-top: 3px solid #6ab42f;
  color: #ddd;
}
.darkMode .el-checkbox-button__inner {
  background: none;
}
</style>

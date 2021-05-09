<template>
  <div id="wrapper" style="position: relative; padding-bottom: 5px">

    <el-row style="padding-top: 10px;">
      <el-col :span="16" style="font-size: 36px; padding-left: 10px;">
        <img src="~@/assets/bug.png" height="26" @click="openLogs()" /> VT Kounter
      </el-col>
      <el-col :span="8">
        <el-switch style="display: block" v-model="configMode" active-color="#6ab42f" inactive-color="#6ab42f" active-text="Setup" inactive-text="Show Mode"></el-switch>
      </el-col>
    </el-row>
    <div style="font-size: 70%; position: absolute; top: 50px; right: 18px;">v{{ version }}</div>

    <el-divider content-position="center" v-if="!configMode">Time Remaining</el-divider>
    <el-row v-if="!configMode" style="font-size: 400%; text-align: center;">
      {{timer}}
    </el-row>
    <el-row v-if="!configMode" style="padding: 10px; text-align: center;">
      <el-col :span="6" v-if="!obs.enabled">&nbsp;</el-col>
      <el-col :span="12">
        <span v-if="vtStatus">{{appChoice}} <i class="fas fa-link green"></i> Connected</span>
        <span v-if="!vtStatus">{{appChoice}} <i class="fas fa-link"></i> Not Connected</span>
      </el-col>
      <el-col :span="12" v-if="obs.enabled">
        <span v-if="obsStatus">OBS <i class="fas fa-link green"></i> Connected</span>
        <span v-if="!obsStatus">OBS <i class="fas fa-link"></i> Not Connected: {{obsMessage}}</span>
      </el-col>
    </el-row>

    <el-form v-if="configMode" label-width="100px" size="small">
    <el-divider content-position="center">Configure VT App</el-divider>
    <el-row style="padding-left: 10px; padding-right: 10px;">
      
        <el-form-item label="App Choice"><i class="fas fa-photo-video green"></i>
          <el-radio-group v-model="appChoice" size="small">
            <el-radio-button label="QLab"></el-radio-button>
            <el-radio-button label="Mitti"></el-radio-button>
          </el-radio-group>
        </el-form-item>
     
    </el-row>

    <el-row v-if="appChoice=='QLab'" style="padding-left: 10px; padding-right: 10px;">
      <el-col :span="12">
        <el-form-item label="IP Address">
          <el-input v-model="qlab.ip"></el-input>
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="Port">
          <el-input v-model="qlab.port"></el-input>
        </el-form-item>
      </el-col>
    </el-row>

    <el-row v-if="appChoice=='QLab'" style="padding-left: 10px; padding-right: 10px;">
      <el-form-item label="Filter Cues">
        <el-checkbox-group v-model="qlab.filter" size="medium">
          <el-checkbox-button v-for="filter in qlabFilters" :label="filter" :key="filter">{{filter}}</el-checkbox-button>
        </el-checkbox-group>
      </el-form-item>
    </el-row>

    <el-divider content-position="center">Configure Output (Just OBS)</el-divider>

    <el-row style="padding-left: 160px; padding-right: 10px;">
      <el-col :span="24">
        <el-form-item label="Enable OBS Output" label-width="160px">
          <el-switch v-model="obs.enabled"></el-switch>
        </el-form-item>
      </el-col>
    </el-row>

    <el-row style="padding-left: 10px; padding-right: 10px;" v-if="obs.enabled">
      <el-col :span="12">
        <el-form-item label="IP Address">
          <el-input v-model="obs.ip"></el-input>
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="Port">
          <el-input v-model="obs.port"></el-input>
        </el-form-item>
      </el-col>
    </el-row>

    <el-row style="padding-left: 10px; padding-right: 10px;" v-if="obs.enabled">
      <el-col :span="12">
        <el-form-item label="Password">
          <el-input v-model="obs.password"></el-input>
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="OBS is on a Mac" label-width="140px">
          <el-switch v-model="obs.platformIsMac"></el-switch>
        </el-form-item>
      </el-col>
    </el-row>

    <el-row style="padding-left: 10px; padding-right: 10px;" v-if="obs.enabled">
        <el-form-item label="Name of text source to update" label-width="240px">
          <el-input v-model="obs.source"></el-input>
        </el-form-item>
    </el-row>

    <el-row style="text-align: center; font-size: 80%;" v-if="obs.enabled">
      OBS Needs to have the WebSocket Server enabled, and have a password set. 
    </el-row>

    

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
        configMode: true,
        appChoice: 'QLab',
        qlab: {ip: '127.0.0.1', port: '53000', filter: ['red']},
        obs: {ip: '127.0.0.1', port: '4444', password: '', source: 'QLab Time', platformIsMac: false, enabled: true},
        qlabFilters: ['red', 'yellow', 'green', 'blue', 'purple'],
        vtStatus: false,
        obsStatus: false,
        obsMessage: '',
        timer: 'Not Connected',
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

      ipcRenderer.send('getConfig')
      ipcRenderer.on('config', function(event, cfg) {
        vm.obs = cfg.obs
        vm.qlab = cfg.qlab
      })
    },
    watch: {
      configMode: function(newVal) {
        if (newVal) {
          // going into config mode
          ipcRenderer.send('configMode')
        } else {
          // going into show mode
          ipcRenderer.send('showMode', {appChoice: this.appChoice, qlab: this.qlab, obs: this.obs})
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
.green {
  color: #6ab42f;
  margin-right: 5px;
}
</style>

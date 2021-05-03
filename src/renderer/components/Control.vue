<template>
  <div id="wrapper" style="position: relative; padding-bottom: 5px">

    <el-row style="padding-top: 10px;">
      <el-col :span="18" style="font-size: 36px; padding-left: 10px;">
        <img src="~@/assets/bug.png" height="26" @click="openLogs()" />
        Device Kontrol
      </el-col>
      <el-col :span="6" style="text-align: right;">
        <el-button round size="small" style="margin-right: 10px;" @click="reload();"><i class="fas fa-sync-alt"></i></el-button>
      </el-col>
    </el-row>

      <div style="font-size: 70%; position: absolute; top: 50px; right: 18px;">v{{ version }}</div>
    <el-divider content-position="center">Select Video Device</el-divider>

    <device v-for="device in devices" :key="device.deviceId" :device="device"></device>

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
        devices: [],
        version: require('./../../../package.json').version
      }
    },
    mounted: function(){
      this.$nextTick(function () {
        let h = document.getElementById('wrapper').clientHeight
        let w = document.getElementById('wrapper').clientWidth
        ipcRenderer.send('controlResize', w, h)
      })
      this.getDevices()
    },
    methods: {
      handleResize: function({ width, height }) {
        ipcRenderer.send('controlResize', width, height)
      },
      openLogs: function() {
        ipcRenderer.send('openLogs')
      },
      reload: function() {
window.document.location.reload()
      },
      getDevices: function() {
        navigator.mediaDevices.enumerateDevices().then((devices) => {
          this.devices = devices.filter(device => device.kind === 'videoinput').filter(device => !device.label.includes('Virtual Camera')).filter(device => !device.label.includes('Virtual Camera')).filter(device => !device.label.includes('NewTek NDI Video'))
          console.log('Update devices... count: ', devices.length)
        })  
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

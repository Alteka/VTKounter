<template>
  <div>

    <el-row style="font-family: DejaVuSansMono; font-size: 400%; text-align: center;" :style="{ color: warningColour, 'font-size': size + '%'}">
      {{timer}}
    </el-row>
    <el-row v-if="config.showPercentage" style="padding: 10px; text-align: center;">
      <el-progress :percentage="percentage" :color="warningColour" :show-text="false"></el-progress>
    </el-row>
    <el-row v-if="config.showCueName" style="padding: 10px; text-align: center;">
      {{ cueName }}
    </el-row>
    <el-row style="padding: 10px; text-align: center;">
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
    
  </div>
</template>

<script>
const { ipcRenderer } = require('electron')

  export default {
    name: 'showMode',
    props: {
        config: Object,
        appControls: Object,
        size: Number
    },
    data: function () {
      return {
        vtStatus: false,
        obsStatus: false,
        obsMessage: '',
        percentage: 0,
        cueName: '',
        timer: 'No VT',
        warning: false
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
      ipcRenderer.on('warning', function(event, val) {
        vm.warning = val
      })
      ipcRenderer.on('cueName', function(event, val) {
        vm.cueName = val
      })
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

</style>

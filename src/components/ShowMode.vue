<template>
    <el-row id="timer" justify="center" :style="{'font-size': size/1.5 + '%'}">
      <span style="{'color': config.textWarningColors ? warningColour : 'inherit'}">{{ timer }}</span>
      <div :style="{'font-size': '50%'}" style="margin-top:10px;" v-if="config.showCueName">
        <div v-if="showArmedCueName && armedCueName">
          <span style="color:#999;font-weight:bold;">STBY:</span>&nbsp;{{ armedCueName }}
        </div>
        <div v-else-if="!showArmedCueName && cueName">
          <span style="color:#9f9;font-weight:bold;">PLAY:</span> {{ cueName }}
        </div>
      </div>
    </el-row>
    <el-row justify="center">

    </el-row>
    <el-row v-if="config.showPercentage" style="padding: 10px 20px; " justify="start">
      <el-col :span="24">
        <el-progress :percentage="percentage" :show-text="false" :color="warningColour" />
      </el-col>
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
</template>

<script>
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
        warning: false,
        armedCueName: ''
      }
    },
    mounted: function(){
      let vm = this
      window.ipcRenderer.receive('vtStatus', function(status) {
        vm.vtStatus = status
      })
      window.ipcRenderer.receive('obsStatus', function(status, msg) {
        vm.obsStatus = status
        vm.obsMessage = msg
      })
      window.ipcRenderer.receive('timer', function(timer) {
        vm.timer = timer
      })
      window.ipcRenderer.receive('percentage', function(data) {
        vm.percentage = data
      })
      window.ipcRenderer.receive('warning', function(val) {
        vm.warning = val
      })
      window.ipcRenderer.receive('cueName', function(val) {
        vm.cueName = val
      })
      window.ipcRenderer.receive('armedCueName', function(val) {
        vm.armedCueName = val
      })
    },
    computed: {
      warningColour: function() {
        if (this.warning == 'close') {
          return '#E28806'   
        } else if (this.warning == 'closer') {
          return '#ff3333'
        } else {
          return '#fff'
        }
      },
      showArmedCueName: function(){
        return this.config.showArmedCue && this.config.noVTText == this.timer
      }
    }
  }
</script>

<style>
#timer {
  font-family: DejaVu;
  font-size: 400%;
  flex: 1;
  display: flex;
  justify-items: center;
  justify-content: center;
  align-items: center;
  flex-direction: column;
}
</style>

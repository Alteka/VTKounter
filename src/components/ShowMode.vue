<template>
    <el-row class="timer" justify="center" :style="{ color: warningColour, 'font-size': size + '%'}">
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
        warning: false
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
@font-face {
  font-family: DejaVuSansMono;
  src: url("~@/assets/DejaVuLGCSansMono.ttf");
}
.timer {
 font-family: DejaVuSansMono;
 font-size: 400%;
}
</style>

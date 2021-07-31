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

    
    <show-mode v-if="showMode" :config="config" :appControls="appControls" :size="size"></show-mode>
    <config-mode v-else :config="config" :appControls="appControls"></config-mode>


    <resize-observer @notify="handleResize" />
  </div>
</template>

<script>
const { ipcRenderer } = require('electron')
import ShowMode from './ShowMode.vue'
import ConfigMode from './ConfigMode.vue'

  export default {
    name: 'control',
    components: { ShowMode, ConfigMode },
    data: function () {
      return {
        showMode: false,
        config: require('../../main/defaultConfig.json'),
        appControls: null,
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
      ipcRenderer.on('darkMode', function(event, val) {
        vm.darkMode = val
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
  font-family: DejaVuSansMono;
  src: url("~@/assets/DejaVuLGCSansMono.ttf");
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

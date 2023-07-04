<template>
    <el-row id="timer" justify="center" :style="{'font-size': size/1.5 + '%'}">
      <span :style="{'color': config.textWarningColors ? warningColour : 'inherit'}">{{ timer }}</span>
    </el-row>

    <el-row v-if="config.showCueName" justify="center" style="{font-size: 50%}">
      <span v-if="showArmedCueName && armedCueName" style="color:#999;"><b>STBY:</b> {{ armedCueName }}</span>
      <span v-else-if="!showArmedCueName && cueName"><b class="green">AWAY:</b> {{ cueName }}</span>
    </el-row>

    <el-row v-if="config.showPercentage" style="padding: 10px 20px; " justify="start">
      <el-col :span="24">
        <el-progress :percentage="percentage" :show-text="false" :color="warningColour"  :stroke-width="12"/>
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
import {Howl} from 'howler';
import CountdownSprite from '/static/CountdownSprite.mp3'

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
        armedCueName: '',
        secondsLeft: -1,
        sound: null,
        soundSprites: {
          '30': [0, 1000],
          '20': [1000, 1000],
          '15': [2000, 1000],
          '10': [3000, 1000],
          '9': [4000, 1000],
          '8': [5000, 1000],
          '7': [6000, 1000],
          '6': [7000, 1000],
          '5': [8000, 1000],
          '4': [9000, 1000],
          '3': [10000, 1000],
          '2': [11000, 1000],
          '1': [12000, 1000],
          '0': [13000, 1000],
        }
      }
    },
    created(){
      this.sound = new Howl({
        src: [CountdownSprite],
        sprite: this.soundSprites
      });
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
      window.ipcRenderer.receive('secondsLeft', function(val) {
        vm.secondsLeft = val
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
      },
      showArmedCueName: function(){
        return this.config.showArmedCue && this.config.noVTText == this.timer
      }
    },
    watch: {
      secondsLeft(newValue){
        if(!this.config.audioCountdown){
          return
        }

        newValue = newValue.toString()
        if(Object.keys(this.soundSprites).indexOf(newValue) !== -1){
          this.sound.play(newValue)
        }
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

<template>
  <el-form label-width="150px" :rules="coreValidationRules" ref="coreForm" :model="config">
    <el-row >
      <el-col :span="18">
        <el-form-item label="Time Format" prop="timerFormat">
          <el-input v-model="config.timerFormat"></el-input>
        </el-form-item>
      </el-col>
      <el-col :span="6" style="text-align: right;">
        <el-button round @click="factoryReset" type="info"><i class="fas fa-undo green"></i> Full Reset</el-button>
      </el-col>
    </el-row>
    <el-row>
      <el-form-item label="Text for no VT" >
        <el-input v-model="config.noVTText"></el-input>
      </el-form-item>
    </el-row>
    <el-row>
      <el-col :span="8">
        <el-form-item label="Show Progress" >
          <el-switch v-model="config.showPercentage"></el-switch>            
        </el-form-item>
      </el-col>
      <el-col :span="8">
        <el-form-item label="Show VT Name">
          <el-switch v-model="config.showCueName"></el-switch>            
        </el-form-item>
      </el-col>
      <el-col :span="8">
        <el-form-item label="Show Armed VT Name" >
          <el-switch v-model="config.showArmedCue"></el-switch>
        </el-form-item>
      </el-col>
    </el-row>
    <el-row>
      <el-col :span="8">
        <el-form-item label="Text Warning Colors" >
          <el-switch v-model="config.textWarningColors"></el-switch>
        </el-form-item>
      </el-col>
      <el-col :span="8">
        <el-form-item label="Voice Countdown" >
          <el-switch v-model="config.audioCountdown"></el-switch>
        </el-form-item>
      </el-col>
      <el-col :span="8">
        <el-form-item label="Dark Mode" >
          <el-switch v-model="config.darkMode"></el-switch>
        </el-form-item>
      </el-col>
    </el-row>
    <el-row>
        <el-form-item label="VT App Choice">
          <el-radio-group v-model="config.appChoice">
            <el-radio-button v-for="(app, name) in appControls" :label="name" :key="name">
              {{ app.name }}
            </el-radio-button>
          </el-radio-group>
        </el-form-item>
    </el-row>
  </el-form>
</template>

<script>
  export default {
    props: {
      modelValue: Object, // v-model object
      appControls: Object
    },
    data: function() {
      return {
        coreValidationRules: {
          timerFormat: [
            { required: true, message: 'The app is almost pointless if this is empty'}
          ]
        }
      }
    },
    computed: {
      config: {
        get() {
          return this.modelValue // return v-model
        },
        set(value) {
          this.$emit('update:modelValue', value) // update the v-model object to parent component
        }
      },
    },
    methods: {
      factoryReset: function() {
        console.log('Request factory reset')
        window.ipcRenderer.send('factoryReset')
      }
    }
  }
</script>

<style scoped>

</style>

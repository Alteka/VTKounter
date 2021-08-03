<template>
  <el-form label-width="110px" size="small" :rules="coreValidationRules" ref="coreForm" :model="config">
    <el-row >
      <el-col :span="18">
        <el-form-item label="Time Format" prop="timerFormat">
          <el-input v-model="config.timerFormat"></el-input>
        </el-form-item>
      </el-col>
      <el-col :span="6" style="text-align: right;">
        <el-button round size="small" @click="factoryReset" type="info"><i class="fas fa-undo green"></i> Full Reset</el-button>
      </el-col>
    </el-row>
    <el-row>
      <el-form-item label="Text for no VT">
        <el-input v-model="config.noVTText"></el-input>
      </el-form-item>
    </el-row>
    <el-row>
      <el-col :span="12">
        <el-form-item label="Show Progress">
          <el-switch v-model="config.showPercentage"></el-switch>            
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="Show VT Name" label-width="125px">
          <el-switch v-model="config.showCueName"></el-switch>            
        </el-form-item>
      </el-col>
    </el-row>
    <el-row>
        <el-form-item label="VT App Choice">
          <el-radio-group v-model="config.appChoice" size="small">
            <el-radio-button v-for="(app, name) in appControls" :label="name" :key="name">
              {{ app.name }}
            </el-radio-button>
          </el-radio-group>
        </el-form-item>
    </el-row>
  </el-form>
</template>

<script>
const { ipcRenderer } = require('electron')
  export default {
    props: {
      config: Object,
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
    methods: {
      factoryReset: function() {
        ipcRenderer.send('factoryReset')
      }
    }
  }
</script>

<style scoped>

</style>

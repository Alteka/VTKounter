<template>
  <el-form label-width="125px" size="small" :rules="appValidationRules" ref="appForm" :model="app">
    <el-row>
      <el-col>
        <el-form-item label="IP Address" prop="ip">
          <el-input v-model="app.ip"></el-input>
        </el-form-item>
      </el-col>
    </el-row>

    <el-row v-for="(control, controlID) in appControl.controls" :key="controlID">
      <el-col>
        <el-form-item :label="control.label">
          <el-input v-if="control.type=='string'" v-model="app[controlID]"></el-input>
          <el-switch v-if="control.type=='boolean'" v-model="app[controlID]"></el-switch>
          <el-radio-group v-if="control.type=='radio-group'" v-model="app[controlID]">
            <el-radio-button v-for="value in control.values" :key="value.value" :label="value.value">
              {{value.label ? value.label : value.value}}
            </el-radio-button>
          </el-radio-group>
          <el-checkbox-group v-if="control.type=='checkbox-group'" v-model="app[controlID]">
            <el-checkbox-button v-for="value in control.values" :key="value.value" :label="value.value">
              {{value.label ? value.label : value.value}}
            </el-checkbox-button>
          </el-checkbox-group>
          <i v-if="control.notes">{{ control.notes }}</i>
        </el-form-item>
      </el-col>
    </el-row>

    <el-row v-if="appControl.notes" >
      <p class="notes">{{appControl.notes}}</p>
    </el-row>
    
  </el-form>
</template>

<script>
  export default {
    props: {
      app: Object,
      appControl: Object
    },
    data: function() {
      return {
        appValidationRules: {
          ip: [
            { required: true, message: 'The IP Address is required', trigger: 'blur' }
          ]
        },
        qlabFilters: ['red', 'yellow', 'green', 'blue', 'purple'],
        qlabCueTypes: ['Video', 'Audio', 'Text', 'Camera', 'Mic', 'Group'],
        pppPorts: [4647, 7000],
      }
    }
  }
</script>

<style scoped>
.notes {
  text-align: center;
  font-size: 80%;
}
</style>

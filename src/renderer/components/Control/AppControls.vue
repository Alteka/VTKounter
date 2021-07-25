<template>
  <el-form label-width="100px" size="small" :rules="appValidationRules" ref="appForm" :model="app">
    <el-row>
      <el-col>
        <el-form-item label="IP Address" prop="ip">
          <el-input v-model="app.ip"></el-input>
        </el-form-item>
      </el-col>
    </el-row>

    <el-row v-for="(control, controlID) in appControl" :key="controlID">
      <el-col>
        <el-form-item :label="control.name">
          <el-input v-model="app[controlID]"></el-input>
          <i v-if="control.notes">{{ control.notes }}</i>
        </el-form-item>
      </el-col>
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

</style>

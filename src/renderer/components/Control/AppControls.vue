<template>
  <el-form label-width="100px" size="small" :rules="appValidationRules" ref="appForm" :model="app">
    <el-row>
      <el-col>
        <el-form-item label="IP Address" prop="ip">
          <el-input v-model="app.ip"></el-input>
        </el-form-item>
      </el-col>
    </el-row>

    <!-- QLab Start -->
    <el-row v-if="app.name=='QLab'">
      <el-form-item label="Filter by Colour" label-width="125px">
        <el-checkbox-group v-model="app.filterColour" size="small">
          <el-checkbox-button v-for="filter in qlabFilters" :label="filter" :key="filter">{{filter}}</el-checkbox-button>
        </el-checkbox-group>
      </el-form-item>
    </el-row>
    <el-row v-if="app.name=='QLab'">
      <el-form-item label="Filter by Type" label-width="125px">
        <el-checkbox-group v-model="app.filterCueType" size="small">
          <el-checkbox-button v-for="filter in qlabCueTypes" :label="filter" :key="filter">{{filter}}</el-checkbox-button>
        </el-checkbox-group>
      </el-form-item>
    </el-row>
    <!-- QLab End -->

    <!-- Mitti Start -->
    <el-row style="text-align: center;" v-if="app.name=='Mitti'">
      Feedback port must be set to 1234<br />
      <p style="font-size: 80%">In Mitti preferences, select 'OSC/UDP Controls' in the left side-bar.<br />
      Set 'Feedback' to Custom. Set the port to 1234.</p>
    </el-row>
    <!-- QLab End -->
    
    <!-- vMix Start -->
    <el-row v-if="app.name=='vMix'">
      <el-col>
        <el-form-item label="Input #">
          <el-input v-model="app.input"></el-input>
           <i>Leave blank to use the active input</i>
        </el-form-item>
      </el-col>
    </el-row>
    <!-- vMix End -->

    <!-- PPP Start -->
    <el-row v-if="app.name=='PP+'">
      <el-form-item label="Port">
        <el-radio-group v-model="app.port" size="small">
          <el-radio-button v-for="port in pppPorts" :label="port" :key="port">
            {{ `${port} (${port == 4647 ? 'TCP' : 'UDP'})` }}
          </el-radio-button>
        </el-radio-group>
      </el-form-item>
    </el-row>
    <!-- PPP End -->
    
  </el-form>
</template>

<script>
  export default {
    props: {
      app: Object
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

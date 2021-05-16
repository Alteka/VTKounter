<template>
  <el-form label-width="100px" size="small" :rules="qlabValidationRules" ref="qlabForm" :model="qlab">
    <el-row>
      <el-col>
        <el-form-item label="IP Address" prop="ip">
          <el-input v-model="qlab.ip"></el-input>
        </el-form-item>
      </el-col>
    </el-row>
    <el-row>
      <el-form-item label="Filter by Colour" label-width="125px">
        <el-checkbox-group v-model="qlab.filterColour" size="small">
          <el-checkbox-button v-for="filter in qlabFilters" :label="filter" :key="filter">{{filter}}</el-checkbox-button>
        </el-checkbox-group>
      </el-form-item>
    </el-row>
    <el-row>
      <el-form-item label="Filter by Type" label-width="125px">
        <el-checkbox-group v-model="qlab.filterCueType" size="small">
          <el-checkbox-button v-for="filter in qlabCueTypes" :label="filter" :key="filter">{{filter}}</el-checkbox-button>
        </el-checkbox-group>
      </el-form-item>
    </el-row>
  </el-form>
</template>

<script>
  export default {
    props: {
      qlab: Object
    },
    data: function() {
      return {
        qlabValidationRules: {
          ip: [
            { required: true, message: 'The IP Address is required', trigger: 'blur' }
          ]
        },
        qlabFilters: ['red', 'yellow', 'green', 'blue', 'purple'],
        qlabCueTypes: ['Video', 'Audio', 'Text', 'Camera', 'Mic', 'Group']
      }
    }
  }
</script>

<style scoped>

</style>

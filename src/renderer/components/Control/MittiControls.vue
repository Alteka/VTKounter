<template>
  <el-form label-width="100px" size="small" :rules="mittiValidationRules" ref="mittiForm" :model="mitti">
    <el-row>
      <el-form-item label="IP Address" prop="ip">
        <el-input v-model="mitti.ip"></el-input>
      </el-form-item>
    </el-row>
    <el-row style="text-align: center;">
      Feedback port must be set to 5151<br />
      <p style="font-size: 80%">In Mitti preferences, select 'OSC/UDP Controls' in the left side-bar.<br />
      Set 'Feedback' to Custom. Set the port to 5151.</p>
    </el-row>
  </el-form>
</template>

<script>
  export default {
    props: {
      mitti: Object
    },
    data: function() {
      return {
        mittiValidationRules: {
          ip: [
            { required: true, message: 'The IP Address is required', trigger: 'blur' }
          ]
        }
      }
    }
  }
</script>

<style scoped>

</style>

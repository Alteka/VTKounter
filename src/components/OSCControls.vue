<template>
  <el-form label-width="150px" :rules="oscValidationRules" ref="obsForm" :model="osc">
        <el-row>
            <el-form-item label="Enable OSC Output">
              <el-switch v-model="osc.enabled"></el-switch>
            </el-form-item>
        </el-row>
        <el-row v-if="osc.enabled">
          <el-col :span="14">
            <el-form-item label="IP Address" prop="ip">
              <el-input v-model="osc.ip"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="10">
            <el-form-item label="Port" prop="port">
              <el-input v-model="osc.port"></el-input>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row v-if="osc.enabled">
          <el-col :span="24">
            <el-form-item label="OSC Address to send" prop="name">
              <el-input v-model="osc.address"></el-input>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row justify="center" v-if="osc.enabled">
          <p>Sends the VT time as a string argument to the above address.</p>
        </el-row>
        </el-form>
</template>

<script>
  export default {
    props: {
      modelValue: Object // v-model object
    },
    data: function() {
      return {
        oscValidationRules: {
          ip: [
            { required: true, message: 'The IP Address is required', trigger: 'blur' }
          ],
          port: [
            { required: true, message: 'The port is required', trigger: 'blur' }
          ],
          address: [
            { required: true, message: 'The OSC Address is required', trigger: 'blur' }
          ]
        }
      }
    },
    computed: {
      osc: {
        get() {
          return this.modelValue // return v-model
        },
        set(value) {
          this.$emit('update:modelValue', value) // update the v-model object to parent component
        }
      }
    }
  }
</script>

<style scoped>

</style>

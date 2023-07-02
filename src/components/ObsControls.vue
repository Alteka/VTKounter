<template>
  <el-form label-width="150px" :rules="obsValidationRules" ref="obsForm" :model="obs">
        <el-row>
            <el-form-item label="Enable OBS Output">
              <el-switch v-model="obs.enabled"></el-switch>
            </el-form-item>
        </el-row>
        <el-row v-if="obs.enabled">
          <el-col :span="14">
            <el-form-item label="IP Address" prop="ip">
              <el-input v-model="obs.ip"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="10">
            <el-form-item label="Port" prop="port">
              <el-input v-model="obs.port"></el-input>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row v-if="obs.enabled">
          <el-col :span="14">
            <el-form-item label="Password" prop="password">
              <el-input v-model="obs.password"></el-input>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row v-if="obs.enabled">
          <el-col :span="22">
            <el-form-item label="Name of text source to update" label-width="240px" prop="name">
              <el-input v-model="obs.source"></el-input>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row justify="center" v-if="obs.enabled">
          <p>OBS Needs to have the WebSocket Server enabled.<br />The socket server must have a password set. </p>
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
        obsValidationRules: {
          password: [
            { required: true, message: 'A password is required', trigger: 'blur' }
          ],
          ip: [
            { required: true, message: 'The IP Address is required', trigger: 'blur' }
          ],
          port: [
            { required: true, message: 'The port is required', trigger: 'blur' }
          ],
          name: [
            { required: true, message: 'This source name is required', trigger: 'blur' }
          ]
        }
      }
    },
    computed: {
      obs: {
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

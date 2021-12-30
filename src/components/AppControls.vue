<template>
  <el-form label-width="125px" size="small" :rules="appValidationRules" ref="appForm" :model="app" style="text-align: left;">
    <!-- output all controls for app -->
    <el-row v-for="(control, controlID) in appControl.controls" :key="controlID" justify="left">
      <el-col>
        <el-form-item :label="control.label ? control.label : controlID" :prop="controlID">
          <el-input v-if="control.type=='string'" v-model="app[controlID]"></el-input>
          <el-input-number v-if="control.type=='number'" v-model="app[controlID]" controls-position="right"></el-input-number>
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

    <!-- output notes if app has any -->
    <el-row v-if="appControl.notes" justify="center">
      <p class="notes" v-html="appControl.notes"></p>
    </el-row>
  </el-form>
</template>

<script>
  export default {
    props: {
      modelValue: Object, // v-model object
      appControl: Object
    },
    computed: {
      app: {
        get() {
          return this.modelValue // return v-model
        },
        set(value) {
          this.$emit('update:modelValue', value) // update the v-model object to parent component
        }
      },
    },
    data: function() {
      return {
        appValidationRules: {
          ip: [
            {
              required: true,
              message: 'The IP Address is required',
              trigger: 'blur'
            }
          ],
          port: [
            {
              required: true,
              type: 'integer',
              message: 'Valid port is required',
              trigger: 'change',
              min: 1,
              max: 65535
            }
          ]
        }
      }
    }
  }
</script>

<style scoped>
.notes {
  text-align: center;
}
</style>

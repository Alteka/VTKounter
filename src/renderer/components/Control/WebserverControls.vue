<template>
  <el-form label-width="100px" size="small" ref="obsForm">
        <el-row>      
            You can view the time remaining in a browser window:
        </el-row>
        <el-row>
          <el-input v-model="url" :readonly="true"></el-input>
        </el-row>

        <el-row v-if="ipAddresses.length > 1">
          <el-select v-model="ip" placeholder="Select IP">
            <el-option v-for="address in ipAddresses" :key="address" :label="address" :value="address"></el-option>
          </el-select>
        </el-row>

        <el-row>
            <el-form-item label="Font Size">
              <el-input v-model="webserver.fontsize"></el-input>
            </el-form-item>
        </el-row>
        
        </el-form>
</template>

<script>
const { ipcRenderer } = require('electron')

  export default {
    props: {
      webserver: Object
    },
    data: function() {
      return {
        ip: '127.0.0.1',
        ipAddresses: []
      }
    },
    mounted: function() {
      let vm = this
      vm.updateNetworkInfo()
      setInterval(vm.updateNetworkInfo, 10000)
      ipcRenderer.on('networkInfo', function(event, networkInfo) {
        vm.ip = networkInfo[0]
        vm.ipAddresses = networkInfo
        console.log(vm.ipAddresses)
      })
    },
    methods: {
      updateNetworkInfo: function() {
        ipcRenderer.send('networkInfo')
      }
    },
    computed: {
      url: function() {
        return 'http://' + this.ip + ':56868/?fs=' + this.webserver.fontsize 
      }
    }
  }
</script>

<style scoped>

</style>

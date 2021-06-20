<template>
  <el-form label-width="100px" size="small" ref="obsForm">
        <el-row>
          <p style="margin-top: 0px;">     
            You can view the time remaining in a browser window:
          </p>
        </el-row>
        <el-row>
          <el-col :span="21">
            <el-form-item label="Server URL">
              <el-input v-model="url" :readonly="true"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="3" style="text-align: center;">
            <el-button type="success" icon="el-icon-document-copy" size="small" round @click="copyUrl()"></el-button>
          </el-col>
        </el-row>
        <el-row v-if="ipAddresses.length > 1">
          <el-col>
            <el-select v-model="ip" placeholder="Select IP">
              <el-option v-for="address in ipAddresses" :key="address" :label="address" :value="address"></el-option>
            </el-select>
          </el-col>
        </el-row>

        <el-divider content-position="center">Options</el-divider>

        <el-row>
          <el-col :span="12">
            <el-form-item label="Text Colour" label-width="100">
              <el-color-picker v-model="webserver.fg"></el-color-picker>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Font Size">
              <el-input-number v-model="webserver.fontsize"></el-input-number>
            </el-form-item>
          </el-col>
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
      })
    },
    methods: {
      updateNetworkInfo: function() {
        ipcRenderer.send('networkInfo')
      },
      copyUrl: function() {
        const el = document.createElement('textarea');  
        el.value = this.url;                                 
        el.setAttribute('readonly', '');                
        el.style.position = 'absolute';                     
        el.style.left = '-9999px';                      
        document.body.appendChild(el);                  
        const selected =  document.getSelection().rangeCount > 0  ? document.getSelection().getRangeAt(0) : false;                                    
        el.select();                                    
        document.execCommand('copy');                   
        document.body.removeChild(el);                  
        if (selected) {                                 
          document.getSelection().removeAllRanges();    
          document.getSelection().addRange(selected);   
        }
    }
    },
    computed: {
      url: function() {
        return encodeURI('http://' + this.ip + ':56868/?fs=' + this.webserver.fontsize + '&fg=' + this.webserver.fg.substr(1))
      }
    }
  }
</script>

<style scoped>
.el-divider--horizontal {
  margin-top: 8px;
}
</style>

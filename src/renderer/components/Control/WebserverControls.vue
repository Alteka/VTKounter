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
            <el-button type="success" icon="el-icon-document-copy" size="small" round @click="copyUrl(url)"></el-button>
          </el-col>
        </el-row>
        <el-row v-if="ipAddresses.length > 1">
          <el-col>
            <el-form-item label="Select IP Address" label-width="250px;">
              <el-select v-model="ip" placeholder="Select IP">
                <el-option v-for="address in ipAddresses" :key="address" :label="address" :value="address"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="center">Options</el-divider>

        <el-row>
          <el-col :span="5">
            <el-form-item label="Colour" label-width="50">
              <el-color-picker v-model="webserver.fg"></el-color-picker>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="Size" label-width="50">
              <el-input-number v-model="webserver.fontsize" controls-position="right" width="50"></el-input-number>
            </el-form-item>
          </el-col>
          <el-col :span="11">
          <el-form-item label="Align" label-width="50">
           <el-radio-group v-model="webserver.align" size="small">
              <el-radio-button label="left">Left</el-radio-button>
              <el-radio-button label="center">Center</el-radio-button>
              <el-radio-button label="right">Right</el-radio-button>
            </el-radio-group>
          </el-form-item>
          </el-col>
        </el-row>

        <el-row>
          <el-col :span="8">
            <el-form-item label="Cue Name" label-width="60">
              <el-switch v-model="webserver.showName"></el-switch>
            </el-form-item>
          </el-col>
          <el-col v-if="webserver.showName" :span="16">
            <el-form-item label="Name Size" label-width="60">
              <el-radio-group v-model="webserver.nameSize" size="small">
                  <el-radio-button label="0.1">1/10</el-radio-button>
                  <el-radio-button label="0.166">1/6</el-radio-button>
                  <el-radio-button label="0.2">1/5</el-radio-button>
                  <el-radio-button label="0.333">1/3</el-radio-button>
                </el-radio-group>
          </el-form-item>
          </el-col>
        </el-row>

         <el-divider content-position="center">API</el-divider>
        <p style="text-align: center;">A simple REST API exists here<br />It works perfectly in vMix as a Data Source</p>
        <el-row>
          <el-col :span="21">
            <el-form-item label="API URL">
              <el-input v-model="api" :readonly="true"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="3" style="text-align: center;">
            <el-button type="success" icon="el-icon-document-copy" size="small" round @click="copyUrl(api)"></el-button>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="21">
            <el-form-item label="vMix API URL">
              <el-input v-model="apivmix" :readonly="true"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="3" style="text-align: center;">
            <el-button type="success" icon="el-icon-document-copy" size="small" round @click="copyUrl(apivmix)"></el-button>
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
      setInterval(vm.updateNetworkInfo, 30000)
      ipcRenderer.on('networkInfo', function(event, networkInfo) {
        vm.ip = networkInfo[0]
        vm.ipAddresses = networkInfo
      })
    },
    methods: {
      updateNetworkInfo: function() {
        ipcRenderer.send('networkInfo')
      },
      copyUrl: function(value) {
        const el = document.createElement('textarea');  
        el.value = value;                                 
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
        return encodeURI('http://' + this.ip + ':56868/?fs=' + this.webserver.fontsize + '&fg=' + this.webserver.fg.substr(1) + '&a=' + this.webserver.align + '&sn=' + this.webserver.showName + '&ns=' + this.webserver.nameSize)
      },
      api: function() {
        return encodeURI('http://' + this.ip + ':56868/api/v1')
      },
      apivmix: function() {
        return encodeURI('http://' + this.ip + ':56868/api/v1/vmix')
      }
    }
  }
</script>

<style scoped>
.el-divider--horizontal {
  margin-top: 8px;
}
.el-input-number--small {
  width: 110px;
}
</style>

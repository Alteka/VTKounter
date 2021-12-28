<template>
    <el-tabs v-model="tab" style="padding-left: 10px; padding-right: 10px;">
      <el-tab-pane label="Core Settings" name="core">
        <core-controls :config="config" :appControls="appControls"></core-controls>
      </el-tab-pane>

      <el-tab-pane v-if="appControls" :label="(appControls[config.appChoice].longName ? appControls[config.appChoice].longName : appControls[config.appChoice].name)">
        <app-controls :app="config.apps[config.appChoice]" :appControl="appControls[config.appChoice]"></app-controls>
      </el-tab-pane>

      <el-tab-pane label="OBS" name="obs">
        <obs-controls :obs="config.obs"></obs-controls>
      </el-tab-pane>

      <el-tab-pane label="Web Server" name="webserver">
        <webserver-controls :webserver="config.webserver"></webserver-controls>
      </el-tab-pane>
    </el-tabs>
</template>

<script>
import ObsControls from './Control/ObsControls'
import AppControls from './Control/AppControls'
import CoreControls from './Control/CoreControls'
import WebserverControls from './Control/WebserverControls'

  export default {
    components: { ObsControls, AppControls, CoreControls, WebserverControls },
    props: {
      config: Object,
      appControls: Object
    },
    data: function() {
      return {
        tab: 'core'
      }
    }
  }
</script>

<style>
 
</style>

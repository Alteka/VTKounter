<template>
  <div id="app">
    <router-view></router-view>
  </div>
</template>

<script>
  export default {
    name: 'DeviceKontrol'
  }
</script>

<style>
:not(input):not(textarea),
:not(input):not(textarea)::after,
:not(input):not(textarea)::before {
    -webkit-user-select: none;
    user-select: none;
    cursor: default;
}
</style>

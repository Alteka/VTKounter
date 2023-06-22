import { createApp } from 'vue'
import App from './App.vue'
import installElementPlus from './plugins/element'

import '@fortawesome/fontawesome-free/js/all'
import '../static/style.css'

import 'vue3-resize/dist/vue3-resize.css'
import Vue3Resize from 'vue3-resize'

const app = createApp(App)

installElementPlus(app)
app.use(Vue3Resize)

app.mount('#app')
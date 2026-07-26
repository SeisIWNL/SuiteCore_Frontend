import { createApp }   from 'vue'
import { createPinia } from 'pinia'
import App             from './App.vue'
import { router }      from './router/index.js'
import { useThemeStore } from '@/stores/theme.js'
import './assets/styles/main.css'

const app   = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

const themeStore = useThemeStore()

useThemeStore()

themeStore.applyTheme

app.mount('#app')

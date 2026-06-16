// src/main.js
// Agrega esta línea después de app.use(createPinia())
// para que el tema se aplique antes de que se monte cualquier componente:



// Dentro del bloque de inicialización, ANTES de app.mount('#app'):

// El store ya aplica el tema en su propio init,
// pero esto asegura que esté activo antes del primer render.
   // ya se llamó en defineStore

// ─── main.js completo ────────────────────────────────────────────
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

// Inicializa el tema ANTES del mount
useThemeStore()

themeStore.applyTheme

app.mount('#app')

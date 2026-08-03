import axios from 'axios'

// ── Instancia base ────────────────────────────────────────────
const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'https://localhost:7073/api',
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
})

// ── Request interceptor — adjunta el token JWT ────────────────
http.interceptors.request.use((config) => {
  const token =
    localStorage.getItem('auth_token') ??
    sessionStorage.getItem('auth_token')

  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── Response interceptor — manejo global de errores ───────────
http.interceptors.response.use(
  (response) => response,
  (error) => {
    const data = error.response?.data

    let msg = ''
    if (data?.errors && typeof data.errors === 'object') {
      const parts = Object.values(data.errors).flat().filter(Boolean)
      if (parts.length) msg = parts.join(' ')
    }

    if (!msg) {
      const candidates = [data?.message, data?.title, data?.detail, error.message]
      msg = candidates.find((c) => typeof c === 'string' && c.trim()) ?? ''
    }

    if (!msg) {
      msg = error.response?.status
        ? `Error ${error.response.status} del servidor.`
        : 'No se pudo conectar con el servidor.'
    }

    // Si el token expiró, limpia la sesión
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token')
      sessionStorage.removeItem('auth_token')
    }
    
    const wrapped = new Error(msg)
    wrapped.status = error.response?.status
    wrapped.data = data
    return Promise.reject(wrapped)
  },
)

export default http
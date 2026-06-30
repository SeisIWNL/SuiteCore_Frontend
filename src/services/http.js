import axios from 'axios'

// ── Instancia base ────────────────────────────────────────────
const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'https://localhost:7073/api',
  timeout: 10_000,
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

    // 1) Errores de validación de .NET: { errors: { Campo: ["msg"] } }
    let msg = ''
    if (data?.errors && typeof data.errors === 'object') {
      const parts = Object.values(data.errors).flat().filter(Boolean)
      if (parts.length) msg = parts.join(' ')
    }

    // 2) Mensaje estándar (ProblemDetails u otros), descartando vacíos
    if (!msg) {
      const candidates = [data?.message, data?.title, data?.detail, error.message]
      msg = candidates.find((c) => typeof c === 'string' && c.trim()) ?? ''
    }

    // 3) Último recurso: status HTTP, o genérico de conexión
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

    // Propaga un Error con mensaje legible, conservando el detalle original
    const wrapped = new Error(msg)
    wrapped.status = error.response?.status
    wrapped.data = data
    return Promise.reject(wrapped)
  },
)

export default http
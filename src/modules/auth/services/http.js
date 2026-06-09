import axios from 'axios'

// ── Instancia base ────────────────────────────────────────────
const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api',
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
    // Parsea el mensaje de error del backend (.NET ProblemDetails)
    const msg =
      error.response?.data?.title ??
      error.response?.data?.message ??
      error.message ??
      'Error desconocido'

    // Si el token expiró, limpia la sesión
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token')
      sessionStorage.removeItem('auth_token')
    }

    return Promise.reject(new Error(msg))
  },
)

export default http

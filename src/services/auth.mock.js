// Simula el delay de una llamada real a la API
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export const authService = {
  async login(username, password) {
    await delay(800) // simula latencia

    // Credenciales hardcodeadas para desarrollo
    if (username === 'admin' && password === '1234') {
      return {
        token: 'mock-jwt-token-dev',
        user: {
          id:        '1',
          username:  'admin',
          firstName: 'Ivan',
          lastName:  'Rupay',
          email:     'ivan.rupay@suitecore.com',
          role:      'admin',
        },
      }
    }

    // Simula error del servidor
    throw new Error('Usuario o contraseña incorrectos.')
  },

  async logout() {
    await delay(200)
  },

  async me() {
    await delay(300)
    // Si hay token mock, devuelve el usuario
    const token = localStorage.getItem('auth_token') ?? sessionStorage.getItem('auth_token')
    if (token === 'mock-jwt-token-dev') {
      return {
        id:        '1',
        username:  'admin',
        firstName: 'Ivan',
        lastName:  'Rupay',
        email:     'ivan.rupay@suitecore.com',
        role:      'admin',
      }
    }
    throw new Error('Token inválido.')
  },
}
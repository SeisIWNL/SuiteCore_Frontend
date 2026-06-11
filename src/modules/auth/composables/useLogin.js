import { ref } from 'vue'
import { useForm } from 'vee-validate'
import * as yup from 'yup'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/modules/auth/store.js'

/**
 * useLogin
 * Maneja el formulario de login usando vee-validate + yup.
 * Separa completamente la lógica de la vista.
 */
export function useLogin() {
  const router    = useRouter()
  const route     = useRoute()
  const authStore = useAuthStore()

  const serverError = ref('')
  const loading     = ref(false)

  // ── Schema de validación con Yup ──────────────────────
  const schema = yup.object({
    username: yup
      .string()
      .required('El nombre de usuario es requerido.')
      .min(2, 'Mínimo 2 caracteres.'),
    password: yup
      .string()
      .required('La contraseña es requerida.')
      .min(4, 'Mínimo 4 caracteres.'),
    rememberMe: yup.boolean(),
  })

  // ── vee-validate form ─────────────────────────────────
  const { handleSubmit, defineField, errors, meta } = useForm({
    validationSchema: schema,
    initialValues: { username: '', password: '', rememberMe: false },
  })

  // Campos con v-model compatible
  const [username, usernameAttrs]       = defineField('username')
  const [password, passwordAttrs]       = defineField('password')
  const [rememberMe, rememberMeAttrs]   = defineField('rememberMe')

  // ── Submit ────────────────────────────────────────────
  const onSubmit = handleSubmit(async (values) => {
    serverError.value = ''
    loading.value     = true
    try {
      await authStore.login(values)
      const redirect = route.query.redirect ?? '/dashboard'
      router.push(redirect)
    } catch (err) {
      serverError.value = err.message ?? 'Error al iniciar sesión.'
    } finally {
      loading.value = false
    }
  })

  return {
    // Campos
    username, usernameAttrs,
    password, passwordAttrs,
    rememberMe, rememberMeAttrs,
    // Estado
    errors, meta, loading, serverError,
    // Acción
    onSubmit,
  }
}

// src/modules/auth/composables/useLogin.js
import { ref } from 'vue'
import { useForm } from 'vee-validate'
import * as yup from 'yup'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore }   from '@/modules/auth/store.js'
import { useLoaderStore } from '@/stores/loader.js'

export function useLogin() {
  const router      = useRouter()
  const route       = useRoute()
  const authStore   = useAuthStore()
  const loader      = useLoaderStore()

  const serverError = ref('')
  const loading     = ref(false)

  const schema = yup.object({
    username:   yup.string().required('El usuario es requerido.').min(2, 'Mínimo 2 caracteres.'),
    password:   yup.string().required('La contraseña es requerida.').min(4, 'Mínimo 4 caracteres.'),
    rememberMe: yup.boolean(),
  })

  const { handleSubmit, defineField, errors, meta } = useForm({
    validationSchema: schema,
    initialValues: { username: '', password: '', rememberMe: false },
  })

  const [username,   usernameAttrs]   = defineField('username')
  const [password,   passwordAttrs]   = defineField('password')
  const [rememberMe, rememberMeAttrs] = defineField('rememberMe')

  const onSubmit = handleSubmit(async (values) => {
    serverError.value = ''
    loading.value     = true
    loader.show('Autenticando...')
    try {
      await authStore.login(values)
      loader.show('Cargando dashboard...')
      const redirect = route.query.redirect ?? '/dashboard'
      router.push(redirect)
    } catch (err) {
      serverError.value = err.message ?? 'Error al iniciar sesión.'
    } finally {
      loading.value = false
      loader.hide()
    }
  })

  return {
    username, usernameAttrs,
    password, passwordAttrs,
    rememberMe, rememberMeAttrs,
    errors, meta, loading, serverError,
    onSubmit,
  }
}

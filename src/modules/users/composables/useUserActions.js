// src/modules/users/composables/useUserActions.js
import { ref, reactive } from 'vue'
import { usersService } from '@/modules/users/services/users.service.js'
import { useLoaderStore } from '@/stores/loader.js'

/**
 * Maneja las acciones CRUD sobre usuarios (crear, editar, deshabilitar,
 * reactivar) y los estados de los modales asociados.
 *
 * Tras cada acción exitosa ejecuta el callback `onChanged` (recarga de
 * GET /Permission/Roles desde la vista).
 *
 * @param {() => Promise<void>} onChanged  callback de recarga
 */
export function useUserActions(onChanged, getRoles) {
  const loader = useLoaderStore()

  const saving = ref(false)
  const error  = ref(null)

  // ── Modal Crear/Editar ─────────────────────────────────────
  const formModal = reactive({
    open: false,
    mode: 'create',      // 'create' | 'edit'
    role: null,          // rol de contexto (objeto { id, name, ... })
    username: '',        // username objetivo (en edición, fijo)
    form: {
      firstName: '',
      lastName: '',
      username: '',
      password: '',
      gidNumber: '',
    },
    errors: {},
  })

  // ── Modal Confirmación (deshabilitar / reactivar) ──────────
  const confirmModal = reactive({
    open: false,
    action: null,        // 'disable' | 'enable'
    user: null,          // objeto usuario
    role: null,
  })

  // ── Abrir crear ────────────────────────────────────────────
  function openCreate(role) {
    error.value = null
    saving.value = false
    formModal.mode = 'create'
    formModal.role = role
    formModal.username = ''
    formModal.form = {
      firstName: '',
      lastName: '',
      username: '',
      password: '',
      gidNumber: String(role.id),
    }
    formModal.errors = {}
    formModal.open = true
  }

  // ── Abrir editar ───────────────────────────────────────────
  function openEdit(user, role) {
    error.value = null
    saving.value = false
    formModal.mode = 'edit'
    formModal.role = role
    formModal.username = user.username

    // Determina el gidNumber a preseleccionar en el combo:
    // 1) el gidNumber real del usuario si coincide con algún rol disponible,
    // 2) si no, el rol de contexto desde donde se abrió la edición.
    const roles = (typeof getRoles === 'function' ? getRoles() : []) ?? []
    const userGid = String(user.gidNumber ?? '').trim()
    const exists = roles.some(r => String(r.id).trim() === userGid)
    const selectedGid = (userGid && exists) ? userGid : String(role.id)

    formModal.form = {
      firstName: user.firstName ?? '',
      lastName: user.lastName ?? '',
      username: user.username ?? '',
      password: '',                          // no se edita aquí
      gidNumber: selectedGid,
    }
    formModal.errors = {}
    formModal.open = true
  }

  function closeForm() {
    formModal.open = false
  }

  // ── Validación del formulario ──────────────────────────────
  function validate() {
    const e = {}
    const f = formModal.form
    if (!f.firstName?.trim()) e.firstName = 'Los nombres son obligatorios.'
    if (formModal.mode === 'create') {
      if (!f.username?.trim()) e.username = 'El username es obligatorio.'
      if (!f.password?.trim()) e.password = 'La contraseña es obligatoria.'
    }
    if (!f.gidNumber) e.gidNumber = 'El rol es obligatorio.'
    formModal.errors = e
    return Object.keys(e).length === 0
  }

  // ── Guardar (crear o editar) ───────────────────────────────
  async function submitForm() {
    if (!validate()) {
      return
    }
    saving.value = true
    error.value  = null
    try {
      loader.show(formModal.mode === 'create' ? 'Creando usuario...' : 'Guardando cambios...')
      const f = formModal.form
      if (formModal.mode === 'create') {
        const payload = {
          firstName: f.firstName.trim(),
          lastName: f.lastName?.trim() ?? '',
          username: f.username.trim(),
          password: f.password,
          gidNumber: String(f.gidNumber),
        }
        await usersService.createUser(payload)
      } else {
        const payload = {
          firstName: f.firstName.trim(),
          lastName: f.lastName?.trim() ?? '',
          gidNumber: String(f.gidNumber),
        }
        await usersService.updateUser(formModal.username, payload)
      }
      formModal.open = false
      await onChanged?.()
    } catch (err) {
      error.value = extractError(err) || 'No se pudo guardar el usuario.'
    } finally {
      saving.value = false
      loader.hide()
    }
  }

  // ── Confirmación deshabilitar / reactivar ──────────────────
  function openDisable(user, role) {
    error.value = null
    saving.value = false
    confirmModal.action = 'disable'
    confirmModal.user = user
    confirmModal.role = role
    confirmModal.open = true
  }
  function openEnable(user, role) {
    error.value = null
    saving.value = false
    confirmModal.action = 'enable'
    confirmModal.user = user
    confirmModal.role = role
    confirmModal.open = true
  }
  function closeConfirm() {
    confirmModal.open = false
  }

  async function confirmAction() {
    saving.value = true
    error.value  = null
    const { action, user } = confirmModal
    try {
      loader.show(action === 'disable' ? 'Deshabilitando usuario...' : 'Reactivando usuario...')
      if (action === 'disable') await usersService.disableUser(user.username)
      else                      await usersService.enableUser(user.username)
      confirmModal.open = false
      await onChanged?.()
    } catch (err) {
      error.value = extractError(err) || 'No se pudo completar la acción.'
    } finally {
      saving.value = false
      loader.hide()
    }
  }

  return {
    saving, error,
    formModal, confirmModal,
    openCreate, openEdit, closeForm, submitForm,
    openDisable, openEnable, closeConfirm, confirmAction,
  }
}

// Intenta extraer un mensaje legible del error.
// Nota: http.js ya transforma el error en new Error(msg), así que normalmente
// el detalle viene en err.message. Cubrimos también el caso de que llegue
// el error de axios crudo (con response.data de .NET ProblemDetails).
function extractError(err) {
  const data = err?.response?.data

  // Errores de validación de .NET: { errors: { Campo: ["msg"] } }
  if (data?.errors && typeof data.errors === 'object') {
    const msgs = Object.values(data.errors).flat().filter(Boolean)
    if (msgs.length) return msgs.join(' ')
  }

  // Candidatos en orden; se descartan los vacíos/espacios
  const candidates = [
    data?.message,
    data?.title,
    data?.detail,
    typeof data === 'string' ? data : null,
    err?.message,
  ]
  for (const c of candidates) {
    if (typeof c === 'string' && c.trim()) return c.trim()
  }

  // Último recurso: status HTTP si existe
  const status = err?.response?.status
  if (status) return `Error ${status} del servidor.`
  return null
}
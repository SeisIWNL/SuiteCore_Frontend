<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modal.open" class="modal-overlay" @click.self="$emit('close')">
        <div class="ufm">
          <!-- Header -->
          <div class="ufm__head">
            <h2 class="ufm__title">
              {{ modal.mode === 'create' ? 'Agregar usuario' : 'Editar usuario' }}
            </h2>
            <button class="ufm__close" @click="$emit('close')" title="Cerrar">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <!-- Body -->
          <div class="ufm__body">
            <!-- Nombres + Apellidos -->
            <div class="ufm__row">
              <div class="ufm__field">
                <label class="ufm__label">Nombres</label>
                <input
                  v-model="modal.form.firstName"
                  type="text"
                  class="ufm__input"
                  :class="{ 'ufm__input--error': modal.errors.firstName }"
                  placeholder="Ej: Juan"
                />
                <span v-if="modal.errors.firstName" class="ufm__error">{{ modal.errors.firstName }}</span>
              </div>
              <div class="ufm__field">
                <label class="ufm__label">Apellidos</label>
                <input
                  v-model="modal.form.lastName"
                  type="text"
                  class="ufm__input"
                  placeholder="Ej: Pérez"
                />
              </div>
            </div>

            <!-- Username -->
            <div class="ufm__field">
              <label class="ufm__label">
                Username
                <span v-if="modal.mode === 'edit'" class="ufm__label-hint">(no editable)</span>
              </label>
              <input
                v-model="modal.form.username"
                type="text"
                class="ufm__input"
                :class="{ 'ufm__input--error': modal.errors.username }"
                :readonly="modal.mode === 'edit'"
                :disabled="modal.mode === 'edit'"
                placeholder="Ej: jperez"
              />
              <span v-if="modal.errors.username" class="ufm__error">{{ modal.errors.username }}</span>
            </div>

            <!-- Contraseña (solo en crear) -->
            <div v-if="modal.mode === 'create'" class="ufm__field">
              <label class="ufm__label">Contraseña</label>
              <input
                v-model="modal.form.password"
                type="password"
                class="ufm__input"
                :class="{ 'ufm__input--error': modal.errors.password }"
                placeholder="••••••••"
                autocomplete="new-password"
              />
              <span v-if="modal.errors.password" class="ufm__error">{{ modal.errors.password }}</span>
            </div>

            <!-- Rol -->
            <div class="ufm__field">
              <label class="ufm__label">Rol</label>

              <!-- Crear: TextField no editable con el rol de contexto -->
              <input
                v-if="modal.mode === 'create'"
                :value="contextRoleName"
                type="text"
                class="ufm__input ufm__input--readonly"
                readonly
                disabled
              />

              <!-- Editar: ComboBox con todos los roles -->
              <div v-else class="ufm__select-wrap">
                <select v-model="modal.form.gidNumber" class="ufm__select">
                  <option v-for="r in roles" :key="r.id" :value="String(r.id)">
                    {{ r.name }}
                  </option>
                </select>
                <svg class="ufm__select-chevron" width="14" height="14" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" stroke-width="2"
                  stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </div>
              <span v-if="modal.errors.gidNumber" class="ufm__error">{{ modal.errors.gidNumber }}</span>
            </div>

            <!-- Error global -->
            <div v-if="error" class="ufm__error-box">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span>{{ error }}</span>
            </div>
          </div>

          <!-- Footer -->
          <div class="ufm__footer">
            <button class="btn btn--ghost" :disabled="saving" @click="$emit('close')">
              Cancelar
            </button>
            <button class="btn btn--primary" :disabled="saving" @click="$emit('save')">
              <span v-if="saving" class="btn__spinner" />
              {{ saving ? 'Guardando...' : 'Guardar' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modal:  { type: Object, required: true },   // formModal de useUserActions
  roles:  { type: Array, default: () => [] },  // todos los roles (para el combo)
  saving: { type: Boolean, default: false },
  error:  { type: String, default: null },
})
defineEmits(['close', 'save'])

// Nombre del rol de contexto (para el TextField de crear)
const contextRoleName = computed(() => props.modal.role?.name ?? '')
</script>

<style scoped>
.modal-overlay {
  position: fixed; inset: 0; z-index: 7000;
  background: rgba(0,0,0,.5); backdrop-filter: blur(2px);
  display: flex; align-items: center; justify-content: center; padding: 20px;
}
.ufm {
  width: 100%; max-width: 420px;
  background: var(--bg-1); border: 1px solid var(--border);
  border-radius: var(--radius-xl); box-shadow: var(--shadow-md);
  display: flex; flex-direction: column; overflow: hidden;
}
.ufm__head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 18px; border-bottom: 1px solid var(--border);
}
.ufm__title { font-family: var(--font-display); font-size: 1.05rem; font-weight: 700; color: var(--accent); }
.ufm__close {
  width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;
  background: none; border: none; border-radius: var(--radius-sm);
  color: var(--text-3); cursor: pointer; transition: background .12s, color .12s;
}
.ufm__close:hover { background: var(--bg-2); color: var(--text-1); }

.ufm__body { padding: 18px; display: flex; flex-direction: column; gap: 14px; }
.ufm__row { display: flex; gap: 12px; }
.ufm__row .ufm__field { flex: 1; }
.ufm__field { display: flex; flex-direction: column; gap: 6px; }
.ufm__label {
  font-size: .76rem; font-weight: 600; color: var(--text-2);
  display: flex; align-items: center; gap: 6px;
}
.ufm__label-hint { font-size: .66rem; font-weight: 400; color: var(--text-3); }
.ufm__input {
  height: 38px; padding: 0 12px;
  background: var(--bg-2); border: 1px solid var(--border);
  border-radius: var(--radius); color: var(--text-1);
  font-family: var(--font-sans); font-size: .84rem; outline: none;
  transition: border-color .15s, box-shadow .15s;
}
.ufm__input::placeholder { color: var(--text-3); }
.ufm__input:focus { border-color: var(--accent); box-shadow: var(--shadow-focus); background: var(--bg-1); }
.ufm__input--readonly, .ufm__input[disabled] {
  background: var(--bg-3); color: var(--text-2); cursor: not-allowed;
}
.ufm__input--error { border-color: var(--danger); }
.ufm__error { font-size: .72rem; color: var(--danger); }

.ufm__select-wrap { position: relative; }
.ufm__select {
  width: 100%; height: 38px; padding: 0 34px 0 12px;
  background: var(--bg-2); border: 1px solid var(--border);
  border-radius: var(--radius); color: var(--text-1);
  font-family: var(--font-sans); font-size: .84rem; outline: none;
  cursor: pointer; appearance: none;
  transition: border-color .15s, box-shadow .15s;
}
.ufm__select:focus { border-color: var(--accent); box-shadow: var(--shadow-focus); }
.ufm__select-chevron {
  position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
  color: var(--text-3); pointer-events: none;
}

.ufm__error-box {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 12px; background: var(--danger-muted);
  border: 1px solid var(--danger); border-radius: var(--radius);
  font-size: .76rem; color: var(--danger);
}

.ufm__footer {
  display: flex; justify-content: flex-end; gap: 10px;
  padding: 14px 18px; border-top: 1px solid var(--border);
}
.btn {
  display: inline-flex; align-items: center; gap: 7px;
  height: 36px; padding: 0 18px;
  border-radius: var(--radius); cursor: pointer;
  font-family: var(--font-sans); font-size: .8rem; font-weight: 600;
  border: 1px solid transparent; transition: background .12s, border-color .12s;
}
.btn:disabled { opacity: .55; cursor: not-allowed; }
.btn--ghost { background: none; color: var(--text-2); }
.btn--ghost:hover:not(:disabled) { background: var(--bg-2); color: var(--text-1); }
.btn--primary { background: var(--accent); color: #fff; }
.btn--primary:hover:not(:disabled) { background: var(--accent-dim); }
.btn__spinner {
  width: 13px; height: 13px; border-radius: 50%;
  border: 2px solid rgba(255,255,255,.4); border-top-color: #fff;
  animation: spin .7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.modal-enter-active { transition: opacity .2s; }
.modal-leave-active { transition: opacity .15s; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-active .ufm { transition: transform .2s; }
.modal-enter-from .ufm { transform: scale(.96) translateY(8px); }
</style>

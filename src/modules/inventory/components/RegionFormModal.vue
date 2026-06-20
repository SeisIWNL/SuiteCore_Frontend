<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="mode" class="modal-overlay" @click.self="$emit('close')">
        <div class="modal">

          <!-- Header -->
          <div class="modal__head">
            <div>
              <h2 class="modal__title">
                {{ mode === 'create' ? 'Nueva región' : 'Editar región' }}
              </h2>
              <p class="modal__sub">
                {{ mode === 'create'
                  ? 'Registra una nueva región en NetBox'
                  : 'Modifica los datos de la región' }}
              </p>
            </div>
            <button class="modal__close" @click="$emit('close')" aria-label="Cerrar">✕</button>
          </div>

          <!-- Error general -->
          <div v-if="errors.general" class="modal__error">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span>{{ errors.general }}</span>
          </div>

          <!-- Form -->
          <div class="modal__body">

            <!-- Nombre -->
            <div class="mfield" :class="{ 'mfield--error': errors.name }">
              <label class="mfield__label" for="region-name">Nombre <span class="mfield__req">*</span></label>
              <input
                id="region-name"
                :value="form.name"
                type="text"
                class="mfield__input"
                placeholder="Ej: Lima Metropolitana"
                @input="onNameInput($event.target.value)"
              />
              <span v-if="errors.name" class="mfield__error">{{ errors.name }}</span>
            </div>

            <!-- Slug -->
            <div class="mfield" :class="{ 'mfield--error': errors.slug }">
              <label class="mfield__label" for="region-slug">
                Slug <span class="mfield__req">*</span>
                <span class="mfield__hint">identificador URL en NetBox</span>
              </label>
              <input
                id="region-slug"
                :value="form.slug"
                type="text"
                class="mfield__input mfield__input--mono"
                placeholder="lima-metropolitana"
                @input="onSlugInput($event.target.value)"
              />
              <span v-if="errors.slug" class="mfield__error">{{ errors.slug }}</span>
            </div>

            <!-- Descripción -->
            <div class="mfield">
              <label class="mfield__label" for="region-desc">Descripción</label>
              <textarea
                id="region-desc"
                :value="form.description"
                class="mfield__input mfield__textarea"
                rows="3"
                placeholder="Descripción opcional de la región..."
                @input="$emit('update-field', { key: 'description', value: $event.target.value })"
              />
            </div>

          </div>

          <!-- Footer -->
          <div class="modal__footer">
            <button class="btn btn--ghost" @click="$emit('close')" :disabled="saving">
              Cancelar
            </button>
            <button class="btn btn--primary" @click="$emit('save')" :disabled="saving">
              <span v-if="saving" class="btn__spinner" />
              {{ saving ? 'Guardando...' : (mode === 'create' ? 'Crear región' : 'Guardar cambios') }}
            </button>
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
defineProps({
  mode:   { type: String,  default: null },   // 'create' | 'edit' | null
  form:   { type: Object,  required: true },
  errors: { type: Object,  required: true },
  saving: { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'save', 'name-input', 'slug-input', 'update-field'])

function onNameInput(value) {
  emit('update-field', { key: 'name', value })
  emit('name-input')
}
function onSlugInput(value) {
  emit('update-field', { key: 'slug', value })
  emit('slug-input')
}
</script>

<style scoped>
.modal-overlay {
  position: fixed; inset: 0; z-index: 7000;
  background: rgba(0,0,0,.5);
  backdrop-filter: blur(2px);
  display: flex; align-items: center; justify-content: center;
  padding: 20px;
}
.modal {
  width: 100%; max-width: 440px;
  background: var(--bg-1);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
  overflow: hidden;
}

/* Head */
.modal__head {
  display: flex; align-items: flex-start; justify-content: space-between;
  padding: 18px 20px 14px;
  border-bottom: 1px solid var(--border);
}
.modal__title {
  font-family: var(--font-display);
  font-size: 1.05rem; font-weight: 700; color: var(--text-1);
}
.modal__sub { font-size: .76rem; color: var(--text-3); margin-top: 3px; }
.modal__close {
  background: none; border: none; cursor: pointer;
  color: var(--text-3); font-size: .85rem;
  width: 26px; height: 26px; border-radius: var(--radius-sm);
  display: flex; align-items: center; justify-content: center;
  transition: background .12s, color .12s;
}
.modal__close:hover { background: var(--bg-hover); color: var(--text-1); }

/* Error */
.modal__error {
  display: flex; align-items: center; gap: 8px;
  margin: 14px 20px 0;
  padding: 9px 12px;
  background: var(--danger-muted);
  border: 1px solid var(--danger);
  border-radius: var(--radius);
  font-size: .78rem; color: var(--danger);
}

/* Body */
.modal__body {
  padding: 18px 20px;
  display: flex; flex-direction: column; gap: 16px;
}

/* Fields */
.mfield { display: flex; flex-direction: column; gap: 5px; }
.mfield__label {
  display: flex; align-items: center; gap: 7px;
  font-size: .76rem; font-weight: 600; color: var(--text-2);
}
.mfield__req { color: var(--danger); }
.mfield__hint {
  font-size: .68rem; font-weight: 400; color: var(--text-3);
  font-style: italic;
}
.mfield__input {
  width: 100%; height: 36px;
  padding: 0 11px;
  background: var(--bg-2); border: 1px solid var(--border);
  border-radius: var(--radius); color: var(--text-1);
  font-family: var(--font-sans); font-size: .85rem; outline: none;
  transition: border-color .15s, box-shadow .15s;
}
.mfield__input::placeholder { color: var(--text-3); }
.mfield__input:focus {
  border-color: var(--accent); box-shadow: var(--shadow-focus);
  background: var(--bg-1);
}
.mfield__input--mono { font-family: var(--font-mono); font-size: .82rem; }
.mfield__textarea {
  height: auto; padding: 9px 11px; resize: vertical;
  font-family: var(--font-sans); line-height: 1.5;
}
.mfield--error .mfield__input { border-color: var(--danger); }
.mfield__error { font-size: .72rem; color: var(--danger); }

/* Footer */
.modal__footer {
  display: flex; justify-content: flex-end; gap: 10px;
  padding: 14px 20px;
  border-top: 1px solid var(--border);
  background: var(--bg-2);
}
.btn {
  display: inline-flex; align-items: center; gap: 7px;
  height: 36px; padding: 0 16px;
  border-radius: var(--radius); cursor: pointer;
  font-family: var(--font-sans); font-size: .82rem; font-weight: 600;
  border: 1px solid transparent;
  transition: background .12s, border-color .12s;
}
.btn:disabled { opacity: .6; cursor: not-allowed; }
.btn--ghost {
  background: var(--bg-1); border-color: var(--border); color: var(--text-1);
}
.btn--ghost:hover:not(:disabled) { background: var(--bg-hover); }
.btn--primary { background: var(--accent); color: #fff; }
.btn--primary:hover:not(:disabled) { background: var(--accent-dim); }
.btn__spinner {
  width: 13px; height: 13px;
  border: 2px solid rgba(255,255,255,.3); border-top-color: #fff;
  border-radius: 50%; animation: spin .6s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Transition */
.modal-enter-active { transition: opacity .2s; }
.modal-leave-active { transition: opacity .15s; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-active .modal { transition: transform .2s; }
.modal-enter-from .modal { transform: scale(.96) translateY(8px); }
</style>

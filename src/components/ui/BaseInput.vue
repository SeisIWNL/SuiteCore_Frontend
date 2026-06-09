<template>
  <div class="field" :class="{ 'field--error': error }">
    <label v-if="label" :for="id" class="field__label">{{ label }}</label>

    <div class="field__control">
      <!-- Ícono izquierdo -->
      <span v-if="$slots.prefix" class="field__adorn field__adorn--left">
        <slot name="prefix" />
      </span>

      <input
        :id="id"
        v-bind="$attrs"
        :type="currentType"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :autocomplete="autocomplete"
        class="field__input"
        :class="{
          'field__input--pl': $slots.prefix,
          'field__input--pr': $slots.suffix || type === 'password',
        }"
        @input="$emit('update:modelValue', $event.target.value)"
      />

      <!-- Toggle contraseña -->
      <button
        v-if="type === 'password'"
        type="button"
        class="field__adorn field__adorn--right field__toggle"
        :aria-label="showPwd ? 'Ocultar contraseña' : 'Mostrar contraseña'"
        @click="showPwd = !showPwd"
      >
        <!-- Ojo abierto -->
        <svg v-if="!showPwd" width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
        <!-- Ojo tachado -->
        <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M17.94 17.94A10 10 0 0 1 12 20c-7 0-11-8-11-8a18 18 0 0 1 5.06-5.94"/>
          <path d="M9.9 4.24A9 9 0 0 1 12 4c7 0 11 8 11 8a18 18 0 0 1-2.16 3.19"/>
          <line x1="1" y1="1" x2="23" y2="23"/>
        </svg>
      </button>

      <!-- Ícono derecho genérico -->
      <span v-else-if="$slots.suffix" class="field__adorn field__adorn--right">
        <slot name="suffix" />
      </span>
    </div>

    <p v-if="error" class="field__msg field__msg--error">{{ error }}</p>
    <p v-else-if="hint"  class="field__msg field__msg--hint">{{ hint }}</p>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  id:           { type: String, default: () => `field-${Math.random().toString(36).slice(2, 6)}` },
  label:        { type: String, default: '' },
  modelValue:   { type: String, default: '' },
  type:         { type: String, default: 'text' },
  placeholder:  { type: String, default: '' },
  disabled:     { type: Boolean, default: false },
  autocomplete: { type: String, default: 'off' },
  error:        { type: String, default: '' },
  hint:         { type: String, default: '' },
})

defineEmits(['update:modelValue'])

const showPwd = ref(false)
const currentType = computed(() =>
  props.type === 'password' ? (showPwd.value ? 'text' : 'password') : props.type
)
</script>

<style scoped>
.field { display: flex; flex-direction: column; gap: 4px; }

.field__label {
  font-size: .76rem; font-weight: 600;
  color: var(--text-2); letter-spacing: .01em;
}

.field__control { position: relative; }

.field__input {
  display: block; width: 100%; height: 34px;
  padding: 0 9px;
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--radius); color: var(--text-1);
  font-size: .88rem; outline: none;
  transition: border-color .15s, box-shadow .15s;
}
.field__input::placeholder { color: var(--text-3); }
.field__input:focus { border-color: var(--border-focus); box-shadow: var(--shadow-focus); }
.field__input:disabled { background: var(--bg); cursor: not-allowed; }
.field__input--pl { padding-left: 32px; }
.field__input--pr { padding-right: 32px; }

.field--error .field__input { border-color: var(--danger); }
.field--error .field__input:focus { box-shadow: 0 0 0 3px rgba(220,38,38,.15); }

.field__adorn {
  position: absolute; top: 0;
  display: flex; align-items: center; justify-content: center;
  width: 30px; height: 100%; color: var(--text-3);
}
.field__adorn--left  { left: 0; pointer-events: none; }
.field__adorn--right { right: 0; }

.field__toggle {
  background: none; border: none; cursor: pointer; padding: 0;
  color: var(--text-3); transition: color .15s;
}
.field__toggle:hover { color: var(--text-2); }

.field__msg { font-size: .72rem; }
.field__msg--error { color: var(--danger); }
.field__msg--hint  { color: var(--text-3); }
</style>

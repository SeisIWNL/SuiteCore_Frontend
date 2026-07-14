<template>
  <div class="inv-toolbar">
    <div class="inv-toolbar__row">
      <div class="search">
        <svg class="search__icon" width="14" height="14" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          :value="search"
          type="text"
          class="search__input"
          :placeholder="placeholder"
          @input="$emit('update:search', $event.target.value)"
        />
        <button v-if="search" class="search__clear" @click="$emit('update:search', '')">✕</button>
      </div>

      <span class="inv-toolbar__count">{{ shown }} de {{ total }}</span>
    </div>

    <div v-if="statusOptions.length" class="inv-toolbar__chips">
      <button
        class="chip"
        :class="{ 'chip--active': statusValue === 'all' }"
        @click="$emit('update:statusValue', 'all')"
      >
        Todos
      </button>
      <button
        v-for="opt in statusOptions"
        :key="opt.value"
        class="chip"
        :class="{ 'chip--active': statusValue === opt.value }"
        @click="$emit('update:statusValue', opt.value)"
      >
        {{ opt.label }}
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  search:        { type: String, default: '' },
  statusValue:   { type: String, default: 'all' },
  statusOptions: { type: Array,  default: () => [] },
  placeholder:   { type: String, default: 'Buscar...' },
  shown:         { type: Number, default: 0 },
  total:         { type: Number, default: 0 },
})
defineEmits(['update:search', 'update:statusValue'])
</script>

<style scoped>
.inv-toolbar { display: flex; flex-direction: column; gap: 10px; margin-bottom: 14px; }
.inv-toolbar__row {
  display: flex; align-items: center; justify-content: space-between; gap: 14px;
}
.search { position: relative; flex: 1; max-width: 340px; }
.search__icon {
  position: absolute; left: 10px; top: 50%; transform: translateY(-50%);
  color: var(--text-3); pointer-events: none;
}
.search__input {
  width: 100%; height: 34px; padding: 0 32px;
  background: var(--bg-2); border: 1px solid var(--border);
  border-radius: var(--radius); color: var(--text-1);
  font-family: var(--font-sans); font-size: .82rem; outline: none;
  transition: border-color .15s, box-shadow .15s;
}
.search__input::placeholder { color: var(--text-3); }
.search__input:focus { border-color: var(--accent); box-shadow: var(--shadow-focus); background: var(--bg-1); }
.search__clear {
  position: absolute; right: 8px; top: 50%; transform: translateY(-50%);
  width: 18px; height: 18px; background: var(--bg-3); border: none; border-radius: 50%;
  color: var(--text-2); cursor: pointer; font-size: .65rem;
  display: flex; align-items: center; justify-content: center;
}
.search__clear:hover { background: var(--border-mid); color: var(--text-1); }
.inv-toolbar__count { font-size: .74rem; color: var(--text-3); white-space: nowrap; }

.inv-toolbar__chips { display: flex; gap: 6px; flex-wrap: wrap; }
.chip {
  padding: 5px 12px; background: var(--bg-2); border: 1px solid var(--border);
  border-radius: 99px; color: var(--text-2);
  font-family: var(--font-sans); font-size: .74rem; font-weight: 600;
  cursor: pointer; transition: background .12s, color .12s, border-color .12s;
}
.chip:hover { background: var(--bg-hover); color: var(--text-1); }
.chip--active { background: var(--accent-muted); border-color: var(--accent); color: var(--accent); }
</style>

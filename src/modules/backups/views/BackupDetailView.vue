<template>
  <div class="detail">

    <!-- Breadcrumb + back -->
    <button class="detail__back" @click="goBack">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round">
        <line x1="19" y1="12" x2="5" y2="12"/>
        <polyline points="12 19 5 12 12 5"/>
      </svg>
      Volver a respaldos
    </button>

    <!-- Error -->
    <div v-if="error" class="detail__error">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <span>{{ error }}</span>
    </div>

    <template v-else>
      <!-- Header -->
      <div class="detail__head">
        <div>
          <div class="detail__eyebrow">RESPALDO DE CONFIGURACIÓN</div>
          <h1 class="detail__title">{{ deviceName }}</h1>
          <p v-if="backup" class="detail__meta">
            Recuperado {{ formatDateTime(backup.retrievedAt) }} · {{ formatRelative(backup.retrievedAt) }}
          </p>
        </div>
        <div class="detail__actions">
          <button class="btn btn--ghost" @click="copyConfig" :disabled="!backup">
            <svg v-if="!copied" width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
            <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2.5"
              stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            {{ copied ? 'Copiado' : 'Copiar' }}
          </button>
          <button class="btn btn--primary" @click="downloadConfig" :disabled="!backup">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Descargar .cfg
          </button>
        </div>
      </div>

      <!-- Stats del config -->
      <div class="detail__stats">
        <div class="cfg-stat">
          <div class="cfg-stat__label">Total líneas</div>
          <div class="cfg-stat__value">{{ lineCount }}</div>
        </div>
        <div class="cfg-stat">
          <div class="cfg-stat__label">Tamaño</div>
          <div class="cfg-stat__value">{{ configSize }}</div>
        </div>
        <div class="cfg-stat">
          <div class="cfg-stat__label">Dispositivo</div>
          <div class="cfg-stat__value cfg-stat__value--sm">{{ deviceName }}</div>
        </div>
        <div class="cfg-stat">
          <div class="cfg-stat__label">Estado</div>
          <div class="cfg-stat__value cfg-stat__value--ok">
            <span class="cfg-stat__dot" /> Verificado
          </div>
        </div>
      </div>

      <!-- Config viewer -->
      <div class="cfg-viewer">
        <div class="cfg-viewer__head">
          <div class="cfg-viewer__tabs">
            <span class="cfg-viewer__tab cfg-viewer__tab--active">
              <span class="cfg-viewer__tab-dot" /> Configuración
            </span>
            <span class="cfg-viewer__filename mono">{{ deviceName.toLowerCase() }}_config.rsc</span>
          </div>
          <div class="cfg-viewer__controls">
            <button class="cfg-viewer__ctrl" @click="toggleWrap" :title="wrapLines ? 'Desactivar ajuste' : 'Ajustar líneas'">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round">
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="12" x2="15" y2="12"/>
                <polyline points="15 9 18 12 15 15"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
            <button class="cfg-viewer__ctrl" @click="toggleExpand" :title="expanded ? 'Contraer' : 'Pantalla completa'">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round">
                <template v-if="!expanded">
                  <polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/>
                  <line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>
                </template>
                <template v-else>
                  <polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/>
                  <line x1="10" y1="14" x2="3" y2="21"/><line x1="14" y1="10" x2="21" y2="3"/>
                </template>
              </svg>
            </button>
          </div>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="cfg-viewer__loading">
          <div class="cfg-viewer__skeleton" v-for="i in 8" :key="i" :style="{ width: `${40 + (i * 7) % 50}%` }" />
        </div>

        <!-- Config con números de línea -->
        <div v-else class="cfg-viewer__body" :class="{ 'cfg-viewer__body--expanded': expanded }">
          <pre class="cfg-code" :class="{ 'cfg-code--wrap': wrapLines }"><code><span
            v-for="(line, i) in configLines"
            :key="i"
            class="cfg-line"
          ><span class="cfg-line__num">{{ i + 1 }}</span><span class="cfg-line__content" :class="lineClass(line)">{{ line || ' ' }}</span></span></code></pre>
        </div>
      </div>
    </template>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { backupsService } from '@/modules/backups/services/backups.service.js'
import { useDateFormat }  from '@/modules/backups/composables/useDateFormat.js'
import { useLoaderStore } from '@/stores/loader.js'

const props = defineProps({
  deviceName: { type: String, required: true },
})

const router = useRouter()
const loader = useLoaderStore()
const { formatDateTime, formatRelative } = useDateFormat()

const backup   = ref(null)
const error    = ref(null)
const loading  = ref(false)
const copied   = ref(false)
const wrapLines = ref(false)
const expanded  = ref(false)

// ── Computeds del config ──────────────────────────────────────
const configLines = computed(() => {
  if (!backup.value?.config) return []
  return backup.value.config.split('\n')
})
const lineCount  = computed(() => configLines.value.length.toLocaleString('es-PE'))
const configSize = computed(() => {
  if (!backup.value?.config) return '0 B'
  const bytes = new Blob([backup.value.config]).size
  if (bytes < 1024) return `${bytes} B`
  return `${(bytes / 1024).toFixed(1)} KB`
})

// Colorea líneas de comentario y comandos
function lineClass(line) {
  const trimmed = line.trimStart()
  if (trimmed.startsWith('#'))  return 'cfg-line__content--comment'
  if (trimmed.startsWith('/'))  return 'cfg-line__content--command'
  if (trimmed.startsWith('add') || trimmed.startsWith('set')) return 'cfg-line__content--action'
  return ''
}

// ── Acciones ──────────────────────────────────────────────────
async function copyConfig() {
  if (!backup.value?.config) return
  try {
    await navigator.clipboard.writeText(backup.value.config)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch {
    error.value = 'No se pudo copiar al portapapeles.'
  }
}

function downloadConfig() {
  if (!backup.value?.config) return
  const blob = new Blob([backup.value.config], { type: 'text/plain' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url
  a.download = `${props.deviceName}_config.rsc`
  a.click()
  URL.revokeObjectURL(url)
}

function toggleWrap()   { wrapLines.value = !wrapLines.value }
function toggleExpand() { expanded.value  = !expanded.value }
function goBack()       { router.push({ name: 'backups' }) }

// ── Fetch ─────────────────────────────────────────────────────
async function fetchBackup() {
  loading.value = true
  error.value   = null
  try {
    loader.show('Cargando respaldo...')
    backup.value = await backupsService.getDeviceBackup(props.deviceName)
  } catch (err) {
    error.value = err.message ?? 'No se pudo obtener el respaldo del dispositivo.'
  } finally {
    loading.value = false
    loader.hide()
  }
}

onMounted(fetchBackup)
</script>

<style scoped>
.detail { max-width: 1800px; }

/* Back */
.detail__back {
  display: inline-flex; align-items: center; gap: 6px;
  background: none; border: none; cursor: pointer;
  color: var(--text-2); font-family: var(--font-sans);
  font-size: .8rem; font-weight: 500; padding: 0;
  margin-bottom: 16px; transition: color .12s;
}
.detail__back:hover { color: var(--accent); }

/* Error */
.detail__error {
  display: flex; align-items: center; gap: 10px;
  padding: 14px 16px;
  background: var(--danger-muted); border: 1px solid var(--danger);
  border-radius: var(--radius); font-size: .82rem; color: var(--danger);
}

/* Header */
.detail__head {
  display: flex; justify-content: space-between; align-items: flex-start;
  gap: 16px; margin-bottom: 18px;
}
.detail__eyebrow {
  font-size: .65rem; font-weight: 700; color: var(--accent);
  letter-spacing: .1em; margin-bottom: 4px;
}
.detail__title {
  font-family: var(--font-display);
  font-size: 1.4rem; font-weight: 700; color: var(--text-1);
}
.detail__meta { font-size: .76rem; color: var(--text-3); margin-top: 4px; }

.detail__actions { display: flex; gap: 10px; flex-shrink: 0; }
.btn {
  display: inline-flex; align-items: center; gap: 7px;
  height: 36px; padding: 0 14px;
  border-radius: var(--radius); cursor: pointer;
  font-family: var(--font-sans); font-size: .8rem; font-weight: 600;
  border: 1px solid transparent; transition: background .12s, border-color .12s;
}
.btn:disabled { opacity: .5; cursor: not-allowed; }
.btn--ghost { background: var(--bg-1); border-color: var(--border); color: var(--text-1); }
.btn--ghost:hover:not(:disabled) { background: var(--bg-hover); }
.btn--primary { background: var(--accent); color: #fff; }
.btn--primary:hover:not(:disabled) { background: var(--accent-dim); }

/* Stats */
.detail__stats {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px; margin-bottom: 16px;
}
.cfg-stat {
  background: var(--bg-1); border: 1px solid var(--border);
  border-radius: var(--radius-lg); padding: 12px 16px;
}
.cfg-stat__label {
  font-size: .65rem; color: var(--text-3); font-weight: 600;
  text-transform: uppercase; letter-spacing: .05em;
}
.cfg-stat__value {
  font-family: var(--font-display);
  font-size: 1.3rem; font-weight: 700; color: var(--text-1);
  margin-top: 4px; line-height: 1;
}
.cfg-stat__value--sm { font-size: .9rem; font-family: var(--font-mono); }
.cfg-stat__value--ok {
  font-size: .9rem; color: var(--success);
  display: flex; align-items: center; gap: 6px;
}
.cfg-stat__dot {
  width: 7px; height: 7px; border-radius: 50%;
  background: var(--success); box-shadow: 0 0 6px var(--success);
}

/* Config viewer */
.cfg-viewer {
  background: var(--bg-1); border: 1px solid var(--border);
  border-radius: var(--radius-lg); overflow: hidden;
}
.cfg-viewer__head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 14px; border-bottom: 1px solid var(--border);
  background: var(--bg-2);
}
.cfg-viewer__tabs { display: flex; align-items: center; gap: 12px; }
.cfg-viewer__tab {
  display: flex; align-items: center; gap: 6px;
  font-size: .76rem; font-weight: 600; color: var(--text-1);
}
.cfg-viewer__tab-dot {
  width: 7px; height: 7px; border-radius: 50%; background: var(--accent);
}
.cfg-viewer__filename { font-size: .72rem; color: var(--text-3); }
.cfg-viewer__controls { display: flex; gap: 4px; }
.cfg-viewer__ctrl {
  width: 28px; height: 28px;
  display: flex; align-items: center; justify-content: center;
  background: var(--bg-1); border: 1px solid var(--border);
  border-radius: var(--radius-sm); color: var(--text-2);
  cursor: pointer; transition: background .12s, color .12s;
}
.cfg-viewer__ctrl:hover { background: var(--bg-hover); color: var(--text-1); }

/* Loading */
.cfg-viewer__loading { padding: 16px; display: flex; flex-direction: column; gap: 8px; }
.cfg-viewer__skeleton {
  height: 12px; border-radius: 3px; background: var(--bg-3);
  animation: shimmer 1.4s ease infinite;
}
@keyframes shimmer { 0%,100%{opacity:.4} 50%{opacity:.8} }

/* Body */
.cfg-viewer__body {
  max-height: 520px; overflow: auto;
  background: var(--bg-1);
}
.cfg-viewer__body--expanded { max-height: 80vh; }

.cfg-code {
  margin: 0; font-family: var(--font-mono);
  font-size: .76rem; line-height: 1.6;
}
.cfg-line { display: flex; }
.cfg-code--wrap .cfg-line { white-space: pre-wrap; }
.cfg-line__num {
  flex-shrink: 0; width: 48px;
  padding: 0 12px 0 0; text-align: right;
  color: var(--text-3); user-select: none;
  border-right: 1px solid var(--border);
  background: var(--bg-2);
  position: sticky; left: 0;
}
.cfg-line__content {
  padding: 0 16px; color: var(--text-2);
  white-space: pre;
}
.cfg-code--wrap .cfg-line__content { white-space: pre-wrap; word-break: break-word; }
.cfg-line:hover .cfg-line__content { background: var(--bg-2); }
.cfg-line:hover .cfg-line__num { color: var(--text-2); }

/* Syntax colors */
.cfg-line__content--comment { color: var(--text-3); font-style: italic; }
.cfg-line__content--command { color: var(--accent); font-weight: 600; }
.cfg-line__content--action  { color: var(--blue); }

@media (max-width: 640px) {
  .detail__head { flex-direction: column; }
  .detail__actions { width: 100%; }
  .btn { flex: 1; justify-content: center; }
}
</style>

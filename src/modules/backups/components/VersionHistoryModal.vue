<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="open" class="modal-overlay" @click.self="close">
        <div class="vhm" :class="{ 'vhm--wide': view === 'config' }">

          <!-- ── Header ── -->
          <div class="vhm__head">
            <div class="vhm__head-left">
              <button
                v-if="view === 'config'"
                class="vhm__back"
                @click="backToList"
                title="Volver al historial"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" stroke-width="2"
                  stroke-linecap="round" stroke-linejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12"/>
                  <polyline points="12 19 5 12 12 5"/>
                </svg>
              </button>
              <div>
                <div class="vhm__eyebrow">
                  {{ view === 'list' ? 'HISTORIAL DE VERSIONES' : `VERSIÓN v${selectedVersion?.num ?? ''}` }}
                </div>
                <h2 class="vhm__title">{{ deviceName }}</h2>
              </div>
            </div>
            <button class="vhm__close" @click="close" title="Cerrar">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <!-- ════════ Vista: Lista de versiones ════════ -->
          <div v-if="view === 'list'" class="vhm__body">

            <!-- Error -->
            <div v-if="versionsError" class="vhm__error">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span>{{ versionsError }}</span>
            </div>

            <!-- Skeleton -->
            <div v-else-if="versionsLoading" class="vhm__skeleton">
              <div v-for="i in 5" :key="`sk-${i}`" class="vhm__skel-row">
                <div class="skeleton" style="width:34px;height:34px;border-radius:50%"/>
                <div style="flex:1">
                  <div class="skeleton" style="width:40%;height:11px"/>
                  <div class="skeleton" style="width:60%;height:10px;margin-top:6px"/>
                </div>
              </div>
            </div>

            <!-- Lista -->
            <ul v-else-if="hasVersions" class="vlist">
              <li
                v-for="(ver, idx) in versions"
                :key="ver.oid"
                class="vitem"
                @click="openVersion(ver)"
              >
                <div class="vitem__badge" :class="{ 'vitem__badge--latest': idx === 0 }">
                  v{{ ver.num }}
                </div>
                <div class="vitem__info">
                  <div class="vitem__top">
                    <span class="vitem__date">{{ formatDateTime(ver.date) }}</span>
                    <span v-if="idx === 0" class="vitem__tag">Más reciente</span>
                  </div>
                  <div class="vitem__sub">
                    <span class="vitem__rel">{{ formatRelative(ver.date) }}</span>
                    <span class="vitem__dot-sep">·</span>
                    <code class="vitem__oid">{{ ver.oid.slice(0, 12) }}</code>
                  </div>
                </div>
                <svg class="vitem__chevron" width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" stroke-width="2"
                  stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </li>
            </ul>

            <!-- Vacío -->
            <div v-else class="vhm__empty">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="1.5"
                stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              <span>No hay versiones registradas para este dispositivo</span>
            </div>
          </div>

          <!-- ════════ Vista: Configuración ════════ -->
          <div v-else class="vhm__config">

            <!-- Meta bar -->
            <div class="cfg-meta">
              <div class="cfg-meta__item">
                <span class="cfg-meta__label">Fecha</span>
                <span class="cfg-meta__value mono">{{ formatDateTime(selectedVersion?.date) }}</span>
              </div>
              <div class="cfg-meta__item">
                <span class="cfg-meta__label">OID</span>
                <code class="cfg-meta__oid">{{ (selectedVersion?.oid ?? '').slice(0, 12) }}…</code>
              </div>
              <div class="cfg-meta__item">
                <span class="cfg-meta__label">Líneas</span>
                <span class="cfg-meta__value">{{ lineCount }}</span>
              </div>
              <div class="cfg-meta__item">
                <span class="cfg-meta__label">Tamaño</span>
                <span class="cfg-meta__value">{{ configSize }}</span>
              </div>
              <div class="cfg-meta__actions">
                <button class="btn btn--ghost btn--sm" @click="copyConfig" :disabled="backupLoading || !backup">
                  <svg v-if="!copied" width="13" height="13" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="2"
                    stroke-linecap="round" stroke-linejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                  </svg>
                  <svg v-else width="13" height="13" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="2.5"
                    stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  {{ copied ? 'Copiado' : 'Copiar' }}
                </button>
                <button class="btn btn--primary btn--sm" @click="downloadConfig" :disabled="backupLoading || !backup">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="2"
                    stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Descargar
                </button>
              </div>
            </div>

            <!-- Error config -->
            <div v-if="backupError" class="vhm__error vhm__error--inline">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span>{{ backupError }}</span>
            </div>

            <!-- Loading config -->
            <div v-else-if="backupLoading" class="cfg-loading">
              <div v-for="i in 12" :key="`cl-${i}`"
                class="skeleton"
                :style="{ width: `${30 + (i * 11) % 55}%`, height: '12px' }" />
            </div>

            <!-- Config con números de línea -->
            <div v-else class="cfg-code-wrap">
              <pre class="cfg-code"><code><span
                v-for="(line, i) in configLines"
                :key="i"
                class="cfg-line"
              ><span class="cfg-line__num">{{ i + 1 }}</span><span
                class="cfg-line__content"
                :class="lineClass(line)"
              >{{ line || ' ' }}</span></span></code></pre>
            </div>
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, toRef, watch } from 'vue'
import { useVersionHistory } from '@/modules/backups/composables/useVersionHistory.js'
import { useDateFormat }     from '@/modules/backups/composables/useDateFormat.js'

const props = defineProps({
  open:       { type: Boolean, default: false },
  deviceName: { type: String,  default: '' },
})
const emit = defineEmits(['close'])

const { formatDateTime, formatRelative } = useDateFormat()

const view   = ref('list')
const copied = ref(false)

const {
  versions, versionsError, versionsLoading, hasVersions,
  backup, backupError, backupLoading, selectedVersion,
  configLines, lineCount, configSize,
  fetchVersions, fetchBackup, reset,
} = useVersionHistory(toRef(props, 'deviceName'))

// Al abrir, resetea y carga el historial; al cerrar, limpia.
watch(() => props.open, (isOpen) => {
  if (isOpen && props.deviceName) {
    view.value   = 'list'
    copied.value = false
    reset()
    fetchVersions()
  } else if (!isOpen) {
    reset()
  }
})

function openVersion(ver) {
  view.value   = 'config'
  copied.value = false
  fetchBackup(ver)
}

function backToList() { view.value = 'list' }
function close()      { emit('close') }

// Colorea líneas (igual que BackupDetailView)
function lineClass(line) {
  const t = line.trimStart()
  if (t.startsWith('#'))                           return 'cfg-line__content--comment'
  if (t.startsWith('/'))                           return 'cfg-line__content--command'
  if (t.startsWith('add') || t.startsWith('set')) return 'cfg-line__content--action'
  return ''
}

async function copyConfig() {
  if (!backup.value?.config) return
  try {
    await navigator.clipboard.writeText(backup.value.config)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch { /* ignore */ }
}

function downloadConfig() {
  if (!backup.value?.config) return
  const suffix = selectedVersion.value ? `_v${selectedVersion.value.num}` : ''
  const blob = new Blob([backup.value.config], { type: 'text/plain' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url
  a.download = `${props.deviceName}${suffix}.rsc`
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
.modal-overlay {
  position: fixed; inset: 0; z-index: 7000;
  background: rgba(0,0,0,.5); backdrop-filter: blur(2px);
  display: flex; align-items: center; justify-content: center;
  padding: 20px;
}
.vhm {
  width: 100%; max-width: 460px;
  max-height: 82vh;
  background: var(--bg-1);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
  display: flex; flex-direction: column;
  overflow: hidden;
  transition: max-width .22s ease;
}
.vhm--wide { max-width: 820px; }

/* Header */
.vhm__head {
  display: flex; align-items: center; justify-content: space-between;
  gap: 12px; padding: 16px 18px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}
.vhm__head-left { display: flex; align-items: center; gap: 12px; min-width: 0; }
.vhm__back {
  width: 30px; height: 30px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  background: var(--bg-2); border: 1px solid var(--border);
  border-radius: var(--radius-sm); color: var(--text-2);
  cursor: pointer; transition: background .12s, color .12s;
}
.vhm__back:hover { background: var(--accent-muted); color: var(--accent); border-color: var(--accent); }
.vhm__eyebrow {
  font-size: .62rem; font-weight: 700; color: var(--accent);
  letter-spacing: .08em; margin-bottom: 2px;
}
.vhm__title {
  font-family: var(--font-display);
  font-size: 1.05rem; font-weight: 700; color: var(--text-1);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.vhm__close {
  width: 30px; height: 30px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  background: none; border: none; border-radius: var(--radius-sm);
  color: var(--text-3); cursor: pointer; transition: background .12s, color .12s;
}
.vhm__close:hover { background: var(--bg-2); color: var(--text-1); }

/* Body (lista) */
.vhm__body { overflow-y: auto; padding: 10px; }

.vhm__error {
  display: flex; align-items: center; gap: 10px;
  padding: 14px 16px; margin: 8px;
  background: var(--danger-muted); border: 1px solid var(--danger);
  border-radius: var(--radius); font-size: .8rem; color: var(--danger);
}
.vhm__error--inline { margin: 14px; }

.vhm__empty {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 10px; padding: 48px 20px; text-align: center;
  color: var(--text-3); font-size: .84rem;
}
.vhm__empty svg { opacity: .4; }

/* Skeleton lista */
.vhm__skeleton { padding: 6px; display: flex; flex-direction: column; gap: 6px; }
.vhm__skel-row { display: flex; align-items: center; gap: 12px; padding: 10px; }
.skeleton { border-radius: 4px; background: var(--bg-3); animation: shimmer 1.4s ease infinite; }
@keyframes shimmer { 0%,100%{opacity:.4} 50%{opacity:.8} }

/* Lista de versiones */
.vlist { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 4px; }
.vitem {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 12px; border-radius: var(--radius);
  border: 1px solid transparent; cursor: pointer;
  transition: background .12s, border-color .12s;
}
.vitem:hover { background: var(--bg-2); border-color: var(--border); }
.vitem__badge {
  flex-shrink: 0; min-width: 38px; height: 34px;
  display: flex; align-items: center; justify-content: center;
  background: var(--bg-3); border-radius: var(--radius-sm);
  font-family: var(--font-mono); font-size: .8rem; font-weight: 700;
  color: var(--text-2);
}
.vitem__badge--latest { background: var(--success-muted); color: var(--success); }
.vitem__info { flex: 1; min-width: 0; }
.vitem__top { display: flex; align-items: center; gap: 8px; }
.vitem__date { font-size: .82rem; font-weight: 600; color: var(--text-1); }
.vitem__tag {
  font-size: .62rem; font-weight: 700;
  padding: 1px 7px; border-radius: 99px;
  background: var(--success-muted); color: var(--success);
}
.vitem__sub { display: flex; align-items: center; gap: 7px; margin-top: 2px; }
.vitem__rel { font-size: .7rem; color: var(--text-3); }
.vitem__dot-sep { color: var(--text-3); font-size: .7rem; }
.vitem__oid { font-family: var(--font-mono); font-size: .68rem; color: var(--text-3); }
.vitem__chevron { color: var(--text-3); flex-shrink: 0; }
.vitem:hover .vitem__chevron { color: var(--accent); }

/* ── Vista config ── */
.vhm__config { display: flex; flex-direction: column; overflow: hidden; min-height: 0; }

.cfg-meta {
  display: flex; align-items: center; gap: 0; flex-wrap: wrap;
  padding: 0; border-bottom: 1px solid var(--border);
  background: var(--bg-2); flex-shrink: 0;
}
.cfg-meta__item {
  display: flex; flex-direction: column;
  padding: 10px 16px; border-right: 1px solid var(--border);
}
.cfg-meta__label {
  font-size: .6rem; font-weight: 700; color: var(--text-3);
  text-transform: uppercase; letter-spacing: .05em; margin-bottom: 2px;
}
.cfg-meta__value {
  font-family: var(--font-display);
  font-size: .9rem; font-weight: 700; color: var(--text-1);
}
.cfg-meta__oid { font-family: var(--font-mono); font-size: .76rem; color: var(--text-2); }
.cfg-meta__actions { margin-left: auto; display: flex; gap: 8px; padding: 0 14px; }
.mono { font-family: var(--font-mono); font-size: .8rem; }

/* Config viewer */
.cfg-loading { padding: 16px; display: flex; flex-direction: column; gap: 8px; }
.cfg-code-wrap { overflow: auto; max-height: 56vh; background: var(--bg-1); }
.cfg-code { margin: 0; font-family: var(--font-mono); font-size: .74rem; line-height: 1.6; }
.cfg-line { display: flex; }
.cfg-line__num {
  flex-shrink: 0; width: 44px; padding: 0 12px 0 0; text-align: right;
  color: var(--text-3); user-select: none;
  border-right: 1px solid var(--border);
  background: var(--bg-2); position: sticky; left: 0;
}
.cfg-line__content { padding: 0 16px; color: var(--text-2); white-space: pre; }
.cfg-line:hover .cfg-line__content { background: var(--bg-2); }
.cfg-line:hover .cfg-line__num { color: var(--text-2); }
.cfg-line__content--comment { color: var(--text-3); font-style: italic; }
.cfg-line__content--command { color: var(--accent); font-weight: 600; }
.cfg-line__content--action  { color: var(--blue); }

/* Botones */
.btn {
  display: inline-flex; align-items: center; gap: 6px;
  height: 36px; padding: 0 14px;
  border-radius: var(--radius); cursor: pointer;
  font-family: var(--font-sans); font-size: .8rem; font-weight: 600;
  border: 1px solid transparent; transition: background .12s, border-color .12s;
}
.btn--sm { height: 30px; padding: 0 11px; font-size: .74rem; }
.btn:disabled { opacity: .5; cursor: not-allowed; }
.btn--ghost { background: var(--bg-1); border-color: var(--border); color: var(--text-1); }
.btn--ghost:hover:not(:disabled) { background: var(--bg-hover); }
.btn--primary { background: var(--accent); color: #fff; }
.btn--primary:hover:not(:disabled) { background: var(--accent-dim); }

/* Transición modal */
.modal-enter-active { transition: opacity .2s; }
.modal-leave-active { transition: opacity .15s; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-active .vhm { transition: transform .2s; }
.modal-enter-from .vhm { transform: scale(.96) translateY(8px); }

@media (max-width: 720px) {
  .cfg-meta__actions { margin-left: 0; width: 100%; padding: 8px 14px; justify-content: flex-end; }
  .cfg-code-wrap { max-height: 48vh; }
}
</style>

// src/modules/main/composables/useChartTheme.js

/**
 * Lee las variables CSS del tema actual y devuelve colores concretos
 * para Chart.js (que no entiende var(--x)). Se recalcula al llamar,
 * así respeta el tema claro/oscuro vigente.
 */
export function readChartTheme() {
  const css = getComputedStyle(document.documentElement)
  const v = (name, fallback) => {
    const val = css.getPropertyValue(name).trim()
    return val || fallback
  }
  return {
    accent:  v('--accent',  '#3b82f6'),
    blue:    v('--blue',    '#60a5fa'),
    success: v('--success', '#34d399'),
    warning: v('--warning', '#fbbf24'),
    danger:  v('--danger',  '#f87171'),
    text1:   v('--text-1',  '#e2e8f0'),
    text2:   v('--text-2',  '#7f8ea3'),
    text3:   v('--text-3',  '#4a5568'),
    border:  v('--border',  '#2a3347'),
    bg1:     v('--bg-1',    '#161b27'),
    bg2:     v('--bg-2',    '#1c2333'),
    bg3:     v('--bg-3',    '#212840'),
  }
}

/**
 * Paleta de N colores derivada del tema, para series categóricas
 * (ej. subredes). Cicla sobre una base agradable.
 */
export function categoricalPalette(theme, n) {
  const base = [
    theme.accent, theme.success, theme.warning,
    theme.blue, theme.danger, '#a78bfa', '#f472b6', '#2dd4bf',
  ]
  const out = []
  for (let i = 0; i < n; i++) out.push(base[i % base.length])
  return out
}

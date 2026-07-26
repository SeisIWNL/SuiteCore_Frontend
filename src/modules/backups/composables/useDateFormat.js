export function useDateFormat() {

  function parseOxidizedDate(str) {
    if (!str) return null
    const normalized = str.replace(' UTC', 'Z').replace(' ', 'T')
    const d = new Date(normalized)
    return isNaN(d.getTime()) ? null : d
  }

  function formatDateTime(str) {
    const d = parseOxidizedDate(str)
    if (!d) return '—'
    return d.toLocaleString('es-PE', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: false,
    })
  }

  function formatRelative(str) {
    const d = parseOxidizedDate(str)
    if (!d) return '—'
    const diff = Date.now() - d.getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1)  return 'hace instantes'
    if (mins < 60) return `hace ${mins} min`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `hace ${hours} h`
    const days = Math.floor(hours / 24)
    return `hace ${days} día${days !== 1 ? 's' : ''}`
  }

  return { parseOxidizedDate, formatDateTime, formatRelative }
}

import { inventoryService, subnetOf } from '@/modules/inventory/services/inventory.service.js'
import { backupsService } from '@/modules/backups/services/backups.service.js'

export const dashboardService = {
  /**
   * NetBox — resumen de direcciones IP agrupadas por subred + estado.
   * @returns {Promise<{
   *   totalIps, totalSubnets, activeIps,
   *   bySubnet: Array<{ subnet, count }>,
   *   byStatus: Array<{ status, count }>,
   *   totalRegions
   * }>}
   */
  async getNetboxSummary() {
    const [ips, regions] = await Promise.all([
      inventoryService.getIpAddresses(),
      inventoryService.getRegions().catch(() => []),
    ])

    // Agrupa por subred
    const subnetMap = new Map()
    const statusMap = new Map()
    let activeIps = 0

    for (const ip of ips ?? []) {
      const subnet = subnetOf(ip.address)
      subnetMap.set(subnet, (subnetMap.get(subnet) ?? 0) + 1)

      const status = ip.status?.label ?? ip.status?.value ?? 'Desconocido'
      statusMap.set(status, (statusMap.get(status) ?? 0) + 1)

      if (ip.status?.value === 'active') activeIps++
    }

    const bySubnet = [...subnetMap.entries()]
      .map(([subnet, count]) => ({ subnet, count }))
      .sort((a, b) => b.count - a.count)

    const byStatus = [...statusMap.entries()]
      .map(([status, count]) => ({ status, count }))

    return {
      totalIps: (ips ?? []).length,
      totalSubnets: subnetMap.size,
      activeIps,
      bySubnet,
      byStatus,
      totalRegions: Array.isArray(regions) ? regions.length : (regions?.length ?? 0),
    }
  },

  /**
   * @returns {Promise<{
   *   total, success, failed,
   *   byGroup: Array<{ group, success, failed }>
   * }>}
   */
  async getBackupsSummary() {
    const data = await backupsService.getDevices()
    const devices = data.devices ?? data ?? []

    let success = 0
    let failed = 0
    const groupMap = new Map()

    for (const d of devices) {
      const ok = (d.status ?? '').toLowerCase() === 'success'
      if (ok) success++
      else failed++

      const group = d.group || 'Sin grupo'
      if (!groupMap.has(group)) groupMap.set(group, { group, success: 0, failed: 0 })
      const g = groupMap.get(group)
      if (ok) g.success++
      else g.failed++
    }

    return {
      total: devices.length,
      success,
      failed,
      byGroup: [...groupMap.values()],
    }
  },
}
/**
 * AlertSummary - Alert counts by severity as a KpiStrip
 * Server Component - displays total and severity counts
 */

import type { Alert } from '@/lib/data/server/alert-data'
import { KpiStrip } from '@/components/ui/kpi-strip'

interface AlertSummaryProps {
  alerts: Alert[]
}

export function AlertSummary({ alerts }: AlertSummaryProps) {
  const totalAlerts = alerts.length
  const criticalCount = alerts.filter((a) => a.severity === 'red').length
  const warningCount = alerts.filter((a) => a.severity === 'yellow').length
  const accountCount = new Set(alerts.map((a) => a.accountName).filter(Boolean)).size

  return (
    <KpiStrip
      items={[
        {
          label: 'Total alerts',
          value: totalAlerts,
          context: totalAlerts === 0 ? 'Nothing needs attention' : 'Sorted by severity below',
        },
        {
          label: 'Critical',
          value: criticalCount,
          context: criticalCount > 0 ? 'Needs attention' : 'None open',
          tone: criticalCount > 0 ? 'critical' : 'default',
        },
        {
          label: 'Warning',
          value: warningCount,
          context: warningCount > 0 ? 'Monitor' : 'None open',
          tone: warningCount > 0 ? 'warning' : 'default',
        },
        {
          label: 'Accounts affected',
          value: accountCount,
          context: 'Alerts tied to a named account',
        },
      ]}
    />
  )
}

/**
 * DM% Trend Chart
 * Client-side chart component showing TTM trends and forecasts
 */

'use client'

import { useEffect, useRef } from 'react'
import type { DMTrackerData } from '@/lib/data/server/dm-tracker-data'
import { readCssColor } from '@/components/charts/chart-colors'

interface DMTrendChartProps {
  data: DMTrackerData
}

export function DMTrendChart({ data }: DMTrendChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<any>(null)

  useEffect(() => {
    const loadChartAndRender = async () => {
      // Dynamically import Chart.js (client-side only)
      const { Chart, registerables } = await import('chart.js')
      Chart.register(...registerables)

      if (!canvasRef.current) return

      // Destroy existing chart if it exists
      if (chartRef.current) {
        chartRef.current.destroy()
      }

      const ctx = canvasRef.current.getContext('2d')
      if (!ctx) return

      // Prepare data: TTM historical + forecast
      const allQuarters = [
        ...data.consolidated.ttm_quarters.map((q) => q.quarter),
        ...data.forecast.quarters.map((q) => q.quarter),
      ]

      const historicalDM = data.consolidated.ttm_quarters.map((q) => q.dm_pct)
      const forecastDM = [
        data.consolidated.ttm_quarters[data.consolidated.ttm_quarters.length - 1]
          .dm_pct,
        ...data.forecast.quarters.map((q) => q.forecasted_dm_pct),
      ]

      // Also prepare BU-specific trends for comparison
      const buTrends = data.business_units.map((bu) => ({
        label: bu.bu,
        data: bu.ttm_quarters.map((q) => q.dm_pct),
      }))

      // Token colors resolved at runtime (Chart.js needs real color strings)
      const navy = readCssColor('--secondary')
      const brick = readCssColor('--accent')
      const muted = readCssColor('--muted')
      const ink2 = readCssColor('--ink-2')
      const critical = readCssColor('--critical-ink')
      const grid = readCssColor('--border')
      const ink = readCssColor('--ink')
      const fontFamily = getComputedStyle(document.body).fontFamily
      const buColors = [brick, muted, ink2]
      const buDashes: number[][] = [[], [], [2, 3]]

      // Create chart
      chartRef.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels: allQuarters,
          datasets: [
            {
              label: 'Consolidated DM% (historical)',
              data: [
                ...historicalDM,
                ...Array(data.forecast.quarters.length).fill(null),
              ],
              borderColor: navy,
              backgroundColor: navy,
              borderWidth: 2.5,
              fill: false,
              tension: 0.3,
              cubicInterpolationMode: 'monotone' as const,
              pointRadius: 3,
              pointHoverRadius: 5,
            },
            {
              label: 'Consolidated DM% (forecast)',
              data: [
                ...Array(data.consolidated.ttm_quarters.length - 1).fill(null),
                ...forecastDM,
              ],
              borderColor: navy,
              backgroundColor: navy,
              borderWidth: 2,
              borderDash: [5, 4],
              fill: false,
              tension: 0.3,
              cubicInterpolationMode: 'monotone' as const,
              pointRadius: 3,
              pointHoverRadius: 5,
            },
            {
              label: '90% target',
              data: Array(allQuarters.length).fill(90),
              borderColor: critical,
              backgroundColor: critical,
              borderWidth: 1.5,
              borderDash: [6, 4],
              pointRadius: 0,
              fill: false,
            },
            // Add BU trends
            ...buTrends.map((bu, idx) => ({
              label: `${bu.label} DM%`,
              data: [
                ...bu.data,
                ...Array(data.forecast.quarters.length).fill(null),
              ],
              borderColor: buColors[idx % buColors.length],
              backgroundColor: buColors[idx % buColors.length],
              borderWidth: 1.5,
              borderDash: buDashes[idx % buDashes.length],
              fill: false,
              tension: 0.3,
              cubicInterpolationMode: 'monotone' as const,
              pointRadius: 2,
              pointHoverRadius: 4,
            })),
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          // No entrance animation (DESIGN.md)
          animation: false,
          interaction: { mode: 'index', intersect: false },
          plugins: {
            legend: {
              display: true,
              position: 'bottom',
              labels: {
                boxWidth: 12,
                boxHeight: 2,
                padding: 14,
                color: ink2,
                font: { size: 12, family: fontFamily },
              },
            },
            tooltip: {
              backgroundColor: ink,
              padding: 10,
              cornerRadius: 6,
              titleFont: { size: 12, weight: 600, family: fontFamily },
              bodyFont: { size: 12, family: fontFamily },
              callbacks: {
                label: function (context) {
                  let label = context.dataset.label || ''
                  if (label) {
                    label += ': '
                  }
                  if (context.parsed.y !== null) {
                    label += context.parsed.y.toFixed(2) + '%'
                  }
                  return label
                },
              },
            },
          },
          scales: {
            y: {
              beginAtZero: false,
              // Soft bounds so out-of-range quarters stay visible
              suggestedMin: 85,
              suggestedMax: 110,
              border: { display: false },
              ticks: {
                callback: function (value) {
                  return value + '%'
                },
                color: muted,
                font: { size: 11, family: fontFamily },
              },
              grid: { color: grid },
              title: {
                display: true,
                text: 'DM% (decline/maintenance rate)',
                color: muted,
                font: { size: 12, family: fontFamily },
              },
            },
            x: {
              border: { color: grid },
              ticks: {
                color: muted,
                font: { size: 11, family: fontFamily },
              },
              grid: { display: false },
            },
          },
        },
      })
    }

    loadChartAndRender()

    // Cleanup on unmount
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy()
      }
    }
  }, [data])

  return (
    <div style={{ position: 'relative', height: '360px' }}>
      <canvas ref={canvasRef} role="img" aria-label="Line chart of TTM DM% by quarter, consolidated and per business unit, with forecast and the 90% target" />
    </div>
  )
}

/**
 * DM% Trend Chart
 * Client-side chart component showing TTM trends and forecasts
 */

'use client'

import { useEffect, useRef } from 'react'
import type { DMTrackerData } from '@/lib/data/server/dm-tracker-data'

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

      // Create chart
      chartRef.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels: allQuarters,
          datasets: [
            {
              label: 'Consolidated DM% (Historical)',
              data: [
                ...historicalDM,
                ...Array(data.forecast.quarters.length).fill(null),
              ],
              borderColor: '#1e3c72',
              backgroundColor: 'rgba(30, 60, 114, 0.1)',
              borderWidth: 3,
              fill: true,
              tension: 0.4,
              pointRadius: 5,
              pointHoverRadius: 7,
            },
            {
              label: 'Consolidated DM% (Forecast)',
              data: [
                ...Array(data.consolidated.ttm_quarters.length - 1).fill(null),
                ...forecastDM,
              ],
              borderColor: '#667eea',
              backgroundColor: 'rgba(102, 126, 234, 0.1)',
              borderWidth: 3,
              borderDash: [5, 5],
              fill: true,
              tension: 0.4,
              pointRadius: 5,
              pointHoverRadius: 7,
            },
            {
              label: '90% Target',
              data: Array(allQuarters.length).fill(90),
              borderColor: '#f5576c',
              backgroundColor: 'transparent',
              borderWidth: 2,
              borderDash: [10, 5],
              pointRadius: 0,
              fill: false,
            },
            // Add BU trends
            ...buTrends.map((bu, idx) => {
              const colors = ['#4facfe', '#10b981', '#fa709a']
              return {
                label: `${bu.label} DM%`,
                data: [
                  ...bu.data,
                  ...Array(data.forecast.quarters.length).fill(null),
                ],
                borderColor: colors[idx % colors.length],
                backgroundColor: 'transparent',
                borderWidth: 2,
                tension: 0.4,
                pointRadius: 3,
                pointHoverRadius: 5,
              }
            }),
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
              position: 'bottom',
              labels: {
                boxWidth: 12,
                padding: 15,
                font: {
                  size: 11,
                  family:
                    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                },
              },
            },
            tooltip: {
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              padding: 12,
              titleFont: {
                size: 13,
                weight: 'bold',
              },
              bodyFont: {
                size: 12,
              },
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
              min: 85,
              max: 125,
              ticks: {
                callback: function (value) {
                  return value + '%'
                },
                font: {
                  size: 11,
                },
              },
              grid: {
                color: 'rgba(0, 0, 0, 0.05)',
              },
              title: {
                display: true,
                text: 'DM% (Decline/Maintenance Rate)',
                font: {
                  size: 12,
                  weight: 'bold',
                },
              },
            },
            x: {
              ticks: {
                font: {
                  size: 11,
                },
              },
              grid: {
                display: false,
              },
              title: {
                display: true,
                text: 'Quarter',
                font: {
                  size: 12,
                  weight: 'bold',
                },
              },
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
    <div
      style={{
        background: 'white',
        borderRadius: '15px',
        padding: '30px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        marginBottom: '20px',
      }}
    >
      <div style={{ position: 'relative', height: '400px' }}>
        <canvas ref={canvasRef} />
      </div>
    </div>
  )
}

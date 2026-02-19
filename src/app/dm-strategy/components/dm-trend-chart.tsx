'use client';

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import type { MonthlyDMData } from '../types';

const DESIGN_TOKENS = {
  success: '#4caf50',
  critical: '#e53935',
  warning: '#f59e0b',
  secondary: '#2d4263',
  accent: '#c84b31',
  muted: '#8b8b8b',
  border: '#e8e6e1',
  ink: '#1a1a1a',
}

interface DMTrendChartProps {
  data: MonthlyDMData[];
  title: string;
  color: string;
  targetDM: number;
  showTarget?: boolean;
}

export default function DMTrendChart({
  data,
  title,
  color,
  targetDM,
  showTarget = true,
}: DMTrendChartProps) {
  // Calculate min/max for Y-axis (with padding)
  const dmValues = data.map((d) => d.dmPercent);
  const minDM = Math.min(...dmValues, targetDM) - 2;
  const maxDM = Math.max(...dmValues, targetDM) + 2;

  return (
    <div
      style={{
        background: '#FFFFFF',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-lg)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        marginBottom: 'var(--space-lg)',
      }}
    >
      {/* Chart Title */}
      <h3
        style={{
          fontSize: '1.25rem',
          fontWeight: 700,
          color: color,
          marginBottom: 'var(--space-md)',
          paddingBottom: 'var(--space-sm)',
          borderBottom: `2px solid ${color}20`,
        }}
      >
        {title}
      </h3>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={data}
          margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={DESIGN_TOKENS.border} />

          <XAxis
            dataKey="month"
            tick={{ fontSize: 12, fill: DESIGN_TOKENS.muted }}
            tickLine={{ stroke: DESIGN_TOKENS.border }}
            axisLine={{ stroke: DESIGN_TOKENS.border }}
          />

          <YAxis
            domain={[minDM, maxDM]}
            tick={{ fontSize: 12, fill: DESIGN_TOKENS.muted }}
            tickLine={{ stroke: DESIGN_TOKENS.border }}
            axisLine={{ stroke: DESIGN_TOKENS.border }}
            tickFormatter={(value) => `${value.toFixed(1)}%`}
          />

          <Tooltip
            contentStyle={{
              background: 'white',
              border: `1px solid ${DESIGN_TOKENS.border}`,
              borderRadius: '8px',
              padding: '12px',
            }}
            labelStyle={{
              fontWeight: 600,
              marginBottom: '8px',
              color: DESIGN_TOKENS.ink,
            }}
            formatter={(value: number | undefined) =>
              value !== undefined ? [`${value.toFixed(1)}%`, 'DM%'] : ['N/A', 'DM%']
            }
          />

          <Legend
            wrapperStyle={{
              paddingTop: '20px',
            }}
          />

          {/* Target Line */}
          {showTarget && (
            <ReferenceLine
              y={targetDM}
              stroke={DESIGN_TOKENS.success}
              strokeDasharray="5 5"
              strokeWidth={2}
              label={{
                value: `Target: ${targetDM}%`,
                position: 'right',
                fill: DESIGN_TOKENS.success,
                fontSize: 12,
                fontWeight: 600,
              }}
            />
          )}

          {/* DM% Line */}
          <Line
            type="monotone"
            dataKey="dmPercent"
            stroke={color}
            strokeWidth={3}
            dot={{
              fill: color,
              strokeWidth: 2,
              r: 4,
            }}
            activeDot={{
              fill: color,
              stroke: 'white',
              strokeWidth: 2,
              r: 6,
            }}
            name="DM%"
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Summary Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: 'var(--space-md)',
          marginTop: 'var(--space-lg)',
          paddingTop: 'var(--space-md)',
          borderTop: `1px solid ${DESIGN_TOKENS.border}`,
        }}
      >
        <div>
          <div
            style={{
              fontSize: '0.75rem',
              color: DESIGN_TOKENS.muted,
              marginBottom: '4px',
            }}
          >
            Latest (Jan '26)
          </div>
          <div
            style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              color: data[data.length - 1].dmPercent >= targetDM ? DESIGN_TOKENS.success : DESIGN_TOKENS.critical,
            }}
          >
            {data[data.length - 1].dmPercent.toFixed(1)}%
          </div>
        </div>

        <div>
          <div
            style={{
              fontSize: '0.75rem',
              color: DESIGN_TOKENS.muted,
              marginBottom: '4px',
            }}
          >
            12-Month Avg
          </div>
          <div
            style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              color: color,
            }}
          >
            {(data.reduce((sum, d) => sum + d.dmPercent, 0) / data.length).toFixed(1)}%
          </div>
        </div>

        <div>
          <div
            style={{
              fontSize: '0.75rem',
              color: DESIGN_TOKENS.muted,
              marginBottom: '4px',
            }}
          >
            Peak
          </div>
          <div
            style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              color: DESIGN_TOKENS.success,
            }}
          >
            {Math.max(...dmValues).toFixed(1)}%
          </div>
        </div>

        <div>
          <div
            style={{
              fontSize: '0.75rem',
              color: DESIGN_TOKENS.muted,
              marginBottom: '4px',
            }}
          >
            Trough
          </div>
          <div
            style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              color: DESIGN_TOKENS.critical,
            }}
          >
            {Math.min(...dmValues).toFixed(1)}%
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import type { MonthlyDMData } from '../types';

interface DMTrendChartProps {
  data: MonthlyDMData[];
  title: string;
  /** Series color: a CSS color or `var(--token)`; tokens are resolved at runtime for SVG attributes */
  color?: string;
  targetDM: number;
  showTarget?: boolean;
}

const TOKEN_NAMES = ['--secondary', '--success-ink', '--critical-ink', '--muted', '--border', '--ink', '--surface'] as const;
type TokenName = (typeof TOKEN_NAMES)[number];

/**
 * SVG presentation attributes don't resolve `var(--x)`, so read the design
 * tokens from :root once mounted and hand Recharts concrete color strings.
 */
function useTokens(): Record<TokenName, string> {
  const [tokens, setTokens] = useState<Record<TokenName, string>>(
    () => Object.fromEntries(TOKEN_NAMES.map((n) => [n, `var(${n})`])) as Record<TokenName, string>
  );
  useEffect(() => {
    const css = getComputedStyle(document.documentElement);
    setTokens(
      Object.fromEntries(
        TOKEN_NAMES.map((n) => [n, css.getPropertyValue(n).trim() || `var(${n})`])
      ) as Record<TokenName, string>
    );
  }, []);
  return tokens;
}

function resolveColor(color: string | undefined, tokens: Record<TokenName, string>): string {
  if (!color) return tokens['--secondary'];
  const match = color.match(/^var\((--[a-z0-9-]+)\)$/i);
  if (match && (TOKEN_NAMES as readonly string[]).includes(match[1])) return tokens[match[1] as TokenName];
  return color;
}

export default function DMTrendChart({
  data,
  title,
  color,
  targetDM,
  showTarget = true,
}: DMTrendChartProps) {
  const tokens = useTokens();
  const series = resolveColor(color, tokens);

  if (data.length === 0) {
    return (
      <section className="card p-5">
        <h3 className="m-0 text-base font-semibold">{title}</h3>
        <p className="m-0 mt-2 text-sm" style={{ color: 'var(--muted)' }}>No history available for this business unit.</p>
      </section>
    );
  }

  // Calculate min/max for Y-axis (with padding)
  const dmValues = data.map((d) => d.dmPercent);
  const minDM = Math.min(...dmValues, targetDM) - 2;
  const maxDM = Math.max(...dmValues, targetDM) + 2;
  const latest = data[data.length - 1];
  const latestBelowTarget = latest.dmPercent < targetDM;

  const stats = [
    {
      label: `Latest (${latest.month})`,
      value: `${latest.dmPercent.toFixed(1)}%`,
      color: latestBelowTarget ? 'var(--critical-ink)' : 'var(--success-ink)',
      context: latestBelowTarget ? `Below ${targetDM}% target` : `At or above ${targetDM}% target`,
    },
    { label: `${data.length}-quarter average`, value: `${(dmValues.reduce((s, v) => s + v, 0) / data.length).toFixed(1)}%` },
    { label: 'Peak', value: `${Math.max(...dmValues).toFixed(1)}%` },
    { label: 'Trough', value: `${Math.min(...dmValues).toFixed(1)}%` },
  ];

  return (
    <section className="card p-5">
      <h3 className="m-0 mb-4 text-base font-semibold">{title}</h3>

      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={tokens['--border']} vertical={false} />

          <XAxis
            dataKey="month"
            tick={{ fontSize: 12, fill: tokens['--muted'] }}
            tickLine={false}
            axisLine={{ stroke: tokens['--border'] }}
            minTickGap={16}
          />

          <YAxis
            domain={[minDM, maxDM]}
            tick={{ fontSize: 12, fill: tokens['--muted'] }}
            tickLine={false}
            axisLine={false}
            width={52}
            tickFormatter={(value) => `${value.toFixed(0)}%`}
          />

          <Tooltip
            contentStyle={{
              background: tokens['--surface'],
              border: `1px solid ${tokens['--border']}`,
              borderRadius: '6px',
              padding: '8px 10px',
              fontSize: 12,
            }}
            labelStyle={{ fontWeight: 600, marginBottom: 4, color: tokens['--ink'] }}
            formatter={(value: number | undefined) =>
              value !== undefined ? [`${value.toFixed(1)}%`, 'RR vs a year earlier'] : ['N/A', 'RR vs a year earlier']
            }
          />

          {/* Target Line */}
          {showTarget && (
            <ReferenceLine
              y={targetDM}
              stroke={tokens['--success-ink']}
              strokeDasharray="4 4"
              strokeWidth={1}
              label={{
                value: `Target ${targetDM}%`,
                position: 'insideTopRight',
                fill: tokens['--success-ink'],
                fontSize: 11,
              }}
            />
          )}

          {/* DM% Line */}
          <Line
            type="monotone"
            dataKey="dmPercent"
            stroke={series}
            strokeWidth={2}
            dot={{ fill: series, stroke: series, r: 2.5 }}
            activeDot={{ fill: series, stroke: tokens['--surface'], strokeWidth: 2, r: 5 }}
            name="DM%"
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Summary stats */}
      <dl
        className="m-0 mt-4 grid gap-4 border-t pt-4"
        style={{ borderColor: 'var(--border)', gridTemplateColumns: 'repeat(auto-fit, minmax(7.5rem, 1fr))' }}
      >
        {stats.map((s) => (
          <div key={s.label}>
            <dt className="text-xs font-medium" style={{ color: 'var(--muted)' }}>{s.label}</dt>
            <dd className="num m-0 mt-0.5 text-lg font-semibold" style={{ color: s.color ?? 'var(--ink)' }}>{s.value}</dd>
            {s.context && <dd className="m-0 text-xs" style={{ color: 'var(--muted)' }}>{s.context}</dd>}
          </div>
        ))}
      </dl>
    </section>
  );
}

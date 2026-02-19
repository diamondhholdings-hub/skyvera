'use client'

/**
 * 7-Section Dashboard Navigation
 * Uses CSS design tokens throughout — no hardcoded hex colors
 */

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect } from 'react'

const sections = [
  { id: 'financial-summary', label: 'Financial Summary' },
  { id: 'financial-detailed', label: 'Financial Analysis' },
  { id: 'customer-summary', label: 'Customer Summary' },
  { id: 'top-customers', label: 'Top Customers' },
  { id: 'at-risk', label: 'At-Risk Accounts' },
  { id: 'expansion', label: 'Expansion Pipeline' },
  { id: 'action-plan', label: 'Action Plan' },
]

export function DashboardNavigation() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeSection = searchParams.get('section') || 'financial-summary'

  // Inject keyframes CSS once on mount
  useEffect(() => {
    if (!document.getElementById('dashboard-keyframes')) {
      const style = document.createElement('style')
      style.id = 'dashboard-keyframes'
      style.textContent = `
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `
      document.head.appendChild(style)
    }
  }, [])

  // Hide/show sections based on active state
  useEffect(() => {
    // Hide all sections
    sections.forEach(({ id }) => {
      const element = document.getElementById(id)
      if (element) {
        element.style.display = id === activeSection ? 'block' : 'none'
        if (id === activeSection) {
          element.style.animation = 'fadeIn 0.5s ease-out'
        }
      }
    })
  }, [activeSection])

  const handleSectionChange = (sectionId: string) => {
    router.push(`/dashboard?section=${sectionId}`, { scroll: false })
  }

  return (
    <nav
      className="bg-[var(--highlight)] border-b border-[var(--border)] flex gap-2 flex-wrap px-10 py-4 sticky top-0 z-[100]"
    >
      {sections.map(({ id, label }) => (
        <button
          key={id}
          onClick={() => handleSectionChange(id)}
          className={`px-[18px] py-2.5 rounded-lg font-semibold text-sm transition-all ${
            activeSection === id
              ? 'bg-[var(--secondary)] text-[var(--paper)]'
              : 'bg-transparent text-[var(--muted)] hover:bg-[var(--secondary)]/10 hover:text-[var(--ink)]'
          }`}
        >
          {label}
        </button>
      ))}
    </nav>
  )
}

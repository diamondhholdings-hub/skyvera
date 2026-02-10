'use client'

/**
 * 7-Section Dashboard Navigation
 * Sticky navigation bar with section tabs
 * Uses URL search params for deep linking
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
    <>
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-slate-50 py-4 px-10 border-b-2 border-slate-200 flex gap-2.5 flex-wrap">
        {sections.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => handleSectionChange(id)}
            className={`
              px-[18px] py-2.5 rounded-lg font-semibold text-[0.9rem] transition-all duration-300
              ${
                activeSection === id
                  ? 'bg-[#1e3c72] text-white'
                  : 'bg-[#667eea] text-white hover:bg-[#764ba2] hover:-translate-y-0.5'
              }
            `}
          >
            {label}
          </button>
        ))}
      </nav>

      {/* CSS for fade-in animation */}
      <style jsx global>{`
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
      `}</style>
    </>
  )
}

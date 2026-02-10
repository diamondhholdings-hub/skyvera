'use client'

/**
 * 7-Section Dashboard Navigation
 * Exact match to reference HTML navigation
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
      {/* Navigation Bar - exact styling from reference */}
      <nav style={{
        background: '#f8f9fa',
        padding: '15px 40px',
        borderBottom: '2px solid #e9ecef',
        display: 'flex',
        gap: '10px',
        flexWrap: 'wrap',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        {sections.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => handleSectionChange(id)}
            style={{
              padding: '10px 18px',
              border: 'none',
              background: activeSection === id ? '#1e3c72' : '#667eea',
              color: 'white',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.9em',
              transition: 'all 0.3s',
              ...(activeSection !== id && {
                ':hover': {
                  background: '#764ba2',
                  transform: 'translateY(-2px)'
                }
              })
            }}
            onMouseEnter={(e) => {
              if (activeSection !== id) {
                e.currentTarget.style.background = '#764ba2'
                e.currentTarget.style.transform = 'translateY(-2px)'
              }
            }}
            onMouseLeave={(e) => {
              if (activeSection !== id) {
                e.currentTarget.style.background = '#667eea'
                e.currentTarget.style.transform = 'translateY(0)'
              }
            }}
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

'use client'

/**
 * SalesforceSyncButton — triggers a Salesforce data sync for the current account
 * Shows loading state, success/error feedback, and last sync time
 */
import { useState } from 'react'
import { RefreshCw, CheckCircle, AlertCircle, Cloud } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface SalesforceSyncButtonProps {
  accountName: string
}

export function SalesforceSyncButton({ accountName }: SalesforceSyncButtonProps) {
  const [status, setStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState<string>('')
  const router = useRouter()

  const handleSync = async () => {
    setStatus('syncing')
    setMessage('')

    try {
      const res = await fetch(`/api/salesforce/sync/${encodeURIComponent(accountName)}`, {
        method: 'POST',
      })
      const data = await res.json()

      if (data.success) {
        const { stakeholders, opportunities, actions } = data.synced
        setStatus('success')
        setMessage(`Synced: ${stakeholders} contacts, ${opportunities} opportunities, ${actions} cases`)
        // Refresh page data
        router.refresh()
      } else if (res.status === 503) {
        setStatus('error')
        setMessage('Salesforce not configured')
      } else {
        setStatus('error')
        setMessage(data.message || data.errors?.[0] || 'Sync failed')
      }
    } catch {
      setStatus('error')
      setMessage('Network error')
    }

    // Reset to idle after 4 seconds
    setTimeout(() => {
      setStatus('idle')
      setMessage('')
    }, 4000)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
      <button
        onClick={handleSync}
        disabled={status === 'syncing'}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 1rem',
          background: status === 'success' ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.1)',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: '4px',
          color: 'white',
          fontSize: '0.8rem',
          fontWeight: 500,
          cursor: status === 'syncing' ? 'not-allowed' : 'pointer',
          opacity: status === 'syncing' ? 0.7 : 1,
          transition: 'all 0.2s',
        }}
      >
        {status === 'syncing' ? (
          <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />
        ) : status === 'success' ? (
          <CheckCircle size={14} />
        ) : status === 'error' ? (
          <AlertCircle size={14} />
        ) : (
          <Cloud size={14} />
        )}
        {status === 'syncing'
          ? 'Syncing...'
          : status === 'success'
          ? 'Synced!'
          : status === 'error'
          ? 'Failed'
          : 'Sync from Salesforce'}
      </button>
      {message && (
        <span
          style={{
            fontSize: '0.7rem',
            color: 'rgba(255,255,255,0.7)',
            maxWidth: '200px',
            textAlign: 'right',
          }}
        >
          {message}
        </span>
      )}
    </div>
  )
}

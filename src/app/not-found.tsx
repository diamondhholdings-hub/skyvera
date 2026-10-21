import Link from 'next/link'

/**
 * Custom 404 page for missing routes
 */
export default function NotFound() {
  return (
    <div className="mx-auto max-w-[1400px] px-4 py-16 lg:px-8">
      <div className="max-w-xl">
        <p className="section-label m-0">Error 404</p>
        <h1 className="m-0 mt-1">Page not found</h1>
        <p className="m-0 mt-2 text-sm" style={{ color: 'var(--muted)' }}>
          The page you are looking for does not exist or has been moved.
        </p>
        <div className="mt-6">
          <Link href="/dashboard" className="btn btn-primary">
            Back to Overview
          </Link>
        </div>
      </div>
    </div>
  )
}

import { FileQuestion } from 'lucide-react'
import Link from 'next/link'

/**
 * Custom 404 page for missing routes
 */
export default function NotFound() {
  return (
    <div className="min-h-[400px] flex flex-col items-center justify-center p-8">
      <div className="max-w-md text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-full bg-yellow-50 flex items-center justify-center">
          <FileQuestion className="h-8 w-8 text-yellow-500" />
        </div>

        <div>
          <h1 className="text-2xl font-semibold text-slate-900 mb-2">
            Page not found
          </h1>
          <p className="text-sm text-gray-600">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  )
}

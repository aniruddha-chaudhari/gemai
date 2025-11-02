'use client'

import { App } from '@/components/App'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Suspense } from 'react'

export default function Home() {
  return (
    <ErrorBoundary>
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-teal-600 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        </div>
      }>
        <App />
      </Suspense>
    </ErrorBoundary>
  )
}

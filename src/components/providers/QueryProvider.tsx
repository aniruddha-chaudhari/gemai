'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode, useState } from 'react'

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Cache data for 5 minutes
            staleTime: 5 * 60 * 1000,
            // Keep unused data in cache for 10 minutes
            gcTime: 10 * 60 * 1000,
            // In dev mode, don't refetch on window focus (reduces hot reload delays)
            // In production, refetch for fresh data
            refetchOnWindowFocus: process.env.NODE_ENV === 'production',
            // Don't refetch on mount if data exists (prevents duplicate requests)
            refetchOnMount: false,
            // Retry failed requests
            retry: 1,
            // Deduplicate requests within 2 seconds
            networkMode: 'online',
          },
        },
      })
  )

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

import { createAuthClient } from "better-auth/react"

export const authClient = createAuthClient({
  // baseURL is optional when running on the same domain
  // Only set it if NEXT_PUBLIC_APP_URL is explicitly provided or in production
  baseURL: process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' && process.env.NODE_ENV === 'production' ? "https://gemai.aniruddhadev.in" : undefined),
})

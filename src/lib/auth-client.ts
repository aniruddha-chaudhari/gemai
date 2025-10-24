import { createAuthClient } from "better-auth/react"

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || (process.env.NODE_ENV === 'production' ? "https://gemai.aniruddhadev.in" : "http://localhost:3000"),
})

'use client'

import { createContext, useContext } from 'react'
import { authClient } from '@/lib/auth-client'
import type { User } from '@/lib/auth'

interface AuthContextType {
  user: User | null
  session: any | null
  isLoading: boolean
  signOut: () => Promise<void>
  signInWithGoogle: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Use Better Auth's built-in useSession hook
  const { data: sessionData, isPending, refetch } = authClient.useSession()

  // Debug: Log auth state changes (remove in production)
  if (process.env.NODE_ENV === 'development') {
    console.log('🔐 Auth State:', {
      isLoading: isPending,
      hasUser: !!sessionData?.user,
      userName: sessionData?.user?.name,
      timestamp: new Date().toISOString()
    })
  }

  const signOut = async () => {
    await authClient.signOut()
    // Session will automatically update via useSession hook
    refetch()
  }

  const signInWithGoogle = async () => {
    await authClient.signIn.social({
      provider: 'google',
      callbackURL: '/',
    })
  }

  return (
    <AuthContext.Provider
      value={{
        user: sessionData?.user ?? null,
        session: sessionData?.session ?? null,
        isLoading: isPending,
        signOut,
        signInWithGoogle,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

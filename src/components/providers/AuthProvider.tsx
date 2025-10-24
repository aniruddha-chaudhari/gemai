'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { authClient } from '@/lib/auth-client'
import type { User, Session } from '@/lib/auth'

interface AuthContextType {
  user: User | null
  session: any | null
  isLoading: boolean
  signOut: () => Promise<void>
  signInWithGoogle: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data } = await authClient.getSession()
        if (data) {
          setUser(data.user)
          setSession(data.session)
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()
  }, [])


  const signOut = async () => {
    await authClient.signOut()
    setUser(null)
    setSession(null)
  }

  const signInWithGoogle = async () => {
    await authClient.signIn.social({
      provider: 'google',
    })
  }


  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
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

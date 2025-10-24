'use client'

import { useState } from 'react'
import { X, Sparkles, User, History } from 'lucide-react'
import { useAuth } from './providers/AuthProvider'

interface LoginPromptModalProps {
  isOpen: boolean
  onClose: () => void
  onLogin: () => void
}

export function LoginPromptModal({ isOpen, onClose, onLogin }: LoginPromptModalProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async () => {
    setIsLoading(true)
    try {
      await onLogin()
      onClose()
    } catch (error) {
      console.error('Login error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-50 dark:bg-[#1E1E1E] rounded-2xl w-full max-w-md p-6 relative border border-gray-200 dark:border-gray-700">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>

        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-linear-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-lg">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Save Your Conversations
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Sign in to save your chat history and access it across devices
          </p>
        </div>

        <div className="space-y-4 mb-6">
          <div className="flex items-center gap-3 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <History className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            <div className="text-sm">
              <div className="font-medium text-gray-900 dark:text-gray-100">Chat History</div>
              <div className="text-gray-500 dark:text-gray-400">Access all your previous conversations</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <User className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            <div className="text-sm">
              <div className="font-medium text-gray-900 dark:text-gray-100">Personalized Experience</div>
              <div className="text-gray-500 dark:text-gray-400">Your preferences and settings saved</div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Signing in...' : 'Continue with Google'}
          </button>
          
          <button
            onClick={onClose}
            className="w-full py-2 px-4 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            Continue without saving
          </button>
        </div>
      </div>
    </div>
  )
}

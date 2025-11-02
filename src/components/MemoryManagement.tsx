'use client'

import { useState, useEffect } from 'react'
import { Trash2, Database, Loader2, AlertCircle } from 'lucide-react'
import { useAuth } from './providers/AuthProvider'

interface Memory {
  id: string
  title?: string | null
  summary?: string | null
  type?: string
  status?: string
  metadata?: any
  updatedAt?: string
  createdAt?: string
  containerTags?: string[]
}

export function MemoryManagement() {
  const { user } = useAuth()
  const [memories, setMemories] = useState<Memory[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      loadMemories()
    }
  }, [user])

  const loadMemories = async () => {
    if (!user) return

    setIsLoading(true)
    setError(null)
    
    try {
      console.log('🔵 Loading memories for user:', user.id)
      
      const response = await fetch('/api/memory/list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id }),
      })

      const data = await response.json()
      
      console.log('📦 API Response:', data)
      console.log('📊 Response status:', response.status)
      console.log('✅ Response OK:', response.ok)

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load memories')
      }

      // Handle the response - it could be an array or an object with memories property
      const memoriesData = Array.isArray(data.memories) ? data.memories : []
      console.log('💾 Memories data:', memoriesData)
      console.log('📈 Memories count:', memoriesData.length)
      
      setMemories(memoriesData)
    } catch (err) {
      console.error('❌ Error loading memories:', err)
      setError(err instanceof Error ? err.message : 'Failed to load memories')
    } finally {
      setIsLoading(false)
    }
  }

  const deleteMemory = async (memoryId: string) => {
    if (!user) return

    setIsDeleting(memoryId)
    setError(null)

    try {
      const response = await fetch('/api/memory/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ memoryId, userId: user.id }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete memory')
      }

      // Remove from local state
      setMemories(prev => prev.filter(m => m.id !== memoryId))
    } catch (err) {
      console.error('Error deleting memory:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete memory')
    } finally {
      setIsDeleting(null)
    }
  }

  const deleteAllMemories = async () => {
    if (!user) return
    
    const confirmed = window.confirm(
      'Are you sure you want to delete all your memories? This action cannot be undone.'
    )
    
    if (!confirmed) return

    setIsDeleting('all')
    setError(null)

    try {
      const response = await fetch('/api/memory/bulk-delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete all memories')
      }

      // Clear local state
      setMemories([])
    } catch (err) {
      console.error('Error deleting all memories:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete all memories')
    } finally {
      setIsDeleting(null)
    }
  }

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">
          Please sign in to view your memories
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Your Memories ({memories.length})
          </h3>
        </div>
        {memories.length > 0 && (
          <button
            onClick={deleteAllMemories}
            disabled={isDeleting === 'all'}
            className="text-xs text-red-600 dark:text-red-400 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting === 'all' ? 'Deleting...' : 'Delete All'}
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
        </div>
      ) : memories.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No memories stored yet. Start chatting to create memories!
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {memories.map((memory) => (
            <div
              key={memory.id}
              className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-300 dark:border-gray-600 hover:border-teal-400 dark:hover:border-teal-500 transition-colors shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  {memory.title && (
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
                      {memory.title}
                    </p>
                  )}
                  {memory.summary && (
                    <p className="text-sm text-gray-800 dark:text-gray-200 wrap-break-word leading-relaxed">
                      {memory.summary}
                    </p>
                  )}
                  {!memory.title && !memory.summary && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                      Memory (ID: {memory.id.substring(0, 8)}...)
                    </p>
                  )}
                  {memory.updatedAt && (
                    <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                      {new Date(memory.updatedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => deleteMemory(memory.id)}
                  disabled={isDeleting === memory.id}
                  className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                  title="Delete memory"
                >
                  {isDeleting === memory.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={loadMemories}
        disabled={isLoading}
        className="w-full text-sm text-teal-600 dark:text-teal-400 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Loading...' : 'Refresh Memories'}
      </button>
    </div>
  )
}

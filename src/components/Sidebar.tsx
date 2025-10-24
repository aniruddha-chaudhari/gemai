'use client'

import { Search, Plus, Sparkles, MessageSquare, Settings, ChevronDown, ChevronRight, LogIn, LogOut, User, RefreshCw } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAuth } from './providers/AuthProvider'
import { LoginModal } from './LoginModal'

interface SidebarProps {
  isDarkMode: boolean
  currentChatId: string | null
  onNewChat: () => void
  onSelectChat: (id: string) => void
  onOpenSettings: () => void
}

export function Sidebar({ isDarkMode, currentChatId, onNewChat, onSelectChat, onOpenSettings }: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedSection, setExpandedSection] = useState<string | null>(null)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [recentChats, setRecentChats] = useState<Array<{ id: string; title: string; date: string; preview: string }>>([])
  const [loadingChats, setLoadingChats] = useState(false)

  const { user, signOut, isLoading } = useAuth()

  // Function to fetch chat history
  const fetchChatHistory = async () => {
    if (user) {
      setLoadingChats(true)
      try {
        const response = await fetch(`/api/chat/history?userId=${user.id}`)
        const data = await response.json()
        if (data.chats) {
          setRecentChats(data.chats)
        }
      } catch (error) {
        console.error('Error fetching chat history:', error)
      } finally {
        setLoadingChats(false)
      }
    } else {
      setRecentChats([])
    }
  }

  // Fetch chat history when user is logged in
  useEffect(() => {
    fetchChatHistory()
  }, [user])

  // Refresh chat history when currentChatId changes (new chat created)
  useEffect(() => {
    if (currentChatId && user) {
      // Small delay to ensure the chat is saved before refreshing
      const timeout = setTimeout(() => {
        fetchChatHistory()
      }, 1000)
      
      return () => clearTimeout(timeout)
    }
  }, [currentChatId, user])

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section)
  }

  return (
    <aside className="w-64 shrink-0 border-r border-gray-200/50 dark:border-gray-800/50 bg-white dark:bg-[#171717] transition-colors duration-300 h-screen">
      <div className="flex flex-col h-full">
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-linear-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Gem AI</h1>
          </div>

          <button
            onClick={onNewChat}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 group"
          >
            <Plus className="w-4 h-4 text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-100 group-hover:scale-110 transition-all" />
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">New chat</span>
          </button>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chats"
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
            />
          </div>

        </div>

        <div className="flex-1 overflow-y-auto px-4 space-y-6 pb-4">


          <div>
            <div className="flex items-center justify-between">
              <button
                onClick={() => toggleSection('recent')}
                className="flex items-center justify-between px-2 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                <span>Chats</span>
                {expandedSection === 'recent' ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
                )}
              </button>
              <button
                onClick={fetchChatHistory}
                disabled={loadingChats}
                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                title="Refresh chats"
              >
                <RefreshCw className={`w-3 h-3 text-gray-400 ${loadingChats ? 'animate-spin' : ''}`} />
              </button>
            </div>
            {expandedSection === 'recent' && (
              <div className="mt-2 space-y-1 animate-in slide-in-from-top duration-200">
                {loadingChats ? (
                  <div className="px-3 py-4 text-center">
                    <div className="text-sm text-gray-500 dark:text-gray-400">Loading chats...</div>
                  </div>
                ) : recentChats.length === 0 ? (
                  <div className="px-3 py-4 text-center">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">No chats yet</div>
                    <div className="text-xs text-gray-400 dark:text-gray-500">Start a new conversation to see your chats here</div>
                  </div>
                ) : (
                  recentChats.map((chat) => (
                    <button
                      key={chat.id}
                      onClick={() => onSelectChat(chat.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 group ${
                        currentChatId === chat.id ? 'bg-gray-100 dark:bg-gray-700' : ''
                      }`}
                    >
                      <MessageSquare className="w-4 h-4 text-gray-600 dark:text-gray-400 shrink-0" />
                      <div className="flex-1 text-left min-w-0">
                        <div className="text-sm text-gray-900 dark:text-gray-100 truncate">{chat.title}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-500">
                          {new Date(chat.date).toLocaleDateString()}
                        </div>
                        {chat.preview && (
                          <div className="text-xs text-gray-400 dark:text-gray-500 truncate mt-1">
                            {chat.preview}
                          </div>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-gray-200/50 dark:border-gray-800/50">
          {user ? (
            <div className="space-y-2">
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gray-100 dark:bg-gray-700">
                <div className="w-7 h-7 rounded-full bg-linear-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white text-xs font-semibold">
                  {user.name ? user.name[0].toUpperCase() : user.email[0].toUpperCase()}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {user.name || user.email}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Signed in</div>
                </div>
              </div>
              
              <div>
                {/* Settings button hidden for now */}
                {/* <button
                  onClick={onOpenSettings}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 group"
                >
                  <Settings className="w-4 h-4 text-gray-400 group-hover:rotate-90 transition-transform duration-300" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Settings</span>
                </button> */}
                
                <button
                  onClick={signOut}
                  className="w-full flex items-center justify-start gap-2 px-4 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 group"
                >
                  <LogOut className="w-4 h-4 text-gray-400 group-hover:text-red-500 transition-colors" />
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Sign out</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-center py-4">
                <User className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                  Get your chat history
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                  Sign in to save and access your conversations across devices
                </p>
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  Sign in
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
      />
    </aside>
  )
}
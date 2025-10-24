'use client'

import { useState, useEffect } from 'react'
import { Sidebar } from './Sidebar'
import { ChatView } from './ChatView'
import { SettingsModal } from './SettingsModal'
import { AuthProvider } from './providers/AuthProvider'
import { useAuth } from './providers/AuthProvider'

function AppContent() {
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [currentChatId, setCurrentChatId] = useState<string | null>('default')
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [chatMessages, setChatMessages] = useState<any[]>([])
  const [isLoadingChat, setIsLoadingChat] = useState(false)
  const [hasUserLoggedIn, setHasUserLoggedIn] = useState(false)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const { user } = useAuth()

  // Load chat messages when a chat is selected
  const loadChat = async (chatId: string) => {
    if (!user) {
      // For non-authenticated users, clear messages (no chat history)
      setChatMessages([])
      return
    }

    setIsLoadingChat(true)
    try {
      const response = await fetch(`/api/chat/load?chatId=${chatId}&userId=${user.id}`)
      
      if (response.status === 404) {
        // Chat not found, clear messages
        setChatMessages([])
        return
      }
      
      const data = await response.json()
      
      if (data.chat && data.chat.messages) {
        setChatMessages(data.chat.messages)
      } else {
        setChatMessages([])
      }
    } catch (error) {
      console.error('Error loading chat:', error)
      setChatMessages([])
    } finally {
      setIsLoadingChat(false)
    }
  }

  // Load chat when currentChatId changes
  useEffect(() => {
    if (currentChatId) {
      loadChat(currentChatId)
    }
  }, [currentChatId, user])

  // Handle user login - create new chat when user logs in
  useEffect(() => {
    if (isInitialLoad) {
      // On initial load, don't create a new chat if user is already logged in
      setIsInitialLoad(false)
      if (user) {
        setHasUserLoggedIn(true)
      }
      return
    }

    if (user && !hasUserLoggedIn) {
      // User just logged in, create a new chat
      const newChatId = `chat-${Date.now()}`
      setCurrentChatId(newChatId)
      setChatMessages([])
      setHasUserLoggedIn(true)
    } else if (!user && hasUserLoggedIn) {
      // User logged out, reset the flag
      setHasUserLoggedIn(false)
    }
  }, [user, hasUserLoggedIn, isInitialLoad])

  const handleSelectChat = (id: string) => {
    setCurrentChatId(id)
  }

  const handleNewChat = () => {
    const newChatId = `chat-${Date.now()}`
    setCurrentChatId(newChatId)
    setChatMessages([])
    // Force clear messages by setting them to empty array
    setTimeout(() => {
      setChatMessages([])
    }, 100)
  }

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <div className="flex h-screen bg-gray-50 dark:bg-[#1E1E1E] transition-colors duration-300">
        {/* Desktop sidebar with smooth animation */}
        <div className={`hidden lg:block transition-all duration-300 ease-in-out h-screen ${
          isSidebarOpen ? 'w-64 opacity-100' : 'w-0 opacity-0 overflow-hidden'
        }`}>
          <Sidebar
            isDarkMode={isDarkMode}
            currentChatId={currentChatId}
            onNewChat={handleNewChat}
            onSelectChat={handleSelectChat}
            onOpenSettings={() => setShowSettings(true)}
          />
        </div>
        
        {/* Mobile sidebar overlay with smooth slide animation */}
        <div className={`lg:hidden fixed inset-0 z-50 transition-all duration-300 ease-in-out ${
          isSidebarOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}>
          <div 
            className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${
              isSidebarOpen ? 'opacity-100' : 'opacity-0'
            }`}
            onClick={() => setIsSidebarOpen(false)} 
          />
          <div className={`relative z-10 h-screen transform transition-transform duration-300 ease-in-out ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}>
            <Sidebar
              isDarkMode={isDarkMode}
              currentChatId={currentChatId}
              onNewChat={() => {
                handleNewChat()
                setIsSidebarOpen(false)
              }}
              onSelectChat={(id) => {
                handleSelectChat(id)
                setIsSidebarOpen(false)
              }}
              onOpenSettings={() => {
                setShowSettings(true)
                setIsSidebarOpen(false)
              }}
            />
          </div>
        </div>

        <ChatView
          key={currentChatId}
          isDarkMode={isDarkMode}
          currentChatId={currentChatId}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onCollapseSidebar={() => setIsSidebarOpen(false)}
          initialMessages={chatMessages}
          isLoadingChat={isLoadingChat}
        />

        {showSettings && (
          <SettingsModal
            isDarkMode={isDarkMode}
            onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
            onClose={() => setShowSettings(false)}
          />
        )}
      </div>
    </div>
  )
}

export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

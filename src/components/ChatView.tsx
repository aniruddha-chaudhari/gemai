'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { ArrowUp, Sparkles, Bot, User, Loader2, Menu, Upload, Search, X } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import MarkdownMessage from './MarkdownMessage'
import { useAuth } from './providers/AuthProvider'
import { LoginPromptModal } from './LoginPromptModal'

interface ChatViewProps {
  isDarkMode: boolean
  currentChatId: string | null
  isSidebarOpen: boolean
  onToggleSidebar: () => void
  onCollapseSidebar: () => void
  initialMessages?: any[]
  isLoadingChat?: boolean
}

export function ChatView({ isDarkMode, currentChatId, isSidebarOpen, onToggleSidebar, onCollapseSidebar, initialMessages = [], isLoadingChat = false }: ChatViewProps) {
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [enableSearch, setEnableSearch] = useState(false)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [messageCount, setMessageCount] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { user, signInWithGoogle } = useAuth()

  const { messages, sendMessage, status, stop, regenerate, error, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: {
        chatId: currentChatId || 'default',
        enableSearch,
        userId: user?.id,
      },
    }),
    onFinish: async () => {
      setIsLoading(false)
      // Note: Messages are now saved in the main chat route, not here
    },
    onError: (error) => {
      console.error('Chat error:', error)
      setIsLoading(false)
    },
  })

  const isStreaming = status === 'streaming' || status === 'submitted'

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Track message count and show login prompt after 3 messages
  useEffect(() => {
    if (!user && messages.length > 0) {
      const userMessages = messages.filter(msg => msg.role === 'user')
      setMessageCount(userMessages.length)
      
      // Show login prompt after 3 user messages
      if (userMessages.length === 3 && !showLoginPrompt) {
        setShowLoginPrompt(true)
      }
    }
  }, [messages, user, showLoginPrompt])

  // Update messages when initialMessages change (when loading a different chat)
  useEffect(() => {
    if (initialMessages.length > 0) {
      setMessages(initialMessages)
    } else {
      // Clear messages for new chats or when no messages
      setMessages([])
    }
  }, [initialMessages, setMessages])

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setUploadedFiles(prev => [...prev, ...files])
  }

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (inputValue.trim() || uploadedFiles.length > 0) {
      setIsLoading(true)
      
      // Don't save user message here - let onFinish handle all message saving
      
      // Create message content with text and files
      const content = []
      
      if (inputValue.trim()) {
        content.push({ type: 'text', text: inputValue })
      }
      
      // Add files to content
      for (const file of uploadedFiles) {
        content.push({
          type: 'file',
          data: file,
          mediaType: file.type,
        })
      }
      
      // Save user message to database immediately (only if user is authenticated)
      if (user && currentChatId && inputValue.trim()) {
        try {
          // Ensure chat exists
          await fetch('/api/chat/save', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              chatId: currentChatId,
              messages: [{
                id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                role: 'user',
                parts: [{ type: 'text', text: inputValue }]
              }],
              userId: user.id,
            }),
          })
        } catch (error) {
          console.error('Error saving user message:', error)
        }
      }

      if (uploadedFiles.length > 0) {
        // Convert files to base64 for server processing
        const filePromises = uploadedFiles.map(async (file) => {
          const arrayBuffer = await file.arrayBuffer()
          const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))
          return {
            type: 'file' as const,
            data: `data:${file.type};base64,${base64}`,
            mediaType: file.type,
            url: `data:${file.type};base64,${base64}`,
          }
        })
        
        const fileParts = await Promise.all(filePromises)
        
        const message = {
          role: 'user' as const,
          parts: [
            ...(inputValue.trim() ? [{ type: 'text' as const, text: inputValue }] : []),
            ...fileParts
          ]
        }
        
        sendMessage(message)
      } else {
        // Send regular text message
        sendMessage({ text: inputValue })
      }
      
      setInputValue('')
      setUploadedFiles([])
      // Auto-collapse sidebar when user sends a message
      onCollapseSidebar()
    }
  }

  const suggestions = [
    {
      title: 'Create a visual design',
      description: 'For a website homepage',
      icon: '🎨',
    },
    {
      title: 'Help me plan',
      description: 'A relaxing weekend getaway',
      icon: '✈️',
    },
    {
      title: 'Write a poem',
      description: 'About spring and renewal',
      icon: '📝',
    },
    {
      title: 'Explain a concept',
      description: 'Like quantum computing',
      icon: '🔬',
    },
  ]

  return (
    <div className="flex-1 flex flex-col">
      <header className="flex items-center justify-between px-4 lg:px-6 py-4 border-b border-gray-200/50 dark:border-gray-800/50">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 group"
            title={isSidebarOpen ? "Hide sidebar" : "Show sidebar"}
          >
            <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors" />
          </button>
        </div>

      </header>

      <main className="flex-1 overflow-y-auto">
        {isLoadingChat ? (
          <div className="h-full flex flex-col items-center justify-center px-4 lg:px-6">
            <div className="text-center space-y-4">
              <Loader2 className="w-8 h-8 text-teal-600 animate-spin mx-auto" />
              <div className="text-sm text-gray-500 dark:text-gray-400">Loading conversation...</div>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center px-4 lg:px-6">
            <div className="max-w-3xl w-full space-y-8 lg:space-y-12">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 lg:w-20 lg:h-20 mx-auto rounded-2xl bg-linear-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-teal-500/25">
                  <Sparkles className="w-8 h-8 lg:w-10 lg:h-10 text-white" />
                </div>
                <h1 className="text-2xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100">
                  What can I help with?
                </h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm lg:text-lg">
                  Choose a suggestion below or start typing your own message
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setInputValue(suggestion.title)
                      onCollapseSidebar()
                    }}
                    className="p-4 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-teal-500 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 text-left group hover:shadow-lg hover:shadow-teal-500/20 dark:hover:shadow-teal-500/20"
                  >
                    <div className="text-2xl mb-2">{suggestion.icon}</div>
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                      {suggestion.title}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {suggestion.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto px-4 lg:px-6 py-6 lg:py-8 space-y-4 lg:space-y-6">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Bot className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h2 className="text-2xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
                    Welcome to Gemini AI Chat
                  </h2>
                  <p className="text-gray-500 dark:text-gray-500">
                    Start a conversation by typing a message below
                  </p>
                </div>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={message.id}
                  className={`flex gap-4 animate-in slide-in-from-bottom duration-200 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div
                    className={`flex gap-3 lg:gap-4 max-w-[85%] lg:max-w-[80%] ${
                      message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-linear-to-br from-teal-500 to-emerald-600 text-white'
                      }`}
                    >
                      {message.role === 'user' ? (
                        <User className="w-4 h-4" />
                      ) : (
                        <Bot className="w-4 h-4" />
                      )}
                    </div>
                    <div
                      className={`px-4 py-3 rounded-2xl ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                      }`}
                    >
                      {message.role === 'user' ? (
                        <p className="whitespace-pre-wrap leading-relaxed">
                          {message.parts.map((part, index) => {
                            if (part.type === 'text') {
                              return <span key={index}>{part.text}</span>
                            }
                            return null
                          })}
                        </p>
                      ) : (
                        <div>
                          <MarkdownMessage 
                            content={message.parts
                              .filter(part => part.type === 'text')
                              .map(part => part.text)
                              .join('')
                            } 
                          />
                          {status === 'ready' && message.role === 'assistant' && (
                            <div className="mt-2 flex gap-2">
                              <button
                                onClick={() => regenerate()}
                                className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-400 rounded-lg transition-colors"
                                title="Regenerate response"
                              >
                                Regenerate
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
            
            {isStreaming && (
              <div className="flex gap-4 justify-start animate-in slide-in-from-bottom duration-200">
                <div className="flex gap-4 max-w-[80%]">
                  <div className="w-8 h-8 rounded-full bg-linear-to-br from-teal-500 to-emerald-600 text-white flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-gray-100 dark:bg-gray-800 px-4 py-3 rounded-2xl">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {status === 'submitted' 
                          ? (enableSearch ? 'Searching and thinking...' : 'Thinking...')
                          : (enableSearch ? 'Searching and responding...' : 'Responding...')
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="flex gap-4 justify-start animate-in slide-in-from-bottom duration-200">
                <div className="flex gap-4 max-w-[80%]">
                  <div className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center shrink-0">
                    <X className="w-4 h-4" />
                  </div>
                  <div className="bg-red-50 dark:bg-red-900/20 px-4 py-3 rounded-2xl border border-red-200 dark:border-red-800">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm text-red-600 dark:text-red-400">
                        Something went wrong. Please try again.
                      </span>
                      <button
                        onClick={() => regenerate()}
                        className="px-3 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                      >
                        Retry
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      <footer className="border-t border-gray-200/50 dark:border-gray-800/50 p-4 lg:p-6">
        <div className="max-w-3xl mx-auto">
          {/* File upload area */}
          {uploadedFiles.length > 0 && (
            <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex flex-wrap gap-2">
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-700">
                    <span className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-32">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                    >
                      <X className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="relative">
            <div className="relative rounded-2xl lg:rounded-3xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg shadow-teal-500/20 dark:shadow-teal-500/20 focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/20 transition-all duration-200">

              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Message ChatGPT"
                className="w-full pl-4 lg:pl-6 pr-32 lg:pr-36 py-3 lg:py-4 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none text-sm lg:text-base"
                disabled={isStreaming}
              />

              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 lg:gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  accept=".pdf,.txt,.doc,.docx,.jpg,.jpeg,.png,.gif,.mp4,.mp3,.wav"
                />
                
                <button
                  type="button"
                  onClick={() => setEnableSearch(!enableSearch)}
                  className={`p-1.5 lg:p-2 rounded-lg transition-all duration-200 group relative ${
                    enableSearch 
                      ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400' 
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400'
                  }`}
                  title={enableSearch ? "Disable web search" : "Enable web search"}
                >
                  <Search className="w-4 h-4 lg:w-5 lg:h-5" />
                  {enableSearch && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-teal-500 rounded-full animate-pulse" />
                  )}
                </button>
                
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isStreaming}
                  className="p-1.5 lg:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Upload files"
                >
                  <Upload className="w-4 h-4 lg:w-5 lg:h-5 text-gray-500 dark:text-gray-400" />
                </button>

                {isStreaming ? (
                  <button
                    type="button"
                    onClick={stop}
                    className="p-1.5 lg:p-2 rounded-lg bg-red-600 dark:bg-red-500 text-white hover:bg-red-700 dark:hover:bg-red-600 transition-all duration-200 hover:scale-105"
                    title="Stop generation"
                  >
                    <X className="w-4 h-4 lg:w-5 lg:h-5" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={(!inputValue.trim() && uploadedFiles.length === 0) || status !== 'ready'}
                    className="p-1.5 lg:p-2 rounded-lg bg-teal-600 dark:bg-teal-500 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-teal-700 dark:hover:bg-teal-600 transition-all duration-200 hover:scale-105 disabled:hover:scale-100"
                    title="Send message"
                  >
                    <ArrowUp className="w-4 h-4 lg:w-5 lg:h-5" />
                  </button>
                )}
              </div>
            </div>
          </form>

      
        </div>
      </footer>

      <LoginPromptModal 
        isOpen={showLoginPrompt} 
        onClose={() => setShowLoginPrompt(false)}
        onLogin={signInWithGoogle}
      />
    </div>
  )
}

'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { ArrowUp, Sparkles, Bot, User, Loader2, Menu, Upload, Search, X, Shapes } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import MarkdownMessage from './MarkdownMessage'
import { useAuth } from './providers/AuthProvider'
import { LoginPromptModal } from './LoginPromptModal'

type ToolMode = 'chat' | 'mermaid' | 'markmap'

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
  const [toolMode, setToolMode] = useState<ToolMode>('chat')
  const [showToolsMenu, setShowToolsMenu] = useState(false)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [messageCount, setMessageCount] = useState(0)
  const [isAutoRegenerating, setIsAutoRegenerating] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const toolsMenuRef = useRef<HTMLDivElement>(null)
  const hasAutoRegeneratedRef = useRef(false)
  const autoRegenerationCountRef = useRef(0)
  const sendMessageRef = useRef<((message: any) => void) | null>(null)
  const MAX_AUTO_REGENERATIONS = 2
  
  // Use refs to keep track of dynamic values
  const enableSearchRef = useRef(enableSearch)
  const currentChatIdRef = useRef(currentChatId)
  const { user, signInWithGoogle } = useAuth()
  const userIdRef = useRef(user?.id)
  const toolModeRef = useRef(toolMode)
  
  // Update refs when values change
  enableSearchRef.current = enableSearch
  currentChatIdRef.current = currentChatId
  userIdRef.current = user?.id
  toolModeRef.current = toolMode

  const { messages, sendMessage, status, stop, regenerate, error, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: () => ({
        chatId: currentChatIdRef.current || 'default',
        enableSearch: toolModeRef.current === 'chat' ? enableSearchRef.current : false,
        userId: userIdRef.current,
        toolMode: toolModeRef.current,
      }),
    }),
    onFinish: async (message) => {
      setIsLoading(false)
      // Note: Messages are now saved in the main chat route, not here
    },
    onError: (error) => {
      console.error('❌ Chat error:', error)
      setIsLoading(false)
    },
  })
  
  // Update sendMessage ref when it changes
  useEffect(() => {
    sendMessageRef.current = sendMessage
  }, [sendMessage])

  // Close tools menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (toolsMenuRef.current && !toolsMenuRef.current.contains(event.target as Node)) {
        setShowToolsMenu(false)
      }
    }

    if (showToolsMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showToolsMenu])
  
  // Handle diagram errors by automatically regenerating
  const handleDiagramError = (error: string, code: string) => {
    // Limit auto-regenerations to prevent infinite loops - STRICT LIMIT OF 2
    if (autoRegenerationCountRef.current >= MAX_AUTO_REGENERATIONS) {
      console.log(`⏭️ Max auto-regenerations (${MAX_AUTO_REGENERATIONS}) reached. Stopping to prevent infinite loop.`, {
        currentCount: autoRegenerationCountRef.current,
        maxAllowed: MAX_AUTO_REGENERATIONS
      })
      // Show a message that max attempts were reached
      setTimeout(() => {
        if (sendMessageRef.current) {
          sendMessageRef.current({
            parts: [{ 
              type: 'text', 
              text: `⚠️ Maximum auto-regeneration attempts (${MAX_AUTO_REGENERATIONS}) reached. The diagram still has syntax errors. Please manually review the error message and regenerate if needed.` 
            }]
          })
        }
      }, 1000)
      return
    }
    
    // Only auto-regenerate once per response to avoid infinite loops
    if (hasAutoRegeneratedRef.current || isAutoRegenerating) {
      console.log('⏭️ Skipping auto-regeneration (already attempted for this response)')
      return
    }
    
    console.log('🔄 Auto-regenerating diagram due to error:', error, {
      attemptNumber: autoRegenerationCountRef.current + 1,
      maxAllowed: MAX_AUTO_REGENERATIONS
    })
    hasAutoRegeneratedRef.current = true
    setIsAutoRegenerating(true)
    autoRegenerationCountRef.current += 1
    
    // Send an automatic fix message with clear examples
    setTimeout(() => {
      const diagramType = toolMode === 'mermaid' ? 'Mermaid diagram' : 'mind map'
      
      // Extract specific error guidance based on the actual error
      let specificFix = ''
      
      // Check for incomplete node definition (missing closing bracket)
      // This catches errors like "Expecting ... got '1'" which often means incomplete bracket
      if ((error.includes('Expecting ') && error.includes('[')) ||
          (error.includes("got '1'") && error.includes('[')) ||
          (error.includes("got '2'") && error.includes('[')) ||
          (error.includes("got '3'") && error.includes('['))) {
        specificFix = `

SPECIFIC ERROR: Incomplete node definition!
You started a node with [ but didn't close it with ]

❌ WRONG: 
StreamSvc[Streaming
AuthSvc[Authentication
CDNSvc[Content

(incomplete - missing the closing bracket and text)

✅ CORRECT: 
StreamSvc[Streaming Service]
AuthSvc[Authentication Service]
CDNSvc[Content Delivery Network]

Every node MUST be complete on one line:
NodeID[Complete Node Text Here]

⚠️ CRITICAL: Finish writing the entire node text AND close the bracket ] on the SAME line before moving to the next line!`
      }
      // Check for node IDs starting with numbers (when it's NOT about incomplete brackets)
      else if ((error.includes("got '1'") || error.includes("got '2'") || error.includes("got '3'")) && 
               !error.includes('[') && !error.includes('Parse error')) {
        specificFix = `

SPECIFIC ERROR: Node ID starts with a number!
❌ WRONG: 1Client, 2API, 3Database, 1UserDevice
✅ CORRECT: Client, API, Database, UserDevice
✅ CORRECT: step1, step2, step3
✅ CORRECT: A, B, C, D

Example of CORRECT syntax:
\`\`\`mermaid
graph TD
    Client[User Device Client]
    API[API Gateway]
    Auth[Auth Service]
    Music[Music Service]
    
    Client --> API
    API --> Auth
    API --> Music
\`\`\`

DO NOT use: 1Client, 2API, 3Auth - This causes parse errors!
USE: Client, API, Auth OR step1, step2, step3`
      }
      // Check for parentheses in text
      else if (error.includes("got 'PS'") || error.includes('parenthes')) {
        specificFix = `

SPECIFIC ERROR: Parentheses in node text!
❌ WRONG: A[User (Client)]
✅ CORRECT: A[User Client]

Remove ALL parentheses from inside square brackets.`
      }
      // Check for comments in wrong place
      else if (error.includes("got 'NODE_STRING'") && code.includes('%')) {
        specificFix = `

SPECIFIC ERROR: Comment placement error!
Comments (%) must be on their own line, not after node definitions.

❌ WRONG: 
CDNSvc[Content Network] % This is a comment

✅ CORRECT: 
%% This is a comment
CDNSvc[Content Network]

Move all comments to separate lines or remove them.`
      }
      
      const attemptInfo = autoRegenerationCountRef.current > 0 
        ? `\n\n⚠️ AUTO-REGENERATION ATTEMPT ${autoRegenerationCountRef.current} of ${MAX_AUTO_REGENERATIONS}`
        : `\n\n⚠️ AUTO-REGENERATION ATTEMPT 1 of ${MAX_AUTO_REGENERATIONS}`
      
      const fixMessage = `STOP! The ${diagramType} has a critical syntax error.${attemptInfo}

ERROR: "${error}"${specificFix}

MANDATORY RULES - READ CAREFULLY:
1. Every node MUST be complete: NodeID[Text] - NO unclosed brackets!
2. Node IDs MUST start with LETTERS (Client, API, step1) - NEVER numbers (1A, 2B)!
3. NO parentheses () anywhere in node text!
4. Comments %% must be on separate lines
5. One complete node definition per line

THINK STEP BY STEP:
Step 1: Plan your node IDs - make sure they ALL start with letters
Step 2: Write each node COMPLETELY on one line
Step 3: Check for parentheses () - REMOVE ALL OF THEM
Step 4: Verify every bracket [ has a matching ]
Step 5: Only THEN generate the output

Generate a SIMPLE, COMPLETE, WORKING diagram. Quality over quantity!`
      
      if (sendMessageRef.current) {
        sendMessageRef.current({
          parts: [{ type: 'text', text: fixMessage }]
        })
      }
      
      setIsAutoRegenerating(false)
    }, 500)
  }

  const isStreaming = status === 'streaming' || status === 'submitted'

  const scrollToBottom = (instant = false) => {
    messagesEndRef.current?.scrollIntoView({ behavior: instant ? 'auto' : 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Reset auto-regeneration flag when streaming completes
  useEffect(() => {
    if (status === 'ready') {
      // Small delay to ensure the last message is fully rendered
      setTimeout(() => {
        hasAutoRegeneratedRef.current = false
        // Don't reset count here - it should persist until chat/mode change
      }, 1000)
    }
  }, [status])

  // Reset auto-regeneration count when starting a new chat or changing tool mode
  useEffect(() => {
    console.log('🔄 Resetting auto-regeneration count', { currentChatId, toolMode })
    autoRegenerationCountRef.current = 0
    hasAutoRegeneratedRef.current = false
  }, [currentChatId, toolMode])

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
    } else if (currentChatId === null) {
      // Only clear messages when explicitly starting a new chat (no chatId)
      setMessages([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMessages])

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setUploadedFiles(prev => [...prev, ...files])
  }

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Prevent double submission
    if (isStreaming || status !== 'ready') {
      return
    }
    
    if (inputValue.trim() || uploadedFiles.length > 0) {
      
      // Capture values before clearing
      const messageText = inputValue.trim()
      const filesToUpload = [...uploadedFiles]
      
      // Clear input immediately to prevent double submission
      setInputValue('')
      setUploadedFiles([])
      setIsLoading(true)
      
      // Save user message to database in the BACKGROUND (non-blocking)
      // Don't await this - let it happen asynchronously
      if (user && currentChatId && messageText) {
        fetch('/api/chat/save', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chatId: currentChatId,
            messages: [{
              id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              role: 'user',
              parts: [{ type: 'text', text: messageText }]
            }],
            userId: user.id,
          }),
        })
        .then(async response => {
          if (!response.ok) {
            const error = await response.text()
            console.error('❌ Failed to save user message:', error)
          } else {
            console.log('💾 User message saved successfully')
          }
        })
        .catch(error => console.error('❌ Error saving user message:', error))
      }

      // Send message immediately without waiting for database save
      if (filesToUpload.length > 0) {
        console.log('📎 Processing files:', filesToUpload.length)
        // Convert files to base64 for server processing
        const filePromises = filesToUpload.map(async (file) => {
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
            ...(messageText ? [{ type: 'text' as const, text: messageText }] : []),
            ...fileParts
          ]
        }
        
        sendMessage(message)
      } else {
        // Send regular text message
        sendMessage({ text: messageText })
      }
      
      // Scroll to bottom immediately (instant, no animation)
      setTimeout(() => scrollToBottom(true), 50)
      
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
                  key={`${message.id}-${index}`}
                  className={`flex gap-4 animate-in slide-in-from-bottom duration-200 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div
                    className={`flex gap-3 lg:gap-4 ${
                      message.role === 'user' 
                        ? 'flex-row-reverse max-w-[85%] lg:max-w-[70%]' 
                        : 'flex-row w-full'
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
                      className={`rounded-2xl ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white px-4 py-3'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-4 py-3 flex-1'
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
                          {(() => {
                            const textContent = message.parts
                              .filter(part => part.type === 'text')
                              .map(part => part.text)
                              .join('')
                            
                            // Debug: Log message structure
                            if (message.parts.length === 0) {
                              console.log('⚠️ Message has no parts:', message)
                            }
                            
                            if (textContent) {
                              return <MarkdownMessage content={textContent} onDiagramError={handleDiagramError} />
                            } else {
                              // Message only has tool calls, no text
                              return (
                                <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                                  Processing...
                                </p>
                              )
                            }
                          })()}
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
            
            {isStreaming && messages.length > 0 && messages[messages.length - 1].role !== 'assistant' && (
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

              {/* Tools button - left side */}
              <div className="absolute left-2 top-1/2 -translate-y-1/2">
                <div className="relative" ref={toolsMenuRef}>
                  <button
                    type="button"
                    onClick={() => setShowToolsMenu(!showToolsMenu)}
                    className={`p-1.5 lg:p-2 rounded-lg transition-all duration-200 group relative ${
                      toolMode !== 'chat'
                        ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400'
                    }`}
                    title="Tools"
                  >
                    <Shapes className="w-4 h-4 lg:w-5 lg:h-5" />
                    {toolMode !== 'chat' && (
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                    )}
                  </button>

                  {/* Tools dropdown menu */}
                  {showToolsMenu && (
                    <div className="absolute left-0 bottom-full mb-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden z-50">
                      <button
                        type="button"
                        onClick={() => {
                          console.log('🔧 Tool mode: Chat')
                          setToolMode('chat')
                          setShowToolsMenu(false)
                        }}
                        className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 transition-colors ${
                          toolMode === 'chat'
                            ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <span className="text-lg">💬</span>
                        <div>
                          <div className="font-medium">Chat</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Normal conversation</div>
                        </div>
                      </button>
                      {/* Mermaid Diagrams option - commented out
                      <button
                        type="button"
                        onClick={() => {
                          console.log('📊 Tool mode: Mermaid Diagrams')
                          setToolMode('mermaid')
                          setShowToolsMenu(false)
                        }}
                        className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 transition-colors ${
                          toolMode === 'mermaid'
                            ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <span className="text-lg">📊</span>
                        <div>
                          <div className="font-medium">Diagrams</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Flowcharts, sequences, etc.</div>
                        </div>
                      </button>
                      */}
                      <button
                        type="button"
                        onClick={() => {
                          console.log('🧠 Tool mode: Markmap Mind Maps')
                          setToolMode('markmap')
                          setShowToolsMenu(false)
                        }}
                        className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 transition-colors ${
                          toolMode === 'markmap'
                            ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <span className="text-lg">🧠</span>
                        <div>
                          <div className="font-medium">Mind Maps</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Interactive mind maps</div>
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={
                  isStreaming 
                    ? "Processing..." 
                    : toolMode === 'mermaid' 
                    ? "Describe a diagram (flowchart, sequence, etc.)"
                    : toolMode === 'markmap'
                    ? "Describe a mind map structure"
                    : "Message ChatGPT"
                }
                className="w-full pl-12 lg:pl-14 pr-32 lg:pr-36 py-3 lg:py-4 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none text-sm lg:text-base disabled:opacity-50"
                disabled={isStreaming || status !== 'ready'}
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
                
                {/* Search button - only in chat mode */}
                {toolMode === 'chat' && (
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
                )}
                
                {/* File upload - only in chat mode */}
                {toolMode === 'chat' && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isStreaming}
                    className="p-1.5 lg:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Upload files"
                  >
                    <Upload className="w-4 h-4 lg:w-5 lg:h-5 text-gray-500 dark:text-gray-400" />
                  </button>
                )}

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
                    disabled={(!inputValue.trim() && uploadedFiles.length === 0) || status !== 'ready' || isStreaming}
                    className={`p-1.5 lg:p-2 rounded-lg text-white transition-all duration-200 disabled:cursor-not-allowed disabled:hover:scale-100 ${
                      status !== 'ready' || isStreaming
                        ? 'bg-gray-400 dark:bg-gray-600 opacity-50'
                        : 'bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 dark:hover:bg-teal-600 hover:scale-105'
                    }`}
                    title={isStreaming ? "Processing message..." : "Send message"}
                  >
                    {status !== 'ready' || isStreaming ? (
                      <Loader2 className="w-4 h-4 lg:w-5 lg:h-5 animate-spin" />
                    ) : (
                      <ArrowUp className="w-4 h-4 lg:w-5 lg:h-5" />
                    )}
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

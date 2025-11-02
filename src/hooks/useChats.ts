'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// Query keys for cache management
export const chatKeys = {
  all: ['chats'] as const,
  lists: () => [...chatKeys.all, 'list'] as const,
  list: (userId: string) => [...chatKeys.lists(), userId] as const,
  details: () => [...chatKeys.all, 'detail'] as const,
  detail: (chatId: string, userId: string) => [...chatKeys.details(), chatId, userId] as const,
}

// Fetch chat history (all chats for a user)
async function fetchChatHistory(userId: string) {
  const response = await fetch(`/api/chat/history?userId=${userId}`)
  if (!response.ok) {
    throw new Error('Failed to fetch chat history')
  }
  return response.json()
}

// Fetch a specific chat
async function fetchChat(chatId: string, userId: string) {
  const response = await fetch(`/api/chat/load?chatId=${chatId}&userId=${userId}`)
  
  if (response.status === 404) {
    return { chat: null, messages: [] }
  }
  
  if (!response.ok) {
    throw new Error('Failed to fetch chat')
  }
  
  return response.json()
}

// Hook to fetch all chats (chat history)
export function useChatHistory(userId: string | undefined) {
  return useQuery({
    queryKey: chatKeys.list(userId || ''),
    queryFn: () => fetchChatHistory(userId!),
    enabled: !!userId, // Only run query if userId exists
    staleTime: 2 * 60 * 1000, // Consider data fresh for 2 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchOnMount: false, // Don't refetch if data exists in cache
    refetchOnReconnect: true, // Refetch when internet reconnects
  })
}

// Hook to fetch a specific chat
export function useChat(chatId: string | null, userId: string | undefined) {
  return useQuery({
    queryKey: chatKeys.detail(chatId || '', userId || ''),
    queryFn: () => fetchChat(chatId!, userId!),
    enabled: !!chatId && !!userId, // Only run if both exist
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 15 * 60 * 1000, // Keep in cache for 15 minutes
    refetchOnWindowFocus: false, // Don't refetch individual chats on focus
    refetchOnMount: false, // Don't refetch if data exists in cache
    refetchOnReconnect: false, // Don't refetch on reconnect
  })
}

// Hook to invalidate chat cache (force refetch)
export function useInvalidateChats() {
  const queryClient = useQueryClient()
  
  return {
    invalidateAll: () => queryClient.invalidateQueries({ queryKey: chatKeys.all }),
    invalidateList: (userId: string) => queryClient.invalidateQueries({ queryKey: chatKeys.list(userId) }),
    invalidateChat: (chatId: string, userId: string) => 
      queryClient.invalidateQueries({ queryKey: chatKeys.detail(chatId, userId) }),
  }
}

// Hook to prefetch a chat (load in background)
export function usePrefetchChat() {
  const queryClient = useQueryClient()
  
  return (chatId: string, userId: string) => {
    queryClient.prefetchQuery({
      queryKey: chatKeys.detail(chatId, userId),
      queryFn: () => fetchChat(chatId, userId),
      staleTime: 5 * 60 * 1000,
    })
  }
}

// Hook to update chat cache optimistically
export function useOptimisticChatUpdate() {
  const queryClient = useQueryClient()
  
  return (chatId: string, userId: string, newTitle: string) => {
    // Optimistically update the chat list
    queryClient.setQueryData(chatKeys.list(userId), (old: any) => {
      if (!old?.chats) return old
      
      return {
        ...old,
        chats: old.chats.map((chat: any) => 
          chat.id === chatId ? { ...chat, title: newTitle } : chat
        )
      }
    })
  }
}

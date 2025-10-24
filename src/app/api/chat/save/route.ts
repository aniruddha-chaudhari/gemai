import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { google } from '@ai-sdk/google'
import { generateObject } from 'ai'
import { z } from 'zod'

export async function POST(req: NextRequest) {
  try {
    const { chatId, messages, userId } = await req.json()

    console.log('=== SAVE API CALLED ===')
    console.log('ChatId:', chatId)
    console.log('UserId:', userId)
    console.log('Messages count:', messages?.length)
    console.log('Messages roles:', messages?.map((m: any) => m.role))

    if (!chatId || !messages || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if chat exists
    let chat = await db.chat.findUnique({
      where: { id: chatId },
      include: { messages: true }
    })

    if (!chat) {
      // Create new chat
      chat = await db.chat.create({
        data: {
          id: chatId,
          userId,
          title: null
        },
        include: { messages: true }
      })
    }

    // Save messages to database
    for (const message of messages) {
      const messageContent = message.parts
        .filter((part: any) => part.type === 'text')
        .map((part: any) => part.text)
        .join('')

      await db.message.upsert({
        where: {
          id: message.id
        },
        update: {
          content: messageContent,
          role: message.role
        },
        create: {
          id: message.id,
          chatId: chatId,
          role: message.role,
          content: messageContent
        }
      })
    }

    // Generate title if this is the first assistant response and no proper title exists
    console.log('=== TITLE GENERATION DEBUG ===')
    console.log('Chat title:', chat.title)
    console.log('Messages length:', messages.length)
    console.log('Messages:', messages.map((m: any) => ({ role: m.role, id: m.id })))
    
    if ((!chat.title || chat.title === 'New Chat') && messages.length >= 2) {
      const firstUserMessage = messages.find((m: any) => m.role === 'user')
      const firstAssistantMessage = messages.find((m: any) => m.role === 'assistant')
      
      console.log('Title generation conditions met!')
      console.log('First user message found:', !!firstUserMessage)
      console.log('First assistant message found:', !!firstAssistantMessage)
      
      if (firstUserMessage && firstAssistantMessage) {
        try {
          const userMessageText = firstUserMessage.parts
            .filter((part: any) => part.type === 'text')
            .map((part: any) => part.text)
            .join('')
            .slice(0, 200)

          const titleResult = await generateObject({
            model: google('gemini-2.5-flash'),
            schema: z.object({
              title: z.string().max(50).describe('A concise, descriptive title for the conversation')
            }),
            prompt: `Create a concise title (under 50 characters) for this conversation. User message: "${userMessageText}"`
          })

          const title = titleResult.object.title.trim()
          console.log('Generated title for chat:', chatId, '->', title)
          
          await db.chat.update({
            where: { id: chatId },
            data: { title }
          })
        } catch (error) {
          console.error('Error generating title:', error)
          // Fallback to a simple title
          const fallbackTitle = firstUserMessage.parts
            .filter((part: any) => part.type === 'text')
            .map((part: any) => part.text)
            .join('')
            .slice(0, 30) + '...'
          
          console.log('Using fallback title:', fallbackTitle)
          
          await db.chat.update({
            where: { id: chatId },
            data: { title: fallbackTitle }
          })
        }
      }
    }

    return NextResponse.json({ success: true, chat })
  } catch (error) {
    console.error('Error saving chat:', error)
    return NextResponse.json({ error: 'Failed to save chat' }, { status: 500 })
  }
}

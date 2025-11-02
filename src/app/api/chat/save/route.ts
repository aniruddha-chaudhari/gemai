import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { google } from '@ai-sdk/google'
import { generateObject } from 'ai'
import { z } from 'zod'

// Ensure this route is treated as dynamic
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const { chatId, messages, userId } = await req.json()

    if (!chatId || !messages || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Ensure chat exists (use upsert to avoid duplicate creation)
    const chat = await db.chat.upsert({
      where: { id: chatId },
      update: {
        updatedAt: new Date()
      },
      create: {
        id: chatId,
        userId,
        title: null
      },
      include: { messages: true }
    })

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
    if ((!chat.title || chat.title === 'New Chat') && messages.length >= 2) {
      const firstUserMessage = messages.find((m: any) => m.role === 'user')
      const firstAssistantMessage = messages.find((m: any) => m.role === 'assistant')
      
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
          
          await db.chat.update({
            where: { id: chatId },
            data: { title }
          })
        } catch (error) {
          console.error('❌ Error generating title:', error)
          // Fallback to a simple title
          const fallbackTitle = firstUserMessage.parts
            .filter((part: any) => part.type === 'text')
            .map((part: any) => part.text)
            .join('')
            .slice(0, 30) + '...'
          
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

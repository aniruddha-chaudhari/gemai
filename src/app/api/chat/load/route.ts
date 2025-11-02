import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Ensure this route is treated as dynamic
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const chatId = searchParams.get('chatId')
    const userId = searchParams.get('userId')

    console.log('Load API called with chatId:', chatId, 'userId:', userId)

    if (!chatId || !userId) {
      return NextResponse.json({ error: 'Chat ID and User ID required' }, { status: 400 })
    }

    // Verify the chat belongs to the user
    const chat = await db.chat.findFirst({
      where: { 
        id: chatId,
        userId: userId
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    })

    console.log('Found chat:', chat ? 'Yes' : 'No')

    if (!chat) {
      console.log('Chat not found for ID:', chatId)
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
    }

    // Convert database messages to UI message format
    const uiMessages = chat.messages.map(msg => ({
      id: msg.id,
      role: msg.role,
      parts: [
        {
          type: 'text',
          text: msg.content
        }
      ]
    }))

    return NextResponse.json({ 
      chat: {
        id: chat.id,
        title: chat.title,
        messages: uiMessages
      }
    })
  } catch (error) {
    console.error('Error loading chat:', error)
    return NextResponse.json({ error: 'Failed to load chat' }, { status: 500 })
  }
}

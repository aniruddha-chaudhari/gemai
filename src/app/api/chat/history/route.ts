import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    const chats = await db.chat.findMany({
      where: { userId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 1 // Get the first message for preview
        }
      },
      orderBy: { updatedAt: 'desc' }
    })

    // Format chats for the sidebar
    const formattedChats = chats.map(chat => ({
      id: chat.id,
      title: chat.title || 'New Chat',
      date: chat.updatedAt.toISOString(),
      preview: chat.messages[0]?.content?.slice(0, 100) || ''
    }))

    return NextResponse.json({ chats: formattedChats })
  } catch (error) {
    console.error('Error fetching chat history:', error)
    return NextResponse.json({ error: 'Failed to fetch chat history' }, { status: 500 })
  }
}

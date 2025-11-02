import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const chatId = searchParams.get('chatId')
    const userId = searchParams.get('userId')

    if (!chatId || !userId) {
      return NextResponse.json({ error: 'Chat ID and User ID required' }, { status: 400 })
    }

    // Verify the chat belongs to the user before deleting
    const chat = await db.chat.findUnique({
      where: { id: chatId },
    })

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
    }

    if (chat.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Delete messages first (due to foreign key constraint)
    await db.message.deleteMany({
      where: { chatId },
    })

    // Delete the chat
    await db.chat.delete({
      where: { id: chatId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting chat:', error)
    return NextResponse.json({ error: 'Failed to delete chat' }, { status: 500 })
  }
}

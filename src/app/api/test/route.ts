import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    // Test database connection
    const userCount = await db.user.count()
    const chatCount = await db.chat.count()
    const messageCount = await db.message.count()
    
    return NextResponse.json({ 
      success: true,
      userCount,
      chatCount,
      messageCount
    })
  } catch (error) {
    console.error('Database test error:', error)
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
  }
}

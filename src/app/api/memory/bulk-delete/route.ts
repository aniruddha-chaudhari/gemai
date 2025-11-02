import { NextRequest, NextResponse } from 'next/server'
import Supermemory from 'supermemory'

export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await req.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const supermemoryKey = process.env.SUPERMEMORY_API_KEY
    if (!supermemoryKey) {
      return NextResponse.json({ error: 'Supermemory API key not configured' }, { status: 500 })
    }

    const client = new Supermemory({ apiKey: supermemoryKey })

    // Get all memories for the user first using list
    const response = await client.memories.list({
      containerTags: [`user:${userId}`],
      limit: 1000, // Get all memories
      page: 1
    })

    const memories = response?.memories || []

    // Delete each memory individually
    const deletePromises = memories.map((memory: any) => 
      client.memories.delete(memory.id)
    )
    
    await Promise.all(deletePromises)

    return NextResponse.json({ 
      success: true, 
      message: `Deleted ${memories.length} memories successfully`,
      count: memories.length
    })
  } catch (error) {
    console.error('Error bulk deleting memories:', error)
    return NextResponse.json(
      { error: 'Failed to delete all memories', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

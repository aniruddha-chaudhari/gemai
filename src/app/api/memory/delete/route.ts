import { NextRequest, NextResponse } from 'next/server'
import Supermemory from 'supermemory'

export async function DELETE(req: NextRequest) {
  try {
    const { memoryId, userId } = await req.json()

    if (!memoryId) {
      return NextResponse.json({ error: 'Memory ID is required' }, { status: 400 })
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const supermemoryKey = process.env.SUPERMEMORY_API_KEY
    if (!supermemoryKey) {
      return NextResponse.json({ error: 'Supermemory API key not configured' }, { status: 500 })
    }

    const client = new Supermemory({ apiKey: supermemoryKey })

    // Delete the memory
    await client.memories.delete(memoryId)

    return NextResponse.json({ 
      success: true, 
      message: 'Memory deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting memory:', error)
    return NextResponse.json(
      { error: 'Failed to delete memory', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const supermemoryKey = process.env.SUPERMEMORY_API_KEY
    if (!supermemoryKey) {
      return NextResponse.json({ error: 'Supermemory API key not configured' }, { status: 500 })
    }

    // Use the raw API to list memories
    const response = await fetch('https://api.supermemory.ai/v3/documents/list', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supermemoryKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        containerTags: [`user:${userId}`],
        limit: 100,
        page: 1,
        sort: 'createdAt',
        order: 'desc'
      })
    })

    const data = await response.json()

    console.log('🔍 Raw API response:', data)
    console.log('📊 Memories count:', data?.memories?.length || 0)

    if (!response.ok) {
      throw new Error(data.error || `API returned ${response.status}`)
    }

    // Extract the memories array from the response
    const memoriesArray = data?.memories || []

    return NextResponse.json({ 
      success: true, 
      memories: memoriesArray,
      pagination: data?.pagination
    })
  } catch (error) {
    console.error('❌ Error listing memories:', error)
    console.error('Error details:', error)
    return NextResponse.json(
      { error: 'Failed to list memories', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

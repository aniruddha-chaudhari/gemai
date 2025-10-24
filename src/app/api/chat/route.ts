import { google } from '@ai-sdk/google'
import { streamText, UIMessage, convertToModelMessages, generateObject } from 'ai'
import { z } from 'zod'
import { db } from '@/lib/db'

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const { messages, chatId, enableSearch, userId }: { 
      messages: UIMessage[]; 
      chatId?: string; 
      enableSearch?: boolean;
      userId?: string;
    } = await req.json()

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return new Response('Missing Google API key. Please set GOOGLE_GENERATIVE_AI_API_KEY in your .env.local file', { status: 500 })
    }

    // Allow chat without authentication, but don't save to database
    const shouldSaveToDatabase = userId && chatId

    // Configure tools based on user preferences
    const tools = enableSearch ? {
      google_search: google.tools.googleSearch({}),
    } : undefined

    const result = streamText({
      model: google('gemini-2.5-flash'),
      messages: convertToModelMessages(messages),
      tools,
      onFinish: async ({ text, toolCalls, toolResults }) => {
        // Only save to database if user is authenticated
        if (shouldSaveToDatabase && text) {
          try {
            // Ensure chat exists
            await db.chat.upsert({
              where: { id: chatId },
              update: {},
              create: {
                id: chatId,
                userId: userId,
                title: null
              }
            })
            
            // Save assistant message
            await db.message.create({
              data: {
                id: `assistant-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                chatId: chatId,
                role: 'assistant',
                content: text
              }
            })

            // Get all messages for this chat to check if we should generate a title
            const chat = await db.chat.findUnique({
              where: { id: chatId },
              include: { messages: true }
            })

            // Generate title if this is the first assistant response and no proper title exists
            if (chat && (!chat.title || chat.title === 'New Chat') && chat.messages.length >= 2) {
              const firstUserMessage = chat.messages.find(m => m.role === 'user')
              const firstAssistantMessage = chat.messages.find(m => m.role === 'assistant')
              
              if (firstUserMessage && firstAssistantMessage) {
                try {
                  const userMessageText = firstUserMessage.content.slice(0, 200)
                  
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
                  const fallbackTitle = firstUserMessage.content.slice(0, 30) + '...'
                  
                  await db.chat.update({
                    where: { id: chatId },
                    data: { title: fallbackTitle }
                  })
                }
              }
            }
          } catch (error) {
            console.error('Error saving assistant message:', error)
          }
        }
      }
    })

    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error('Error in chat API:', error)
    return new Response(`Internal Server Error: ${error instanceof Error ? error.message : 'Unknown error'}`, { status: 500 })
  }
}

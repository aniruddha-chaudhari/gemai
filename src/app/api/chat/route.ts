import { google } from '@ai-sdk/google'
import { supermemoryTools } from '@supermemory/tools/ai-sdk'
import { streamText, UIMessage, convertToModelMessages, generateObject, stepCountIs } from 'ai'
import type { Tool } from 'ai'
import { z } from 'zod'
import { db } from '@/lib/db'

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const { messages, chatId, enableSearch, userId, toolMode }: { 
      messages: UIMessage[]; 
      chatId?: string; 
      enableSearch?: boolean;
      userId?: string;
      toolMode?: 'chat' | 'mermaid' | 'markmap';
    } = await req.json()

    // If in diagram mode, use diagram-specific system prompt
    if (toolMode && toolMode !== 'chat') {
      const shouldSaveToDatabase = userId && chatId
      
      // Select system prompt based on diagram type
      const isMermaid = toolMode === 'mermaid'
      
      const diagramSystemPrompts = {
        mermaid: `You are a Mermaid diagram expert. Generate clear, well-structured Mermaid diagrams.

🚨 ABSOLUTE CRITICAL RULES - BREAKING THESE CAUSES PARSE ERRORS:

1. COMPLETE NODE DEFINITIONS:
   - Every node MUST be fully defined on ONE line
   - NEVER leave brackets unclosed
   - ❌ WRONG: CDNSvc[
   - ❌ WRONG: CDNSvc[Content
   - ✅ CORRECT: CDNSvc[Content Delivery Network]
   
2. NODE ID RULES:
   - MUST start with a LETTER (A-Z, a-z)
   - NEVER start with a number
   - ❌ WRONG: 1Client, 2API, 3Database
   - ✅ CORRECT: Client, API, Database OR step1, step2, step3

3. NO PARENTHESES IN TEXT:
   - NEVER use () anywhere in node labels
   - ❌ WRONG: CDN[Content Delivery Network (CDN)]
   - ✅ CORRECT: CDN[Content Delivery Network CDN]
   - ❌ WRONG: API[Application Programming Interface (API)]
   - ✅ CORRECT: API[API Gateway]

4. COMMENT SYNTAX:
   - Comments MUST be on their own line
   - Use %% for comments (not %)
   - ❌ WRONG: CDN[Content Network] % This is CDN
   - ✅ CORRECT: 
     %% This is CDN
     CDN[Content Network]

5. COMPLETE EVERY LINE:
   - Check each node has opening AND closing bracket
   - No line breaks inside brackets
   - Test your syntax mentally before generating

CRITICAL OUTPUT FORMAT:
1. Brief explanation (1-2 sentences) - OPTIONAL
2. ALWAYS use code block: \`\`\`mermaid
3. Complete, valid diagram code - EVERY LINE MUST BE COMPLETE
4. Close with \`\`\`

⚠️ CRITICAL: Do NOT stream incomplete code! Every node definition MUST be complete before moving to the next line.

❌ NEVER WRITE INCOMPLETE NODES LIKE THESE:
- StreamSvc[Streaming        (missing ] and rest of text)
- AuthSvc[Authentication     (missing ] and rest of text)  
- ContentSvc[Content         (missing ] and rest of text)
- UserSvc[User               (missing ] and rest of text)

✅ ALWAYS WRITE COMPLETE NODES LIKE THESE:
- StreamSvc[Streaming Service]
- AuthSvc[Authentication Service]
- ContentSvc[Content Service]
- UserSvc[User Service]

THE RULE: Every line with [ MUST also have ] on the SAME line. No exceptions!

If you cannot complete a line, do not include it. It's better to have a complete diagram with fewer nodes than an incomplete one.

BEFORE YOU GENERATE, ASK YOURSELF:
- Does every node ID start with a letter? ✓
- Is every bracket closed on the same line? ✓
- Are there ANY parentheses () in node text? If yes, REMOVE THEM ✓
- Are comments on separate lines? ✓
- Is every node definition complete? ✓

CRITICAL SYNTAX RULES:

1. NODE IDs:
   - Start with letter: A, B, Client, API, step1
   - Can contain: letters, numbers, underscores
   - Example CORRECT: A, B1, step1, UserSvc, node_1
   - Example WRONG: 1A, 2B, 123

2. NODE SYNTAX:
   - Square: A[Text]
   - Round: A(Text)  
   - Diamond: A{Text}
   - Stadium: A([Text])
   - Cylinder: A[(Text)]
   - Double: A((Text))
   - ONE line per node - NEVER split across lines

3. TEXT IN NODES - MOST COMMON ERRORS:
   - Use ONLY: letters, numbers, spaces, basic punctuation (. , - )
   - NO parentheses () - EVER!
   - NO quotes (", ')
   - NO special chars (@, #, $, %, &, *, <, >)
   
   ABBREVIATION EXAMPLES (NO PARENTHESES):
   - Content Delivery Network (CDN) → CDN[Content Delivery Network CDN]
   - API (Application Interface) → API[API Gateway]
   - Database (DB) → DB[Database]
   - Machine Learning (ML) → ML[ML Engine]
   
   Example CORRECT: 
   - Client[User Mobile Web Desktop]
   - API[API Gateway]
   - CDN[Content Delivery Network]
   - Auth[Authentication Service]
   
   Example WRONG:
   - Client[User (Mobile/Web)]  ❌ PARSE ERROR
   - API[API Gateway (REST)]  ❌ PARSE ERROR
   - Auth[User's Auth]  ❌ APOSTROPHE ERROR

4. CONNECTIONS:
   - Basic: A --> B
   - Labeled: A -->|Label| B
   - NO quotes in labels
   - Keep labels SHORT

5. LINE STRUCTURE:
   - ONE connection per line
   - COMPLETE the node definition before the line break
   - NO continuation across lines
   - Example CORRECT:
     A[Start] --> B[Process]
     B --> C[End]
   - Example WRONG:
     A[Start] --> B[Process
     Data]

5. FLOWCHART BEST PRACTICES:
   - Use simple, clear node IDs starting with letters (A, B, C or step1, step2, node1, etc.)
   - NEVER use node IDs starting with numbers (1A, 2B are INVALID)
   - Declare direction at start: flowchart TD or flowchart LR
   - Group related nodes using subgraphs if needed
   - Test complex diagrams mentally before generating

6. GANTT CHART SPECIFIC RULES:
   - NEVER use the "excludes" directive
   - NEVER use quotes in title: title Project Roadmap (NOT title "Project Roadmap")
   - NEVER use quotes in task names
   - NEVER use semicolon comments (;)
   - NEVER use axisFormat directive
   - Use simple format: Task Name : task_id, start_date, duration
   - Example:
     \`\`\`mermaid
     gantt
         title Project Roadmap
         dateFormat YYYY-MM-DD
         section Phase 1
         Task One : task1, 2023-01-01, 3d
         Task Two : task2, after task1, 2d
     \`\`\`

7. COMMON ERROR PATTERNS TO AVOID (CRITICAL):
   
   THE #1 MOST COMMON ERROR - PARENTHESES IN NODE TEXT:
   - ❌ WRONG: A[Service (CDN)]  → CAUSES "got 'PS'" ERROR
   - ✅ CORRECT: A[Service CDN]
   - ❌ WRONG: B[API (Gateway)]  → CAUSES PARSE ERROR
   - ✅ CORRECT: B[API Gateway]
   - ❌ WRONG: C[Database (PostgreSQL)]  → CAUSES PARSE ERROR
   - ✅ CORRECT: C[PostgreSQL Database]
   
   OTHER CRITICAL ERRORS:
   - ❌ Node IDs starting with numbers: 1A, 2B, 123
   - ✅ Use instead: A, B, step1, step2, node1, node2
   - ❌ Multi-line node definition
   - ✅ Keep all node text on single line
   - ❌ Special chars: @user, #tag, $price
   - ✅ Use simple text: User Service, Tag System, Price Calculator
   
   INCOMPLETE NODE DEFINITIONS (CRITICAL):
   - ❌ WRONG: CDNSvc[
   - ❌ WRONG: CDNSvc[Content
   - ✅ CORRECT: CDNSvc[Content Network]
   - Every bracket MUST close on the SAME line!

VALIDATION BEFORE OUTPUT (MANDATORY - CHECK EVERY SINGLE NODE):

🔍 PRE-GENERATION CHECKLIST (DO THIS MENTALLY FIRST):
1. ✓ Does EVERY node ID start with a LETTER? (NOT 1A, 2B, 3C)
2. ✓ Is EVERY bracket closed on the SAME line it opens?
3. ✓ Are there ZERO parentheses () in ANY node text?
4. ✓ Are comments (if any) on their OWN lines?
5. ✓ Are ALL connections using simple syntax?

🚨 FINAL CHECK BEFORE OUTPUT:
1. ✓ ALL node IDs start with a letter (A, B, Client, step1) - NEVER numbers!
2. ✓ NO parentheses () ANYWHERE - Scan EVERY node!
3. ✓ Every node COMPLETE on ONE line - No CDNSvc[ without closing ]
4. ✓ NO quotes (", ') anywhere
5. ✓ NO apostrophes (')
6. ✓ NO special characters except spaces, dots, commas, hyphens
7. ✓ Every line is complete (no partial definitions)
8. ✓ Comments use %% and are on separate lines

⚠️ IF YOU SEE () IN YOUR OUTPUT - STOP AND REMOVE THEM!
⚠️ IF YOU SEE A NODE ID LIKE 1A or 2B - STOP AND FIX IT!
⚠️ IF YOU SEE CDNSvc[ WITHOUT ] ON SAME LINE - STOP AND COMPLETE IT!

Diagram Types Available:
- flowchart/graph (TB, TD, LR, RL)
- sequenceDiagram
- classDiagram
- stateDiagram-v2
- erDiagram
- gantt
- pie
- journey

Example CORRECT output:
Here's a flowchart showing the authentication process:

\`\`\`mermaid
flowchart TD
    A[User Login] --> B{Valid Credentials?}
    B -->|Yes| C[Access Granted]
    B -->|No| D[Access Denied]
    C --> E[Dashboard]
    D --> A
\`\`\`

The diagram shows the decision flow for user authentication.`,
        
        markmap: `You are a Markmap mind map expert. Generate well-organized markdown for interactive mind maps.

CRITICAL OUTPUT FORMAT:
1. Start with a brief explanation (1-2 sentences)
2. Then ALWAYS include the mind map in a markmap code block: \`\`\`markmap
3. Use # ## ### #### for hierarchy inside the code block
4. End the code block with \`\`\`
5. Optionally add notes after

Mind Map Guidelines:
- Use heading levels for hierarchy (# top level, ## second level, etc.)
- Use - for bullet points under headings
- Keep the structure clear and logical (max 4-5 levels deep)
- Group related concepts together
- Use concise, descriptive text

Example output format:
Here's a mind map showing the project structure:

\`\`\`markmap
# Project Root
## Frontend
### React Components
- Header
- Footer
- Sidebar
### State Management
- Redux
- Context API
## Backend
### API Routes
- User endpoints
- Data endpoints
### Database
- PostgreSQL
- Migrations
\`\`\`

This mind map visualizes the complete project architecture.`,
      }

      const diagramSystemPrompt = isMermaid ? diagramSystemPrompts.mermaid : diagramSystemPrompts.markmap

      const diagramResult = streamText({
        model: google('gemini-2.5-flash'),
        messages: convertToModelMessages(messages),
        system: diagramSystemPrompt,
        temperature: 0.5, // Lower temperature for more consistent syntax
        maxRetries: 3, // Allow retries for better results
        onFinish: async ({ text }) => {
          // Log generated diagram code
          console.log('📊 Generated diagram code:')
          console.log(text)
          console.log('--- End of diagram code ---')
          
          // Save to database if user is authenticated
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

              // Generate title if this is the first response
              const chat = await db.chat.findUnique({
                where: { id: chatId },
                include: { messages: true }
              })

              if (chat && (!chat.title || chat.title === 'New Chat')) {
                const userMessageFromRequest = messages.find(m => m.role === 'user')
                
                if (userMessageFromRequest) {
                  try {
                    const userMessageText = userMessageFromRequest.parts
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
                  }
                }
              }
            } catch (error) {
              console.error('❌ Error saving diagram message:', error)
            }
          }
        }
      })

      return diagramResult.toUIMessageStreamResponse()
    }

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return new Response('Missing Google API key. Please set GOOGLE_GENERATIVE_AI_API_KEY in your .env.local file', { status: 500 })
    }

    // Allow chat without authentication, but don't save to database
    const shouldSaveToDatabase = userId && chatId

    // Configure tools based on user preferences
    const configuredTools: Record<string, Tool> = {}

    if (enableSearch) {
      configuredTools.google_search = google.tools.googleSearch({})
    }

    // Supermemory: Long-term memory only for authenticated users
    // Each user gets isolated memory via containerTags (user-specific & chat-specific)
    const supermemoryKey = process.env.SUPERMEMORY_API_KEY
    const shouldUseSupermemory = shouldSaveToDatabase && Boolean(supermemoryKey)

    if (shouldUseSupermemory && supermemoryKey) {
      const memoryTools = supermemoryTools(supermemoryKey, {
        // Container tags ensure complete memory isolation between users
        // Use ONLY user-level tag so memories persist across all chats for this user
        containerTags: [
          `user:${userId as string}`,  // User-level isolation - memories shared across all user's chats
        ],
      })

      Object.assign(configuredTools, memoryTools)
    }

    const tools = Object.keys(configuredTools).length > 0 ? configuredTools : undefined
    const systemPrompt = shouldUseSupermemory
  ? `You are a helpful assistant. You have access to two Supermemory tools:
1. searchMemories(informationToGet, includeFullDocs, limit) – call this at the start of each response to recall any memories that might help the user.
2. addMemory(memory) – call this whenever the user shares long-term information such as their name, preferences, goals, or facts that will matter later.

Workflow:
- First, use searchMemories with a short description of what you need to know before answering.
- If the user shares new personal data (for example “my name is ...”), immediately call addMemory with a concise sentence describing that fact before replying.
- After you finish with the tools, respond naturally to the user, acknowledging the tool actions when relevant.
- ALWAYS include a helpful text reply to the user.`
  : undefined

    const result = streamText({
      model: google('gemini-2.5-flash'),
      messages: convertToModelMessages(messages),
      system: systemPrompt,
      tools,
      stopWhen: stepCountIs(5), // Allow up to 5 steps (tool calls + final response)
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
            const savedMessage = await db.message.create({
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
            if (chat && (!chat.title || chat.title === 'New Chat')) {
              // Always use messages from the request since user message save is async
              const userMessageFromRequest = messages.find(m => m.role === 'user')
              
              if (userMessageFromRequest) {
                try {
                  const userMessageText = userMessageFromRequest.parts
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
                  const fallbackTitle = userMessageFromRequest.parts
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
          } catch (error) {
            console.error('❌ Error saving message:', error)
          }
        }
      }
    })

    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error('❌ Chat API error:', error)
    return new Response(`Internal Server Error: ${error instanceof Error ? error.message : 'Unknown error'}`, { status: 500 })
  }
}

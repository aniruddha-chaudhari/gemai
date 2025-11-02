import { google } from '@ai-sdk/google'
import { streamText, UIMessage, convertToModelMessages } from 'ai'
import { z } from 'zod'
import { db } from '@/lib/db'

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const { messages, chatId, userId, diagramType }: { 
      messages: UIMessage[]; 
      chatId?: string; 
      userId?: string;
      diagramType?: 'mermaid' | 'markmap';
    } = await req.json()

    console.log('🎨 Diagram mode:', diagramType || 'mermaid')

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return new Response('Missing Google API key. Please set GOOGLE_GENERATIVE_AI_API_KEY in your .env.local file', { status: 500 })
    }

    const shouldSaveToDatabase = userId && chatId

    // Select system prompt based on diagram type
    const isMermaid = diagramType === 'mermaid' || !diagramType
    
    const systemPrompts = {
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
1. Brief explanation (1-2 sentences) - OPTIONAL, can skip if not needed
2. ALWAYS use code block: \`\`\`mermaid
3. Complete, valid diagram code - EVERY LINE MUST BE COMPLETE
4. Close with \`\`\`

⚠️ CRITICAL: Do NOT stream incomplete code! Every node definition MUST be complete before moving to the next line.
NEVER write: ContentSvc[Content
ALWAYS write: ContentSvc[Content Service]

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

Example CORRECT output:
\`\`\`mermaid
flowchart TD
    A[User Login] --> B{Valid Credentials?}
    B -->|Yes| C[Access Granted]
    B -->|No| D[Access Denied]
    C --> E[Dashboard]
    D --> A
\`\`\``,
      
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

    const systemPrompt = isMermaid ? systemPrompts.mermaid : systemPrompts.markmap

    const result = streamText({
      model: google('gemini-2.5-flash'),
      messages: convertToModelMessages(messages),
      system: systemPrompt,
      temperature: 0.5, // Lower temperature for more consistent syntax
      maxRetries: 3, // Allow retries for better results
      onFinish: async ({ text }) => {
        // Debug: Log the generated diagram
        console.log('📊 Generated diagram response:', text?.substring(0, 500))
        
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
            
            // Save assistant message with diagram
            await db.message.create({
              data: {
                id: `diagram-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                chatId: chatId,
                role: 'assistant',
                content: text,
              }
            })
          } catch (error) {
            console.error('❌ Failed to save diagram:', error)
          }
        }
      },
    })

    return result.toTextStreamResponse()
  } catch (error) {
    console.error('❌ Diagram generation error:', error)
    return new Response('Internal server error', { status: 500 })
  }
}

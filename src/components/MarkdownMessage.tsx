'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import hljs from 'highlight.js'
import { DiagramRenderer } from './DiagramRenderer'

interface MarkdownMessageProps {
  content: string
  className?: string
  onDiagramError?: (error: string, code: string) => void
}

export default function MarkdownMessage({ content, className = '', onDiagramError }: MarkdownMessageProps) {
  // Debug: Log content to verify it's being received
  console.log('📝 MarkdownMessage content:', content?.substring(0, 100))
  
  return (
    <div className={`prose prose-sm max-w-none dark:prose-invert ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '')
            if (!inline && match) {
              const language = match[1]
              let codeString = String(children).replace(/\n$/, '').trim()
              
              // For Mermaid, clean up code to remove incomplete lines at the end
              if (language === 'mermaid') {
                // Remove any trailing incomplete node definitions (likely from streaming cutoff)
                const lines = codeString.split('\n')
                const validLines: string[] = []
                
                for (const line of lines) {
                  const trimmed = line.trim()
                  // Skip empty lines
                  if (!trimmed) {
                    validLines.push('')
                    continue
                  }
                  
                  // Stop at incomplete node definitions at the end (likely from streaming cutoff)
                  // More aggressive check for incomplete nodes
                  const hasOpenBracket = trimmed.includes('[')
                  const hasCloseBracket = trimmed.includes(']')
                  const hasOpenParen = trimmed.includes('(') && !trimmed.match(/\(\[|\[\(/)
                  const hasCloseParen = trimmed.includes(')')
                  const hasOpenBrace = trimmed.includes('{')
                  const hasCloseBrace = trimmed.includes('}')
                  
                  // Stop if incomplete brackets/parentheses/braces (unless subgraph or comment)
                  if (!trimmed.startsWith('subgraph') && !trimmed.startsWith('%%')) {
                    if ((hasOpenBracket && !hasCloseBracket) ||
                        (hasOpenParen && !hasCloseParen && !trimmed.match(/-->|%%/)) ||
                        (hasOpenBrace && !hasCloseBrace)) {
                      console.warn('⚠️ Skipping incomplete Mermaid node at end:', trimmed)
                      break
                    }
                  }
                  
                  // Stop if connection is incomplete
                  if (trimmed.includes('-->')) {
                    const afterArrow = trimmed.split('-->')[1]?.trim()
                    if (!afterArrow || 
                        (!afterArrow.match(/^[A-Za-z_][A-Za-z0-9_]*\[|^[A-Za-z_][A-Za-z0-9_]*\(|^[A-Za-z_][A-Za-z0-9_]*\{|^[A-Za-z_][A-Za-z0-9_]*$/) &&
                         !afterArrow.startsWith('|'))) {
                      console.warn('⚠️ Skipping incomplete Mermaid connection at end:', trimmed)
                      break
                    }
                  }
                  
                  validLines.push(line)
                }
                
                codeString = validLines.join('\n').trim()
                
                // Only render if we have valid code
                if (codeString) {
                  console.log('🎨 Rendering Mermaid diagram:', codeString?.substring(0, 100))
                  return <DiagramRenderer code={codeString} type="mermaid" language={language} onError={onDiagramError} />
                } else {
                  console.warn('⚠️ Mermaid code is empty after cleaning')
                  return (
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-800 rounded-lg">
                      <p className="text-sm text-yellow-800 dark:text-yellow-300">
                        Waiting for complete diagram code...
                      </p>
                    </div>
                  )
                }
              }
              
              // Render Markmap diagrams
              if (language === 'markmap') {
                console.log('🧠 Rendering Markmap diagram:', codeString?.substring(0, 100))
                return <DiagramRenderer code={codeString} type="markmap" language={language} onError={onDiagramError} />
              }
              
              // Regular code highlighting
              const highlightedCode = hljs.highlight(codeString, { language }).value
              return (
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                  <code 
                    className={`language-${language} hljs`}
                    dangerouslySetInnerHTML={{ __html: highlightedCode }}
                    {...props}
                  />
                </pre>
              )
            }
            return (
              <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                {children}
              </code>
            )
          },
          h1: ({ children }) => (
            <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">{children}</h3>
          ),
          p: ({ children }) => (
            <p className="text-gray-800 dark:text-gray-200 mb-2 leading-relaxed">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="text-gray-800 dark:text-gray-200">{children}</li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-600 dark:text-gray-400 my-2">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-2">
              <table className="min-w-full border border-gray-300 dark:border-gray-600 rounded-lg">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-gray-50 dark:bg-gray-700">{children}</thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-gray-200 dark:divide-gray-600">{children}</tbody>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">{children}</tr>
          ),
          th: ({ children }) => (
            <th className="px-4 py-2 text-left text-sm font-medium text-gray-900 dark:text-white">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-2 text-sm text-gray-800 dark:text-gray-200">{children}</td>
          ),
          a: ({ href, children }) => (
            <a 
              href={href} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              {children}
            </a>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-gray-900 dark:text-white">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-gray-700 dark:text-gray-300">{children}</em>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

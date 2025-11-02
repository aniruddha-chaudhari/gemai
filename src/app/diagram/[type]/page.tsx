'use client'

import { use, useEffect, useRef, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import mermaid from 'mermaid'
import { Transformer } from 'markmap-lib'
import { Markmap } from 'markmap-view'
import { Toolbar } from 'markmap-toolbar'
import { ArrowLeft } from 'lucide-react'

// Initialize mermaid with custom theme matching your teal/emerald palette
if (typeof window !== 'undefined') {
  mermaid.initialize({
    startOnLoad: false,
    theme: 'base',
    themeVariables: {
      // Primary colors - Teal/Emerald brand
      primaryColor: '#14b8a6', // teal-500
      primaryTextColor: '#ffffff',
      primaryBorderColor: '#0d9488', // teal-600
      
      // Secondary colors
      secondaryColor: '#10b981', // emerald-500
      secondaryTextColor: '#ffffff',
      secondaryBorderColor: '#059669', // emerald-600
      
      // Tertiary colors
      tertiaryColor: '#0f766e', // teal-700
      tertiaryTextColor: '#ffffff',
      tertiaryBorderColor: '#115e59', // teal-800
      
      // Background and text
      background: '#1f2937', // gray-800
      mainBkg: '#14b8a6', // teal-500
      secondBkg: '#10b981', // emerald-500
      tertiaryBkg: '#0d9488', // teal-600
      
      // Line colors
      lineColor: '#6b7280', // gray-500
      textColor: '#f9fafb', // gray-50
      
      // Node styling
      nodeBorder: '#0d9488', // teal-600
      nodeTextColor: '#ffffff',
      
      // Edge styling
      edgeLabelBackground: '#374151', // gray-700
      
      // Class diagram
      classText: '#ffffff',
      
      // State diagram
      labelBoxBkgColor: '#14b8a6', // teal-500
      labelBoxBorderColor: '#0d9488', // teal-600
      labelTextColor: '#ffffff',
      
      // Sequence diagram
      actorBorder: '#0d9488', // teal-600
      actorBkg: '#14b8a6', // teal-500
      actorTextColor: '#ffffff',
      actorLineColor: '#6b7280', // gray-500
      signalColor: '#f9fafb', // gray-50
      signalTextColor: '#f9fafb', // gray-50
      
      // Gantt diagram
      gridColor: '#4b5563', // gray-600
      todayLineColor: '#ef4444', // red-500
      
      // Git graph
      git0: '#14b8a6', // teal-500
      git1: '#10b981', // emerald-500
      git2: '#0d9488', // teal-600
      git3: '#059669', // emerald-600
      git4: '#0f766e', // teal-700
      git5: '#047857', // emerald-700
      git6: '#5eead4', // teal-300
      git7: '#6ee7b7', // emerald-300
      
      // Pie chart
      pie1: '#14b8a6', // teal-500
      pie2: '#10b981', // emerald-500
      pie3: '#0d9488', // teal-600
      pie4: '#059669', // emerald-600
      pie5: '#0f766e', // teal-700
      pie6: '#047857', // emerald-700
      pie7: '#5eead4', // teal-300
      pie8: '#6ee7b7', // emerald-300
      pie9: '#2dd4bf', // teal-400
      pie10: '#34d399', // emerald-400
      pie11: '#99f6e4', // teal-200
      pie12: '#a7f3d0', // emerald-200
    },
    securityLevel: 'loose',
    fontFamily: 'inherit',
    logLevel: 'fatal',
    suppressErrorRendering: true,
  })
}

export default function DiagramFullscreenPage({ params }: { params: Promise<{ type: string }> }) {
  const resolvedParams = use(params)
  const searchParams = useSearchParams()
  const router = useRouter()
  const code = searchParams.get('code') || ''
  const diagramType = resolvedParams.type as 'mermaid' | 'markmap'
  
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const markmapRef = useRef<Markmap | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const [svg, setSvg] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [zoom, setZoom] = useState(1)
  const [position, setPosition] = useState({ x: 4, y: 3 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [initialZoomSet, setInitialZoomSet] = useState(false)

  // Calculate optimal zoom to fit diagram in viewport
  const calculateOptimalZoom = () => {
    if (!canvasRef.current) return 1

    const canvasRect = canvasRef.current.getBoundingClientRect()
    // Account for canvas padding (p-8 = 32px * 2 = 64px) and container padding (p-12 = 48px * 2 = 96px)
    const totalPadding = 64 + 96 // 160px total horizontal/vertical padding
    const availableWidth = canvasRect.width - totalPadding
    const availableHeight = canvasRect.height - totalPadding

    let diagramWidth = 0
    let diagramHeight = 0

    if (diagramType === 'mermaid' && containerRef.current) {
      const svgElement = containerRef.current.querySelector('svg')
      if (svgElement) {
        try {
          const bbox = svgElement.getBBox()
          diagramWidth = bbox.width
          diagramHeight = bbox.height
        } catch {
          // Fallback if getBBox fails
          const rect = svgElement.getBoundingClientRect()
          diagramWidth = rect.width
          diagramHeight = rect.height
        }
      }
    } else if (diagramType === 'markmap' && svgRef.current) {
      // For markmap, get the actual rendered bounds
      const svgRect = svgRef.current.getBoundingClientRect()
      diagramWidth = svgRect.width
      diagramHeight = svgRect.height
      
      // Try to get the actual content bounds if available
      if (markmapRef.current?.state) {
        // Markmap doesn't provide easy bounds access, so use SVG size
      }
    }

    if (diagramWidth === 0 || diagramHeight === 0) return 1

    // Calculate zoom to fit with some margin (80% of available space for comfortable viewing)
    const widthZoom = (availableWidth * 0.80) / diagramWidth
    const heightZoom = (availableHeight * 0.80) / diagramHeight
    const optimalZoom = Math.min(widthZoom, heightZoom, 1) // Don't zoom in beyond 100%

    // Clamp between 0.25 and 1.0 for sensible defaults
    const finalZoom = Math.max(0.25, Math.min(1.0, optimalZoom))
    
    // Log canvas calculations
    console.log('🎨 Canvas Settings Calculation:', {
      canvasSize: {
        width: canvasRect.width,
        height: canvasRect.height
      },
      padding: {
        total: totalPadding,
        canvas: 64,
        container: 96
      },
      availableSpace: {
        width: availableWidth,
        height: availableHeight
      },
      diagramSize: {
        width: diagramWidth,
        height: diagramHeight
      },
      zoomCalculations: {
        widthZoom,
        heightZoom,
        optimalZoom,
        finalZoom
      },
      fitMargin: '80%'
    })
    
    return finalZoom
  }
  
  // Log current canvas settings whenever they change
  useEffect(() => {
    console.log('📊 Current Canvas Settings:', {
      zoom: {
        value: zoom,
        percentage: Math.round(zoom * 100) + '%'
      },
      position: {
        x: position.x,
        y: position.y
      },
      diagramType,
      isDragging,
      initialZoomSet,
      canvasDimensions: canvasRef.current ? {
        width: canvasRef.current.getBoundingClientRect().width,
        height: canvasRef.current.getBoundingClientRect().height
      } : 'not available',
      diagramDimensions: (() => {
        if (diagramType === 'mermaid' && containerRef.current) {
          const svg = containerRef.current.querySelector('svg')
          if (svg) {
            try {
              const bbox = svg.getBBox()
              return { width: bbox.width, height: bbox.height, method: 'getBBox' }
            } catch {
              const rect = svg.getBoundingClientRect()
              return { width: rect.width, height: rect.height, method: 'getBoundingClientRect' }
            }
          }
        } else if (diagramType === 'markmap' && svgRef.current) {
          const rect = svgRef.current.getBoundingClientRect()
          return { width: rect.width, height: rect.height, method: 'getBoundingClientRect' }
        }
        return 'not available'
      })()
    })
  }, [zoom, position, diagramType, isDragging, initialZoomSet])

  // Auto-fit zoom when diagram is rendered
  useEffect(() => {
    if ((diagramType === 'mermaid' && svg) || (diagramType === 'markmap' && svgRef.current && markmapRef.current)) {
      if (!initialZoomSet) {
        console.log('⏳ Auto-fit: Waiting for diagram to settle...')
        // Wait for DOM to settle and SVG to be properly rendered
        const timeoutId = setTimeout(() => {
          console.log('✅ Auto-fit: Calculating optimal zoom...')
          const optimalZoom = calculateOptimalZoom()
          if (optimalZoom > 0 && optimalZoom <= 1) {
            // Use last working settings as default (from console logs)
            const defaultPosition = { x: 4, y: 3 }
            const defaultZoom = optimalZoom > 0 ? optimalZoom : 1
            
            console.log('✅ Auto-fit: Applying settings:', {
              zoom: defaultZoom,
              position: defaultPosition,
              percentage: Math.round(defaultZoom * 100) + '%',
              note: 'Using last working settings as default'
            })
            setZoom(defaultZoom)
            setPosition(defaultPosition)
            setInitialZoomSet(true)
          } else {
            console.warn('⚠️ Auto-fit: Invalid zoom calculated:', optimalZoom)
          }
        }, 500) // Increased timeout to ensure markmap has fully rendered
        
        return () => clearTimeout(timeoutId)
      }
    }
  }, [svg, diagramType, initialZoomSet])

  // Render Mermaid diagram
  useEffect(() => {
    if (diagramType === 'mermaid' && code) {
      console.log('🎨 Rendering Mermaid diagram...', { codeLength: code.length })
      const renderDiagram = async () => {
        try {
          const { svg } = await mermaid.render('diagram-fullscreen', code)
          console.log('✅ Mermaid diagram rendered:', { svgLength: svg.length })
          setSvg(svg)
          setError('')
          setInitialZoomSet(false) // Reset zoom calculation
        } catch (err) {
          console.error('❌ Mermaid render error:', err)
          setError(err instanceof Error ? err.message : 'Failed to render diagram')
        }
      }
      renderDiagram()
    }
  }, [code, diagramType])

  // Render Markmap diagram
  useEffect(() => {
    if (diagramType === 'markmap' && code && svgRef.current) {
      console.log('🎨 Initializing Markmap diagram...', { codeLength: code.length })
      // Wait for SVG to be properly sized before initializing Markmap
      // This prevents the SVGLength relative length error
      const initMarkmap = () => {
        try {
          const svg = svgRef.current
          if (!svg) {
            console.warn('⚠️ Markmap: SVG ref not available')
            return
          }
          console.log('✅ Markmap: SVG element found')

          // Ensure SVG has explicit pixel dimensions based on viewport
          const container = svg.parentElement
          if (container && canvasRef.current) {
            const canvasRect = canvasRef.current.getBoundingClientRect()
            // Use most of the available canvas space, accounting for minimal padding
            const availableWidth = Math.max(canvasRect.width - 64, 1200) // Most of the width
            const availableHeight = Math.max(canvasRect.height - 64, 800) // Most of the height
            
            console.log('📐 Markmap: Setting SVG dimensions:', {
              canvasSize: { width: canvasRect.width, height: canvasRect.height },
              svgSize: { width: availableWidth, height: availableHeight }
            })
            
            // Set dimensions to fill viewport better
            svg.setAttribute('width', `${availableWidth}px`)
            svg.setAttribute('height', `${availableHeight}px`)
          } else {
            console.log('📐 Markmap: Using fallback dimensions (1400x900)')
            // Fallback to larger dimensions
            svg.setAttribute('width', '1400px')
            svg.setAttribute('height', '900px')
          }

          console.log('🔄 Markmap: Transforming code to tree structure...')
          const transformer = new Transformer()
          const { root } = transformer.transform(code)
          
          // Create or update markmap
          if (!markmapRef.current) {
            console.log('✨ Markmap: Creating new Markmap instance...')
            markmapRef.current = Markmap.create(svg, {
              duration: 500,
              maxWidth: 400,  // Increased for larger text
              spacingVertical: 10,  // More spacing between nodes
              spacingHorizontal: 120,  // More horizontal spacing
              paddingX: 20,  // More padding
              initialExpandLevel: -1,
              // Use bright colors for nodes on dark background
              color: (node: any) => {
                const colors = [
                  '#5eead4', // teal-300 - very bright
                  '#6ee7b7', // emerald-300 - very bright
                  '#2dd4bf', // teal-400 - bright
                  '#34d399', // emerald-400 - bright
                  '#14b8a6', // teal-500 - medium
                  '#10b981', // emerald-500 - medium
                ]
                return colors[node.state.depth % colors.length]
              },
            })
          }
          
          console.log('✅ Markmap: Setting data and fitting...')
          markmapRef.current.setData(root)
          markmapRef.current.fit()
          setError('')
          
          // Collapse all nodes deeper than level 1
          setTimeout(() => {
            if (markmapRef.current) {
              console.log('🔄 Markmap: Collapsing nodes deeper than level 1...')
              const { state } = markmapRef.current
              
              // Function to recursively collapse nodes
              const collapseDeep = (node: any, depth: number = 0) => {
                if (depth >= 1 && node.children && node.children.length > 0) {
                  // Collapse this node
                  node.payload = node.payload || {}
                  node.payload.fold = 1
                }
                // Recursively process children
                if (node.children) {
                  node.children.forEach((child: any) => collapseDeep(child, depth + 1))
                }
              }
              
              // Start from root
              collapseDeep(state.data)
              
              // Trigger re-render
              markmapRef.current.setData(state.data)
              markmapRef.current.fit()
              console.log('✅ Markmap: Nodes collapsed and re-rendered')
              
              // Fit again after a longer delay to ensure proper sizing
              setTimeout(() => {
                if (markmapRef.current) {
                  markmapRef.current.fit()
                  console.log('🎯 Final fit applied for optimal display')
                }
              }, 200)
              
              // Reset zoom calculation after markmap is ready
              setInitialZoomSet(false)
            }
          }, 150)
          
          // Apply CSS styling to make text visible on dark background
          // Use setTimeout to ensure DOM is fully updated
          setTimeout(() => {
            if (svgRef.current) {
              console.log('🎨 Applying text styling for dark mode visibility')
              
              // Force ALL text elements to white with maximum specificity
              const textElements = svgRef.current.querySelectorAll('text')
              console.log(`📝 Found ${textElements.length} text elements`)
              textElements.forEach(text => {
                // Remove any dark fills
                text.removeAttribute('fill')
                // Set bright white fill with inline style for maximum priority
                text.style.setProperty('fill', '#ffffff', 'important')
                text.style.setProperty('font-weight', '600', 'important')
                text.style.setProperty('cursor', 'pointer', 'important')
                text.style.setProperty('text-shadow', '0 2px 4px rgba(0, 0, 0, 0.8)', 'important')
                text.setAttribute('fill', '#ffffff')
                // Override any class-based styling
                text.style.color = '#ffffff'
              })
              
              // Force style on tspan elements (child text elements)
              const tspanElements = svgRef.current.querySelectorAll('tspan')
              console.log(`📄 Found ${tspanElements.length} tspan elements`)
              tspanElements.forEach(tspan => {
                tspan.removeAttribute('fill')
                tspan.style.setProperty('fill', '#ffffff', 'important')
                tspan.style.setProperty('font-weight', '600', 'important')
                tspan.style.setProperty('text-shadow', '0 2px 4px rgba(0, 0, 0, 0.8)', 'important')
                tspan.setAttribute('fill', '#ffffff')
                tspan.style.color = '#ffffff'
              })
              
              // Override any <g> (group) elements that might have dark fills
              const groupElements = svgRef.current.querySelectorAll('g')
              console.log(`📦 Found ${groupElements.length} group elements`)
              groupElements.forEach(group => {
                // Check if group has a fill attribute
                const fill = group.getAttribute('fill')
                if (fill && (fill.includes('#0') || fill.includes('#1') || fill.includes('#2') || 
                             fill.includes('#3') || fill === 'black' || fill === '#000')) {
                  console.log(`🔧 Overriding dark fill on group: ${fill}`)
                  group.removeAttribute('fill')
                  group.style.setProperty('fill', 'none', 'important')
                }
              })
              
              console.log('✅ Text styling complete')
              
              // Set up MutationObserver to continuously fix any dark text that appears
              // This catches dynamically added or modified text elements
              const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                  if (mutation.type === 'attributes' || mutation.type === 'childList') {
                    // Re-apply white text styling to any modified or added elements
                    if (svgRef.current) {
                      const texts = svgRef.current.querySelectorAll('text, tspan')
                      texts.forEach(text => {
                        const currentFill = text.getAttribute('fill')
                        // Only update if it's dark
                        if (currentFill && (
                          currentFill.includes('#0') || 
                          currentFill.includes('#1') || 
                          currentFill.includes('#2') || 
                          currentFill.includes('#3') || 
                          currentFill === 'black' ||
                          currentFill === '#000'
                        )) {
                          console.log(`🔧 Fixing dark text: ${currentFill} → #ffffff`)
                          text.removeAttribute('fill')
                          if (text instanceof SVGElement) {
                            text.style.setProperty('fill', '#ffffff', 'important')
                          }
                          text.setAttribute('fill', '#ffffff')
                        }
                      })
                    }
                  }
                })
              })
              
              // Observe the SVG for changes
              if (svgRef.current) {
                observer.observe(svgRef.current, {
                  attributes: true,
                  attributeFilter: ['fill', 'style'],
                  childList: true,
                  subtree: true
                })
                console.log('👁️ MutationObserver set up to watch for dark text')
              }
            }
          }, 250)
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to render mind map')
        }
      }

      // Wait for next frame to ensure SVG is rendered and sized
      requestAnimationFrame(() => {
        setTimeout(() => {
          initMarkmap()
        }, 50)
      })
      
      // Cleanup on unmount
      return () => {
        markmapRef.current = null
      }
    }
  }, [code, diagramType])

  const handleZoomIn = () => {
    setZoom(prev => {
      const newZoom = Math.min(prev + 0.25, 10)
      console.log('🔍 Zoom In:', { from: prev, to: newZoom, percentage: Math.round(newZoom * 100) + '%' })
      return newZoom
    })
  }
  
  const handleZoomOut = () => {
    setZoom(prev => {
      const newZoom = Math.max(prev - 0.25, 0.25)
      console.log('🔍 Zoom Out:', { from: prev, to: newZoom, percentage: Math.round(newZoom * 100) + '%' })
      return newZoom
    })
  }
  
  const handleResetZoom = () => {
    // Reset to optimal zoom and last working position
    const optimalZoom = calculateOptimalZoom()
    const finalZoom = Math.max(0.25, Math.min(1.0, optimalZoom))
    const defaultPosition = { x: 4, y: 3 }
    console.log('🔄 Reset Zoom:', { 
      optimalZoom, 
      finalZoom, 
      position: defaultPosition,
      action: 'reset to default settings'
    })
    setZoom(finalZoom)
    setPosition(defaultPosition)
  }
  
  const handleFit = () => {
    if (markmapRef.current && diagramType === 'markmap') {
      console.log('🎯 Fitting Markmap to screen...')
      markmapRef.current.fit()
    }
  }

  const handleWheel = (e: WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    setZoom(prev => {
      const newZoom = Math.max(0.25, Math.min(10, prev + delta))
      if (Math.abs(newZoom - prev) > 0.01) { // Only log if zoom actually changed
        console.log('🖱️ Mouse Wheel Zoom:', { 
          from: prev, 
          to: newZoom, 
          percentage: Math.round(newZoom * 100) + '%',
          direction: delta > 0 ? 'zoom in' : 'zoom out'
        })
      }
      return newZoom
    })
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    console.log('🖱️ Mouse Down - Start Dragging:', {
      clientX: e.clientX,
      clientY: e.clientY,
      currentPosition: position,
      dragStart: { x: e.clientX - position.x, y: e.clientY - position.y }
    })
    setIsDragging(true)
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    const newPosition = {
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    }
    // Only log every 50px of movement to avoid spam
    if (Math.abs(newPosition.x - position.x) > 50 || Math.abs(newPosition.y - position.y) > 50) {
      console.log('🖱️ Dragging:', {
        from: position,
        to: newPosition,
        delta: {
          x: newPosition.x - position.x,
          y: newPosition.y - position.y
        }
      })
    }
    setPosition(newPosition)
  }

  const handleMouseUp = () => {
    if (isDragging) {
      console.log('🖱️ Mouse Up - Stop Dragging:', {
        finalPosition: position,
        wasDragging: true
      })
    }
    setIsDragging(false)
  }

  const handleClose = () => {
    router.back()
  }

  useEffect(() => {
    const wheelHandler = (e: WheelEvent) => handleWheel(e)
    window.addEventListener('wheel', wheelHandler, { passive: false })
    return () => window.removeEventListener('wheel', wheelHandler)
  }, [])

  if (!code) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#1E1E1E] flex items-center justify-center">
        <div className="text-gray-900 dark:text-white text-xl">No diagram code provided</div>
      </div>
    )
  }

  return (
    <div 
      className="h-screen bg-white dark:bg-[#1E1E1E] flex flex-col overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Header with Controls */}
      <div className="sticky top-0 z-50 bg-white dark:bg-[#171717] border-b border-gray-200/50 dark:border-gray-800/50">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={handleClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 group"
              title="Go back"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors" />
            </button>
            <div className="px-3 py-1.5 bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-lg">
              <span className="text-teal-700 dark:text-teal-400 text-sm font-medium">
                {diagramType === 'mermaid' ? '📊 Mermaid Diagram' : '🧠 Mind Map'}
              </span>
            </div>
            {error && (
              <div className="px-3 py-1.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <span className="text-red-600 dark:text-red-400 text-sm">⚠️ Error rendering diagram</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Diagram Canvas */}
      <div 
        ref={canvasRef}
        className="flex-1 flex items-center justify-center p-8 bg-white dark:bg-[#1E1E1E] overflow-hidden"
      >
        <div
          className="select-none flex items-center justify-center"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
            cursor: isDragging ? 'grabbing' : 'grab',
            transition: isDragging ? 'none' : 'transform 0.1s ease-out',
            width: '100%',
            height: '100%'
          }}
          onMouseDown={handleMouseDown}
        >
          {diagramType === 'mermaid' ? (
            <div 
              ref={containerRef}
              dangerouslySetInnerHTML={{ __html: svg }}
              className="mermaid-container bg-white dark:bg-gray-900 rounded-xl shadow-xl p-12 border border-gray-200 dark:border-gray-800 [&>svg]:max-w-full [&>svg]:h-auto"
              style={{ 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                maxWidth: '100%',
                maxHeight: '100%',
                overflow: 'hidden'
              }}
            />
          ) : (
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl p-4 border border-gray-200 dark:border-gray-800 overflow-hidden flex items-center justify-center" style={{
              width: '95%',
              height: '95%',
              maxWidth: '95vw',
              maxHeight: '85vh'
            }}>
              <style>{`
                /* Force white text on dark background - text colors only */
                
                /* Force ALL text to be white with absolute maximum priority */
                svg text,
                svg text *,
                svg tspan,
                svg tspan *,
                svg foreignObject text,
                svg foreignObject * {
                  fill: #ffffff !important;
                  font-weight: 600 !important;
                  color: #ffffff !important;
                  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8) !important;
                }
                
                /* Override any specific text classes */
                svg .markmap-text,
                svg .mm-node text,
                svg g text,
                svg g > text {
                  fill: #ffffff !important;
                  color: #ffffff !important;
                }
                
                /* Override ANY inline dark fills */
                svg [fill="#000"],
                svg [fill="#000000"],
                svg [fill="black"],
                svg [fill="rgb(0,0,0)"],
                svg [fill="#111"],
                svg [fill="#222"],
                svg [fill="#333"],
                svg [fill="#444"],
                svg [fill="#555"] {
                  fill: #ffffff !important;
                }
                
                /* Override any computed dark colors */
                svg g[fill*="#0"],
                svg g[fill*="#1"],
                svg g[fill*="#2"],
                svg g[fill*="#3"] {
                  fill: none !important;
                }
              `}</style>
              <svg 
                ref={svgRef} 
                className="w-full h-full max-w-full max-h-full"
                style={{ background: 'transparent' }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Footer with Instructions */}
      <div className="sticky bottom-0 bg-white dark:bg-[#171717] border-t border-gray-200/50 dark:border-gray-800/50">
        <div className="px-6 py-3 flex items-center justify-center gap-8 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-teal-500 rounded-full" />
            <span>Click and drag to pan</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full" />
            <span>Mouse wheel to zoom</span>
          </div>
        </div>
      </div>
    </div>
  )
}

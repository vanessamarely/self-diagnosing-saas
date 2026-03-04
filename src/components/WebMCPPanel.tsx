import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Play, CheckCircle, Warning, Info } from '@phosphor-icons/react'
import type { AppState, WebMCPTool, WebMCPToolResult } from '@/lib/types'
import { executeTool } from '@/lib/webmcp'
import { JsonViewer } from './JsonViewer'
import { motion } from 'framer-motion'

interface WebMCPPanelProps {
  appState: AppState
}

const tools: { name: WebMCPTool; description: string }[] = [
  { name: 'get_app_state', description: 'Get overall application state summary' },
  { name: 'get_user_session', description: 'Get current user session details' },
  { name: 'get_business_rules', description: 'Get all business rules' },
  { name: 'get_failed_events', description: 'Get all failed event logs' },
  { name: 'reproduce_bug', description: 'Reproduce the last bug with full context' },
  { name: 'generate_bug_report', description: 'Generate comprehensive bug report' },
]

interface WebMCPStatus {
  isSupported: boolean
  usingPolyfill: boolean
}

export function WebMCPPanel({ appState }: WebMCPPanelProps) {
  const [result, setResult] = useState<WebMCPToolResult | null>(null)
  const [executingTool, setExecutingTool] = useState<string | null>(null)
  const [webmcpStatus, setWebmcpStatus] = useState<WebMCPStatus>({ isSupported: false, usingPolyfill: true })

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).webMCP) {
      setWebmcpStatus({
        isSupported: (window as any).webMCP.isSupported,
        usingPolyfill: (window as any).webMCP.usingPolyfill
      })
    }
  }, [])

  const handleExecuteTool = async (toolName: WebMCPTool) => {
    setExecutingTool(toolName)
    
    await new Promise(resolve => setTimeout(resolve, 300))
    
    try {
      const toolResult = executeTool(toolName, appState)
      setResult(toolResult)
    } catch (error) {
      setResult({
        tool: toolName,
        timestamp: new Date().toISOString(),
        data: { error: error instanceof Error ? error.message : 'Unknown error' },
      })
    } finally {
      setExecutingTool(null)
    }
  }

  return (
    <Card className="h-full flex flex-col bg-muted/50">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl flex items-center gap-2">
              WebMCP Debug Tools
              {webmcpStatus.isSupported ? (
                <Badge variant="default" className="gap-1 bg-accent text-accent-foreground">
                  <CheckCircle weight="fill" size={14} />
                  Native
                </Badge>
              ) : (
                <Badge variant="secondary" className="gap-1">
                  <Warning size={14} />
                  Polyfill
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="text-sm mt-1">
              {webmcpStatus.isSupported 
                ? 'Using navigator.modelContext.provideContext'
                : 'navigator.modelContext not available - using fallback'
              }
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col gap-3 min-h-0 overflow-hidden">
        {!webmcpStatus.isSupported && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <strong>WebMCP Status:</strong> This browser doesn't support <code className="font-mono bg-muted px-1 rounded">navigator.modelContext</code> yet. 
              Tools are available via <code className="font-mono bg-muted px-1 rounded">window.webMCP</code> polyfill.
            </AlertDescription>
          </Alert>
        )}
        
        <ScrollArea className="max-h-[280px]">
          <div className="grid grid-cols-1 gap-2 pr-3">
            {tools.map((tool) => (
              <Button
                key={tool.name}
                variant="secondary"
                className="justify-start gap-2 h-auto py-2 px-3"
                onClick={() => handleExecuteTool(tool.name)}
                disabled={executingTool !== null}
              >
                {executingTool === tool.name ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    <Play className="text-primary flex-shrink-0" />
                  </motion.div>
                ) : (
                  <Play className="text-primary flex-shrink-0" />
                )}
                <div className="flex flex-col items-start text-left">
                  <span className="font-mono text-xs">{tool.name}</span>
                  <span className="text-xs text-muted-foreground font-normal">
                    {tool.description}
                  </span>
                </div>
              </Button>
            ))}
          </div>
        </ScrollArea>
        
        <Separator />
        
        {result ? (
          <div className="flex-1 flex flex-col gap-2 min-h-0 overflow-hidden">
            <div className="flex items-center justify-between flex-shrink-0">
              <span className="font-mono text-sm text-primary">{result.tool}</span>
              <span className="text-xs text-muted-foreground">
                {new Date(result.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <Card className="flex-1 bg-card/50 border-primary/20 min-h-0 overflow-hidden">
              <ScrollArea className="h-full">
                <CardContent className="p-0">
                  <JsonViewer data={result.data} />
                </CardContent>
              </ScrollArea>
            </Card>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center p-4">
            <div className="text-sm font-semibold text-foreground">
              How to Test WebMCP
            </div>
            <div className="text-xs text-muted-foreground max-w-xs space-y-3">
              <div className="text-left space-y-1">
                <p className="font-semibold">1. Click a tool button above</p>
                <p className="ml-3">View structured JSON responses</p>
              </div>
              <div className="text-left space-y-1">
                <p className="font-semibold">2. Open browser console</p>
                <p className="ml-3"><code className="font-mono bg-muted px-1 py-0.5 rounded text-[10px]">window.webMCP.tools.list()</code></p>
              </div>
              <div className="text-left space-y-1">
                <p className="font-semibold">3. Call tools directly</p>
                <p className="ml-3"><code className="font-mono bg-muted px-1 py-0.5 rounded text-[10px]">window.webMCP.tools.call('get_app_state')</code></p>
              </div>
              {webmcpStatus.isSupported && (
                <div className="text-left space-y-1">
                  <p className="font-semibold">4. Native API available</p>
                  <p className="ml-3 text-accent">Tools registered via navigator.modelContext ✓</p>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

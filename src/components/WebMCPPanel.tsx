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

        <Card className="flex-shrink-0 bg-card/30 border-primary/10">
          <CardContent className="p-3">
            <div className="text-sm font-semibold text-foreground mb-2">
              How to Test WebMCP
            </div>
            <div className="text-xs text-muted-foreground space-y-2">
              <div className="flex items-start gap-2">
                <span className="font-semibold flex-shrink-0">1.</span>
                <div>
                  <span className="font-semibold">Click a tool button below</span>
                  <span className="block text-muted-foreground/80">View structured JSON responses</span>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-semibold flex-shrink-0">2.</span>
                <div>
                  <span className="font-semibold">Open browser console</span>
                  <code className="block font-mono bg-muted px-1 py-0.5 rounded text-[10px] mt-0.5">window.webMCP.tools.list()</code>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-semibold flex-shrink-0">3.</span>
                <div>
                  <span className="font-semibold">Call tools directly</span>
                  <code className="block font-mono bg-muted px-1 py-0.5 rounded text-[10px] mt-0.5">window.webMCP.tools.call('get_app_state')</code>
                </div>
              </div>
              {webmcpStatus.isSupported && (
                <div className="flex items-start gap-2">
                  <span className="font-semibold flex-shrink-0">4.</span>
                  <div>
                    <span className="font-semibold">Native API available</span>
                    <span className="block text-accent mt-0.5">Tools registered via navigator.modelContext ✓</span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <ScrollArea className="max-h-[280px] flex-shrink-0">
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
        
        {result && (
          <>
            <Separator />
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
          </>
        )}
      </CardContent>
    </Card>
  )
}

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Play } from '@phosphor-icons/react'
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

export function WebMCPPanel({ appState }: WebMCPPanelProps) {
  const [result, setResult] = useState<WebMCPToolResult | null>(null)
  const [executingTool, setExecutingTool] = useState<string | null>(null)

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
        <CardTitle className="text-xl">WebMCP Debug Tools</CardTitle>
        <CardDescription className="text-sm">
          Internal application context exposed for AI debugging
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-3 min-h-0 overflow-hidden">
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
            <div className="text-sm text-muted-foreground max-w-xs">
              <strong>How to use WebMCP Tools:</strong>
            </div>
            <div className="text-xs text-muted-foreground max-w-xs space-y-2">
              <p>1. Click any tool button above to execute it</p>
              <p>2. View the structured JSON response below</p>
              <p>3. Try the console: <code className="font-mono bg-muted px-1 py-0.5 rounded">window.webMCP.tools.list()</code></p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

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
      <CardHeader>
        <CardTitle className="text-xl">WebMCP Debug Tools</CardTitle>
        <CardDescription>
          Internal application context exposed for AI debugging
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4 min-h-0">
        <div className="grid grid-cols-1 gap-2">
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
                  <Play className="text-primary" />
                </motion.div>
              ) : (
                <Play className="text-primary" />
              )}
              <div className="flex flex-col items-start">
                <span className="font-mono text-xs">{tool.name}</span>
                <span className="text-xs text-muted-foreground font-normal">
                  {tool.description}
                </span>
              </div>
            </Button>
          ))}
        </div>
        
        <Separator />
        
        {result ? (
          <div className="flex-1 flex flex-col gap-2 min-h-0">
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm text-primary">{result.tool}</span>
              <span className="text-xs text-muted-foreground">
                {new Date(result.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <Card className="flex-1 bg-card/50 border-primary/20 min-h-0">
              <CardContent className="p-0 h-full">
                <ScrollArea className="h-full">
                  <JsonViewer data={result.data} />
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
            Click a tool to execute and view results
          </div>
        )}
      </CardContent>
    </Card>
  )
}

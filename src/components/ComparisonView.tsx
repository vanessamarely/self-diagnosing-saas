import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Code, MagnifyingGlass, Robot, CheckCircle, XCircle, Clock } from '@phosphor-icons/react'
import type { AppState } from '@/lib/types'
import { executeTool } from '@/lib/webmcp'
import { JsonViewer } from './JsonViewer'
import { motion, AnimatePresence } from 'framer-motion'

interface ComparisonViewProps {
  appState: AppState
}

interface DebugStep {
  id: number
  description: string
  command?: string
  result?: string
  status: 'pending' | 'active' | 'complete' | 'stuck'
  timeEstimate?: string
}

const traditionalSteps: DebugStep[] = [
  {
    id: 1,
    description: 'Inspect DOM to find error message',
    command: 'document.querySelectorAll(\'.error\')',
    result: 'Found: "Checkout failed" - no details',
    status: 'complete',
    timeEstimate: '2 min'
  },
  {
    id: 2,
    description: 'Check console for errors',
    command: 'Console shows no errors',
    result: 'No stack traces, no helpful info',
    status: 'complete',
    timeEstimate: '1 min'
  },
  {
    id: 3,
    description: 'Inspect network requests',
    result: 'No failed requests visible',
    status: 'complete',
    timeEstimate: '3 min'
  },
  {
    id: 4,
    description: 'Search codebase for checkout logic',
    result: 'Found 12 files referencing checkout',
    status: 'complete',
    timeEstimate: '10 min'
  },
  {
    id: 5,
    description: 'Read through business logic',
    result: 'Complex conditional chains found',
    status: 'complete',
    timeEstimate: '15 min'
  },
  {
    id: 6,
    description: 'Check feature flags manually',
    result: 'Found 8 flags, unclear which apply',
    status: 'complete',
    timeEstimate: '5 min'
  },
  {
    id: 7,
    description: 'Review user permissions',
    result: 'Permissions stored in state, hard to trace',
    status: 'complete',
    timeEstimate: '8 min'
  },
  {
    id: 8,
    description: 'Add console.log statements',
    result: 'Recompile, test, repeat...',
    status: 'stuck',
    timeEstimate: '20+ min'
  }
]

const webmcpSteps: DebugStep[] = [
  {
    id: 1,
    description: 'Call get_failed_events tool',
    command: 'window.webMCP.tools.call("get_failed_events")',
    result: 'Complete error context retrieved',
    status: 'complete',
    timeEstimate: '10 sec'
  },
  {
    id: 2,
    description: 'Call reproduce_bug tool',
    command: 'window.webMCP.tools.call("reproduce_bug")',
    result: 'Root cause identified with full context',
    status: 'complete',
    timeEstimate: '5 sec'
  },
  {
    id: 3,
    description: 'Review structured diagnosis',
    result: 'Clear explanation: Permission conflict between user role and approval requirement',
    status: 'complete',
    timeEstimate: '30 sec'
  }
]

export function ComparisonView({ appState }: ComparisonViewProps) {
  const [activeMethod, setActiveMethod] = useState<'traditional' | 'webmcp'>('traditional')
  const [showWebMCPResult, setShowWebMCPResult] = useState(false)
  const [webmcpResult, setWebmcpResult] = useState<any>(null)

  const executeWebMCPDemo = () => {
    setShowWebMCPResult(true)
    const result = executeTool('reproduce_bug', appState)
    setWebmcpResult(result.data)
  }

  const totalTraditionalTime = traditionalSteps.reduce((acc, step) => {
    const time = parseInt(step.timeEstimate?.split(' ')[0] || '0')
    return acc + time
  }, 0)

  const totalWebMCPTime = webmcpSteps.reduce((acc, step) => {
    const time = parseInt(step.timeEstimate?.split(' ')[0] || '0')
    return acc + time
  }, 0)

  return (
    <div className="w-full h-full flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Debugging Comparison</h2>
          <p className="text-sm text-muted-foreground">
            Traditional DOM/Console vs WebMCP Context-Aware Debugging
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={activeMethod === 'traditional' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveMethod('traditional')}
          >
            <MagnifyingGlass className="mr-2" />
            Traditional
          </Button>
          <Button
            variant={activeMethod === 'webmcp' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveMethod('webmcp')}
          >
            <Robot className="mr-2" />
            WebMCP
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 min-h-0">
        <Card className={`flex flex-col ${activeMethod === 'traditional' ? 'ring-2 ring-destructive/50' : 'opacity-60'}`}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MagnifyingGlass className="text-destructive" size={24} />
                <CardTitle>Traditional Debugging</CardTitle>
              </div>
              <Badge variant="destructive" className="gap-1">
                <Clock size={14} />
                {totalTraditionalTime}+ min
              </Badge>
            </div>
            <CardDescription>
              DOM inspection, console logs, manual code search
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col gap-3 min-h-0">
            <ScrollArea className="flex-1">
              <div className="space-y-2 pr-3">
                {traditionalSteps.map((step, index) => (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className={`p-3 ${step.status === 'stuck' ? 'border-destructive bg-destructive/5' : ''}`}>
                      <div className="flex items-start gap-2">
                        <div className="mt-0.5">
                          {step.status === 'complete' && <CheckCircle className="text-muted-foreground" size={16} />}
                          {step.status === 'stuck' && <XCircle className="text-destructive" size={16} />}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{step.description}</span>
                            <span className="text-xs text-muted-foreground">{step.timeEstimate}</span>
                          </div>
                          {step.command && (
                            <code className="block text-xs bg-muted px-2 py-1 rounded font-mono text-muted-foreground">
                              {step.command}
                            </code>
                          )}
                          {step.result && (
                            <p className="text-xs text-muted-foreground">{step.result}</p>
                          )}
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>

            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                <strong>Stuck!</strong> Without internal context, debugging requires guesswork, 
                time-consuming code reading, and trial-and-error console logging.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        <Card className={`flex flex-col ${activeMethod === 'webmcp' ? 'ring-2 ring-primary' : 'opacity-60'}`}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Robot className="text-primary" size={24} />
                <CardTitle>WebMCP Debugging</CardTitle>
              </div>
              <Badge variant="default" className="gap-1 bg-accent text-accent-foreground">
                <Clock size={14} />
                {totalWebMCPTime} sec
              </Badge>
            </div>
            <CardDescription>
              Context-aware tools with structured application state
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col gap-3 min-h-0">
            <ScrollArea className="flex-1">
              <div className="space-y-2 pr-3">
                {webmcpSteps.map((step, index) => (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="p-3 border-primary/20 bg-primary/5">
                      <div className="flex items-start gap-2">
                        <div className="mt-0.5">
                          <CheckCircle className="text-primary" size={16} />
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{step.description}</span>
                            <span className="text-xs text-muted-foreground">{step.timeEstimate}</span>
                          </div>
                          {step.command && (
                            <code className="block text-xs bg-card px-2 py-1 rounded font-mono text-primary">
                              {step.command}
                            </code>
                          )}
                          {step.result && (
                            <p className="text-xs text-muted-foreground">{step.result}</p>
                          )}
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>

            {!showWebMCPResult ? (
              <Alert className="border-primary bg-primary/10">
                <Robot className="h-4 w-4 text-primary" />
                <AlertDescription className="text-xs">
                  <Button 
                    size="sm" 
                    className="w-full mt-2"
                    onClick={executeWebMCPDemo}
                  >
                    <Code className="mr-2" />
                    Execute WebMCP Demo
                  </Button>
                </AlertDescription>
              </Alert>
            ) : (
              <Card className="border-primary/20 bg-accent/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <CheckCircle className="text-accent" />
                    Bug Diagnosed
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="max-h-[200px]">
                    <div className="px-4 pb-4">
                      <JsonViewer data={webmcpResult} />
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-accent/10 border-accent">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-accent">
                {Math.round((totalTraditionalTime / totalWebMCPTime) * 10) / 10}x
              </div>
              <div className="text-xs text-muted-foreground">Faster with WebMCP</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">100%</div>
              <div className="text-xs text-muted-foreground">Context Accuracy</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-destructive">0</div>
              <div className="text-xs text-muted-foreground">Guesswork Required</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

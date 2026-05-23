import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Brain, Robot, Sparkle, CheckCircle, Warning, Info, Play } from '@phosphor-icons/react'
import { motion, AnimatePresence } from 'framer-motion'
import type { AppState } from '@/lib/types'
import { executeTool } from '@/lib/webmcp'
import { JsonViewer } from './JsonViewer'

interface AIAssistantProps {
  appState: AppState
}

interface DiagnosticStep {
  id: string
  tool: string
  description: string
  status: 'pending' | 'running' | 'complete' | 'error'
  result?: any
  timestamp?: string
}

interface DiagnosticResult {
  issue: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  rootCause: string
  affectedComponents: string[]
  recommendation: string
  steps: string[]
}

export function AIAssistant({ appState }: AIAssistantProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [diagnosticSteps, setDiagnosticSteps] = useState<DiagnosticStep[]>([])
  const [diagnosis, setDiagnosis] = useState<DiagnosticResult | null>(null)
  const [autoMode, setAutoMode] = useState(false)

  useEffect(() => {
    if (autoMode && appState.failedEvents.length > 0) {
      const lastFailedEvent = appState.failedEvents[appState.failedEvents.length - 1]
      const existingDiagnosis = diagnosticSteps.find(
        step => step.result?.failedEvent?.id === lastFailedEvent.id
      )
      
      if (!existingDiagnosis && !isAnalyzing) {
        runAutoDiagnosis()
      }
    }
  }, [appState.failedEvents, autoMode])

  const runAutoDiagnosis = async () => {
    setIsAnalyzing(true)
    setDiagnosticSteps([])
    setDiagnosis(null)

    const steps: DiagnosticStep[] = [
      {
        id: '1',
        tool: 'get_app_state',
        description: 'Calling get_app_state via W3C WebMCP API...',
        status: 'pending'
      },
      {
        id: '2',
        tool: 'get_failed_events',
        description: 'Calling get_failed_events to retrieve error logs...',
        status: 'pending'
      },
      {
        id: '3',
        tool: 'reproduce_bug',
        description: 'Calling reproduce_bug for detailed analysis...',
        status: 'pending'
      },
      {
        id: '4',
        tool: 'generate_bug_report',
        description: 'Calling generate_bug_report for recommendations...',
        status: 'pending'
      }
    ]

    for (const step of steps) {
      setDiagnosticSteps(prev => [...prev.filter(s => s.id !== step.id), { ...step, status: 'running' }])
      
      await new Promise(resolve => setTimeout(resolve, 800))
      
      try {
        const result = await executeTool(step.tool as any, appState)
        
        setDiagnosticSteps(prev => 
          prev.map(s => 
            s.id === step.id 
              ? { ...s, status: 'complete', result: result.data, timestamp: result.timestamp }
              : s
          )
        )

        if (step.tool === 'reproduce_bug') {
          await analyzeBugResult(result.data)
        }
      } catch (error) {
        setDiagnosticSteps(prev => 
          prev.map(s => 
            s.id === step.id 
              ? { ...s, status: 'error', result: { error: error instanceof Error ? error.message : 'Unknown error' }}
              : s
          )
        )
      }
    }

    setIsAnalyzing(false)
  }

  const analyzeBugResult = async (bugData: any) => {
    if (bugData.status === 'no_bugs_found') {
      setDiagnosis({
        issue: 'No issues detected',
        severity: 'low',
        rootCause: 'Application is functioning normally',
        affectedComponents: [],
        recommendation: 'Continue monitoring for any new issues',
        steps: []
      })
      return
    }

    const failedEvent = bugData.failedEvent
    const userContext = bugData.userContext
    
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
    let issue = failedEvent?.errorMessage || 'Unknown issue'
    let rootCause = ''
    let affectedComponents: string[] = []
    let recommendation = ''
    let resolutionSteps: string[] = []

    if (failedEvent?.context?.reason === 'permission_denied') {
      severity = 'high'
      rootCause = `User role '${userContext.role}' lacks required permissions: ${userContext.missingPermissions.join(', ')}`
      affectedComponents = ['User Permissions', 'Role-Based Access Control']
      recommendation = `Grant the following permissions to role '${userContext.role}': ${userContext.missingPermissions.join(', ')}`
      resolutionSteps = [
        'Navigate to Admin Panel → User Session',
        `Add missing permissions: ${userContext.missingPermissions.join(', ')}`,
        'Retry the failed operation',
        'Verify the operation completes successfully'
      ]
    } else if (failedEvent?.context?.reason === 'feature_flag_disabled') {
      severity = 'medium'
      const disabledFlags = failedEvent.context.affectedFlags || []
      rootCause = `Required feature flags are disabled: ${disabledFlags.join(', ')}`
      affectedComponents = ['Feature Flags', 'Checkout Flow']
      recommendation = `Enable the following feature flags: ${disabledFlags.join(', ')}`
      resolutionSteps = [
        'Navigate to Admin Panel → Feature Flags',
        `Enable flags: ${disabledFlags.join(', ')}`,
        'Retry the failed operation',
        'Monitor for additional flag conflicts'
      ]
    } else if (failedEvent?.context?.reason === 'feature_flag_conflict') {
      severity = 'critical'
      const conflictingFlags = bugData.conflictingFlags || []
      rootCause = `Multiple feature flags creating conflicting behavior: ${conflictingFlags.map((f: any) => f.name).join(', ')}`
      affectedComponents = ['Feature Flags', 'Business Logic']
      recommendation = 'Review and resolve conflicting feature flag combinations'
      resolutionSteps = [
        'Analyze feature flag dependencies',
        'Disable conflicting flags or adjust logic',
        'Test all affected workflows',
        'Document flag interaction patterns'
      ]
    }

    setDiagnosis({
      issue,
      severity,
      rootCause,
      affectedComponents,
      recommendation,
      steps: resolutionSteps
    })
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-accent/20 text-accent'
      case 'medium': return 'bg-primary/20 text-primary'
      case 'high': return 'bg-destructive/30 text-destructive'
      case 'critical': return 'bg-destructive text-destructive-foreground'
      default: return 'bg-muted text-muted-foreground'
    }
  }

  const getStepIcon = (status: DiagnosticStep['status']) => {
    switch (status) {
      case 'running':
        return (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <Sparkle className="text-primary" size={16} />
          </motion.div>
        )
      case 'complete':
        return <CheckCircle className="text-accent" size={16} weight="fill" />
      case 'error':
        return <Warning className="text-destructive" size={16} weight="fill" />
      default:
        return <div className="w-4 h-4 rounded-full border-2 border-muted" />
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
      <Card className="lg:col-span-1 flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="text-primary" size={24} weight="fill" />
              <CardTitle className="text-lg">AI Diagnostics</CardTitle>
            </div>
            <Badge variant="secondary" className="gap-1">
              <Robot size={14} />
              Auto
            </Badge>
          </div>
          <CardDescription className="text-xs">
            W3C WebMCP tools via navigator.modelContext
          </CardDescription>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Button
              onClick={runAutoDiagnosis}
              disabled={isAnalyzing}
              className="flex-1"
              size="sm"
            >
              {isAnalyzing ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="mr-2"
                  >
                    <Sparkle size={16} />
                  </motion.div>
                  Analyzing...
                </>
              ) : (
                <>
                  <Play className="mr-2" size={16} />
                  Run Diagnosis
                </>
              )}
            </Button>
            <Button
              variant={autoMode ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAutoMode(!autoMode)}
              disabled={isAnalyzing}
            >
              <Robot size={16} className="mr-1" />
              {autoMode ? 'On' : 'Off'}
            </Button>
          </div>

          {autoMode && (
            <Alert className="border-primary bg-primary/10">
              <Robot className="h-4 w-4 text-primary" />
              <AlertDescription className="text-xs">
                <strong>Auto-mode active:</strong> AI will automatically run diagnostics when new failures are detected using W3C WebMCP tools.
              </AlertDescription>
            </Alert>
          )}

          {appState.failedEvents.length === 0 && !isAnalyzing && diagnosticSteps.length === 0 && (
            <Alert className="border-accent/30 bg-accent/5">
              <Info className="h-4 w-4 text-accent" />
              <AlertDescription className="text-xs space-y-2">
                <p><strong>W3C WebMCP AI Assistant</strong></p>
                <p>This AI uses the W3C standard <code className="font-mono bg-muted px-1 rounded">navigator.modelContext</code> API to call debugging tools and diagnose issues automatically.</p>
                <p className="text-muted-foreground">💡 Try checking out Bob Smith's order ($299.99) in the Orders tab to trigger a permission error and see AI diagnostics in action!</p>
              </AlertDescription>
            </Alert>
          )}

          {diagnosticSteps.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Diagnostic Steps
                </h4>
                <ScrollArea className="max-h-[200px]">
                  <div className="space-y-2 pr-3">
                    <AnimatePresence mode="popLayout">
                      {diagnosticSteps.map((step, index) => (
                        <motion.div
                          key={step.id}
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <div className="flex items-center gap-2 text-xs">
                            {getStepIcon(step.status)}
                            <span className={step.status === 'running' ? 'text-primary font-medium' : ''}>
                              {step.description}
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </ScrollArea>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-2 flex flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkle className="text-accent" weight="fill" />
            Diagnosis Report
          </CardTitle>
          <CardDescription className="text-xs">
            AI-powered root cause analysis via W3C WebMCP API
          </CardDescription>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col gap-3 min-h-0">
          {!diagnosis && diagnosticSteps.length === 0 && (
            <div className="flex-1 flex items-center justify-center text-center p-8">
              <div className="space-y-3 max-w-md">
                <Robot size={48} className="mx-auto text-muted-foreground" />
                <p className="text-sm font-medium">AI-Powered Diagnostics</p>
                <p className="text-xs text-muted-foreground">
                  Click "Run Diagnosis" to start automated root cause analysis using W3C WebMCP standard
                </p>
                <Alert className="text-left border-primary/30">
                  <Info className="h-3 w-3" />
                  <AlertDescription className="text-xs">
                    <strong>How it works:</strong> The AI calls debugging tools (<code className="font-mono bg-muted px-1 rounded">get_app_state</code>, <code className="font-mono bg-muted px-1 rounded">get_failed_events</code>, <code className="font-mono bg-muted px-1 rounded">reproduce_bug</code>, <code className="font-mono bg-muted px-1 rounded">generate_bug_report</code>) via the W3C <code className="font-mono bg-muted px-1 rounded">navigator.modelContext.provideContext()</code> API to diagnose issues without reading code.
                  </AlertDescription>
                </Alert>
              </div>
            </div>
          )}

          {diagnosis && (
            <ScrollArea className="flex-1">
              <div className="space-y-4 pr-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Issue Detected</h3>
                    <Badge className={getSeverityColor(diagnosis.severity)}>
                      {diagnosis.severity.toUpperCase()}
                    </Badge>
                  </div>
                  <Alert variant={diagnosis.severity === 'critical' || diagnosis.severity === 'high' ? 'destructive' : 'default'}>
                    <Warning className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      {diagnosis.issue}
                    </AlertDescription>
                  </Alert>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold text-sm">Root Cause</h3>
                  <Card className="p-3 bg-muted/50">
                    <p className="text-sm text-foreground">{diagnosis.rootCause}</p>
                  </Card>
                </div>

                {diagnosis.affectedComponents.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm">Affected Components</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {diagnosis.affectedComponents.map((component, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {component}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <CheckCircle className="text-accent" weight="fill" />
                    Recommendation
                  </h3>
                  <Alert className="border-accent bg-accent/10">
                    <AlertDescription className="text-sm">
                      {diagnosis.recommendation}
                    </AlertDescription>
                  </Alert>
                </div>

                {diagnosis.steps.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm">Resolution Steps</h3>
                    <ol className="space-y-2">
                      {diagnosis.steps.map((step, i) => (
                        <li key={i} className="flex gap-2 text-sm">
                          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">
                            {i + 1}
                          </span>
                          <span className="flex-1 pt-0.5">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                <Separator />

                <div className="space-y-2">
                  <h3 className="font-semibold text-sm">Technical Details</h3>
                  <Card className="bg-muted/30">
                    <ScrollArea className="max-h-[200px]">
                      <CardContent className="p-3">
                        {diagnosticSteps.find(s => s.tool === 'reproduce_bug')?.result && (
                          <JsonViewer 
                            data={diagnosticSteps.find(s => s.tool === 'reproduce_bug')?.result} 
                          />
                        )}
                      </CardContent>
                    </ScrollArea>
                  </Card>
                </div>
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

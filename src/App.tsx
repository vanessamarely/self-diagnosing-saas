import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Sparkle, FileText, Cursor, Mouse, PencilSimple, Clock, Plus, Info } from '@phosphor-icons/react'
import type { ModelContext } from '@/lib/types'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

function App() {
  const [contexts, setContexts] = useState<ModelContext[]>([])
  const [customContext, setCustomContext] = useState('')
  const [apiAvailable, setApiAvailable] = useState<boolean | null>(null)
  const [activeTab, setActiveTab] = useState('active')

  useEffect(() => {
    checkAPIAvailability()
    loadContexts()

    const messageListener = (message: any) => {
      if (message.type === 'context-added') {
        setContexts(prev => [...prev, message.context])
        toast.success('Context added')
      } else if (message.type === 'context-updated') {
        loadContexts()
      }
    }

    chrome.runtime.onMessage.addListener(messageListener)
    return () => chrome.runtime.onMessage.removeListener(messageListener)
  }, [])

  const checkAPIAvailability = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (!tab.id) return

    chrome.tabs.sendMessage(tab.id, { type: 'check-api' }, (response) => {
      if (chrome.runtime.lastError) {
        setApiAvailable(false)
        return
      }
      setApiAvailable(response?.available || false)
    })
  }

  const loadContexts = async () => {
    const result = await chrome.storage.local.get(['contexts'])
    setContexts(result.contexts || [])
  }

  const addCustomContext = async () => {
    if (!customContext.trim()) {
      toast.error('Please enter some context')
      return
    }

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (!tab.id) return

    const newContext: ModelContext = {
      id: `custom-${Date.now()}`,
      type: 'custom',
      content: customContext,
      timestamp: Date.now(),
      enabled: true
    }

    chrome.tabs.sendMessage(tab.id, { type: 'add-context', context: newContext })
    setCustomContext('')
    toast.success('Custom context added')
  }

  const toggleContext = async (contextId: string) => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (!tab.id) return

    chrome.tabs.sendMessage(tab.id, { type: 'toggle-context', contextId })
    
    setContexts(prev =>
      prev.map(ctx =>
        ctx.id === contextId ? { ...ctx, enabled: !ctx.enabled } : ctx
      )
    )
  }

  const getContextIcon = (type: ModelContext['type']) => {
    switch (type) {
      case 'page':
        return <FileText className="w-4 h-4" />
      case 'selection':
        return <Cursor className="w-4 h-4" />
      case 'interaction':
        return <Mouse className="w-4 h-4" />
      case 'custom':
        return <PencilSimple className="w-4 h-4" />
    }
  }

  const getContextTypeColor = (type: ModelContext['type']) => {
    switch (type) {
      case 'page':
        return 'bg-primary/20 text-primary'
      case 'selection':
        return 'bg-accent/20 text-accent'
      case 'interaction':
        return 'bg-secondary/20 text-secondary-foreground'
      case 'custom':
        return 'bg-muted text-muted-foreground'
    }
  }

  const formatTimestamp = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)

    if (seconds < 60) return `${seconds}s ago`
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return new Date(timestamp).toLocaleString()
  }

  const activeContexts = contexts.filter(ctx => ctx.enabled)
  const allContextsHistory = [...contexts].reverse()

  return (
    <div className="w-[380px] min-h-[500px] max-h-[600px] bg-background text-foreground">
      <div className="p-4 border-b border-border bg-card">
        <div className="flex items-center gap-2 mb-2">
          <Sparkle className="w-5 h-5 text-accent" weight="fill" />
          <h1 className="text-lg font-semibold">ModelContext API</h1>
        </div>
        {apiAvailable === false && (
          <Alert className="mt-2">
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs">
              The navigator.modelContext API is not available. Enable the Prompt API in chrome://flags
            </AlertDescription>
          </Alert>
        )}
        {apiAvailable === true && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            API Available
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
        <TabsList className="w-full grid grid-cols-2 m-4 mb-0">
          <TabsTrigger value="active">
            Active ({activeContexts.length})
          </TabsTrigger>
          <TabsTrigger value="history">
            <Clock className="w-3 h-3 mr-1" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="p-4 space-y-3 mt-0 pt-4">
          <Card>
            <CardHeader className="p-3 pb-2">
              <CardTitle className="text-sm">Add Custom Context</CardTitle>
              <CardDescription className="text-xs">
                Provide additional context to the AI model
              </CardDescription>
            </CardHeader>
            <CardContent className="p-3 pt-0 space-y-2">
              <Textarea
                id="custom-context"
                placeholder="E.g., 'The user is looking for restaurants in Toronto'"
                value={customContext}
                onChange={(e) => setCustomContext(e.target.value)}
                className="text-sm min-h-[60px] resize-none"
              />
              <Button 
                size="sm" 
                className="w-full" 
                onClick={addCustomContext}
                disabled={!apiAvailable || !customContext.trim()}
              >
                <Plus className="w-3 h-3 mr-1" />
                Add Context
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-2">
            <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground px-1">
              Active Contexts
            </h3>
            <ScrollArea className="h-[280px]">
              <AnimatePresence mode="popLayout">
                {activeContexts.length === 0 ? (
                  <Card className="p-4">
                    <p className="text-sm text-muted-foreground text-center">
                      No active contexts. Interact with the page to generate context.
                    </p>
                  </Card>
                ) : (
                  activeContexts.map((context) => (
                    <motion.div
                      key={context.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                    >
                      <Card className="mb-2 overflow-hidden">
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <Badge className={`${getContextTypeColor(context.type)} gap-1 text-xs`}>
                              {getContextIcon(context.type)}
                              {context.type}
                            </Badge>
                            <Switch
                              checked={context.enabled}
                              onCheckedChange={() => toggleContext(context.id)}
                              className="scale-75"
                            />
                          </div>
                          <p className="text-xs text-foreground line-clamp-3 mb-1">
                            {context.content}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {formatTimestamp(context.timestamp)}
                          </p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </ScrollArea>
          </div>
        </TabsContent>

        <TabsContent value="history" className="p-4 space-y-2 mt-0 pt-4">
          <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground px-1">
            Context History
          </h3>
          <ScrollArea className="h-[420px]">
            {allContextsHistory.length === 0 ? (
              <Card className="p-4">
                <p className="text-sm text-muted-foreground text-center">
                  No context history yet.
                </p>
              </Card>
            ) : (
              allContextsHistory.map((context) => (
                <Card key={context.id} className={`mb-2 ${!context.enabled && 'opacity-50'}`}>
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <Badge className={`${getContextTypeColor(context.type)} gap-1 text-xs`}>
                        {getContextIcon(context.type)}
                        {context.type}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {formatTimestamp(context.timestamp)}
                      </span>
                    </div>
                    <p className="text-xs text-foreground">
                      {context.content}
                    </p>
                    {context.metadata && Object.keys(context.metadata).length > 0 && (
                      <div className="mt-2 p-2 bg-muted rounded text-[10px] font-mono">
                        {JSON.stringify(context.metadata, null, 2)}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default App

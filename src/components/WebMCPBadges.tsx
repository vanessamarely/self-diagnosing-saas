import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { CheckCircle, Code, Info, Lightning } from '@phosphor-icons/react'

interface WebMCPInfo {
  isSupported: boolean
  usingPolyfill: boolean
  implementationMode: 'declarative' | 'polyfill'
  toolsCount: number
}

export function WebMCPBadges() {
  const [webMCPInfo, setWebMCPInfo] = useState<WebMCPInfo>({
    isSupported: false,
    usingPolyfill: true,
    implementationMode: 'polyfill',
    toolsCount: 0,
  })
  const [showDialog, setShowDialog] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).webMCP) {
      const webMCP = (window as any).webMCP
      setWebMCPInfo({
        isSupported: webMCP.isSupported || false,
        usingPolyfill: webMCP.usingPolyfill || false,
        implementationMode: webMCP.implementationMode || 'polyfill',
        toolsCount: webMCP.tools?.list()?.length || 0,
      })
    }
  }, [])

  const version = '1.0.0'
  const specVersion = 'W3C Working Draft'
  const isDeclarative = webMCPInfo.implementationMode === 'declarative'

  return (
    <>
      <div className="flex items-center gap-2 flex-wrap">
        <Badge
          variant="outline"
          className="cursor-pointer hover:bg-primary/10 transition-colors gap-1.5 px-2.5 py-1"
          onClick={() => setShowDialog(true)}
        >
          <Code size={14} weight="bold" className="text-primary" />
          <span className="font-semibold">WebMCP</span>
          <span className="text-muted-foreground">{version}</span>
        </Badge>

        <Badge
          variant={isDeclarative ? 'default' : 'secondary'}
          className={`cursor-pointer transition-colors gap-1.5 px-2.5 py-1 ${
            isDeclarative
              ? 'bg-accent hover:bg-accent/90 text-accent-foreground'
              : 'hover:bg-secondary/80'
          }`}
          onClick={() => setShowDialog(true)}
        >
          {isDeclarative ? (
            <CheckCircle size={14} weight="fill" />
          ) : (
            <Lightning size={14} weight="fill" />
          )}
          <span className="font-semibold">
            {isDeclarative ? 'Declarative' : 'Polyfill'}
          </span>
        </Badge>

        <Badge
          variant="outline"
          className="cursor-pointer hover:bg-muted transition-colors gap-1.5 px-2.5 py-1"
          onClick={() => setShowDialog(true)}
        >
          <Info size={14} weight="fill" className="text-primary" />
          <span>{webMCPInfo.toolsCount} Tools</span>
        </Badge>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Code size={24} weight="bold" className="text-primary" />
              WebMCP Implementation Details
            </DialogTitle>
            <DialogDescription>
              Model Context Protocol for AI-Agent Interaction
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Version</span>
                    <Badge variant="outline">{version}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Specification</span>
                    <Badge variant="outline">{specVersion}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Tools Registered</span>
                    <Badge variant="outline">{webMCPInfo.toolsCount}</Badge>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  {isDeclarative ? (
                    <CheckCircle size={18} weight="fill" className="text-accent" />
                  ) : (
                    <Lightning size={18} weight="fill" className="text-secondary-foreground" />
                  )}
                  Implementation Mode: {webMCPInfo.implementationMode.toUpperCase()}
                </h4>
                
                {isDeclarative ? (
                  <div className="space-y-2 text-sm">
                    <div className="bg-accent/10 border border-accent/30 rounded-lg p-3 space-y-2">
                      <div className="flex items-start gap-2">
                        <CheckCircle size={16} weight="fill" className="text-accent mt-0.5" />
                        <div>
                          <p className="font-medium text-accent-foreground">
                            ✓ Using W3C Standard API
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Tools are registered declaratively via{' '}
                            <code className="font-mono bg-muted px-1 rounded">
                              navigator.modelContext.provideContext()
                            </code>
                          </p>
                        </div>
                      </div>
                      <Separator className="opacity-50" />
                      <div className="text-xs space-y-1">
                        <p className="font-medium">Benefits:</p>
                        <ul className="list-disc list-inside space-y-0.5 text-muted-foreground ml-2">
                          <li>W3C standardized approach (recommended)</li>
                          <li>All tools registered at once</li>
                          <li>Better browser integration</li>
                          <li>Native AI agent support</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 text-sm">
                    <div className="bg-muted border border-border rounded-lg p-3 space-y-2">
                      <div className="flex items-start gap-2">
                        <Lightning size={16} weight="fill" className="text-muted-foreground mt-0.5" />
                        <div>
                          <p className="font-medium">Using Polyfill Mode</p>
                          <p className="text-xs text-muted-foreground">
                            Tools are accessible via{' '}
                            <code className="font-mono bg-background px-1 rounded">
                              window.webMCP
                            </code>
                            {' '}fallback API
                          </p>
                        </div>
                      </div>
                      <Separator className="opacity-50" />
                      <div className="text-xs space-y-1">
                        <p className="font-medium">Note:</p>
                        <p className="text-muted-foreground">
                          Native WebMCP API (navigator.modelContext) is not available in this
                          browser. Using compatibility layer.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="font-semibold">Registered Tools ({webMCPInfo.toolsCount})</h4>
                <div className="space-y-1.5 text-xs">
                  {typeof window !== 'undefined' && (window as any).webMCP && (
                    (window as any).webMCP.tools.list().map((tool: any, index: number) => (
                      <div
                        key={tool.name}
                        className="bg-muted/50 border border-border rounded p-2 space-y-1"
                      >
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] font-mono">
                            {index + 1}
                          </Badge>
                          <code className="font-mono font-semibold">{tool.name}</code>
                        </div>
                        <p className="text-muted-foreground text-[11px] leading-relaxed">
                          {tool.description}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="font-semibold">Documentation</h4>
                <div className="space-y-2 text-xs">
                  <a
                    href="https://github.com/webmachinelearning/webmcp"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary hover:underline"
                  >
                    <Code size={14} />
                    W3C WebMCP Specification
                  </a>
                  <a
                    href="https://github.com/explainers-by-googlers/prompt-api"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary hover:underline"
                  >
                    <Code size={14} />
                    Prompt API Explainer
                  </a>
                  <p className="text-muted-foreground pt-2">
                    View implementation details in the{' '}
                    <span className="font-mono bg-muted px-1 rounded">
                      W3C_WEBMCP_IMPLEMENTATION.md
                    </span>{' '}
                    file
                  </p>
                </div>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  )
}

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { TooltipProvider } from '@/components/ui/tooltip'
import { TouchTooltip } from '@/components/TouchTooltip'
import { Play, CheckCircle, Warning, Info, BookOpen } from '@phosphor-icons/react'
import type { AppState, WebMCPTool, WebMCPToolResult } from '@/lib/types'
import { executeTool } from '@/lib/webmcp'
import { JsonViewer } from './JsonViewer'
import { motion } from 'framer-motion'

interface WebMCPPanelProps {
  appState: AppState
}

interface ToolInfo {
  name: WebMCPTool
  description: string
  tooltip: {
    purpose: string
    whenToUse: string
    examples: string[]
  }
}

const toolCategories: Array<{ category: string; tools: ToolInfo[] }> = [
  {
    category: 'State & Session',
    tools: [
      { 
        name: 'get_app_state' as WebMCPTool, 
        description: 'Get overall application state summary',
        tooltip: {
          purpose: 'Returns a comprehensive snapshot of the entire application state',
          whenToUse: 'When you need to understand the full context of the application',
          examples: [
            'Check how many orders exist',
            'See all feature flags at once',
            'Get complete system overview'
          ]
        }
      },
      { 
        name: 'get_user_session' as WebMCPTool, 
        description: 'Get current user session details',
        tooltip: {
          purpose: 'Returns the current user\'s authentication and authorization details',
          whenToUse: 'When debugging permission or role-based issues',
          examples: [
            'Verify user has "approve_orders" permission',
            'Check if user is admin or regular user',
            'Diagnose authorization failures'
          ]
        }
      },
    ]
  },
  {
    category: 'Shopping Cart',
    tools: [
      { 
        name: 'get_active_cart' as WebMCPTool, 
        description: 'Get active shopping cart contents',
        tooltip: {
          purpose: 'Returns structured JSON with current cart items, quantities, and total price',
          whenToUse: 'When you need to inspect the current cart state',
          examples: [
            'Check pending orders in cart',
            'Verify cart total calculations',
            'See all items awaiting checkout'
          ]
        }
      },
      { 
        name: 'add_item_to_cart' as WebMCPTool, 
        description: 'Add item to shopping cart',
        tooltip: {
          purpose: 'Adds a specific product to the user\'s shopping cart',
          whenToUse: 'When testing cart operations or automating purchases',
          examples: [
            'Add product with ID "prod_123"',
            'Add multiple quantities of an item',
            'Test cart update workflows'
          ]
        }
      },
      { 
        name: 'remove_item_from_cart' as WebMCPTool, 
        description: 'Remove specific item from cart',
        tooltip: {
          purpose: 'Removes a specific order/item from the shopping cart by order ID',
          whenToUse: 'When you need to remove unwanted items from the cart',
          examples: [
            'Remove order with ID "order_123"',
            'Test cart removal workflows',
            'Clean up incorrect cart items'
          ]
        }
      },
      { 
        name: 'clear_cart' as WebMCPTool, 
        description: 'Clear all items from cart',
        tooltip: {
          purpose: 'Removes all pending items from the shopping cart at once',
          whenToUse: 'When you need to empty the entire cart',
          examples: [
            'Reset cart to empty state',
            'Cancel all pending orders',
            'Test cart clearing workflows'
          ]
        }
      },
      { 
        name: 'update_cart_quantity' as WebMCPTool, 
        description: 'Update item quantity/amount',
        tooltip: {
          purpose: 'Updates the quantity or price amount of a specific cart item',
          whenToUse: 'When you need to modify cart item quantities or pricing',
          examples: [
            'Change order amount to $150',
            'Update item quantity',
            'Test price adjustment workflows'
          ]
        }
      },
    ]
  },
  {
    category: 'Configuration',
    tools: [
      { 
        name: 'get_business_rules' as WebMCPTool, 
        description: 'Get all business rules',
        tooltip: {
          purpose: 'Returns all configured business rules and their current status',
          whenToUse: 'When operations fail due to business logic constraints',
          examples: [
            'Check if high-value order rules are enabled',
            'See which rules affect checkout flow',
            'Debug order approval requirements'
          ]
        }
      },
    ]
  },
  {
    category: 'Debugging',
    tools: [
      { 
        name: 'get_failed_events' as WebMCPTool, 
        description: 'Get all failed event logs',
        tooltip: {
          purpose: 'Returns a log of all failed operations with full error context',
          whenToUse: 'When investigating why something went wrong',
          examples: [
            'See permission denied errors',
            'Check which feature flags caused failures',
            'Review checkout failure history'
          ]
        }
      },
      { 
        name: 'reproduce_bug' as WebMCPTool, 
        description: 'Reproduce the last bug with full context',
        tooltip: {
          purpose: 'Provides step-by-step reproduction of the most recent failure',
          whenToUse: 'When you need to recreate an error for debugging',
          examples: [
            'Get exact steps that caused permission error',
            'See which order triggered the failure',
            'Identify conflicting rules in sequence'
          ]
        }
      },
      { 
        name: 'generate_bug_report' as WebMCPTool, 
        description: 'Generate comprehensive bug report',
        tooltip: {
          purpose: 'Creates a detailed bug report with all relevant context for developers',
          whenToUse: 'When reporting an issue to the development team',
          examples: [
            'Generate report for checkout failures',
            'Create detailed issue with user context',
            'Export complete debugging information'
          ]
        }
      },
    ]
  }
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
      const toolResult = await executeTool(toolName, appState)
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
    <TooltipProvider delayDuration={300}>
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
                  ? 'W3C Standard: navigator.modelContext API'
                  : 'Polyfill Mode: window.webMCP fallback'
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
              <strong>Polyfill Mode Active:</strong> This browser doesn't support the W3C standard <code className="font-mono bg-muted px-1 rounded">navigator.modelContext</code> API yet. 
              All WebMCP tools are still fully functional via the <code className="font-mono bg-muted px-1 rounded">window.webMCP</code> compatibility layer.
            </AlertDescription>
          </Alert>
        )}
        
        {webmcpStatus.isSupported && (
          <Alert className="border-accent bg-accent/10">
            <CheckCircle className="h-4 w-4 text-accent" />
            <AlertDescription className="text-xs">
              <strong>Native WebMCP Supported:</strong> This browser supports the W3C <code className="font-mono bg-muted px-1 rounded">navigator.modelContext</code> API. 
              Tools are registered natively and can be discovered by AI agents automatically.
            </AlertDescription>
          </Alert>
        )}

        <Accordion type="multiple" defaultValue={['instructions']} className="flex-shrink-0">
          <AccordionItem value="instructions" className="border rounded-lg px-4 bg-card/30">
            <AccordionTrigger className="text-sm font-semibold hover:no-underline py-3">
              W3C WebMCP Testing Guide
            </AccordionTrigger>
            <AccordionContent className="pb-3">
              <div className="text-xs text-muted-foreground space-y-2">
                <div className="flex items-start gap-2">
                  <span className="font-semibold flex-shrink-0">1.</span>
                  <div>
                    <span className="font-semibold">Test via UI</span>
                    <span className="block text-muted-foreground/80">Click tool buttons below to execute and view JSON responses</span>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-semibold flex-shrink-0">2.</span>
                  <div>
                    <span className="font-semibold">Test via Console</span>
                    <code className="block font-mono bg-muted px-1 py-0.5 rounded text-[10px] mt-0.5">window.webMCP.tools.list()</code>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-semibold flex-shrink-0">3.</span>
                  <div>
                    <span className="font-semibold">Call tools programmatically</span>
                    <code className="block font-mono bg-muted px-1 py-0.5 rounded text-[10px] mt-0.5">await window.webMCP.tools.call('get_app_state')</code>
                  </div>
                </div>
                {webmcpStatus.isSupported && (
                  <div className="flex items-start gap-2">
                    <span className="font-semibold flex-shrink-0">4.</span>
                    <div>
                      <span className="font-semibold">W3C Native Mode Active</span>
                      <span className="block text-accent mt-0.5">Tools registered via navigator.modelContext.provideContext() ✓</span>
                    </div>
                  </div>
                )}
                <Separator className="my-2" />
                <div className="space-y-1">
                  <div className="font-semibold flex items-center gap-1 text-primary">
                    <BookOpen size={14} />
                    WebMCP Documentation
                  </div>
                  <div className="space-y-1 pl-1">
                    <a 
                      href="https://github.com/webmachinelearning/webmcp" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 hover:text-primary transition-colors"
                    >
                      <span className="text-[10px]">→</span>
                      <span>Official W3C WebMCP Proposal</span>
                    </a>
                    <a 
                      href="https://github.com/WebMCP-org" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 hover:text-primary transition-colors"
                    >
                      <span className="text-[10px]">→</span>
                      <span>WebMCP Organization (Examples)</span>
                    </a>
                    <a 
                      href="https://modelcontextprotocol.io" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 hover:text-primary transition-colors"
                    >
                      <span className="text-[10px]">→</span>
                      <span>Model Context Protocol (MCP)</span>
                    </a>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        
        <Accordion type="multiple" defaultValue={['state', 'shopping-cart', 'config', 'debug']} className="flex-shrink-0">
          {toolCategories.map(({ category, tools }) => (
            <AccordionItem 
              key={category} 
              value={category.toLowerCase().replace(/\s+/g, '-')}
              className="border rounded-lg px-4 mb-2 bg-card/30"
            >
              <AccordionTrigger className="text-sm font-semibold hover:no-underline py-3">
                {category}
              </AccordionTrigger>
              <AccordionContent className="pb-3">
                <div className="space-y-2">
                  {tools.map((tool) => (
                    <TouchTooltip
                      key={tool.name}
                      side="top"
                      sideOffset={10}
                      className="max-w-xs p-3"
                      content={
                        <div className="space-y-2">
                          <div>
                            <div className="font-semibold text-xs mb-1">Purpose</div>
                            <div className="text-xs text-primary-foreground/90">{tool.tooltip.purpose}</div>
                          </div>
                          <div>
                            <div className="font-semibold text-xs mb-1">When to Use</div>
                            <div className="text-xs text-primary-foreground/90">{tool.tooltip.whenToUse}</div>
                          </div>
                          <div>
                            <div className="font-semibold text-xs mb-1">Example Use Cases</div>
                            <ul className="text-xs text-primary-foreground/90 space-y-0.5 list-disc list-inside">
                              {tool.tooltip.examples.map((example, idx) => (
                                <li key={idx}>{example}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      }
                    >
                      <Button
                        variant="secondary"
                        className="w-full justify-start gap-2 h-auto py-2 px-3"
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
                    </TouchTooltip>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        
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
    </TooltipProvider>
  )
}

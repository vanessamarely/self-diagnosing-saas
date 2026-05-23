import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  ShoppingCart,
  UserCircle,
  ClipboardText,
  Warning,
  CheckCircle,
  Plus,
  Code,
  Robot,
  Info,
} from '@phosphor-icons/react'
import type { AppState, Order } from '@/lib/types'
import { createInitialState, generateNewOrder, recordFailedEvent } from '@/lib/state'
import { initializeWebMCPTools, setAppState } from '@/lib/webmcp'
import { WebMCPPanel } from '@/components/WebMCPPanel'
import { ComparisonView } from '@/components/ComparisonView'
import { AIAssistant } from '@/components/AIAssistant'
import { toast, Toaster } from 'sonner'

function App() {
  const [appState, setInternalAppState] = useState<AppState>(() => createInitialState())
  const [newOrderForm, setNewOrderForm] = useState({
    customerName: '',
    email: '',
    amount: '',
    items: '',
  })

  useEffect(() => {
    initializeWebMCPTools()
    setAppState(appState)
  }, [])

  useEffect(() => {
    setAppState(appState)
  }, [appState])

  const handleCreateOrder = () => {
    if (!newOrderForm.customerName || !newOrderForm.email || !newOrderForm.amount) {
      toast.error('Please fill in all required fields')
      return
    }

    const amount = parseFloat(newOrderForm.amount)
    const items = newOrderForm.items.split(',').map((i) => i.trim()).filter(Boolean)

    const newOrder = generateNewOrder(
      newOrderForm.customerName,
      newOrderForm.email,
      amount,
      items.length > 0 ? items : ['Custom Order']
    )

    setInternalAppState((prev) => ({
      ...prev,
      orders: [...prev.orders, newOrder],
    }))

    setNewOrderForm({
      customerName: '',
      email: '',
      amount: '',
      items: '',
    })

    toast.success('Order created successfully')
  }

  const handleCheckout = (orderId: string) => {
    const order = appState.orders.find((o) => o.id === orderId)
    if (!order) return

    const checkoutFlag = appState.featureFlags.find((f) => f.name === 'enable_checkout')
    if (!checkoutFlag?.enabled) {
      recordFailedEvent(
        appState,
        'checkout_attempt',
        'Checkout feature is disabled',
        {
          reason: 'feature_flag_disabled',
          orderId: order.id,
          affectedFlags: ['enable_checkout'],
        }
      )
      setInternalAppState({ ...appState })
      toast.error('Checkout failed: Feature disabled')
      return
    }

    const highValueRule = appState.businessRules.find((r) => r.id === 'rule_1')
    if (order.amount > 200 && highValueRule?.enabled) {
      const hasApprovalPermission = appState.userSession.permissions.includes('approve_orders')

      if (!hasApprovalPermission) {
        recordFailedEvent(
          appState,
          'checkout_attempt',
          'User lacks permission to approve high-value orders',
          {
            reason: 'permission_denied',
            orderId: order.id,
            orderAmount: order.amount,
            affectedRules: ['rule_1'],
            affectedFlags: ['require_admin_approval'],
            requiredPermissions: ['approve_orders'],
            userPermissions: appState.userSession.permissions,
          }
        )
        setInternalAppState({ ...appState })
        toast.error('Checkout failed: Permission denied for high-value order')
        return
      }
    }

    setInternalAppState((prev) => ({
      ...prev,
      orders: prev.orders.map((o) =>
        o.id === orderId ? { ...o, status: 'completed' as const } : o
      ),
    }))

    toast.success('Order completed successfully!')
  }

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-accent/20 text-accent'
      case 'processing':
        return 'bg-primary/20 text-primary'
      case 'pending':
        return 'bg-muted-foreground/20 text-muted-foreground'
      case 'failed':
        return 'bg-destructive/20 text-destructive'
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-right" />
      
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Self-Diagnosing SaaS Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                WebMCP Demo - Context-Aware Debugging
              </p>
            </div>
            <div className="flex items-center gap-2">
              <UserCircle size={24} className="text-muted-foreground" />
              <div className="text-sm">
                <div className="font-medium">{appState.userSession.userName}</div>
                <div className="text-xs text-muted-foreground">
                  Role: {appState.userSession.role}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="orders" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="orders">
              <ShoppingCart className="mr-2" size={16} />
              Orders
            </TabsTrigger>
            <TabsTrigger value="create">
              <Plus className="mr-2" size={16} />
              Create Order
            </TabsTrigger>
            <TabsTrigger value="admin">
              <UserCircle className="mr-2" size={16} />
              Admin Panel
            </TabsTrigger>
            <TabsTrigger value="ai">
              <Robot className="mr-2" size={16} />
              AI Assistant
            </TabsTrigger>
            <TabsTrigger value="debug">
              <Code className="mr-2" size={16} />
              WebMCP Tools
            </TabsTrigger>
            <TabsTrigger value="comparison">
              <ClipboardText className="mr-2" size={16} />
              Comparison
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="mt-6">
            <div className="grid grid-cols-1 gap-6">
              <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="text-primary" size={24} />
                    Active Shopping Cart
                  </CardTitle>
                  <CardDescription>Pending orders awaiting checkout</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="space-y-1">
                      <div className="text-3xl font-bold text-primary">
                        {appState.orders.filter(o => o.status === 'pending').length}
                      </div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wide">
                        Items in Cart
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-3xl font-bold text-primary">
                        ${appState.orders
                          .filter(o => o.status === 'pending')
                          .reduce((sum, o) => sum + o.amount, 0)
                          .toFixed(2)}
                      </div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wide">
                        Cart Total
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-3xl font-bold text-accent">
                        {appState.orders.filter(o => o.status === 'completed').length}
                      </div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wide">
                        Completed
                      </div>
                    </div>
                  </div>
                  <Separator className="my-4" />
                  <Alert className="bg-card/50 border-primary/30">
                    <Info size={16} />
                    <AlertDescription className="text-xs">
                      <strong>WebMCP Tip:</strong> Use the <code className="font-mono bg-muted px-1 rounded">get_active_cart</code> tool 
                      in the WebMCP Tools tab to see detailed cart data in JSON format.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>All Orders</CardTitle>
                  <CardDescription>View and manage all customer orders</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-3">
                      {appState.orders.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                          <ShoppingCart size={48} className="mx-auto mb-3 opacity-50" />
                          <p className="font-medium">No orders yet</p>
                          <p className="text-sm">Create your first order in the "Create Order" tab</p>
                        </div>
                      ) : (
                        appState.orders.map((order) => (
                          <Card key={order.id} className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="font-semibold">{order.customerName}</h3>
                                  <Badge className={getStatusColor(order.status)}>
                                    {order.status}
                                  </Badge>
                                  {order.status === 'pending' && (
                                    <Badge variant="outline" className="gap-1 text-primary border-primary/50">
                                      <ShoppingCart size={12} />
                                      In Cart
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-sm text-muted-foreground space-y-1">
                                  <p>Email: {order.email}</p>
                                  <p>Amount: ${order.amount.toFixed(2)}</p>
                                  <p>Items: {order.items.join(', ')}</p>
                                  <p className="text-xs">
                                    Created: {new Date(order.createdAt).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                              <div className="flex flex-col gap-2">
                                {order.status === 'pending' && (
                                  <Button
                                    size="sm"
                                    onClick={() => handleCheckout(order.id)}
                                  >
                                    <CheckCircle className="mr-1" size={16} />
                                    Checkout
                                  </Button>
                                )}
                              </div>
                            </div>
                          </Card>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="create" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Create New Order</CardTitle>
                <CardDescription>Add a new customer order to the system</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="customerName">Customer Name *</Label>
                  <Input
                    id="customerName"
                    value={newOrderForm.customerName}
                    onChange={(e) =>
                      setNewOrderForm({ ...newOrderForm, customerName: e.target.value })
                    }
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newOrderForm.email}
                    onChange={(e) =>
                      setNewOrderForm({ ...newOrderForm, email: e.target.value })
                    }
                    placeholder="john@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount ($) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={newOrderForm.amount}
                    onChange={(e) =>
                      setNewOrderForm({ ...newOrderForm, amount: e.target.value })
                    }
                    placeholder="99.99"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="items">Items (comma-separated)</Label>
                  <Input
                    id="items"
                    value={newOrderForm.items}
                    onChange={(e) =>
                      setNewOrderForm({ ...newOrderForm, items: e.target.value })
                    }
                    placeholder="Pro Plan, Support Package"
                  />
                </div>
                <Button onClick={handleCreateOrder} className="w-full">
                  <Plus className="mr-2" size={16} />
                  Create Order
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="admin" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>User Session</CardTitle>
                  <CardDescription>Current user permissions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-sm">
                    <span className="font-medium">User ID:</span> {appState.userSession.userId}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Role:</span> {appState.userSession.role}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Permissions:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {appState.userSession.permissions.map((perm) => (
                        <Badge key={perm} variant="secondary" className="text-xs">
                          {perm}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Feature Flags</CardTitle>
                  <CardDescription>Active feature toggles</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-2">
                      {appState.featureFlags.map((flag) => (
                        <div
                          key={flag.name}
                          className="flex items-start justify-between p-2 rounded bg-muted/50"
                        >
                          <div className="flex-1">
                            <div className="font-medium text-sm">{flag.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {flag.description}
                            </div>
                          </div>
                          <Badge variant={flag.enabled ? 'default' : 'secondary'}>
                            {flag.enabled ? 'ON' : 'OFF'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Warning size={20} className="text-destructive" />
                    Failed Events
                  </CardTitle>
                  <CardDescription>
                    Recent errors and failures (demonstrates WebMCP debugging)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {appState.failedEvents.length === 0 ? (
                    <Alert>
                      <CheckCircle className="h-4 w-4 text-accent" />
                      <AlertDescription>
                        No failed events yet. Try checking out a high-value order ($200+) to
                        trigger a permission error.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <ScrollArea className="h-[300px]">
                      <div className="space-y-2">
                        {appState.failedEvents.slice().reverse().map((event) => (
                          <Card key={event.id} className="p-3 border-destructive/50">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Badge variant="destructive">{event.eventType}</Badge>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(event.timestamp).toLocaleString()}
                                </span>
                              </div>
                              <p className="text-sm font-medium">{event.errorMessage}</p>
                              <div className="text-xs text-muted-foreground">
                                <div className="font-mono bg-muted p-2 rounded mt-1">
                                  {JSON.stringify(event.context, null, 2)}
                                </div>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="ai" className="mt-6">
            <AIAssistant appState={appState} />
          </TabsContent>

          <TabsContent value="debug" className="mt-6">
            <WebMCPPanel appState={appState} />
          </TabsContent>

          <TabsContent value="comparison" className="mt-6">
            <ComparisonView appState={appState} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default App

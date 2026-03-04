import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Switch } from '@/components/ui/switch'
import { Plus, ShoppingCart, Gear, Warning, Bug, Columns } from '@phosphor-icons/react'
import type { AppState, Order, FeatureFlag } from '@/lib/types'
import { createInitialState, recordFailedEvent, generateNewOrder } from '@/lib/state'
import { initializeWebMCPTools } from '@/lib/webmcp'
import { WebMCPPanel } from '@/components/WebMCPPanel'
import { ComparisonView } from '@/components/ComparisonView'
import { toast } from 'sonner'
import { motion } from 'framer-motion'

initializeWebMCPTools()

function App() {
  const [appState, setAppState] = useState<AppState>(createInitialState())
  const [createOrderOpen, setCreateOrderOpen] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [adminOpen, setAdminOpen] = useState(false)
  const [activeView, setActiveView] = useState<'dashboard' | 'comparison'>('dashboard')
  
  const [newOrderData, setNewOrderData] = useState({
    customerName: '',
    email: '',
    amount: '',
    items: '',
  })
  
  const [paymentMethod, setPaymentMethod] = useState('')

  const handleCreateOrder = () => {
    const amount = parseFloat(newOrderData.amount)
    
    if (!newOrderData.customerName || !newOrderData.email || !newOrderData.amount) {
      toast.error('Please fill in all fields')
      return
    }
    
    if (isNaN(amount) || amount <= 0) {
      toast.error('Invalid amount')
      return
    }

    if (!appState.userSession.permissions.includes('create_order')) {
      recordFailedEvent(
        appState,
        'create_order',
        'Permission denied: User lacks create_order permission',
        {
          reason: 'permission_denied',
          requiredPermissions: ['create_order'],
          userPermissions: appState.userSession.permissions,
          attemptedAction: 'create_order',
        }
      )
      toast.error('Permission denied')
      setAppState({ ...appState })
      return
    }

    const items = newOrderData.items.split(',').map(i => i.trim()).filter(i => i)
    const newOrder = generateNewOrder(newOrderData.customerName, newOrderData.email, amount, items)
    
    setAppState(prev => ({
      ...prev,
      orders: [...prev.orders, newOrder],
    }))
    
    toast.success('Order created successfully')
    setCreateOrderOpen(false)
    setNewOrderData({ customerName: '', email: '', amount: '', items: '' })
  }

  const handleCheckout = () => {
    if (!selectedOrder) return

    if (!appState.featureFlags.find(f => f.name === 'enable_checkout')?.enabled) {
      recordFailedEvent(
        appState,
        'checkout',
        'Feature disabled: Checkout feature is not enabled',
        {
          reason: 'feature_flag_conflict',
          affectedFlags: ['enable_checkout'],
          orderId: selectedOrder.id,
        }
      )
      toast.error('Checkout is currently disabled')
      setAppState({ ...appState })
      return
    }

    if (!paymentMethod) {
      recordFailedEvent(
        appState,
        'checkout',
        'Business rule violation: Payment method required',
        {
          reason: 'business_rule_violation',
          affectedRules: ['rule_3'],
          orderId: selectedOrder.id,
          paymentMethod: null,
        }
      )
      toast.error('Payment method is required')
      setAppState({ ...appState })
      return
    }

    const requiresApproval = appState.businessRules.find(r => r.id === 'rule_1')
    const autoApprove = appState.featureFlags.find(f => f.name === 'auto_approve_orders')
    const requireAdmin = appState.featureFlags.find(f => f.name === 'require_admin_approval')

    if (selectedOrder.amount > 200 && requiresApproval?.enabled) {
      if (requireAdmin?.enabled && !appState.userSession.permissions.includes('approve_orders')) {
        recordFailedEvent(
          appState,
          'checkout',
          'Conflict: Order requires admin approval but user lacks approval permission. Auto-approve is enabled but conflicts with approval requirement.',
          {
            reason: 'permission_denied',
            affectedRules: ['rule_1'],
            affectedFlags: ['require_admin_approval', 'auto_approve_orders'],
            requiredPermissions: ['approve_orders'],
            userPermissions: appState.userSession.permissions,
            orderAmount: selectedOrder.amount,
            orderId: selectedOrder.id,
            conflictDescription: 'High-value order ($' + selectedOrder.amount + ') requires admin approval, but user role "' + appState.userSession.role + '" lacks approval permission. Auto-approve flag is enabled but conflicts with manual approval requirement.',
          }
        )
        toast.error('Permission denied: High-value orders require admin approval')
        setAppState({ ...appState })
        return
      }
    }

    setAppState(prev => ({
      ...prev,
      orders: prev.orders.map(o => 
        o.id === selectedOrder.id ? { ...o, status: 'completed' as const } : o
      ),
    }))
    
    toast.success('Checkout completed successfully!')
    setCheckoutOpen(false)
    setSelectedOrder(null)
    setPaymentMethod('')
  }

  const toggleFeatureFlag = (flagName: string) => {
    setAppState(prev => ({
      ...prev,
      featureFlags: prev.featureFlags.map(f =>
        f.name === flagName ? { ...f, enabled: !f.enabled } : f
      ),
    }))
    toast.success('Feature flag updated')
  }

  const changeUserRole = (role: 'admin' | 'user' | 'guest') => {
    const permissions: Record<string, string[]> = {
      admin: ['view_orders', 'create_order', 'approve_orders', 'process_refunds', 'manage_settings'],
      user: ['view_orders', 'create_order'],
      guest: ['view_orders'],
    }

    setAppState(prev => ({
      ...prev,
      userSession: {
        ...prev.userSession,
        role,
        permissions: permissions[role],
      },
    }))
    toast.success(`Role changed to ${role}`)
  }

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-accent/20 text-accent-foreground'
      case 'processing':
        return 'bg-primary/20 text-primary-foreground'
      case 'pending':
        return 'bg-secondary/20 text-secondary-foreground'
      case 'failed':
        return 'bg-destructive/20 text-destructive-foreground'
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-6">
      <div className="max-w-[1800px] mx-auto flex flex-col lg:flex-row gap-6 h-[calc(100vh-3rem)]">
        <div className="flex-1 flex flex-col gap-6 min-h-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">SaaS Dashboard</h1>
              <p className="text-muted-foreground">WebMCP Debugging Demo</p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant={activeView === 'comparison' ? 'default' : 'outline'} 
                size="sm" 
                onClick={() => setActiveView(activeView === 'dashboard' ? 'comparison' : 'dashboard')}
              >
                <Columns />
                {activeView === 'dashboard' ? 'Show Comparison' : 'Show Dashboard'}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setAdminOpen(true)}>
                <Gear />
                Admin
              </Button>
              {appState.failedEvents.length > 0 && (
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Badge variant="destructive" className="gap-1">
                    <Bug />
                    {appState.failedEvents.length} Bugs
                  </Badge>
                </motion.div>
              )}
            </div>
          </div>

          {activeView === 'dashboard' ? (
            <>
              <Card className="flex-1 flex flex-col min-h-0">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <ShoppingCart />
                      Orders
                    </CardTitle>
                    <CardDescription>
                      Manage customer orders and process checkouts
                    </CardDescription>
                  </div>
                  <Button onClick={() => setCreateOrderOpen(true)}>
                    <Plus />
                    Create Order
                  </Button>
                </CardHeader>
                <CardContent className="flex-1 min-h-0">
                  <div className="border rounded-lg overflow-hidden h-full flex flex-col">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                    </Table>
                    <div className="flex-1 overflow-auto">
                      <Table>
                        <TableBody>
                          {appState.orders.map((order) => (
                            <TableRow key={order.id}>
                              <TableCell className="font-mono text-xs">{order.id}</TableCell>
                              <TableCell>{order.customerName}</TableCell>
                              <TableCell className="text-muted-foreground">{order.email}</TableCell>
                              <TableCell className="font-semibold">${order.amount.toFixed(2)}</TableCell>
                              <TableCell>
                                <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                              </TableCell>
                              <TableCell>
                                {order.status === 'pending' && (
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => {
                                      setSelectedOrder(order)
                                      setCheckoutOpen(true)
                                    }}
                                  >
                                    Checkout
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {appState.failedEvents.length > 0 && (
                <Alert variant="destructive">
                  <Warning className="h-4 w-4" />
                  <AlertDescription>
                    {appState.failedEvents.length} error(s) detected. Use WebMCP tools to diagnose →
                  </AlertDescription>
                </Alert>
              )}
            </>
          ) : (
            <ComparisonView appState={appState} />
          )}
        </div>

        {activeView === 'dashboard' && (
          <div className="lg:w-[500px] flex flex-col min-h-0">
            <WebMCPPanel appState={appState} />
          </div>
        )}
      </div>

      <Dialog open={createOrderOpen} onOpenChange={setCreateOrderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Order</DialogTitle>
            <DialogDescription>Add a new customer order to the system</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="customerName">Customer Name</Label>
              <Input
                id="customerName"
                value={newOrderData.customerName}
                onChange={(e) => setNewOrderData({ ...newOrderData, customerName: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newOrderData.email}
                onChange={(e) => setNewOrderData({ ...newOrderData, email: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="amount">Amount ($)</Label>
              <Input
                id="amount"
                type="number"
                value={newOrderData.amount}
                onChange={(e) => setNewOrderData({ ...newOrderData, amount: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="items">Items (comma-separated)</Label>
              <Input
                id="items"
                value={newOrderData.items}
                onChange={(e) => setNewOrderData({ ...newOrderData, items: e.target.value })}
                placeholder="Item 1, Item 2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOrderOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateOrder}>Create Order</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Checkout</DialogTitle>
            <DialogDescription>Complete the order checkout process</DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Order Details</Label>
                <div className="text-sm space-y-1">
                  <div>Customer: {selectedOrder.customerName}</div>
                  <div>Amount: ${selectedOrder.amount.toFixed(2)}</div>
                  <div>Items: {selectedOrder.items.join(', ')}</div>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="payment">Payment Method</Label>
                <Input
                  id="payment"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  placeholder="Credit Card, PayPal, etc."
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCheckoutOpen(false)}>Cancel</Button>
            <Button onClick={handleCheckout}>Complete Checkout</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={adminOpen} onOpenChange={setAdminOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Admin Settings</DialogTitle>
            <DialogDescription>Manage feature flags and user permissions</DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="flags" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="flags">Feature Flags</TabsTrigger>
              <TabsTrigger value="user">User Session</TabsTrigger>
            </TabsList>
            <TabsContent value="flags" className="space-y-4">
              {appState.featureFlags.map((flag) => (
                <div key={flag.name} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="font-mono text-sm">{flag.name}</div>
                    <div className="text-xs text-muted-foreground">{flag.description}</div>
                    {flag.requiredPermission && (
                      <div className="text-xs text-muted-foreground">
                        Requires: {flag.requiredPermission}
                      </div>
                    )}
                  </div>
                  <Switch
                    checked={flag.enabled}
                    onCheckedChange={() => toggleFeatureFlag(flag.name)}
                  />
                </div>
              ))}
            </TabsContent>
            <TabsContent value="user" className="space-y-4">
              <div className="space-y-2">
                <Label>Current User</Label>
                <div className="text-sm space-y-1 p-4 bg-muted rounded-lg">
                  <div>Name: {appState.userSession.userName}</div>
                  <div>Role: {appState.userSession.role}</div>
                  <div>Permissions: {appState.userSession.permissions.join(', ')}</div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Change Role</Label>
                <div className="flex gap-2">
                  <Button
                    variant={appState.userSession.role === 'guest' ? 'default' : 'outline'}
                    onClick={() => changeUserRole('guest')}
                  >
                    Guest
                  </Button>
                  <Button
                    variant={appState.userSession.role === 'user' ? 'default' : 'outline'}
                    onClick={() => changeUserRole('user')}
                  >
                    User
                  </Button>
                  <Button
                    variant={appState.userSession.role === 'admin' ? 'default' : 'outline'}
                    onClick={() => changeUserRole('admin')}
                  >
                    Admin
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default App

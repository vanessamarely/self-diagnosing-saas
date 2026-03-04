# Console Testing Script

Copy and paste these commands into your browser's console to test the AI Assistant and WebMCP tools.

## 🔍 Check WebMCP Status

```javascript
// Check if WebMCP is loaded
console.log('WebMCP Available:', !!window.webMCP)
console.log('WebMCP Using Polyfill:', window.webMCP?.usingPolyfill)
console.log('Navigator ModelContext:', !!window.navigator.modelContext)

// List all available WebMCP tools
if (window.webMCP) {
  console.log('Available Tools:', window.webMCP.tools.list().map(t => t.name))
}
```

## 🧪 Test Individual WebMCP Tools

### Test 1: get_app_state
```javascript
// Get complete application state
const appState = window.webMCP?.tools.call('get_app_state')
console.log('App State:', appState)
console.log('Number of Orders:', appState?.orders?.length)
console.log('User Role:', appState?.userSession?.role)
console.log('User Permissions:', appState?.userSession?.permissions)
```

### Test 2: get_user_session
```javascript
// Get current user session info
const userSession = window.webMCP?.tools.call('get_user_session')
console.log('User Session:', userSession)
console.log('Has approve_orders permission?', 
  userSession?.permissions?.includes('approve_orders'))
```

### Test 3: get_business_rules
```javascript
// Get business rules
const rules = window.webMCP?.tools.call('get_business_rules')
console.log('Business Rules:', rules)
console.log('High Value Rule:', 
  rules?.businessRules?.find(r => r.name === 'High Value Order Approval'))
```

### Test 4: get_failed_events
```javascript
// Get failed events
const failedEvents = window.webMCP?.tools.call('get_failed_events')
console.log('Failed Events:', failedEvents)
console.log('Number of Failures:', failedEvents?.failedEvents?.length || 0)
```

### Test 5: reproduce_bug
```javascript
// Reproduce the last bug
const bugReproduction = window.webMCP?.tools.call('reproduce_bug')
console.log('Bug Reproduction:', bugReproduction)
console.log('Status:', bugReproduction?.status)
if (bugReproduction?.status === 'reproduced') {
  console.log('Failed Event:', bugReproduction.failedEvent)
  console.log('Missing Permissions:', bugReproduction.userContext?.missingPermissions)
}
```

### Test 6: generate_bug_report
```javascript
// Generate a bug report
const bugReport = window.webMCP?.tools.call('generate_bug_report')
console.log('Bug Report:', bugReport)
```

## 🎯 Complete Test Sequence

Run this to test all tools in order:

```javascript
// Complete WebMCP tool test
async function testAllWebMCPTools() {
  if (!window.webMCP) {
    console.error('❌ WebMCP not available!')
    return
  }

  console.log('🚀 Starting WebMCP Tools Test\n')
  
  const tools = [
    'get_app_state',
    'get_user_session', 
    'get_business_rules',
    'get_failed_events',
    'reproduce_bug',
    'generate_bug_report'
  ]
  
  for (const tool of tools) {
    console.log(`\n📦 Testing: ${tool}`)
    console.log('─'.repeat(50))
    try {
      const result = window.webMCP.tools.call(tool)
      console.log('✅ Success:', result)
    } catch (error) {
      console.error('❌ Error:', error)
    }
  }
  
  console.log('\n✨ Test complete!')
}

testAllWebMCPTools()
```

## 🔨 Simulate Creating a High-Value Order

```javascript
// This demonstrates what happens internally when you create a high-value order
function simulateHighValueOrder() {
  console.log('💰 Simulating high-value order creation...')
  
  const orderData = {
    customerName: 'Test Customer',
    email: 'test@example.com',
    amount: 250,
    items: ['Enterprise Package']
  }
  
  console.log('Order Details:', orderData)
  console.log('Amount > $200?', orderData.amount > 200 ? '✓ YES' : '✗ NO')
  
  // Check if checkout would fail
  const userSession = window.webMCP?.tools.call('get_user_session')
  const hasPermission = userSession?.permissions?.includes('approve_orders')
  
  console.log('User has approve_orders permission?', hasPermission ? '✓ YES' : '✗ NO')
  
  if (orderData.amount > 200 && !hasPermission) {
    console.log('❌ CHECKOUT WOULD FAIL: Permission denied for high-value order')
    console.log('Required permission: approve_orders')
    console.log('User permissions:', userSession?.permissions)
  } else {
    console.log('✅ CHECKOUT WOULD SUCCEED')
  }
}

simulateHighValueOrder()
```

## 📊 Check Current Application State

```javascript
// Quick status check
function checkAppStatus() {
  const appState = window.webMCP?.tools.call('get_app_state')
  const failedEvents = window.webMCP?.tools.call('get_failed_events')
  
  console.log('📊 Application Status Report')
  console.log('═'.repeat(50))
  console.log(`Orders: ${appState?.orders?.length || 0}`)
  console.log(`Failed Events: ${failedEvents?.failedEvents?.length || 0}`)
  console.log(`User Role: ${appState?.userSession?.role}`)
  console.log(`Permissions: ${appState?.userSession?.permissions?.join(', ')}`)
  console.log(`Checkout Enabled: ${appState?.featureFlags?.find(f => f.name === 'enable_checkout')?.enabled ? '✓' : '✗'}`)
  console.log(`Require Admin Approval: ${appState?.featureFlags?.find(f => f.name === 'require_admin_approval')?.enabled ? '✓' : '✗'}`)
  
  if (failedEvents?.failedEvents?.length > 0) {
    console.log('\n🚨 Recent Failures:')
    failedEvents.failedEvents.slice(-3).forEach((event, i) => {
      console.log(`  ${i + 1}. ${event.eventType}: ${event.errorMessage}`)
    })
  } else {
    console.log('\n✅ No failures detected')
  }
}

checkAppStatus()
```

## 🐛 Debug Helper Functions

### Check Permission Requirements
```javascript
function checkOrderPermissions(amount) {
  const rules = window.webMCP?.tools.call('get_business_rules')
  const userSession = window.webMCP?.tools.call('get_user_session')
  
  console.log(`Checking permissions for $${amount} order...`)
  
  if (amount > 200) {
    const rule = rules?.businessRules?.find(r => r.id === 'rule_1')
    console.log('High Value Rule:', rule?.enabled ? 'Enabled' : 'Disabled')
    
    const hasPermission = userSession?.permissions?.includes('approve_orders')
    console.log('Has Required Permission:', hasPermission ? '✓ YES' : '✗ NO')
    
    return hasPermission
  } else {
    console.log('Order amount <= $200: No special permission required')
    return true
  }
}

// Test various amounts
checkOrderPermissions(99)
checkOrderPermissions(250)
checkOrderPermissions(500)
```

### Analyze Last Failure
```javascript
function analyzeLastFailure() {
  const failedEvents = window.webMCP?.tools.call('get_failed_events')
  const events = failedEvents?.failedEvents || []
  
  if (events.length === 0) {
    console.log('No failures to analyze')
    return
  }
  
  const lastEvent = events[events.length - 1]
  
  console.log('🔍 Analyzing Last Failure')
  console.log('═'.repeat(50))
  console.log('Event Type:', lastEvent.eventType)
  console.log('Error:', lastEvent.errorMessage)
  console.log('Timestamp:', new Date(lastEvent.timestamp).toLocaleString())
  console.log('\nContext:')
  console.log('  Reason:', lastEvent.context.reason)
  console.log('  Order Amount:', lastEvent.context.orderAmount)
  console.log('  Required Permissions:', lastEvent.context.requiredPermissions)
  console.log('  User Permissions:', lastEvent.context.userPermissions)
  console.log('  Missing:', 
    lastEvent.context.requiredPermissions?.filter(
      p => !lastEvent.context.userPermissions?.includes(p)
    ))
}

analyzeLastFailure()
```

## 🎨 Pretty Print Tools

```javascript
// Pretty print any WebMCP tool result
function prettyPrintTool(toolName) {
  console.log(`\n${'═'.repeat(60)}`)
  console.log(`🔧 ${toolName}`)
  console.log('═'.repeat(60))
  
  const result = window.webMCP?.tools.call(toolName)
  console.log(JSON.stringify(result, null, 2))
}

// Usage:
prettyPrintTool('get_app_state')
prettyPrintTool('get_user_session')
prettyPrintTool('reproduce_bug')
```

## 🧩 Test WebMCP Tool Schema

```javascript
// Inspect tool definitions
function inspectTools() {
  const tools = window.webMCP?.tools.list() || []
  
  console.log('📋 WebMCP Tools Inventory')
  console.log('═'.repeat(60))
  
  tools.forEach((tool, i) => {
    console.log(`\n${i + 1}. ${tool.name}`)
    console.log(`   Description: ${tool.description}`)
    console.log(`   Input Schema:`, tool.inputSchema)
  })
  
  console.log(`\nTotal Tools: ${tools.length}`)
}

inspectTools()
```

## 🚨 Verify Test Prerequisites

```javascript
// Check if environment is ready for testing
function verifyTestEnvironment() {
  console.log('🔍 Verifying Test Environment')
  console.log('═'.repeat(60))
  
  const checks = []
  
  // Check 1: WebMCP available
  checks.push({
    name: 'WebMCP Available',
    pass: !!window.webMCP,
    details: window.webMCP ? 'Found' : 'Missing'
  })
  
  // Check 2: All tools registered
  const expectedTools = [
    'get_app_state',
    'get_user_session',
    'get_business_rules',
    'get_failed_events',
    'reproduce_bug',
    'generate_bug_report'
  ]
  const availableTools = window.webMCP?.tools.list().map(t => t.name) || []
  checks.push({
    name: 'All Tools Registered',
    pass: expectedTools.every(t => availableTools.includes(t)),
    details: `${availableTools.length}/${expectedTools.length}`
  })
  
  // Check 3: User session exists
  const userSession = window.webMCP?.tools.call('get_user_session')
  checks.push({
    name: 'User Session',
    pass: !!userSession,
    details: userSession ? `Role: ${userSession.role}` : 'Not found'
  })
  
  // Check 4: Business rules configured
  const rules = window.webMCP?.tools.call('get_business_rules')
  const highValueRule = rules?.businessRules?.find(r => r.id === 'rule_1')
  checks.push({
    name: 'High Value Rule Configured',
    pass: !!highValueRule && highValueRule.enabled,
    details: highValueRule ? `Enabled: ${highValueRule.enabled}` : 'Not found'
  })
  
  // Print results
  checks.forEach(check => {
    const icon = check.pass ? '✅' : '❌'
    console.log(`${icon} ${check.name}: ${check.details}`)
  })
  
  const allPassed = checks.every(c => c.pass)
  console.log('\n' + '═'.repeat(60))
  console.log(allPassed ? '✅ Environment Ready!' : '⚠️  Some checks failed')
  
  return allPassed
}

verifyTestEnvironment()
```

## 🎯 One-Command Test

```javascript
// Run complete test suite with one command
(async function completeTest() {
  console.clear()
  console.log('🧪 WebMCP & AI Assistant Complete Test Suite')
  console.log('═'.repeat(60))
  
  // Step 1: Verify environment
  console.log('\n📋 Step 1: Environment Check')
  const envReady = verifyTestEnvironment()
  if (!envReady) {
    console.log('❌ Environment not ready. Cannot continue.')
    return
  }
  
  // Step 2: Check current status
  console.log('\n📊 Step 2: Current Status')
  checkAppStatus()
  
  // Step 3: Test all tools
  console.log('\n🔧 Step 3: Testing All Tools')
  await testAllWebMCPTools()
  
  // Step 4: Analyze failures (if any)
  console.log('\n🐛 Step 4: Failure Analysis')
  analyzeLastFailure()
  
  // Step 5: Simulate order
  console.log('\n💰 Step 5: Order Simulation')
  simulateHighValueOrder()
  
  console.log('\n✨ Complete test finished!')
  console.log('💡 Tip: Create a high-value order in the UI to see AI diagnosis in action!')
})()
```

## 📝 Usage Instructions

1. Open your browser's Developer Tools (F12)
2. Go to the Console tab
3. Copy any of the above code blocks
4. Paste and press Enter
5. Review the output

## 🎓 What to Look For

✅ **All tools return data** (not undefined or errors)
✅ **User role is "user"** with limited permissions
✅ **High Value Rule is enabled** and set to > 200
✅ **If failures exist**, reproduce_bug shows context
✅ **WebMCP is available** and tools are registered

## 💡 Troubleshooting

If tools return undefined:
- Refresh the page
- Wait for app to fully load
- Check for console errors

If no failures show:
- You need to create and checkout a high-value order first
- Go to UI: Create Order → Amount: $250 → Checkout

---

**Happy Testing!** 🎉

# WebMCP Implementation Guide

This document explains how the **real WebMCP** is implemented in this application, following the official WebMCP specification from [github.com/webmachinelearning/webmcp](https://github.com/webmachinelearning/webmcp).

## What is WebMCP?

WebMCP (Model Context Protocol for the Browser) is a JavaScript API that allows web developers to expose their web application functionality as "tools" that can be invoked by AI agents, browser assistants, and assistive technologies.

## ✅ Implementation Mode: DECLARATIVE (W3C Recommended)

According to the official W3C WebMCP specification, there are **TWO ways** to register tools:

1. **DECLARATIVE** (✅ Used in this app) - Register all tools at once via `provideContext()`
2. **IMPERATIVE** (❌ Not used) - Register tools one by one via `registerTool()`

**This application uses the DECLARATIVE approach**, which is the **recommended method** by the W3C WebMCP Working Group because it:
- Provides better performance (single registration call)
- Makes tools available to AI agents immediately
- Follows the principle of "declare what you provide" rather than "imperatively register"
- Is more declarative and functional in nature

## Implementation Overview

### 1. Native WebMCP API - DECLARATIVE (`navigator.modelContext.provideContext`)

The application uses the **official DECLARATIVE WebMCP API** via `navigator.modelContext.provideContext`:

```typescript
// From src/lib/webmcp.ts - DECLARATIVE APPROACH
if (typeof window !== 'undefined') {
  const nav = window.navigator as NavigatorWithModelContext
  
  if (isWebMCPSupported() && nav.modelContext) {
    // ✅ DECLARATIVE: Register ALL tools at once via provideContext()
    nav.modelContext.provideContext({
      tools: [
        {
          name: "get_app_state",
          description: "Returns overall application state summary",
          inputSchema: {
            type: "object",
            properties: {},
            required: []
          },
          async execute(args) {
            const appState = getCurrentAppState()
            return {
              content: [{
                type: "text",
                text: JSON.stringify(appState)
              }]
            }
          }
        },
        // ... more tools defined in the array
      ]
    })
    console.log('[WebMCP Declarative] All tools registered at once')
  }
}
```

### 2. Alternative: IMPERATIVE Approach (NOT USED)

For reference, the **imperative approach** would look like this (we don't use this):

```typescript
// ❌ IMPERATIVE APPROACH (NOT USED IN THIS APP)
if (nav.modelContext) {
  // Register each tool individually
  nav.modelContext.registerTool({
    name: "get_app_state",
    description: "Returns overall application state summary",
    inputSchema: { type: "object", properties: {}, required: [] },
    async execute(args) { /* ... */ }
  })
  
  nav.modelContext.registerTool({
    name: "get_user_session",
    description: "Get current user session details",
    inputSchema: { type: "object", properties: {}, required: [] },
    async execute(args) { /* ... */ }
  })
  
  // ... register each tool one by one
}
```

**Why we chose DECLARATIVE:**
- ✅ Single API call for all tools (better performance)
- ✅ Cleaner, more maintainable code
- ✅ Tools are registered atomically
- ✅ Recommended by W3C specification
- ✅ Better for tool discovery by AI agents

### 3. Polyfill Fallback (`window.webMCP`)

Since `navigator.modelContext` is not yet widely supported in browsers, the application provides a **polyfill** that makes the same tools available via `window.webMCP`:

```typescript
const webMCP: WebMCPInterface = {
  tools: {
    list: () => toolDefinitions,
    call: (name: string, args: Record<string, unknown> = {}) => {
      const tool = toolDefinitions.find(t => t.name === name)
      if (!tool) throw new Error(`Tool ${name} not found`)
      return tool.handler(args)
    }
  },
  isSupported: supported,
  usingPolyfill: !supported
};

(window as any).webMCP = webMCP
```

## Registered Tools

The application registers **10 WebMCP tools** that expose internal application context:

### State & Session Tools

1. **`get_app_state`**
   - Returns complete application state snapshot
   - Includes: orders, feature flags, business rules, user permissions
   - Use when: You need full context of the application

2. **`get_user_session`**
   - Returns current user authentication and authorization details
   - Includes: user ID, role, permissions, session info
   - Use when: Debugging permission or role-based access issues

### Configuration Tools

3. **`get_business_rules`**
   - Returns all configured business rules with their status
   - Includes: rule conditions, actions, priorities, enabled state
   - Use when: Operations fail due to business logic constraints

### Debugging Tools

4. **`get_failed_events`**
   - Returns log of all failed operations with error context
   - Includes: event type, error messages, timestamps, full context
   - Use when: Investigating why something went wrong

5. **`reproduce_bug`**
   - Provides step-by-step reproduction of the most recent failure
   - Includes: conflicting rules, flags, missing permissions
   - Use when: You need to recreate an error for debugging

6. **`generate_bug_report`**
   - Creates comprehensive bug report with root cause analysis
   - Includes: failure patterns, recommendations, affected components
   - Use when: Reporting issues to development team

### Shopping Cart Tools (CRUD Operations)

7. **`get_active_cart`**
   - Returns the current shopping cart with all pending orders
   - Includes: items, quantities, prices, total cost
   - Use when: Checking cart contents or debugging cart state

8. **`add_item_to_cart`**
   - Adds a product to the shopping cart
   - Parameters: `productId` (required), `quantity` (optional)
   - Use when: Need to programmatically add items to cart

9. **`remove_item_from_cart`**
   - Removes a specific item from the cart by order ID
   - Parameters: `orderId` (required)
   - Use when: Need to remove a single cart item

10. **`clear_cart`**
    - Removes all pending orders from the cart
    - No parameters required
    - Use when: Need to empty the entire cart

11. **`update_cart_quantity`**
    - Updates the amount/price of a specific cart item
    - Parameters: `orderId` (required), `newAmount` (required)
    - Use when: Need to modify cart item quantities or prices

## How to Test WebMCP

### Method 1: UI Button Interface

1. Look at the **WebMCP Debug Tools** panel on the right side of the dashboard
2. Check the badge next to the title:
   - **Green "Native" badge** = `navigator.modelContext` is available ✅
   - **Gray "Polyfill" badge** = Using fallback `window.webMCP` ⚠️
3. Click any tool button to execute it
4. View the structured JSON response below

### Method 2: Browser Console (Polyfill)

Open your browser's developer console and try these commands:

```javascript
// Check if WebMCP is available
window.webMCP

// Check implementation mode
window.webMCP.implementationMode  // "declarative" or "polyfill"

// List all registered tools
window.webMCP.tools.list()

// Call a specific tool
window.webMCP.tools.call('get_app_state')

// Check if native API is supported
window.webMCP.isSupported  // false in most browsers currently
window.webMCP.usingPolyfill  // true in most browsers currently

// Call debugging tools
window.webMCP.tools.call('get_user_session')
window.webMCP.tools.call('get_business_rules')
window.webMCP.tools.call('get_failed_events')
window.webMCP.tools.call('reproduce_bug')
window.webMCP.tools.call('generate_bug_report')

// Call cart management tools
window.webMCP.tools.call('get_active_cart')
window.webMCP.tools.call('remove_item_from_cart', { orderId: 'order_123' })
window.webMCP.tools.call('update_cart_quantity', { orderId: 'order_123', newAmount: 150.00 })
window.webMCP.tools.call('clear_cart')
```

### Method 3: Native API (Future)

Once browsers implement `navigator.modelContext`, you would use it like this:

```javascript
// Check if native WebMCP is available
if (navigator.modelContext) {
  console.log('Native WebMCP supported!')
  
  // The tools are already registered via provideContext()
  // AI agents and browser assistants can now discover and use them
}
```

## Key Differences: DECLARATIVE vs IMPERATIVE vs POLYFILL

| Feature | Declarative (✅ Used) | Imperative (❌ Not used) | Polyfill |
|---------|---------------------|------------------------|----------|
| **API Method** | `provideContext({ tools: [...] })` | `registerTool(toolDef)` | `window.webMCP` |
| **Registration** | All tools at once | One tool at a time | Manual fallback |
| **Performance** | ✅ Single call | ⚠️ Multiple calls | ✅ Single call |
| **W3C Recommendation** | ✅ Recommended | ⚠️ Alternative | N/A (fallback) |
| **Browser Support** | Future native | Future native | Available now |
| **Agent Discovery** | Automatic | Automatic | Manual |
| **Code Style** | Functional/Declarative | Imperative/Procedural | Custom |

## Why Use WebMCP?

### Traditional Debugging (Without WebMCP)
- Inspect DOM elements manually
- Search through console logs
- Guess at internal state
- No access to business rules or context
- **Time to diagnose: 60+ seconds**

### Context-Aware Debugging (With WebMCP)
- Query structured application state
- Access business rules directly
- View failed events with full context
- Get AI-generated bug reports
- **Time to diagnose: ~15 seconds** ⚡

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Browser Environment                      │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  navigator.modelContext (Future/Native WebMCP)         │ │
│  │  - provideContext() registers tools                    │ │
│  │  - Browser agents can discover tools                   │ │
│  └────────────────────────────────────────────────────────┘ │
│                             │                                │
│                             │ Not yet supported              │
│                             ▼                                │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  window.webMCP (Polyfill/Current)                      │ │
│  │  - tools.list() - List all tools                       │ │
│  │  - tools.call(name, args) - Execute tool               │ │
│  │  - isSupported - Check native support                  │ │
│  │  - usingPolyfill - Check if using fallback             │ │
│  └────────────────────────────────────────────────────────┘ │
│                             │                                │
│                             │                                │
│                             ▼                                │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Application Tools (src/lib/webmcp.ts)                 │ │
│  │                                                         │ │
│  │  • get_app_state                                       │ │
│  │  • get_user_session                                    │ │
│  │  • get_business_rules                                  │ │
│  │  • get_failed_events                                   │ │
│  │  • reproduce_bug                                       │ │
│  │  • generate_bug_report                                 │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## References

- **Official WebMCP Proposal**: https://github.com/webmachinelearning/webmcp
- **WebMCP Org**: https://github.com/WebMCP-org
- **Model Context Protocol (MCP)**: https://modelcontextprotocol.io

## Console Output

When the application loads, check the browser console for WebMCP status:

**If Native WebMCP is supported (Declarative Mode):**
```
[WebMCP Declarative] ✓ Tools registered via navigator.modelContext.provideContext
[WebMCP Declarative] ✓ Implementation: DECLARATIVE (Recommended by W3C)
[WebMCP Declarative] ✓ Registered tools: (10) ['get_app_state', 'get_user_session', ...]

=== WebMCP Tools Ready ===
✓ DECLARATIVE Mode (W3C Standard)
Implementation: navigator.modelContext.provideContext (Recommended)
Tools registered declaratively - all tools provided at once
```

**If using Polyfill Mode:**
```
[WebMCP Polyfill] ⚠ navigator.modelContext not available, using fallback

=== WebMCP Tools Ready ===
⚠ POLYFILL Mode
Using window.webMCP fallback (navigator.modelContext not available)
Note: Native WebMCP API is not supported in this browser

Registered Tools:
  1. get_app_state
  2. get_user_session
  3. get_business_rules
  4. get_failed_events
  5. reproduce_bug
  6. generate_bug_report
  7. get_active_cart
  8. add_item_to_cart
  9. remove_item_from_cart
  10. clear_cart
  11. update_cart_quantity

Quick Start:
  window.webMCP.tools.list()                    // List all tools
  window.webMCP.tools.call('get_app_state')      // Call a tool
  window.webMCP.implementationMode              // Check mode

Implementation Modes:
  • DECLARATIVE: Tools registered via provideContext() - All at once
  • IMPERATIVE: Tools registered via registerTool() - One at a time (not used)
```

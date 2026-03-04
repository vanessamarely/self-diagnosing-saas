# WebMCP Implementation Guide

This document explains how the **real WebMCP** is implemented in this application, following the official WebMCP specification from [github.com/webmachinelearning/webmcp](https://github.com/webmachinelearning/webmcp).

## What is WebMCP?

WebMCP (Model Context Protocol for the Browser) is a JavaScript API that allows web developers to expose their web application functionality as "tools" that can be invoked by AI agents, browser assistants, and assistive technologies.

## Implementation Overview

### 1. Native WebMCP API (`navigator.modelContext.provideContext`)

The application attempts to use the **official WebMCP API** via `navigator.modelContext.provideContext`:

```typescript
// From src/lib/webmcp.ts
if (typeof window !== 'undefined') {
  const nav = window.navigator as NavigatorWithModelContext
  
  if (isWebMCPSupported() && nav.modelContext) {
    // ✅ REAL WEBMCP: Register tool via official API
    nav.modelContext.provideContext({
      name: definition.name,
      description: definition.description,
      inputSchema: definition.inputSchema,
      handler: definition.handler
    })
    console.log(`[WebMCP Native] Registered tool: ${definition.name}`)
  }
}
```

### 2. Polyfill Fallback (`window.webMCP`)

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

The application registers 6 WebMCP tools that expose internal application context:

1. **`get_app_state`** - Get overall application state summary
2. **`get_user_session`** - Get current user session details  
3. **`get_business_rules`** - Get all business rules
4. **`get_failed_events`** - Get all failed event logs
5. **`reproduce_bug`** - Reproduce the last bug with full context
6. **`generate_bug_report`** - Generate comprehensive bug report

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

// List all registered tools
window.webMCP.tools.list()

// Call a specific tool
window.webMCP.tools.call('get_app_state')

// Check if native API is supported
window.webMCP.isSupported  // false in most browsers currently
window.webMCP.usingPolyfill  // true in most browsers currently

// Call other tools
window.webMCP.tools.call('get_user_session')
window.webMCP.tools.call('get_business_rules')
window.webMCP.tools.call('get_failed_events')
window.webMCP.tools.call('reproduce_bug')
window.webMCP.tools.call('generate_bug_report')
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

## Key Differences: Native vs Polyfill

| Feature | Native (`navigator.modelContext`) | Polyfill (`window.webMCP`) |
|---------|----------------------------------|----------------------------|
| **Availability** | Not yet in browsers | Available now |
| **Discoverability** | Browser can enumerate tools | Manual discovery |
| **Agent Integration** | Automatic for browser agents | Manual integration needed |
| **API Standard** | Official WebMCP spec | Custom implementation |
| **Security** | Browser-managed | Application-managed |

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

```
[WebMCP Native] All tools registered via navigator.modelContext.provideContext
[WebMCP Native] Registered tools: (6) ['get_app_state', 'get_user_session', ...]
```

OR

```
[WebMCP Polyfill] navigator.modelContext.provideContext not available
[WebMCP Polyfill] Using fallback window.webMCP interface
[WebMCP Polyfill] Registered tools: (6) ['get_app_state', 'get_user_session', ...]
[WebMCP Polyfill] Try: window.webMCP.tools.list()
```

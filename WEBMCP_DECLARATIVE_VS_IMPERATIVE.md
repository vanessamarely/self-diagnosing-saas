# WebMCP: Declarative vs Imperative Implementation

## Overview

According to the official W3C WebMCP specification, there are **TWO approaches** to register tools with the `navigator.modelContext` API:

1. **DECLARATIVE** - Register all tools at once ✅ **RECOMMENDED**
2. **IMPERATIVE** - Register tools one at a time

This document explains both approaches and why we chose the declarative method.

---

## 1. DECLARATIVE Approach (✅ Used in This Application)

### What is it?

The declarative approach registers **all tools at once** using a single call to `navigator.modelContext.provideContext()` with an array of tool definitions.

### Code Example

```typescript
// ✅ DECLARATIVE: Register all tools at once
if (navigator.modelContext) {
  navigator.modelContext.provideContext({
    tools: [
      {
        name: "get_app_state",
        description: "Get overall application state",
        inputSchema: {
          type: "object",
          properties: {},
          required: []
        },
        async execute(args) {
          return {
            content: [{
              type: "text",
              text: JSON.stringify(appState)
            }]
          }
        }
      },
      {
        name: "get_user_session",
        description: "Get current user session",
        inputSchema: {
          type: "object",
          properties: {},
          required: []
        },
        async execute(args) {
          return {
            content: [{
              type: "text",
              text: JSON.stringify(userSession)
            }]
          }
        }
      },
      // ... all other tools in the same array
    ]
  })
}
```

### Advantages ✅

1. **Performance**: Single API call for all tools
2. **Atomic Registration**: All tools registered together or none at all
3. **Cleaner Code**: Tools defined in one place
4. **W3C Recommended**: This is the preferred method in the specification
5. **Better Discovery**: AI agents can see all available tools immediately
6. **Functional Style**: Declarative, "what" not "how"

### Disadvantages ⚠️

1. Must define all tools upfront (not dynamic)
2. Slightly larger initial payload

---

## 2. IMPERATIVE Approach (❌ NOT Used in This Application)

### What is it?

The imperative approach registers tools **one at a time** using multiple calls to `navigator.modelContext.registerTool()`.

### Code Example

```typescript
// ❌ IMPERATIVE: Register each tool individually
if (navigator.modelContext) {
  // Register first tool
  navigator.modelContext.registerTool({
    name: "get_app_state",
    description: "Get overall application state",
    inputSchema: {
      type: "object",
      properties: {},
      required: []
    },
    async execute(args) {
      return {
        content: [{
          type: "text",
          text: JSON.stringify(appState)
        }]
      }
    }
  })

  // Register second tool
  navigator.modelContext.registerTool({
    name: "get_user_session",
    description: "Get current user session",
    inputSchema: {
      type: "object",
      properties: {},
      required: []
    },
    async execute(args) {
      return {
        content: [{
          type: "text",
          text: JSON.stringify(userSession)
        }]
      }
    }
  })

  // ... register each tool with a separate call
}
```

### Advantages ✅

1. **Dynamic Registration**: Can register tools conditionally or at runtime
2. **Modular**: Each tool can be in a separate file/module
3. **Lazy Loading**: Register tools only when needed

### Disadvantages ⚠️

1. **Multiple API Calls**: Less efficient (N calls for N tools)
2. **Timing Issues**: Tools available at different times
3. **More Code**: Repetitive registration logic
4. **Not W3C Recommended**: Alternative, not preferred method

---

## Comparison Table

| Feature | Declarative (provideContext) | Imperative (registerTool) |
|---------|----------------------------|--------------------------|
| **API Method** | `provideContext({ tools: [...] })` | `registerTool(definition)` |
| **Number of Calls** | 1 (all tools at once) | N (one per tool) |
| **Performance** | ✅ Best | ⚠️ N network calls |
| **Code Style** | Functional/Declarative | Imperative/Procedural |
| **W3C Recommendation** | ✅ **Recommended** | ⚠️ Alternative |
| **Tool Availability** | All tools immediately | Tools available gradually |
| **Agent Discovery** | ✅ Complete tool list | ⚠️ Partial until all registered |
| **Dynamic Registration** | ❌ Must define upfront | ✅ Can add tools at runtime |
| **Code Maintainability** | ✅ Single definition | ⚠️ Scattered registrations |
| **Use Case** | Most web applications | Dynamic/plugin systems |

---

## Why We Chose DECLARATIVE

This application uses the **DECLARATIVE approach** for the following reasons:

### 1. **W3C Recommendation**
The W3C WebMCP specification explicitly recommends `provideContext()` as the primary method for exposing tools to AI agents.

### 2. **Performance**
Our application has a fixed set of 10 tools. Registering them all at once is more efficient than 10 separate API calls.

### 3. **Better Developer Experience**
All tools are defined in one place (`src/lib/webmcp.ts`), making the code easier to understand and maintain.

### 4. **Complete Tool Discovery**
AI agents can immediately discover all available tools without waiting for incremental registration.

### 5. **Simpler Testing**
Testing is easier when all tools are available immediately after initialization.

---

## When to Use IMPERATIVE

The imperative approach might be better for:

1. **Plugin Systems**: Where tools are added dynamically by third-party plugins
2. **Conditional Tools**: Tools that should only be available under certain conditions
3. **Lazy Loading**: Large applications where tools should load on-demand
4. **Micro-frontends**: Where different parts of the app register their own tools

**Example Use Case:**
```typescript
// Plugin system - tools registered dynamically
window.addEventListener('plugin-loaded', (event) => {
  const plugin = event.detail
  
  // Register plugin's tool imperatively
  navigator.modelContext.registerTool({
    name: plugin.toolName,
    description: plugin.toolDescription,
    inputSchema: plugin.inputSchema,
    execute: plugin.execute
  })
})
```

---

## Our Implementation

### File: `src/lib/webmcp.ts`

```typescript
export function initializeWebMCPTools() {
  // Build tool definitions array
  const tools: WebMCPToolDefinition[] = []
  
  // Add each tool to the array
  tools.push({
    name: 'get_app_state',
    description: '...',
    inputSchema: { ... },
    async execute(args) { ... }
  })
  
  tools.push({
    name: 'get_user_session',
    description: '...',
    inputSchema: { ... },
    async execute(args) { ... }
  })
  
  // ... add all 10 tools
  
  // ✅ DECLARATIVE: Register all tools at once
  if (navigator.modelContext) {
    navigator.modelContext.provideContext({ tools })
    console.log('[WebMCP Declarative] ✓ All 10 tools registered')
  }
}
```

---

## Verification

To verify which mode is being used:

```javascript
// In browser console
window.webMCP.implementationMode
// Returns: "declarative" or "polyfill"

// Check the console logs on page load:
// You should see:
// [WebMCP Declarative] ✓ Tools registered via navigator.modelContext.provideContext
// [WebMCP Declarative] ✓ Implementation: DECLARATIVE (Recommended by W3C)
```

---

## References

- [W3C WebMCP Specification](https://github.com/webmachinelearning/webmcp)
- [WebMCP Proposal Document](https://github.com/webmachinelearning/webmcp/blob/main/proposal.md)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- Application Implementation: `src/lib/webmcp.ts`

---

## Summary

✅ **Declarative Approach** (This App):
- `navigator.modelContext.provideContext({ tools: [...] })`
- All tools registered at once
- Recommended by W3C
- Best for most applications

❌ **Imperative Approach** (Not Used):
- `navigator.modelContext.registerTool(definition)`
- Tools registered one at a time
- Alternative method
- Best for dynamic/plugin systems

**Our Choice**: DECLARATIVE - because it's recommended, performant, and fits our use case perfectly.

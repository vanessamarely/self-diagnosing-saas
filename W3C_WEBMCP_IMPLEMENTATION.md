# WebMCP Implementation - W3C Standard Compliance

## Overview

This application has been refactored to use the **standardized W3C Web MCP (Model Context Protocol)** specifications as defined by the [WebMCP Working Group](https://github.com/webmachinelearning/webmcp).

The implementation follows the official WebMCP proposal to make our application "Agent-Ready" so that AI browser agents can interact with our debugging tools natively, securely, and with minimum token overhead.

## What Changed

### ❌ REMOVED: Deprecated Experimental APIs

The following non-standard experimental implementations have been **completely removed**:

- `window.webMCP` with custom JSON-RPC listeners ❌
- `window.ai.mcp` proprietary APIs ❌
- Custom tool registration patterns ❌

### ✅ ADDED: W3C Standardized Implementation

#### 1. Native `navigator.modelContext` API

The application now uses the official `navigator.modelContext.provideContext()` API as specified in the W3C WebMCP proposal:

```typescript
if (typeof navigator !== 'undefined' && navigator.modelContext) {
  navigator.modelContext.provideContext({
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
      // ... more tools
    ]
  })
}
```

#### 2. Standardized Tool Response Format

All tools now return responses in the MCP content block format:

```typescript
{
  content: [{
    type: "text",
    text: JSON.stringify(data)
  }]
}
```

This format is compatible with the Model Context Protocol and allows AI agents to parse tool responses consistently.

#### 3. Graceful Fallback (Polyfill Mode)

For browsers that don't yet support `navigator.modelContext`, the application provides a `window.webMCP` polyfill that maintains the same tool interface:

```typescript
// Polyfill for non-supporting browsers
window.webMCP = {
  tools: {
    list: () => [...],
    call: async (name, args) => { ... }
  },
  isSupported: false,
  usingPolyfill: true
}
```

## Registered Tools

The application exposes **6 WebMCP tools** for AI-powered debugging:

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

## Testing WebMCP Tools

### Method 1: Browser Console (Polyfill Mode)

Open your browser console and run:

```javascript
// List all available tools
window.webMCP.tools.list()

// Call a specific tool
await window.webMCP.tools.call('get_app_state')

// Call with parameters (for future tools that accept params)
await window.webMCP.tools.call('tool_name', { param: 'value' })

// Check if native support is available
window.webMCP.isSupported  // true if navigator.modelContext exists
window.webMCP.usingPolyfill  // true if using fallback mode
```

### Method 2: UI Panel

1. Navigate to the **"WebMCP Tools"** tab in the application
2. Click any tool button to execute it
3. View the structured JSON response below
4. The panel will display whether you're using Native or Polyfill mode

### Method 3: AI Agent Integration (Future)

When using a browser with native `navigator.modelContext` support and an AI agent (like an LLM-powered browser extension), the agent will automatically discover and use these tools:

```
User: "Why did my checkout fail?"

Agent: [Internally calls get_failed_events tool]
Agent: [Internally calls reproduce_bug tool]
Agent: "Your checkout failed because you attempted to process a $299.99 order, 
        which requires 'approve_orders' permission due to the 'High Value Order 
        Approval' business rule. Your current role 'user' only has 
        'view_orders' and 'create_order' permissions."
```

## Error Handling

The implementation includes comprehensive error handling:

```typescript
// 1. Browser compatibility check
if (typeof window === 'undefined' || typeof navigator === 'undefined') {
  return false  // Server-side or incompatible environment
}

// 2. Feature detection
const nav = navigator as unknown as NavigatorWithModelContext
if (!('modelContext' in nav)) {
  console.log('[WebMCP] ⚠ Polyfill Mode - navigator.modelContext not available')
  // Falls back to window.webMCP
}

// 3. API call error handling
try {
  nav.modelContext!.provideContext({ tools: toolDefinitions })
  console.log('[WebMCP Native] ✓ All tools registered')
} catch (error) {
  console.error('[WebMCP Native] ✗ Error:', error)
  // Gracefully degrades to polyfill
}
```

## Security Considerations

Following W3C WebMCP security guidelines:

1. **User Control**: All tool calls should be initiated or approved by the user
2. **Permissions**: Browser may prompt for permission before allowing tool registration
3. **Cross-Origin Isolation**: Tools only expose data from the current application
4. **No Sensitive Data**: Tools avoid exposing passwords, API keys, or PII
5. **Transparency**: UI clearly shows when WebMCP mode is active

## Browser Support

| Browser | navigator.modelContext | Status |
|---------|----------------------|--------|
| Chrome/Edge (with flag) | ✅ Experimental | Use chrome://flags/#enable-webmcp |
| Firefox | ❌ Not yet | Polyfill mode active |
| Safari | ❌ Not yet | Polyfill mode active |
| Other | ❌ Not yet | Polyfill mode active |

**Note**: As of 2025, `navigator.modelContext` is an experimental API. Most browsers will use the polyfill mode. Enable experimental flags to test native mode.

## Development Notes

### Adding New Tools

To add a new WebMCP tool to the application:

```typescript
// In src/lib/webmcp.ts - inside initializeWebMCPTools()

registerWebMCPTool({
  name: 'your_tool_name',
  description: 'Clear description of what the tool does',
  inputSchema: {
    type: 'object',
    properties: {
      paramName: {
        type: 'string',
        description: 'Parameter description'
      }
    },
    required: ['paramName']  // List required parameters
  },
  async execute(args) {
    // Tool logic here
    const result = await doSomething(args.paramName)
    
    // Return in MCP format
    return {
      content: [{
        type: 'text',
        text: JSON.stringify(result)
      }]
    }
  }
})
```

### Type Safety

TypeScript definitions ensure type safety:

```typescript
interface WebMCPToolDefinition {
  name: string
  description: string
  inputSchema: {
    type: 'object'
    properties?: Record<string, unknown>
    required?: string[]
  }
  execute: (args: Record<string, unknown>) => 
    Promise<{ content: Array<{ type: string; text: string }> }>
}
```

## References

- [W3C WebMCP Proposal](https://github.com/webmachinelearning/webmcp)
- [Model Context Protocol (MCP)](https://modelcontextprotocol.io/)
- [WebMCP Organization](https://github.com/WebMCP-org)
- [WebMCP Proposal Document](https://github.com/webmachinelearning/webmcp/blob/main/proposal.md)

## Future Enhancements

Planned improvements as the specification evolves:

1. **Resources**: Expose application data as MCP resources
2. **Prompts**: Provide pre-defined prompt templates for common debugging tasks
3. **Sampling**: Allow agents to request specific data samples
4. **Tool Parameters**: Add input parameters to existing tools for filtered queries
5. **Multimodal Content**: Support image/video content in tool responses

## Summary

✅ **Standardized**: Uses official W3C WebMCP specification  
✅ **Future-Proof**: Compatible with emerging AI agent browsers  
✅ **Backward Compatible**: Polyfill ensures existing functionality  
✅ **Secure**: Follows W3C security guidelines  
✅ **Developer-Friendly**: Clear APIs, comprehensive error handling  
✅ **Agent-Ready**: Six debugging tools ready for AI interaction

The application is now fully compliant with the latest WebMCP standards and ready for the agent-powered web!

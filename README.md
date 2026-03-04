# Self-Diagnosing SaaS Dashboard - WebMCP Demo

This **React application** demonstrates the power of **WebMCP** (Model Context Protocol for Web Applications) for debugging complex application issues by exposing internal application context through a standardized browser API.

## 🚀 Quick Start: Verify WebMCP is Working

**→ [VERIFICATION_GUIDE.md](./VERIFICATION_GUIDE.md) ← Start here to confirm everything is working!**

The guide includes:
- ✅ Visual checklist for the UI panel
- ✅ Console commands to test the API
- ✅ Step-by-step bug scenarios
- ✅ Troubleshooting common issues

**→ [WEBMCP_TEST_GUIDE.md](./WEBMCP_TEST_GUIDE.md) ← Complete browser console testing guide**

Comprehensive testing instructions for all 6 WebMCP tools:
- 🧪 Detailed test procedures for each tool
- 📊 Expected output for every test case
- 🔄 Native vs Polyfill mode testing
- ✅ Complete verification checklist

## About This Application

### Is this a React app?
**YES!** This is a full React application built with:
- **React 19.2.0** with TypeScript
- **Vite 7** for build tooling
- **Tailwind CSS 4** for styling
- **shadcn/ui components** (v4)
- **Framer Motion** for animations
- **Phosphor Icons** for iconography

You can verify this by checking `package.json` or looking at `src/App.tsx` and `src/main.tsx`.

## What is WebMCP?

WebMCP (Model Context Protocol for the Browser) is a **web standard proposal** that allows web applications to expose their internal functionality as "tools" that can be invoked by AI agents, browser assistants, and assistive technologies.

###WebMCP Official Documentation:
- Main Proposal: https://github.com/webmachinelearning/webmcp
- Implementation (MCP-B): https://github.com/WebMCP-org

### How WebMCP Works

Instead of AI agents trying to understand your app by scraping the DOM and simulating clicks, WebMCP lets you expose a clean API directly:

```typescript
// Traditional approach: AI agents scrape DOM
<div class="error">Permission denied</div>
// Agent has no idea WHY this happened

// WebMCP approach: Expose context programmatically
window.webMCP.tools.call('reproduce_bug')
// Returns: {
//   failedEvent: {...},
//   conflictingRules: [...],
//   missingPermissions: ['approve_orders'],
//   reproductionSteps: [...]
// }
```

## WebMCP Implementation in This App

This demo implements WebMCP according to the official specification:

### 1. Tool Registration (src/lib/webmcp.ts)

Each tool is registered with:
- **name**: Unique identifier
- **description**: Natural language description
- **inputSchema**: JSON Schema for parameters
- **handler**: Function that returns the tool's output

```typescript
registerWebMCPTool({
  name: 'get_app_state',
  description: 'Get overall application state summary...',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  handler: () => {
    return { /* app state data */ }
  }
})
```

### 2. Browser API Exposure

The tools are exposed via `window.webMCP`:

```typescript
window.webMCP = {
  tools: {
    list: () => [...all tool definitions...],
    call: (name, args) => execute tool and return result
  }
}
```

### 3. Available Tools

This demo registers 6 WebMCP tools:

1. **get_app_state** - Overview of orders, flags, rules, and user state
2. **get_user_session** - Current user role and permissions
3. **get_business_rules** - All business rules and their conditions
4. **get_failed_events** - Complete log of failed operations with context
5. **reproduce_bug** - Step-by-step reproduction of the last bug
6. **generate_bug_report** - Comprehensive analysis with root causes

## Demo Features

### SaaS Dashboard (The "App")
- **Orders Management**: View and create customer orders
- **Checkout Flow**: Process orders with payment methods
- **Admin Panel**: Configure feature flags and user permissions
- **Intentional Bugs**: Realistic failure scenarios for demonstration

### WebMCP Debug Panel (The "Tools")
- Interactive UI to call WebMCP tools
- JSON viewer for tool outputs
- Real-time application state inspection
- Root cause analysis for failures

## Intentional Bugs

The app includes three realistic bug scenarios to demonstrate WebMCP's power:

### Bug 1: Permission Mismatch
- **Trigger**: Change role to "Guest" → try to create an order
- **Surface Issue**: "Permission denied" error
- **Hidden Cause**: User role lacks `create_order` permission
- **WebMCP Reveals**: Exact missing permission + user's current permissions

### Bug 2: Feature Flag Conflict
- **Trigger**: Disable "enable_checkout" flag → try to checkout an order
- **Surface Issue**: Generic "Checkout disabled" message
- **Hidden Cause**: Feature flag configuration
- **WebMCP Reveals**: Which flags are enabled/disabled + their dependencies

### Bug 3: Business Rule Conflict (Most Complex)
- **Trigger**: Create order > $200 → try to checkout as "User" role
- **Surface Issue**: "High-value orders require admin approval"
- **Hidden Cause**: Conflicting business rules + feature flags
  - Rule: Orders > $200 require approval
  - Flag: `require_admin_approval` is enabled
  - Flag: `auto_approve_orders` is also enabled (conflict!)
  - User lacks `approve_orders` permission
- **WebMCP Reveals**: 
  - Conflicting rules and their priorities
  - Conflicting feature flags
  - Missing permissions for the action
  - Step-by-step reproduction path
  - Suggested solutions

## Traditional Debugging vs WebMCP

### Without WebMCP (DOM-only debugging)
```javascript
// What you see in the DOM:
<div class="error">Permission denied: High-value orders require admin approval</div>

// What you DON'T know:
// - Which rule triggered this?
// - What's the user's actual role and permissions?
// - Are there conflicting feature flags?
// - What's the threshold for "high-value"?
// - Why doesn't auto-approve work?
```

### With WebMCP
```javascript
// Open browser console:
window.webMCP.tools.call('reproduce_bug')

// Returns complete context:
{
  "conflictingRules": [
    { "name": "High Value Order Approval", "condition": "order.amount > 200" }
  ],
  "conflictingFlags": [
    { "name": "require_admin_approval", "enabled": true },
    { "name": "auto_approve_orders", "enabled": true }
  ],
  "userContext": {
    "role": "user",
    "missingPermissions": ["approve_orders"]
  },
  "reproductionSteps": [/* Step-by-step guide */]
}
```

## How to Use This Demo

### In the UI:
1. **Explore the Dashboard**: Create orders, view the list
2. **Trigger a Bug**: Try one of the scenarios above
3. **Use WebMCP Tools**: Click tools in the right panel to diagnose
4. **Compare**: Notice how WebMCP reveals the full context
5. **Fix the Bug**: Use admin panel to grant permissions or adjust flags

### In the Browser Console:
```javascript
// List all available tools
window.webMCP.tools.list()

// Call a specific tool
window.webMCP.tools.call('get_app_state')
window.webMCP.tools.call('get_failed_events')
window.webMCP.tools.call('reproduce_bug')
window.webMCP.tools.call('generate_bug_report')

// This is what AI agents would use to debug your app!
```

## Key Takeaways

- **DOM inspection** shows UI state but not business logic
- **Console logs** are limited by what developers remembered to log
- **WebMCP tools** expose complete application context on demand
- **AI debugging agents** can use WebMCP to diagnose issues without source code access
- **Complex bugs** involving multiple systems are instantly traceable
- **Human-in-the-loop** workflows where users and agents collaborate

## WebMCP Use Cases (from official docs)

1. **Creative Workflows** - AI helps with complex UIs (design tools, photo editors)
2. **Shopping** - AI filters and suggests products based on natural language
3. **Code Review** - AI navigates complex interfaces and automates repetitive tasks
4. **Debugging** - This demo! AI diagnoses bugs using internal app context

## Technical Architecture

```
src/
├── App.tsx              # Main React component with dashboard logic
├── components/
│   ├── WebMCPPanel.tsx  # UI for calling WebMCP tools
│   ├── JsonViewer.tsx   # JSON output display
│   └── ui/              # shadcn components
├── lib/
│   ├── webmcp.ts        # WebMCP tool registration & browser API
│   ├── types.ts         # TypeScript interfaces
│   ├── state.ts         # Application state management
│   └── utils.ts         # Utility functions
└── index.css            # Tailwind + theme configuration
```

## Running the App

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Differences from Standard MCP

**MCP (Model Context Protocol)** typically runs as a backend server (Python/Node.js) that AI platforms connect to.

**WebMCP** runs in the browser and:
- Uses JavaScript instead of Python/Node backends
- Shares UI context with the user (human-in-the-loop)
- Tools execute in the same environment as the web app
- No server setup required - just add to your frontend code
- Perfect for scenarios where users and agents collaborate in the same interface

## Future Enhancements

Based on the WebMCP proposal, future versions could:
- **Progressive Web App (PWA)**: Register tools offline
- **Cross-tab communication**: Share tools across browser tabs
- **Extension integration**: Make tools available to browser extensions
- **MCP bridge**: Expose WebMCP tools as MCP servers for external agents

---

**The power of WebMCP**: Transform opaque runtime errors into fully contextualized, diagnosable issues for AI debugging agents - all from your React frontend!

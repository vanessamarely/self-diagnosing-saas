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

Comprehensive testing instructions for all 8 WebMCP tools:
- 🧪 Detailed test procedures for each tool
- 📊 Expected output for every test case
- 🔄 Native vs Polyfill mode testing
- 🛒 Shopping cart tools testing
- ✅ Complete verification checklist

**→ [SHOPPING_CART_TOOLS_TEST.md](./SHOPPING_CART_TOOLS_TEST.md) ← Detailed shopping cart tools guide**

In-depth testing for the new shopping cart WebMCP tools:
- 🛒 `get_active_cart` - Retrieve cart contents
- ➕ `add_item_to_cart` - Add items programmatically
- 📝 Complete test scenarios
- 🔍 Integration testing workflows

**→ [QUICK_CART_TEST.md](./QUICK_CART_TEST.md) ← Quick console test for shopping cart tools**

Fast copy-paste console tests:
- ⚡ One-line verification
- 🚀 Complete test suite script
- 📋 Expected output examples

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

WebMCP (Model Context Protocol for the Browser) is a **W3C web standard proposal** that allows web applications to expose their internal functionality as "tools" that can be invoked by AI agents, browser assistants, and assistive technologies.

### WebMCP Official Documentation:
- **W3C Proposal**: https://github.com/webmachinelearning/webmcp
- **Proposal Document**: https://github.com/webmachinelearning/webmcp/blob/main/proposal.md
- **WebMCP Organization**: https://github.com/WebMCP-org

### Key Concepts from W3C Proposal

**Agent**: An autonomous assistant (typically LLM-based) that can understand user goals and take actions to achieve them.

**Tools**: JavaScript functions with natural language descriptions and structured schemas that can be invoked by agents.

**Human-in-the-Loop**: WebMCP enables cooperative workflows where users and agents work together within the same web interface, leveraging existing application logic while maintaining shared context and user control.

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

This demo registers **8 WebMCP tools**:

#### State & Session Tools
1. **get_app_state** - Overview of orders, flags, rules, and user state
2. **get_user_session** - Current user role and permissions

#### Shopping Cart Tools (NEW!)
3. **get_active_cart** - Retrieve cart contents with items, quantities, and totals
4. **add_item_to_cart** - Add items to cart programmatically

#### Configuration Tools
5. **get_business_rules** - All business rules and their conditions

#### Debugging Tools
6. **get_failed_events** - Complete log of failed operations with context
7. **reproduce_bug** - Step-by-step reproduction of the last bug
8. **generate_bug_report** - Comprehensive analysis with root causes

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
// List all available tools (should show 8 tools)
window.webMCP.tools.list()

// Call debugging tools
window.webMCP.tools.call('get_app_state')
window.webMCP.tools.call('get_failed_events')
window.webMCP.tools.call('reproduce_bug')
window.webMCP.tools.call('generate_bug_report')

// Call shopping cart tools
window.webMCP.tools.call('get_active_cart')
window.webMCP.tools.call('add_item_to_cart', {
  productId: 'prod_123',
  quantity: 2
})

// This is what AI agents would use to debug your app!
```

## Key Takeaways

- **DOM inspection** shows UI state but not business logic
- **Console logs** are limited by what developers remembered to log
- **WebMCP tools** expose complete application context on demand
- **AI debugging agents** can use WebMCP to diagnose issues without source code access
- **Complex bugs** involving multiple systems are instantly traceable
- **Human-in-the-loop** workflows where users and agents collaborate

## WebMCP Use Cases (from W3C proposal)

The W3C proposal outlines several key use cases for WebMCP:

### 1. Creative Workflows (Design Tools)
A user working in a graphic design platform asks their browser agent to "show me templates that are spring themed with prominent date/time on white background." The agent uses the platform's `filterTemplates(description)` tool to update the UI, then helps with editing using an `editDesign(instructions)` tool.

### 2. Shopping (E-commerce)
A user browsing an online store asks their agent to "show only dresses in my size appropriate for cocktail-attire." The agent calls the store's `getDresses(size, color)` and `showDresses(product_ids)` tools to filter results using natural language.

### 3. Code Review (Development Tools)
A developer opens a code review and asks "Why are the Mac and Android bots failing?" The agent uses `getTryRunStatuses()` and `getTryRunFailureSnippet(bot_name)` tools to diagnose the issue and even suggest fixes.

### 4. Debugging (This Demo!)
**This application demonstrates WebMCP for debugging!** When checkout fails, instead of reading through code and logs, an AI agent can call `get_failed_events()` and `reproduce_bug()` to instantly understand the root cause with complete business context.

### Key Benefits
- **Enables human-in-the-loop workflows**: Users work directly through delegating tasks to AI agents while maintaining visibility and control
- **Simplifies AI integration**: AI agents interact through well-defined tools instead of fragile UI actuation
- **Minimizes developer burden**: Reuse existing JavaScript code - any task users can do can be made into a tool
- **Improves accessibility**: Assistive technologies can access functionality beyond traditional accessibility trees

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

## Differences from Backend MCP

**Backend MCP (Model Context Protocol)** typically runs as a server (Python/Node.js) that AI platforms connect to directly:
- Agent ↔ MCP Server ↔ Backend Service
- No UI required
- Server-to-server communication
- Fully autonomous workflows

**WebMCP (Web MCP)** runs in the browser with a live UI:
- Agent ↔ Browser ↔ Web Page (with UI visible to user)
- Uses JavaScript instead of Python/Node backends
- Shares UI context with the user (human-in-the-loop)
- Tools execute in the same environment as the web app
- No server setup required - just add to your frontend code
- Perfect for scenarios where users and agents collaborate in the same interface
- Users can see agent actions in real-time and intervene

### When to Use Each

**Use Backend MCP when:**
- No UI needed (headless operations)
- Fully autonomous agent workflows
- Backend-only logic and data access
- Server-to-server integration required

**Use WebMCP when:**
- Users and agents collaborate in the same UI
- Visual feedback is important
- Leveraging existing frontend code
- Human-in-the-loop workflows
- Simplifying integration for web-first services

## Future Enhancements

Based on the WebMCP proposal, future versions could:
- **Progressive Web App (PWA)**: Register tools offline
- **Cross-tab communication**: Share tools across browser tabs
- **Extension integration**: Make tools available to browser extensions
- **MCP bridge**: Expose WebMCP tools as MCP servers for external agents

---

**The power of WebMCP**: Transform opaque runtime errors into fully contextualized, diagnosable issues for AI debugging agents - all from your React frontend!

# Self-Diagnosing SaaS Dashboard - WebMCP Demo

This application demonstrates the power of **WebMCP** (Model Context Protocol for Web Applications) for debugging complex application issues by exposing internal application context that would be impossible to discover through DOM inspection alone.

## What is WebMCP?

WebMCP extends the Model Context Protocol to web applications, allowing AI debugging agents to access:
- Internal application state
- Business rules and their interactions
- Feature flag configurations
- Failed events with full context
- Permission and role information

## Demo Features

### SaaS Dashboard
- **Orders Management**: View and create customer orders
- **Checkout Flow**: Process orders with payment methods
- **Admin Panel**: Configure feature flags and user permissions
- **Real-time Bugs**: Intentional bugs that demonstrate debugging scenarios

### WebMCP Debug Tools
The right panel exposes 6 tools that reveal internal application context:

1. **get_app_state** - Overview of orders, flags, rules, and user state
2. **get_user_session** - Current user role and permissions
3. **get_business_rules** - All business rules and their conditions
4. **get_failed_events** - Complete log of failed operations with context
5. **reproduce_bug** - Step-by-step reproduction of the last bug
6. **generate_bug_report** - Comprehensive analysis with root causes

## Intentional Bugs

The app includes three realistic bug scenarios:

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
// What you see:
<div class="error">Permission denied: High-value orders require admin approval</div>

// What you don't know:
// - Which rule triggered this?
// - What's the user's actual role and permissions?
// - Are there conflicting feature flags?
// - What's the threshold for "high-value"?
// - Why does auto-approve not work?
```

### With WebMCP
```javascript
// Click "reproduce_bug" tool:
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
  "reproductionSteps": [...]
}
```

## How to Use This Demo

1. **Explore the Dashboard**: Create orders, view the list
2. **Trigger a Bug**: Try one of the scenarios above
3. **Use WebMCP Tools**: Click tools in the right panel to diagnose
4. **Compare**: Notice how WebMCP reveals the full context
5. **Fix the Bug**: Use admin panel to grant permissions or adjust flags

## Key Takeaways

- **DOM inspection** shows UI state but not business logic
- **Console logs** are limited by what developers remembered to log
- **WebMCP tools** expose complete application context on demand
- **AI debugging agents** can use WebMCP to diagnose issues without source code access
- **Complex bugs** involving multiple systems are instantly traceable

## Try It Yourself

1. Change user role to "Guest" in Admin Settings
2. Try to create an order
3. Click "reproduce_bug" in WebMCP panel
4. See the exact permission mismatch revealed
5. Grant the permission and try again

---

**The power of WebMCP**: Transform opaque runtime errors into fully contextualized, diagnosable issues for AI debugging agents.

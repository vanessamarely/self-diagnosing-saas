# WebMCP Verification Guide

This guide helps you verify that WebMCP is working correctly in the Self-Diagnosing SaaS Dashboard.

## ✅ Quick Verification Checklist

### 1. Visual Check - UI Panel

When you open the application, you should immediately see:

- ✅ **Right sidebar** labeled "WebMCP Debug Tools"
- ✅ **6 tool buttons** with names like `get_app_state`, `get_user_session`, etc.
- ✅ **Instructions section** showing:
  - "How to use WebMCP Tools:"
  - "1. Click any tool button above to execute it"
  - "2. View the structured JSON response below"
  - "3. Try the console: window.webMCP.tools.list()"

### 2. Functional Check - Click a Tool

**Action:** Click the `get_app_state` button

**Expected Result:**
- Button shows spinning icon briefly
- Below the separator, you should see:
  - Tool name: `get_app_state`
  - Timestamp of execution
  - JSON output showing:
    ```json
    {
      "ordersCount": 3,
      "ordersByStatus": { "completed": 1, "pending": 1, "processing": 1 },
      "activeFeatureFlags": [...],
      "activeBusinessRules": 3,
      "failedEventsCount": 0,
      "userRole": "user",
      "userPermissions": ["view_orders", "create_order"]
    }
    ```

### 3. Console Check - Browser API

**Action:** Open browser DevTools (F12) and run:

```javascript
window.webMCP
```

**Expected Result:**
```javascript
{
  tools: {
    list: ƒ (),
    call: ƒ (name, args)
  }
}
```

**Action:** Run:
```javascript
window.webMCP.tools.list()
```

**Expected Result:** Array of 6 tool definitions:
```javascript
[
  {
    name: "get_app_state",
    description: "Get overall application state summary including orders, feature flags, business rules, and user context",
    inputSchema: { type: "object", properties: {}, required: [] },
    handler: ƒ ()
  },
  // ... 5 more tools
]
```

**Action:** Run:
```javascript
window.webMCP.tools.call('get_user_session')
```

**Expected Result:**
```javascript
{
  userId: "user_123",
  userName: "Demo User",
  role: "user",
  permissions: ["view_orders", "create_order"],
  loginTime: "2025-01-...",
  sessionId: "session_..."
}
```

### 4. Console Log Check

**Action:** Look at the browser console when the app loads

**Expected Output:**
```
[WebMCP] Registered tools: ['get_app_state', 'get_user_session', 'get_business_rules', 'get_failed_events', 'reproduce_bug', 'generate_bug_report']
```

## 🐛 Testing Bug Detection

### Test 1: Trigger a Permission Bug

1. Click **"Admin"** button (top right)
2. Go to **"User Session"** tab
3. Click **"Guest"** button to change role
4. Close the admin dialog
5. Click **"Create Order"** button
6. Fill in the form and click "Create Order"
7. You should see error: "Permission denied"
8. In the WebMCP panel, click **`get_failed_events`**
9. **Expected:** JSON showing the failed event with context

### Test 2: Reproduce the Bug

1. After triggering the bug above
2. In the WebMCP panel, click **`reproduce_bug`**
3. **Expected:** Detailed reproduction info:
   ```json
   {
     "status": "reproduced",
     "failedEvent": { ... },
     "conflictingRules": [],
     "conflictingFlags": [],
     "userContext": {
       "role": "guest",
       "permissions": ["view_orders"],
       "missingPermissions": ["create_order"]
     },
     "reproductionSteps": [
       "1. User with role 'guest' attempted action",
       "2. Action required permissions: create_order",
       "3. User has permissions: view_orders",
       ...
     ]
   }
   ```

### Test 3: Generate Bug Report

1. After triggering one or more bugs
2. Click **`generate_bug_report`** in the WebMCP panel
3. **Expected:** Comprehensive report with:
   - `summary` - Total failures, failure types
   - `rootCauses` - Array of identified root causes
   - `recommendations` - Suggested fixes

## 🚨 Troubleshooting

### Issue: WebMCP Panel shows but no output

**Symptoms:** Panel is visible but clicking tools shows nothing

**Solutions:**
1. Check browser console for errors
2. Verify `window.webMCP` exists in console
3. Try calling tools directly: `window.webMCP.tools.call('get_app_state')`
4. Check if app state is initialized (should happen automatically)

### Issue: Console says "webMCP is not defined"

**Symptoms:** `window.webMCP` returns `undefined`

**Solutions:**
1. Check that `initializeWebMCPTools()` is called in App.tsx (line 20)
2. Refresh the page
3. Check browser console for any JavaScript errors
4. Verify you're running the latest code

### Issue: JSON output not displaying

**Symptoms:** Tool executes but no JSON shown

**Solutions:**
1. Check if the result section appears (should show tool name and timestamp)
2. Scroll down in the result area (it might be there but scrolled)
3. Try a different tool to see if all tools are affected
4. Check browser console for rendering errors

### Issue: "App state not initialized" error

**Symptoms:** Tools return error "App state not initialized"

**Solutions:**
1. This should never happen if the app loaded correctly
2. Refresh the page
3. Check that `App.tsx` is rendering properly
4. Verify `appState` is being passed to `<WebMCPPanel appState={appState} />`

## ✨ Expected Behavior Summary

| Action | Expected Result |
|--------|-----------------|
| Open app | WebMCP panel visible with 6 tools |
| Click any tool | JSON output appears below |
| Open console | `window.webMCP` is defined |
| Call `window.webMCP.tools.list()` | Returns array of 6 tools |
| Call `window.webMCP.tools.call('get_app_state')` | Returns state object |
| Trigger bug | Error shows in UI |
| Click `get_failed_events` | Shows array with error details |
| Click `reproduce_bug` | Shows reproduction with full context |
| Click `generate_bug_report` | Shows comprehensive analysis |

## 🎯 Success Criteria

WebMCP is working correctly if:

✅ All 6 tools are visible in the UI panel  
✅ Clicking any tool displays JSON output  
✅ `window.webMCP` is accessible in console  
✅ Console commands work as expected  
✅ Failed events are captured and queryable  
✅ Bug reproduction provides detailed context  
✅ Bug reports include root causes and recommendations  

## 📚 Next Steps

Once you've verified WebMCP is working:

1. **Explore the tools** - Try each tool to see what data it exposes
2. **Trigger all bugs** - Follow the scenarios in README.md
3. **Use the console** - Practice calling tools programmatically
4. **Imagine AI integration** - Think how an AI agent would use these tools
5. **Read the docs** - Check out WEBMCP_EXAMPLES.md for detailed workflows

---

**If everything above checks out, WebMCP is working correctly! 🎉**

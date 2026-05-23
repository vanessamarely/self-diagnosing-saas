# Visual Testing Guide: Shopping Cart & get_active_cart Tool

## Overview
This guide provides a complete walkthrough for testing the shopping cart functionality and verifying it using the `get_active_cart` WebMCP tool.

---

## 🎯 Test Scenario: Complete Cart Workflow

### Visual Indicators to Look For

When you open the **Orders** tab, you'll see:

1. **Active Shopping Cart Summary Card** (at the top with gradient background)
   - Number of items in cart (pending orders)
   - Total cart value in USD
   - Number of completed orders

2. **Order Cards** with visual badges:
   - 🟣 **"pending"** badge = Item is in the cart
   - 🛒 **"In Cart"** badge = Explicitly shows it's a cart item
   - 🟢 **"completed"** badge = Order has been checked out
   - 🔴 **"failed"** badge = Checkout failed

---

## 📝 Step-by-Step Testing

### Step 1: Start with Empty State

1. Navigate to **Orders** tab
2. If you see orders, you can refresh the app to reset (or complete all pending orders)
3. **Expected**: Empty state shows shopping cart icon with "No orders yet" message

---

### Step 2: Create Test Orders

Navigate to **Create Order** tab and add these orders:

#### Order A: Small Purchase
```
Customer Name: Alice Cooper
Email: alice@test.com
Amount: 25.50
Items: Starter Pack
```
**Click "Create Order"**

#### Order B: Medium Purchase
```
Customer Name: Bob Smith
Email: bob@test.com
Amount: 89.99
Items: Pro Plan, Support
```
**Click "Create Order"**

#### Order C: High Value (will trigger error)
```
Customer Name: Charlie Brown
Email: charlie@test.com
Amount: 299.00
Items: Enterprise License, Premium Support, Training
```
**Click "Create Order"**

---

### Step 3: Verify Visual Cart Display

Navigate back to **Orders** tab.

**What you should see in the Cart Summary Card:**

```
┌─────────────────────────────────────────────┐
│  🛒 Active Shopping Cart                     │
│                                              │
│   3          $414.49        0               │
│  Items       Cart Total    Completed        │
└─────────────────────────────────────────────┘
```

**In the orders list below:**
- All 3 orders showing "pending" badge
- All 3 orders showing "In Cart" badge
- Each has a "Checkout" button

---

### Step 4: Test get_active_cart Tool

#### Method 1: WebMCP Debug Tools Panel

1. Navigate to **WebMCP Tools** tab
2. Scroll to **Shopping Cart** section
3. Click the **"get_active_cart"** button

**Expected JSON Response:**
```json
{
  "items": [
    {
      "orderId": "01J...",
      "customerName": "Alice Cooper",
      "email": "alice@test.com",
      "items": ["Starter Pack"],
      "quantity": 1,
      "price_usd": 25.50,
      "createdAt": "2025-01-..."
    },
    {
      "orderId": "01J...",
      "customerName": "Bob Smith",
      "email": "bob@test.com",
      "items": ["Pro Plan", "Support"],
      "quantity": 2,
      "price_usd": 89.99,
      "createdAt": "2025-01-..."
    },
    {
      "orderId": "01J...",
      "customerName": "Charlie Brown",
      "email": "charlie@test.com",
      "items": ["Enterprise License", "Premium Support", "Training"],
      "quantity": 3,
      "price_usd": 299.00,
      "createdAt": "2025-01-..."
    }
  ],
  "itemCount": 3,
  "total_usd": 414.49,
  "currency": "USD",
  "timestamp": "2025-01-..."
}
```

✅ **Verification Points:**
- `itemCount` matches the visual cart summary (3)
- `total_usd` matches the visual cart total ($414.49)
- All 3 orders are listed with complete details

#### Method 2: Browser Console

Open Developer Console (F12) and run:

```javascript
await window.webMCP.tools.call('get_active_cart')
```

You should see the same JSON response.

---

### Step 5: Checkout a Low-Value Order

1. Go back to **Orders** tab
2. Find Alice Cooper's order ($25.50)
3. Click the **"Checkout"** button

**Expected Results:**

✅ Success toast: "Order completed successfully!"

**Visual Changes in Cart Summary:**
```
┌─────────────────────────────────────────────┐
│  🛒 Active Shopping Cart                     │
│                                              │
│   2          $388.99        1               │
│  Items       Cart Total    Completed        │
└─────────────────────────────────────────────┘
```

**In the orders list:**
- Alice's order now shows "completed" badge (green)
- Alice's order NO LONGER shows "In Cart" badge
- Alice's order NO LONGER has "Checkout" button
- Bob and Charlie's orders remain "pending"

**Re-run get_active_cart:**
```javascript
await window.webMCP.tools.call('get_active_cart')
```

**Expected:**
- `itemCount: 2` (Alice removed)
- `total_usd: 388.99` (updated total)
- Only Bob and Charlie in the items array

---

### Step 6: Try to Checkout High-Value Order (Permission Error)

1. Find Charlie Brown's order ($299.00)
2. Click **"Checkout"** button

**Expected Results:**

❌ Error toast: "Checkout failed: Permission denied for high-value order"

**Visual Changes:**
- Cart summary remains: **2 items, $388.99**
- Charlie's order STILL shows "pending" badge
- Charlie's order STILL shows "In Cart" badge
- NO change to order status

**Why?** The business rule "High-value orders (>$200) require approval permission" is active, and the current user (role: "user") doesn't have the "approve_orders" permission.

---

### Step 7: Investigate the Failure

#### Navigate to Admin Panel Tab

Scroll to **Failed Events** section. You should see:

```
┌─────────────────────────────────────────────┐
│  ⚠️ Failed Events                            │
│                                              │
│  [checkout_attempt]  12:34:56 PM             │
│  User lacks permission to approve            │
│  high-value orders                           │
│                                              │
│  {                                           │
│    "reason": "permission_denied",            │
│    "orderId": "01J...",                      │
│    "orderAmount": 299.00,                    │
│    "affectedRules": ["rule_1"],              │
│    "requiredPermissions": ["approve_orders"], │
│    "userPermissions": ["view_orders",        │
│                        "create_orders"]      │
│  }                                           │
└─────────────────────────────────────────────┘
```

#### Navigate to WebMCP Tools Tab

**Run `reproduce_bug` tool:**

Expected to see reproduction steps:
```json
{
  "status": "reproduced",
  "failedEvent": {...},
  "userContext": {
    "role": "user",
    "permissions": ["view_orders", "create_orders"],
    "missingPermissions": ["approve_orders"]
  },
  "reproductionSteps": [
    "1. User with role 'user' attempted action",
    "2. Action required permissions: approve_orders",
    "3. User has permissions: view_orders, create_orders",
    "4. Business rules evaluated: High-value order approval",
    "5. Feature flags checked: require_admin_approval",
    "6. Result: User lacks permission to approve high-value orders"
  ]
}
```

**Run `generate_bug_report` tool:**

Expected to see a complete analysis:
```json
{
  "summary": {
    "totalFailures": 1,
    "recentFailures": 1,
    "failureTypes": {
      "checkout_attempt": 1
    }
  },
  "rootCauses": [
    {
      "type": "Permission Mismatch",
      "count": 1,
      "description": "User role 'user' lacks required permissions",
      "solution": "Grant permissions: approve_orders"
    }
  ],
  "recommendations": [
    "Review user permissions and align with role requirements",
    "Audit feature flag combinations for conflicts",
    ...
  ]
}
```

---

## 🔄 Advanced Test: Cart Updates in Real-Time

### Scenario A: Rapid Order Creation

1. Stay on **Orders** tab (keep it visible)
2. Open **Create Order** tab in split view (if possible) or switch back and forth
3. Create 5 orders quickly with amounts: $10, $20, $30, $40, $50
4. Watch the cart summary update after each creation

**Expected:** Cart summary updates immediately:
- Items count: 2 → 3 → 4 → 5 → 6 → 7
- Total: $388.99 → $398.99 → $418.99 → ...

### Scenario B: Multiple Checkouts

1. Checkout Bob's order ($89.99)
2. Run `get_active_cart` 
3. Create a new order
4. Run `get_active_cart` again

**Expected:** Tool always reflects current state

---

## 📊 Comparison: Traditional vs WebMCP Debugging

### Traditional Debugging (The Hard Way)

To find out what's in the cart:
1. Open DevTools
2. Find React Components tree
3. Drill into state
4. Copy state object
5. Manually calculate totals
6. Search through code to understand business logic
7. Set breakpoints to see why checkout failed
8. Guess which rules are affecting behavior

**Time: ~10-15 minutes** ⏱️

### WebMCP Debugging (The Easy Way)

To find out what's in the cart:
1. Click `get_active_cart` button
2. See structured JSON immediately

**Time: ~2 seconds** ⚡

To understand a failure:
1. Click `reproduce_bug`
2. Click `generate_bug_report`
3. See complete analysis with root causes

**Time: ~5 seconds** ⚡

---

## ✅ Success Criteria Checklist

Use this to verify everything works:

- [ ] Cart summary shows correct item count
- [ ] Cart summary shows correct total value
- [ ] Orders with "pending" status appear in cart
- [ ] Orders with "completed" status don't appear in cart
- [ ] `get_active_cart` returns all pending orders
- [ ] `get_active_cart` total matches visual display
- [ ] Checking out an order removes it from cart
- [ ] High-value orders trigger permission errors
- [ ] Failed events are logged with full context
- [ ] `reproduce_bug` provides step-by-step recreation
- [ ] `generate_bug_report` includes root cause analysis
- [ ] Console commands work: `window.webMCP.tools.list()`
- [ ] Console commands work: `await window.webMCP.tools.call('get_active_cart')`

---

## 🎨 Visual Design Elements to Notice

### Color Coding
- **Primary Blue** (#6366f1): Cart summary, tool buttons
- **Accent Purple** (#a855f7): Active states, AI indicators
- **Green** (success): Completed orders
- **Red** (destructive): Failed orders, errors
- **Yellow/Orange** (warning): Permission issues

### Badges
- **"pending"** - Muted colors
- **"In Cart"** - Primary blue with cart icon
- **"completed"** - Accent purple/green
- **"failed"** - Destructive red

### Gradients
- Cart summary card has a subtle gradient from primary to accent
- Creates visual hierarchy and draws attention

---

## 🐛 Troubleshooting

### Problem: Cart summary shows 0 items but I see orders

**Solution:** Check that orders have status "pending". Only pending orders count as cart items.

### Problem: get_active_cart returns empty array

**Solution:** 
1. Verify you have orders with status "pending"
2. Check browser console for errors
3. Refresh the page and try again

### Problem: WebMCP tools not available

**Solution:**
1. Open console and check for WebMCP initialization logs
2. Run `window.webMCP` to verify it exists
3. Check for errors during page load

### Problem: Checkout button does nothing

**Solution:**
1. Check if there's a toast message (might be too quick to see)
2. Open Admin Panel → Failed Events to see if error was logged
3. Check browser console for JavaScript errors

---

## 🚀 Next Steps

After verifying the cart works:

1. **Try the AI Assistant** (AI Assistant tab)
   - Ask: "Why did my checkout fail?"
   - Ask: "What's in my cart?"
   - See how it uses WebMCP tools automatically

2. **View the Comparison** (Comparison tab)
   - Side-by-side traditional vs WebMCP debugging
   - See the difference visually

3. **Export Bug Reports**
   - Use `generate_bug_report` to create detailed reports
   - Share with your development team

4. **Test with Browser Agents**
   - If your browser supports `navigator.modelContext`
   - Tools are automatically available to AI agents
   - No additional integration needed

---

## 📚 Related Documentation

- `CART_VERIFICATION_GUIDE.md` - Quick testing steps
- `WEBMCP_TEST_GUIDE.md` - Complete WebMCP testing
- `TESTING_AI_ASSISTANT.md` - AI assistant testing
- `W3C_WEBMCP_IMPLEMENTATION.md` - Technical details

---

**Happy Testing! 🎉**

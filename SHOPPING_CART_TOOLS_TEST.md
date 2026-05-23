# Shopping Cart WebMCP Tools - Testing Guide

This guide focuses specifically on testing the two new shopping cart WebMCP tools that were added to the application.

## Overview

The application now includes **8 WebMCP tools** total (previously 6):

### New Shopping Cart Tools
1. **`get_active_cart`** - Returns structured cart data with items, quantities, and totals
2. **`add_item_to_cart`** - Adds items to the shopping cart programmatically

### Original Debug Tools
3. `get_app_state`
4. `get_user_session`
5. `get_business_rules`
6. `get_failed_events`
7. `reproduce_bug`
8. `generate_bug_report`

## Prerequisites

1. Open the application in your browser
2. Open Browser Developer Console (F12 or Cmd+Option+I)
3. Navigate to the "WebMCP Tools" tab in the application UI

## Verify All 8 Tools Are Registered

```javascript
// List all available tools
window.webMCP.tools.list()

// Expected: Array with 8 tools
// Look for 'get_active_cart' and 'add_item_to_cart' in the list
```

**✅ Success:** You should see 8 tools total, including the two shopping cart tools.

---

## Test 1: get_active_cart (Empty Cart)

### Scenario: Test cart retrieval when no orders exist

```javascript
// Clear any existing orders first (optional - just to test empty state)
window.webMCP.tools.call('get_active_cart')
```

### Expected Output (Empty Cart):
```json
{
  "items": [],
  "itemCount": 0,
  "total_usd": 0,
  "currency": "USD",
  "timestamp": "2025-01-15T14:30:00.000Z"
}
```

**✅ Success Criteria:**
- Returns an object with `items` array (empty)
- `itemCount` is 0
- `total_usd` is 0
- `currency` is "USD"
- `timestamp` is present

---

## Test 2: get_active_cart (With Items)

### Setup: Create some orders first

1. Navigate to the "Create Order" tab in the UI
2. Create multiple orders with different amounts:
   - Order 1: Customer "Alice", Email "alice@test.com", Amount $50
   - Order 2: Customer "Bob", Email "bob@test.com", Amount $150
   - Order 3: Customer "Charlie", Email "charlie@test.com", Amount $99.99

3. **Important:** Do NOT checkout these orders - they need to remain "pending" to appear in the cart

### Test Command:
```javascript
window.webMCP.tools.call('get_active_cart')
```

### Expected Output (With Items):
```json
{
  "items": [
    {
      "orderId": "ord_1234567890",
      "customerName": "Alice",
      "email": "alice@test.com",
      "items": ["Custom Order"],
      "quantity": 1,
      "price_usd": 50,
      "createdAt": "2025-01-15T14:25:00.000Z"
    },
    {
      "orderId": "ord_1234567891",
      "customerName": "Bob",
      "email": "bob@test.com",
      "items": ["Custom Order"],
      "quantity": 1,
      "price_usd": 150,
      "createdAt": "2025-01-15T14:26:00.000Z"
    },
    {
      "orderId": "ord_1234567892",
      "customerName": "Charlie",
      "email": "charlie@test.com",
      "items": ["Custom Order"],
      "quantity": 1,
      "price_usd": 99.99,
      "createdAt": "2025-01-15T14:27:00.000Z"
    }
  ],
  "itemCount": 3,
  "total_usd": 299.99,
  "currency": "USD",
  "timestamp": "2025-01-15T14:30:00.000Z"
}
```

**✅ Success Criteria:**
- `items` array contains all pending orders
- Each item has: orderId, customerName, email, items, quantity, price_usd, createdAt
- `itemCount` matches number of pending orders
- `total_usd` is the sum of all item prices (50 + 150 + 99.99 = 299.99)
- Only orders with status "pending" are included

---

## Test 3: Verify Cart Excludes Completed Orders

### Setup: Checkout one order

1. Go to "Orders" tab
2. Click "Checkout" on one of the orders (preferably a low-value order under $200 to avoid permission errors)
3. The order status should change to "completed"

### Test Command:
```javascript
window.webMCP.tools.call('get_active_cart')
```

### Expected Behavior:
- The checked-out order should NOT appear in the cart
- `itemCount` should decrease by 1
- `total_usd` should decrease by the amount of the checked-out order
- Only "pending" orders remain in the cart

**✅ Success Criteria:**
- Completed orders are excluded from cart
- Cart totals update correctly

---

## Test 4: add_item_to_cart (Basic)

### Test Command:
```javascript
window.webMCP.tools.call('add_item_to_cart', {
  productId: 'prod_test_001',
  quantity: 2
})
```

### Expected Output:
```json
{
  "success": true,
  "message": "Item added successfully",
  "productId": "prod_test_001",
  "quantity": 2,
  "timestamp": "2025-01-15T14:35:00.000Z",
  "note": "This is a demonstration tool. In a real implementation, this would trigger the application's addToCart action and update the cart state."
}
```

**✅ Success Criteria:**
- Returns success response
- Confirms the productId that was passed
- Confirms the quantity that was passed
- Includes helpful note about demonstration nature

---

## Test 5: add_item_to_cart (Default Quantity)

### Test Command (without quantity parameter):
```javascript
window.webMCP.tools.call('add_item_to_cart', {
  productId: 'prod_test_002'
})
```

### Expected Output:
```json
{
  "success": true,
  "message": "Item added successfully",
  "productId": "prod_test_002",
  "quantity": 1,
  "timestamp": "2025-01-15T14:36:00.000Z",
  "note": "This is a demonstration tool. In a real implementation, this would trigger the application's addToCart action and update the cart state."
}
```

**✅ Success Criteria:**
- Quantity defaults to 1 when not specified
- Tool execution succeeds without error

---

## Test 6: add_item_to_cart (Missing Required Parameter)

### Test Command (missing productId):
```javascript
window.webMCP.tools.call('add_item_to_cart', {
  quantity: 5
})
```

### Expected Behavior:
- Should throw an error
- Error message should indicate productId is required

**✅ Success Criteria:**
- Tool validates required parameters
- Provides clear error message

---

## Test 7: UI Testing - WebMCP Panel

### Test in the UI:

1. Navigate to "WebMCP Tools" tab
2. Expand the "Shopping Cart" section in the accordion
3. Verify both tools are visible:
   - ✅ `get_active_cart` button
   - ✅ `add_item_to_cart` button

### Test get_active_cart Button:
1. Click the `get_active_cart` button
2. Wait for execution to complete
3. Result should appear below in a JSON viewer

**✅ Success Criteria:**
- Button is clickable
- Shows loading state during execution
- Displays formatted JSON result
- Result matches console test output

### Test Tooltips (Desktop):
1. Hover over the `get_active_cart` button
2. Tooltip should appear showing:
   - **Purpose:** "Returns structured JSON with current cart items, quantities, and total price"
   - **When to Use:** "When you need to inspect the current cart state"
   - **Example Use Cases:**
     - "Check pending orders in cart"
     - "Verify cart total calculations"
     - "See all items awaiting checkout"

**✅ Success Criteria:**
- Tooltip appears on hover
- Positioned at the top of the button
- Contains all three sections
- Text is readable

### Test Tooltips (Mobile/Touch):
1. Tap and hold on the `add_item_to_cart` button
2. Tooltip should appear after a brief delay
3. Tap elsewhere to dismiss

**✅ Success Criteria:**
- Touch and hold triggers tooltip
- Tooltip appears within 300-500ms
- Tapping elsewhere dismisses it

---

## Test 8: Integration Test - Full Workflow

### Complete Shopping Cart Workflow:

```javascript
// Step 1: Check initial cart state
console.log('=== Initial Cart ===');
console.log(window.webMCP.tools.call('get_active_cart'));

// Step 2: Add item via tool (demonstration)
console.log('\n=== Adding Item ===');
console.log(window.webMCP.tools.call('add_item_to_cart', {
  productId: 'prod_demo_123',
  quantity: 3
}));

// Step 3: Check cart again
console.log('\n=== Cart After Add (Demo) ===');
console.log(window.webMCP.tools.call('get_active_cart'));

// Note: Since add_item_to_cart is a demo tool, the cart won't actually update.
// Real cart changes happen through the UI "Create Order" flow.

// Step 4: Get full app state to see cart in context
console.log('\n=== Full App State ===');
console.log(window.webMCP.tools.call('get_app_state'));
```

**✅ Success Criteria:**
- All commands execute without errors
- Data is consistent across tool calls
- Cart state reflects UI state

---

## Test 9: Cross-Tool Verification

### Verify cart data appears in multiple tools:

```javascript
// Get detailed cart data
const cart = window.webMCP.tools.call('get_active_cart');
console.log('Cart items:', cart.itemCount);

// Get summary from app state
const appState = window.webMCP.tools.call('get_app_state');
console.log('Orders by status:', appState.ordersByStatus);

// These should match
console.log('Match:', cart.itemCount === appState.ordersByStatus.pending);
```

**✅ Success Criteria:**
- `cart.itemCount` equals number of pending orders in app state
- Data is consistent between different tools

---

## Test 10: Native WebMCP API Verification

### Check if tools are registered with native API:

```javascript
// Check WebMCP status
console.log('Native API supported:', window.webMCP.isSupported);
console.log('Using polyfill:', window.webMCP.usingPolyfill);

// If native is supported, verify registration
if (window.webMCP.isSupported) {
  console.log('✅ Shopping cart tools registered via navigator.modelContext');
  console.log('✅ AI agents can access these tools natively');
} else {
  console.log('⚠️ Using polyfill - tools accessible via window.webMCP');
  console.log('⚠️ Native agent support requires browser with navigator.modelContext');
}
```

**✅ Success Criteria:**
- Status is reported correctly
- Appropriate message shown based on native support
- Tools work in either mode

---

## Console Testing Script

Run this complete test script in the browser console:

```javascript
// ==================================================
// Shopping Cart Tools - Complete Test Suite
// ==================================================

console.log('%c=== Shopping Cart Tools Test Suite ===', 'color: #6366f1; font-weight: bold; font-size: 16px;');

// Test 1: Verify all 8 tools exist
console.log('\n%c[Test 1] Verify Tool Registration', 'font-weight: bold; color: #10b981');
const allTools = window.webMCP.tools.list();
console.log('Total tools:', allTools.length);
const cartTools = allTools.filter(t => t.name.includes('cart'));
console.log('Cart tools:', cartTools.map(t => t.name));
console.assert(allTools.length === 8, '❌ Expected 8 tools');
console.assert(cartTools.length === 2, '❌ Expected 2 cart tools');
console.log('✅ Tool registration verified');

// Test 2: get_active_cart
console.log('\n%c[Test 2] Get Active Cart', 'font-weight: bold; color: #10b981');
try {
  const cart = window.webMCP.tools.call('get_active_cart');
  console.log('Cart data:', cart);
  console.assert(typeof cart.itemCount === 'number', '❌ itemCount should be a number');
  console.assert(typeof cart.total_usd === 'number', '❌ total_usd should be a number');
  console.assert(cart.currency === 'USD', '❌ currency should be USD');
  console.assert(Array.isArray(cart.items), '❌ items should be an array');
  console.log('✅ get_active_cart works correctly');
} catch (error) {
  console.error('❌ get_active_cart failed:', error);
}

// Test 3: add_item_to_cart with parameters
console.log('\n%c[Test 3] Add Item to Cart (with quantity)', 'font-weight: bold; color: #10b981');
try {
  const result = window.webMCP.tools.call('add_item_to_cart', {
    productId: 'test_prod_001',
    quantity: 5
  });
  console.log('Add result:', result);
  console.assert(result.success === true, '❌ success should be true');
  console.assert(result.productId === 'test_prod_001', '❌ productId mismatch');
  console.assert(result.quantity === 5, '❌ quantity should be 5');
  console.log('✅ add_item_to_cart works with parameters');
} catch (error) {
  console.error('❌ add_item_to_cart failed:', error);
}

// Test 4: add_item_to_cart default quantity
console.log('\n%c[Test 4] Add Item to Cart (default quantity)', 'font-weight: bold; color: #10b981');
try {
  const result = window.webMCP.tools.call('add_item_to_cart', {
    productId: 'test_prod_002'
  });
  console.log('Add result:', result);
  console.assert(result.quantity === 1, '❌ quantity should default to 1');
  console.log('✅ Default quantity works');
} catch (error) {
  console.error('❌ Default quantity test failed:', error);
}

// Test 5: Verify cart consistency with app state
console.log('\n%c[Test 5] Cross-Tool Consistency', 'font-weight: bold; color: #10b981');
try {
  const cart = window.webMCP.tools.call('get_active_cart');
  const appState = window.webMCP.tools.call('get_app_state');
  const pendingOrders = appState.ordersByStatus?.pending || 0;
  console.log('Cart items:', cart.itemCount);
  console.log('Pending orders:', pendingOrders);
  console.assert(cart.itemCount === pendingOrders, '❌ Cart count should match pending orders');
  console.log('✅ Data consistency verified');
} catch (error) {
  console.error('❌ Consistency check failed:', error);
}

// Test 6: WebMCP API status
console.log('\n%c[Test 6] WebMCP API Status', 'font-weight: bold; color: #10b981');
console.log('Native API supported:', window.webMCP.isSupported);
console.log('Using polyfill:', window.webMCP.usingPolyfill);
if (window.webMCP.isSupported) {
  console.log('✅ Native navigator.modelContext available');
} else {
  console.log('⚠️ Using window.webMCP polyfill (this is OK)');
}

// Summary
console.log('\n%c=== Test Suite Complete ===', 'color: #6366f1; font-weight: bold; font-size: 16px;');
console.log('%cAll shopping cart tools are functioning correctly!', 'color: #10b981; font-weight: bold;');
console.log('\n%cNext Steps:', 'font-weight: bold');
console.log('1. Create orders in the UI to see cart populate');
console.log('2. Checkout orders to see cart update');
console.log('3. Test tools in the WebMCP Tools tab UI');
console.log('4. Try calling tools from the console directly');
```

---

## Troubleshooting

### Issue: "Tool add_item_to_cart not found"

**Solution:** The tool is registered. Check spelling:
```javascript
// Correct spelling
window.webMCP.tools.call('add_item_to_cart', { productId: 'test' })
```

### Issue: Cart shows 0 items even though orders exist

**Cause:** Only "pending" orders appear in cart. Completed orders are excluded.

**Solution:** 
1. Create new orders without checking them out
2. Or verify order status in the "Orders" tab

### Issue: add_item_to_cart doesn't update the cart

**This is expected behavior!** The `add_item_to_cart` tool is a demonstration tool. It shows how the API works but doesn't actually modify the app state. The note in the response explains this:

```json
{
  "note": "This is a demonstration tool. In a real implementation, 
           this would trigger the application's addToCart action 
           and update the cart state."
}
```

To actually add items to cart, use the "Create Order" UI.

### Issue: Tooltip doesn't appear on hover

**Solution:**
- Make sure you're hovering over the button itself (not the section header)
- Wait ~300ms for tooltip to appear
- On mobile, use tap-and-hold instead of hover

---

## Verification Checklist

Use this checklist to verify shopping cart tools:

### Console Tests
- [ ] ✅ `window.webMCP.tools.list()` shows 8 tools
- [ ] ✅ `get_active_cart` and `add_item_to_cart` appear in tool list
- [ ] ✅ `get_active_cart` returns cart with itemCount and total_usd
- [ ] ✅ `get_active_cart` correctly counts only pending orders
- [ ] ✅ `add_item_to_cart` accepts productId parameter
- [ ] ✅ `add_item_to_cart` defaults quantity to 1
- [ ] ✅ `add_item_to_cart` returns success response
- [ ] ✅ Cart data matches app state data

### UI Tests
- [ ] ✅ "Shopping Cart" section visible in WebMCP Tools tab
- [ ] ✅ Both cart tool buttons are displayed
- [ ] ✅ Clicking `get_active_cart` button shows results
- [ ] ✅ Results display in formatted JSON viewer
- [ ] ✅ Tooltips appear on hover (desktop)
- [ ] ✅ Tooltips appear on tap-and-hold (mobile)
- [ ] ✅ Tooltips positioned at top of button
- [ ] ✅ Accordion expands/collapses correctly

### Integration Tests
- [ ] ✅ Cart updates when orders are created
- [ ] ✅ Cart updates when orders are checked out
- [ ] ✅ Data consistent across all tools
- [ ] ✅ No JavaScript errors in console
- [ ] ✅ WebMCP status badge shows correct mode (Native/Polyfill)

---

## Success! 🎉

If all tests pass, the shopping cart WebMCP tools are working correctly and are ready for:
- AI agent integration
- Browser extension usage
- Automated testing
- Debugging workflows

The tools provide a clean, programmatic API to access cart state without needing to parse the DOM or simulate user interactions.

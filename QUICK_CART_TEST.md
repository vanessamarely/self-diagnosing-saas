# Quick Shopping Cart Tools Test

Copy and paste this into your browser console to quickly test the shopping cart WebMCP tools.

## One-Line Quick Test

```javascript
// Quick test: List all tools and verify shopping cart tools exist
window.webMCP.tools.list().filter(t => t.name.includes('cart'))
```

**Expected:** Should show 2 tools: `get_active_cart` and `add_item_to_cart`

---

## Complete Shopping Cart Test Suite

Copy and paste this entire block:

```javascript
// ================================================
// Shopping Cart Tools - Quick Test
// ================================================

console.log('%c🛒 Testing Shopping Cart Tools', 'font-size: 18px; font-weight: bold; color: #6366f1;');

// 1. Verify tools exist
console.log('\n%c[1/4] Verifying tool registration...', 'font-weight: bold; color: #10b981');
const allTools = window.webMCP.tools.list();
const cartTools = allTools.filter(t => t.name.includes('cart'));
console.log(`✓ Total tools: ${allTools.length}`);
console.log(`✓ Cart tools: ${cartTools.length}`);
cartTools.forEach(t => console.log(`  - ${t.name}: ${t.description}`));

// 2. Test get_active_cart
console.log('\n%c[2/4] Testing get_active_cart...', 'font-weight: bold; color: #10b981');
try {
  const cart = window.webMCP.tools.call('get_active_cart');
  console.log(`✓ Cart retrieved successfully`);
  console.log(`  - Items in cart: ${cart.itemCount}`);
  console.log(`  - Total: $${cart.total_usd} ${cart.currency}`);
  console.log(`  - Full data:`, cart);
  
  if (cart.itemCount === 0) {
    console.log('%c  ℹ️ Cart is empty. Create some orders in the "Create Order" tab to populate the cart.', 'color: #f59e0b');
  } else {
    console.log(`%c  ✓ Cart has ${cart.itemCount} pending order(s)`, 'color: #10b981');
  }
} catch (error) {
  console.error('✗ Error:', error);
}

// 3. Test add_item_to_cart with quantity
console.log('\n%c[3/4] Testing add_item_to_cart (with quantity)...', 'font-weight: bold; color: #10b981');
try {
  const result = window.webMCP.tools.call('add_item_to_cart', {
    productId: 'quick_test_prod_001',
    quantity: 5
  });
  console.log('✓ Tool executed successfully');
  console.log(`  - Product ID: ${result.productId}`);
  console.log(`  - Quantity: ${result.quantity}`);
  console.log(`  - Success: ${result.success}`);
  console.log(`  - Message: ${result.message}`);
  console.log('%c  ℹ️ Note: This is a demo tool. Check the UI "Create Order" tab to actually add items.', 'color: #f59e0b');
} catch (error) {
  console.error('✗ Error:', error);
}

// 4. Test add_item_to_cart with default quantity
console.log('\n%c[4/4] Testing add_item_to_cart (default quantity)...', 'font-weight: bold; color: #10b981');
try {
  const result = window.webMCP.tools.call('add_item_to_cart', {
    productId: 'quick_test_prod_002'
  });
  console.log('✓ Tool executed successfully');
  console.log(`  - Quantity defaulted to: ${result.quantity}`);
  console.assert(result.quantity === 1, '✗ Quantity should default to 1');
} catch (error) {
  console.error('✗ Error:', error);
}

// Summary
console.log('\n%c✓ Shopping Cart Tools Test Complete!', 'font-size: 16px; font-weight: bold; color: #10b981;');
console.log('\n%cNext steps:', 'font-weight: bold');
console.log('1. Go to "Create Order" tab and create a few orders');
console.log('2. Run: window.webMCP.tools.call(\'get_active_cart\')');
console.log('3. Go to "Orders" tab and checkout an order');
console.log('4. Run get_active_cart again to see the cart update');
console.log('\n%cFor detailed testing, see: SHOPPING_CART_TOOLS_TEST.md', 'color: #6366f1; font-style: italic');
```

---

## Individual Tool Tests

### Test: Get Active Cart

```javascript
window.webMCP.tools.call('get_active_cart')
```

### Test: Add Item to Cart (with quantity)

```javascript
window.webMCP.tools.call('add_item_to_cart', {
  productId: 'test_product_123',
  quantity: 3
})
```

### Test: Add Item to Cart (default quantity)

```javascript
window.webMCP.tools.call('add_item_to_cart', {
  productId: 'test_product_456'
})
```

---

## Verify Cart Updates After UI Actions

```javascript
// Run this workflow to see cart update in real-time:

// Step 1: Check initial cart
console.log('Before creating orders:');
console.log(window.webMCP.tools.call('get_active_cart'));

// Step 2: Create orders in UI (go to "Create Order" tab)
console.log('\n👉 Now create 2-3 orders in the UI...');
console.log('Press Enter when done');

// Step 3: Check cart again (run after creating orders)
console.log('\nAfter creating orders:');
console.log(window.webMCP.tools.call('get_active_cart'));

// Step 4: Checkout an order in UI (go to "Orders" tab)
console.log('\n👉 Now checkout one order in the UI...');
console.log('Press Enter when done');

// Step 5: Check cart again (run after checkout)
console.log('\nAfter checkout:');
console.log(window.webMCP.tools.call('get_active_cart'));
```

---

## Verify Data Consistency

```javascript
// Verify cart data matches app state
const cart = window.webMCP.tools.call('get_active_cart');
const appState = window.webMCP.tools.call('get_app_state');

console.log('Cart items:', cart.itemCount);
console.log('Pending orders:', appState.ordersByStatus?.pending || 0);
console.log('Match:', cart.itemCount === (appState.ordersByStatus?.pending || 0) ? '✓' : '✗');
```

---

## Check WebMCP Status

```javascript
// Check if native WebMCP is supported
console.log('Native support:', window.webMCP.isSupported ? '✓ Yes' : '✗ No (using polyfill)');
console.log('Using polyfill:', window.webMCP.usingPolyfill ? 'Yes' : 'No');

if (window.webMCP.isSupported) {
  console.log('✓ Tools registered via navigator.modelContext');
  console.log('✓ AI agents can access these tools natively');
} else {
  console.log('⚠️ Using window.webMCP polyfill (this is OK!)');
  console.log('⚠️ Tools accessible but not via native navigator.modelContext');
}
```

---

## Expected Output Examples

### Empty Cart
```json
{
  "items": [],
  "itemCount": 0,
  "total_usd": 0,
  "currency": "USD",
  "timestamp": "2025-01-15T14:30:00.000Z"
}
```

### Cart with Items
```json
{
  "items": [
    {
      "orderId": "ord_01JJQW...",
      "customerName": "Test User",
      "email": "test@example.com",
      "items": ["Custom Order"],
      "quantity": 1,
      "price_usd": 150,
      "createdAt": "2025-01-15T14:25:00.000Z"
    }
  ],
  "itemCount": 1,
  "total_usd": 150,
  "currency": "USD",
  "timestamp": "2025-01-15T14:30:00.000Z"
}
```

### Add Item Response
```json
{
  "success": true,
  "message": "Item added successfully",
  "productId": "test_product_123",
  "quantity": 3,
  "timestamp": "2025-01-15T14:35:00.000Z",
  "note": "This is a demonstration tool..."
}
```

---

## Troubleshooting

### ❌ Error: "window.webMCP is undefined"
**Solution:** Page not fully loaded. Refresh and wait for page to load completely.

### ❌ Cart shows 0 items but orders exist
**Solution:** Only "pending" orders appear in cart. Check order status in "Orders" tab. Completed orders won't show in cart.

### ❌ add_item_to_cart doesn't update cart
**Expected:** This is a demo tool. It shows the API pattern but doesn't modify app state. Use "Create Order" UI to actually add items.

### ❌ Tool returns "Tool not found"
**Solution:** Check spelling. Tools are:
- `get_active_cart` (with underscore)
- `add_item_to_cart` (with underscores)

---

## Success Criteria ✅

- [ ] Both cart tools appear in `window.webMCP.tools.list()`
- [ ] `get_active_cart` returns object with items, itemCount, total_usd, currency
- [ ] Cart itemCount matches pending orders in app state
- [ ] `add_item_to_cart` accepts productId and quantity parameters
- [ ] `add_item_to_cart` returns success response
- [ ] No JavaScript errors in console
- [ ] WebMCP status shows either Native or Polyfill mode

**If all criteria are met, shopping cart tools are working correctly! 🎉**

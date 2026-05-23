# Shopping Cart Verification Guide

This guide walks you through creating orders and verifying cart updates using the `get_active_cart` WebMCP tool.

## Quick Start: Create Orders and Verify Cart

### Step 1: Create Multiple Orders

1. Navigate to the **"Create Order"** tab
2. Fill in the order form with the following test orders:

#### Test Order 1 - Low Value
- **Customer Name**: John Smith
- **Email**: john@example.com
- **Amount**: 49.99
- **Items**: Basic Plan, Monthly Subscription
- Click **"Create Order"**

#### Test Order 2 - Medium Value
- **Customer Name**: Sarah Johnson
- **Email**: sarah@example.com
- **Amount**: 125.00
- **Items**: Pro Plan, Annual Subscription, Support Package
- Click **"Create Order"**

#### Test Order 3 - High Value (Will trigger permission issues)
- **Customer Name**: Mike Davis
- **Email**: mike@example.com
- **Amount**: 350.00
- **Items**: Enterprise Plan, Premium Support, Training Package
- Click **"Create Order"**

### Step 2: View Created Orders

1. Navigate to the **"Orders"** tab
2. You should see all three orders listed with status **"pending"**
3. Note the order details:
   - Customer names
   - Email addresses
   - Total amounts
   - Items lists

### Step 3: Verify Cart with get_active_cart Tool

#### Method A: Using WebMCP Debug Tools Panel

1. Navigate to the **"WebMCP Tools"** tab
2. Expand the **"Shopping Cart"** section
3. Click the **"get_active_cart"** button
4. View the JSON response showing:
   - All pending orders (items in cart)
   - Individual order details
   - Total cart value
   - Item count

**Expected Result:**
```json
{
  "items": [
    {
      "orderId": "...",
      "customerName": "John Smith",
      "email": "john@example.com",
      "items": ["Basic Plan", "Monthly Subscription"],
      "quantity": 2,
      "price_usd": 49.99,
      "createdAt": "..."
    },
    {
      "orderId": "...",
      "customerName": "Sarah Johnson",
      "email": "sarah@example.com",
      "items": ["Pro Plan", "Annual Subscription", "Support Package"],
      "quantity": 3,
      "price_usd": 125.00,
      "createdAt": "..."
    },
    {
      "orderId": "...",
      "customerName": "Mike Davis",
      "email": "mike@example.com",
      "items": ["Enterprise Plan", "Premium Support", "Training Package"],
      "quantity": 3,
      "price_usd": 350.00,
      "createdAt": "..."
    }
  ],
  "itemCount": 3,
  "total_usd": 524.99,
  "currency": "USD",
  "timestamp": "2025-01-XX..."
}
```

#### Method B: Using Browser Console

1. Open browser console (F12 or Cmd+Option+I)
2. Run the following command:
   ```javascript
   await window.webMCP.tools.call('get_active_cart')
   ```
3. View the returned cart data

#### Method C: Using Native WebMCP API (if supported)

If your browser supports `navigator.modelContext`, the tools are automatically registered and available to browser agents.

### Step 4: Test Cart Updates

#### Complete an Order (Low Value)
1. Go back to **"Orders"** tab
2. Find John Smith's order ($49.99)
3. Click **"Checkout"** button
4. Order status should change to **"completed"**
5. Run `get_active_cart` again
6. Verify John's order is NO LONGER in the cart
7. Total should now be: $475.00 (Sarah + Mike)

#### Try to Complete a High-Value Order (Will Fail)
1. Find Mike Davis's order ($350.00)
2. Click **"Checkout"** button
3. You should see an error: **"Checkout failed: Permission denied for high-value order"**
4. Run `get_active_cart` again
5. Verify Mike's order is STILL in the cart (status still "pending")
6. Total remains: $475.00

### Step 5: Investigate the Failed Checkout

1. Navigate to **"Admin Panel"** tab
2. Scroll to **"Failed Events"** section
3. You should see the permission denied error with full context
4. Navigate to **"WebMCP Tools"** tab
5. Click **"reproduce_bug"** to see step-by-step reproduction
6. Click **"generate_bug_report"** for a full analysis

## What This Demonstrates

### WebMCP Benefits Over Traditional Debugging

#### Traditional Debugging Approach:
- Inspect DOM elements manually
- Check console logs
- Set breakpoints in code
- Guess at internal state
- Limited context about why something failed

#### WebMCP Approach:
- **`get_active_cart`**: Instantly see structured cart data
- **`get_user_session`**: Check user permissions
- **`get_business_rules`**: See which rules are active
- **`get_failed_events`**: Full error context
- **`reproduce_bug`**: Step-by-step recreation
- **`generate_bug_report`**: Automated root cause analysis

## Advanced Testing Scenarios

### Scenario 1: Empty Cart Check
1. Complete all pending orders (low-value ones)
2. Run `get_active_cart`
3. Should return empty items array with $0 total

### Scenario 2: Mass Order Creation
1. Create 10 orders quickly
2. Run `get_active_cart`
3. Verify all 10 appear in the cart
4. Check that total_usd is accurate

### Scenario 3: Cart Persistence
1. Create some orders
2. Run `get_active_cart` and note the total
3. Refresh the page
4. Run `get_active_cart` again
5. Verify data persists (if using useKV or localStorage)

## Console Commands Reference

```javascript
// List all available WebMCP tools
window.webMCP.tools.list()

// Get cart contents
await window.webMCP.tools.call('get_active_cart')

// Get app state summary
await window.webMCP.tools.call('get_app_state')

// Get user session info
await window.webMCP.tools.call('get_user_session')

// Get business rules
await window.webMCP.tools.call('get_business_rules')

// Get failed events
await window.webMCP.tools.call('get_failed_events')

// Reproduce last bug
await window.webMCP.tools.call('reproduce_bug')

// Generate bug report
await window.webMCP.tools.call('generate_bug_report')

// Add item to cart (demonstration)
await window.webMCP.tools.call('add_item_to_cart', { 
  productId: 'prod_123', 
  quantity: 2 
})
```

## Success Criteria

✅ Orders appear immediately in the Orders tab after creation
✅ `get_active_cart` returns all pending orders
✅ Cart total matches sum of pending order amounts
✅ Completing an order removes it from cart
✅ High-value orders trigger permission errors
✅ Failed events are captured with full context
✅ Cart data structure is clear and well-formatted

## Troubleshooting

### Cart appears empty but orders are visible
- Check that orders have status "pending"
- Only pending orders appear in the cart
- Completed orders are excluded

### get_active_cart returns error
- Check browser console for errors
- Verify app state is initialized
- Try refreshing the page

### WebMCP tools not available
- Check that `window.webMCP` exists in console
- View console logs for WebMCP initialization messages
- Verify tools are registered (check console output on page load)

## Next Steps

After verifying the cart works correctly:
1. Navigate to **"AI Assistant"** tab
2. Ask the AI to analyze cart issues
3. Try the **"Comparison"** tab to see traditional vs WebMCP debugging
4. Export bug reports for your development team

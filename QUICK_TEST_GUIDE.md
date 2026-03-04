# Quick Test Guide - AI Assistant

## 🚀 Fast Track: Test in 60 Seconds

### Step 1: Enable Auto-Diagnosis
1. Open the app
2. Click **"AI Assistant"** tab
3. Click the **"Auto"** button (should turn blue/active)

### Step 2: Create High-Value Order
1. Click **"Create Order"** tab
2. Fill in:
   - Customer Name: `Test User`
   - Email: `test@test.com`
   - Amount: **`250`** ← Must be > $200
3. Click **"Create Order"**

### Step 3: Trigger the Error
1. Click **"Orders"** tab
2. Find the new order at the bottom (status: pending)
3. Click **"Checkout"** button
4. ❌ Error appears: "Checkout failed: Permission denied"

### Step 4: Watch AI Diagnose
1. Click **"AI Assistant"** tab
2. Watch the automatic diagnosis run
3. Review the diagnosis report

## ✅ What You Should See

### Diagnostic Steps (in sequence):
- ✓ Analyzing application state...
- ✓ Retrieving failed events...
- ✓ Reproducing the issue...
- ✓ Generating diagnostic report...

### Diagnosis Report:
- **Severity**: HIGH
- **Issue**: User lacks permission to approve high-value orders
- **Root Cause**: User role 'user' lacks required permissions: approve_orders
- **Recommendation**: Grant permissions to role 'user': approve_orders

## 🎯 Key Points

- **High-value = > $200**: Orders above $200 require special permission
- **Default user lacks permission**: By design to demonstrate the error
- **Auto mode**: AI automatically diagnoses new failures
- **Manual mode**: Click "Run Diagnosis" to analyze on demand

## 📊 Test Variations

### Create Different Order Amounts:

| Amount | Expected Behavior |
|--------|-------------------|
| $99    | ✅ Checkout succeeds |
| $150   | ✅ Checkout succeeds |
| $200   | ✅ Checkout succeeds |
| $201   | ❌ Permission error |
| $500   | ❌ Permission error |
| $1000  | ❌ Permission error |

### Multiple Failures:
Create and checkout multiple orders > $200 to see the AI track multiple failures.

## 🔍 Verify It's Working

✅ Check Admin Panel → Failed Events to see error details
✅ AI Assistant shows 4 completed diagnostic steps
✅ Diagnosis report shows severity badge
✅ Resolution steps are listed
✅ Technical details JSON is displayed

## 💡 Pro Tips

1. **Keep Auto Mode On**: The AI will catch failures immediately
2. **Check WebMCP Tools Tab**: See raw tool outputs
3. **Compare Tab**: See traditional vs WebMCP debugging
4. **Multiple Tests**: Create several high-value orders to build a failure history

## 🐛 If Something's Wrong

**No error appears?**
- Verify amount is > $200
- Check if business rule is enabled in Admin Panel

**AI doesn't run?**
- Try clicking "Run Diagnosis" manually
- Refresh page and re-enable Auto Mode
- Check browser console for errors

**Checkout succeeds when it shouldn't?**
- User might have been modified to include approve_orders permission
- Check Admin Panel → User Session → Permissions

---

## Example Test Sequence

```
1. Open app → AI Assistant tab → Enable "Auto" 
2. Create Order tab → Enter: Test User, test@test.com, $250
3. Create Order button
4. Orders tab → Find new order → Checkout button
5. Error appears ✓
6. AI Assistant tab → Watch automatic diagnosis ✓
7. Review diagnosis report ✓
```

Total time: ~60 seconds

Happy testing! 🎉

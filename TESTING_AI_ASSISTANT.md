# Testing the AI Assistant

This guide explains how to test the AI Assistant feature by triggering permission errors and watching the automated diagnostics in action.

## Overview

The Self-Diagnosing SaaS Dashboard includes an AI Assistant that automatically detects and diagnoses issues using WebMCP tools. The assistant monitors failed events and provides root cause analysis with actionable recommendations.

## How to Test

### Step 1: Navigate to the Application

Open the application in your browser. You should see the main dashboard with several tabs:
- Orders
- Create Order
- Admin Panel
- **AI Assistant** ← Click this tab
- WebMCP Tools
- Comparison

### Step 2: Enable Auto-Diagnosis (Optional)

In the AI Assistant tab, you'll see:
- A "Run Diagnosis" button
- An "Auto" toggle button (with Robot icon)

**Enable Auto Mode**: Click the "Auto" button to enable automatic diagnosis. When enabled, the AI will automatically analyze any new failures as they occur.

### Step 3: Create a High-Value Order

To trigger a permission error, you need to create an order worth more than $200.

1. Click on the **"Create Order"** tab
2. Fill in the form with the following details:
   - **Customer Name**: Test Customer
   - **Email**: test@example.com
   - **Amount**: `250` (or any value > $200)
   - **Items**: Enterprise Package, Premium Support (optional)
3. Click **"Create Order"**

A success message will appear confirming the order was created.

### Step 4: Attempt to Check Out the High-Value Order

1. Navigate to the **"Orders"** tab
2. Find your newly created order (it will be at the bottom with status "pending")
3. Click the **"Checkout"** button on this order

**Expected Result**: The checkout will fail with an error: "Checkout failed: Permission denied for high-value order"

### Step 5: View the Failed Event

1. Navigate to the **"Admin Panel"** tab
2. Scroll down to the **"Failed Events"** section
3. You should see your failed checkout attempt with details including:
   - Event type: `checkout_attempt`
   - Error: "User lacks permission to approve high-value orders"
   - Context showing:
     - `reason: permission_denied`
     - `orderAmount: 250`
     - `requiredPermissions: ['approve_orders']`
     - `userPermissions: ['view_orders', 'create_order']`

### Step 6: Watch the AI Assistant Diagnose the Issue

If you enabled **Auto Mode** in Step 2, the AI will automatically start diagnosing:

1. Navigate to the **"AI Assistant"** tab
2. Watch as the diagnostic steps execute:
   - ✓ Analyzing application state...
   - ✓ Retrieving failed events...
   - ✓ Reproducing the issue...
   - ✓ Generating diagnostic report...

If you didn't enable Auto Mode, simply click **"Run Diagnosis"** to start the analysis manually.

### Step 7: Review the Diagnosis Report

After the analysis completes, you'll see a detailed diagnosis report:

**Issue Detected**: 
- Severity: **HIGH**
- Message: "User lacks permission to approve high-value orders"

**Root Cause**:
- "User role 'user' lacks required permissions: approve_orders"

**Affected Components**:
- User Permissions
- Role-Based Access Control

**Recommendation**:
- "Grant the following permissions to role 'user': approve_orders"

**Resolution Steps**:
1. Navigate to Admin Panel → User Session
2. Add missing permissions: approve_orders
3. Retry the failed operation
4. Verify the operation completes successfully

**Technical Details**:
- JSON viewer showing the complete context including:
  - Failed event details
  - User context
  - Missing permissions
  - Business rules that were violated

## Understanding the Business Rules

The application has the following business rule that triggers this error:

**Rule: High Value Order Approval**
- Condition: `order.amount > 200`
- Action: `require_admin_approval`
- Required Permission: `approve_orders`

The default user session has role `user` with only these permissions:
- `view_orders`
- `create_order`

Missing: `approve_orders` (required for orders > $200)

## Additional Test Scenarios

### Test Scenario 2: Low-Value Order (Should Succeed)

Create an order with amount < $200 to verify normal checkout flow works:

1. Create Order tab
2. Customer Name: "Normal Customer"
3. Email: "normal@example.com"
4. Amount: `99.99`
5. Create Order → Checkout

**Expected**: Checkout succeeds without errors.

### Test Scenario 3: Multiple High-Value Orders

Create multiple high-value orders and attempt to check them out to see the AI Assistant track multiple failed events.

### Test Scenario 4: Feature Flag Testing

You can also test feature flag failures:

1. Imagine a scenario where `enable_checkout` flag is disabled
2. Any checkout attempt would fail with `feature_flag_disabled` reason
3. The AI would diagnose this differently

## WebMCP Tools Used by AI Assistant

The AI Assistant uses the following WebMCP tools during diagnosis:

1. **get_app_state**: Retrieves complete application state
2. **get_failed_events**: Gets list of all failed events
3. **reproduce_bug**: Attempts to reproduce the last failed event
4. **generate_bug_report**: Generates a structured bug report

You can manually test these tools in the **"WebMCP Tools"** tab or in the browser console.

## Expected AI Behavior

✅ **Auto-detection**: When Auto Mode is enabled, the AI detects new failures within seconds

✅ **Context-aware**: The AI understands the difference between permission errors, feature flag issues, and business rule conflicts

✅ **Actionable**: Provides specific steps to resolve the issue, not generic advice

✅ **Visual feedback**: Shows real-time progress through diagnostic steps with animated icons

✅ **Severity assessment**: Correctly categorizes issues (low, medium, high, critical)

## Troubleshooting

**Q: The AI Assistant shows "No failures detected"**
- Make sure you've attempted to checkout a high-value order (> $200)
- Check the Admin Panel → Failed Events section to verify the error was recorded
- Try clicking "Run Diagnosis" manually

**Q: Auto Mode isn't working**
- Refresh the page and re-enable Auto Mode
- Make sure you're on the AI Assistant tab when the failure occurs
- Check browser console for any errors

**Q: The checkout succeeds when it shouldn't**
- Verify the order amount is greater than $200
- Check Admin Panel → Business Rules to ensure "High Value Order Approval" is enabled
- Check Admin Panel → Feature Flags to ensure "require_admin_approval" is enabled

## Success Criteria

You've successfully tested the AI Assistant when:

1. ✅ You can create a high-value order
2. ✅ The checkout fails with a permission error
3. ✅ The error appears in the Failed Events list
4. ✅ The AI Assistant diagnoses the issue (auto or manual)
5. ✅ The diagnosis correctly identifies:
   - The root cause (missing permission)
   - Affected components
   - Specific resolution steps
6. ✅ Technical details are displayed in JSON format

## Next Steps

After testing, you might want to:

- Compare the AI Assistant's diagnosis with traditional debugging in the **Comparison** tab
- Manually invoke WebMCP tools in the **WebMCP Tools** tab
- Review the implementation in `src/components/AIAssistant.tsx`
- Check how WebMCP tools are defined in `src/lib/webmcp.ts`

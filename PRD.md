# Planning Guide

A self-diagnosing SaaS dashboard **React application** that demonstrates the power of WebMCP (Model Context Protocol for the Browser) by implementing the official WebMCP specification to expose internal application state, business rules, and debugging context through a standardized browser API (`window.webMCP`) that AI agents, browser assistants, and assistive technologies can use to diagnose issues that would be impossible to debug using only DOM inspection and console logs.

**Experience Qualities**:
1. **Educational** - Clearly demonstrates the difference between traditional DOM-based debugging and context-aware WebMCP debugging
2. **Interactive** - Users can trigger intentional bugs and use WebMCP tools to diagnose them in real-time
3. **Professional** - Resembles a real SaaS admin dashboard with realistic business logic and failure scenarios

**Complexity Level**: Light Application (multiple features with basic state)
This is a demonstration app with a simulated dashboard, order management, and debugging tools. It focuses on showcasing WebMCP capabilities rather than building a full-featured SaaS platform.

## Essential Features

### Order Management
- **Functionality**: Display a list of orders with status, amount, and customer information
- **Purpose**: Provide realistic data context for debugging scenarios
- **Trigger**: Loads automatically on app start
- **Progression**: App loads → Orders render from state → User can view order details → User can filter/sort orders
- **Success criteria**: Orders display correctly with all relevant information and update in real-time

### Order Creation
- **Functionality**: Form to create new orders with validation
- **Purpose**: Trigger business rule conflicts and validation errors
- **Trigger**: User clicks "Create Order" button
- **Progression**: Click create → Form dialog opens → User fills details → Submit → Validation runs → Business rules check → Order created or error shown
- **Success criteria**: Valid orders are created; invalid orders show appropriate error messages

### Checkout Flow
- **Functionality**: Multi-step checkout process with payment simulation
- **Purpose**: Demonstrate complex failure scenarios with hidden business rule conflicts
- **Trigger**: User selects an order and clicks "Checkout"
- **Progression**: Select order → Checkout modal opens → Enter payment details → Submit → Business rules validate → Success or failure with cryptic error
- **Success criteria**: Successful checkouts complete; intentional failures show business rule conflicts

### Admin Panel
- **Functionality**: Settings panel with feature flags and user permissions
- **Purpose**: Create conflicts between feature flags and user permissions that cause hidden bugs
- **Trigger**: User clicks "Admin Settings" button
- **Progression**: Click admin → Panel opens → View/edit feature flags → View/edit permissions → Save changes → State updates
- **Success criteria**: Settings persist and affect application behavior correctly

### WebMCP Debug Tools Panel
- **Functionality**: Interactive panel with buttons to call WebMCP tools and display results
- **Purpose**: Demonstrate how WebMCP exposes internal context for AI-powered debugging
- **Trigger**: Always visible in a sidebar or bottom panel
- **Progression**: Click tool button → Tool executes → Structured JSON displays → AI can use data to diagnose issues
- **Success criteria**: All tools return accurate, structured data about application state

### Intentional Bug System
- **Functionality**: Pre-configured bugs that demonstrate different failure modes
- **Purpose**: Show realistic scenarios where WebMCP provides critical debugging context
- **Trigger**: Specific user actions trigger the bugs
- **Progression**: User action → Bug occurs → Error shows in UI → WebMCP tools reveal root cause
- **Success criteria**: Bugs are reproducible and WebMCP tools clearly expose the underlying issues

## Edge Case Handling

- **Empty Orders List**: Show empty state with helpful message to create first order
- **Invalid Form Input**: Validate all fields and show inline error messages
- **Permission Denied**: Show clear error when user lacks permissions for an action
- **Feature Flag Conflicts**: Detect and expose when multiple flags create contradictory states
- **Failed Checkout**: Capture failed events and make them queryable via WebMCP tools
- **Network Simulation**: Since this is client-only, simulate async delays for realism

## Design Direction

The design should evoke a sense of technical sophistication and debugging clarity - this is a developer tool demonstration, so it should feel precise, information-dense, and terminal-inspired. Think of a blend between a modern SaaS dashboard and a debugging console, with clear visual separation between the "app" and the "debugging tools".

## Color Selection

The color scheme should emphasize technical precision with high contrast for readability, using a dark terminal aesthetic for the debugging panel and a clean professional look for the dashboard.

- **Primary Color**: Deep cyan `oklch(0.65 0.18 210)` - Communicates technical precision and debugging focus, used for WebMCP tool buttons and active states
- **Secondary Colors**: 
  - Slate gray `oklch(0.35 0.02 240)` for panels and cards
  - Dark charcoal `oklch(0.18 0.01 240)` for the debugging console background
- **Accent Color**: Electric lime `oklch(0.75 0.20 130)` for success states and active debugging indicators
- **Foreground/Background Pairings**: 
  - Background (Dark Charcoal `oklch(0.18 0.01 240)`): Bright text `oklch(0.95 0.01 240)` - Ratio 12.1:1 ✓
  - Primary (Deep Cyan `oklch(0.65 0.18 210)`): Dark text `oklch(0.15 0 0)` - Ratio 7.8:1 ✓
  - Accent (Electric Lime `oklch(0.75 0.20 130)`): Dark text `oklch(0.15 0 0)` - Ratio 10.2:1 ✓
  - Cards (Slate Gray `oklch(0.35 0.02 240)`): Light text `oklch(0.92 0.01 240)` - Ratio 8.5:1 ✓

## Font Selection

Typefaces should evoke technical precision and readability, using a monospace font for the debugging panel to reinforce the developer tool aesthetic, and a clean sans-serif for the dashboard UI.

- **Typographic Hierarchy**: 
  - H1 (Dashboard Title): Space Grotesk Bold/32px/tight tracking
  - H2 (Section Headers): Space Grotesk SemiBold/24px/normal tracking
  - H3 (Card Titles): Space Grotesk Medium/18px/normal tracking
  - Body (UI Text): Space Grotesk Regular/14px/relaxed leading
  - Code/Debug (WebMCP Output): JetBrains Mono Regular/13px/monospace leading

## Animations

Animations should be subtle and functional, emphasizing state changes and the execution of debugging tools without distracting from the information-dense interface.

- State transitions (tool execution) should use a 200ms ease with a subtle pulse effect
- Order creation and checkout flows should have smooth 300ms modal transitions
- WebMCP tool results should fade in with a 150ms duration to feel instant but polished
- Failed events should shake briefly (200ms) to draw attention
- Success confirmations should scale up slightly (scale 1.02) for 200ms

## Component Selection

- **Components**: 
  - `Card` for order items and admin panels
  - `Button` for all actions, with variants for primary (create), secondary (view), and destructive (debug trigger)
  - `Dialog` for order creation and checkout flows
  - `Table` for orders list with sortable columns
  - `Badge` for order status (pending, completed, failed)
  - `Tabs` for switching between orders view and admin settings
  - `ScrollArea` for the WebMCP debug output panel
  - `Separator` to divide dashboard sections from debug tools
  - `Alert` for showing error states and warnings
- **Customizations**: 
  - Custom "debug panel" component with monospace font and terminal styling
  - Custom "bug indicator" badge that pulses when a bug is active
  - Custom JSON viewer component for WebMCP tool output with syntax highlighting
- **States**: 
  - Buttons have distinct hover (brightness increase), active (scale down), and loading (spinner) states
  - Cards have hover states with subtle elevation increase
  - Debug tool buttons glow when executing
  - Form inputs show validation states inline
- **Icon Selection**: 
  - `Bug` for bug indicators and debug triggers
  - `Play` for executing WebMCP tools
  - `ShoppingCart` for orders
  - `Plus` for creating new orders
  - `Gear` for admin settings
  - `Warning` for errors and conflicts
  - `Check` for success states
- **Spacing**: 
  - Container padding: `p-6`
  - Card padding: `p-4`
  - Section gaps: `gap-6`
  - Form field gaps: `gap-4`
  - Tight grouping: `gap-2`
- **Mobile**: 
  - Stack dashboard and debug panel vertically on mobile
  - Convert table to card list on screens < 768px
  - Make debug panel collapsible on mobile with fixed bottom button
  - Reduce font sizes by 10% on mobile
  - Modal dialogs take full screen on mobile

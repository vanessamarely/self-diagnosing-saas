# Planning Guide

A browser extension that demonstrates the native `navigator.modelContext` API by providing context to on-device AI models running in the browser, showcasing how web applications can enhance AI capabilities by sharing structured information about the current page, user interactions, and application state.

**Experience Qualities**:
1. **Educational** - Clearly demonstrates how `navigator.modelContext.provideContext()` works with real examples
2. **Interactive** - Users can see context being provided in real-time as they browse and interact with content
3. **Transparent** - Shows exactly what context is being shared with AI models and why

**Complexity Level**: Light Application (multiple features with basic state)
This is a demonstration browser extension that showcases the `navigator.modelContext` API with a popup interface, background service worker, and content script that provides context to on-device AI models.

## Essential Features

### Context Provider Interface
- **Functionality**: Main popup UI that shows active contexts being provided to the AI model
- **Purpose**: Visualize what context is currently being shared with on-device AI
- **Trigger**: User clicks the extension icon
- **Progression**: Click icon → Popup opens → Shows list of active contexts → User can enable/disable contexts → Contexts update in real-time
- **Success criteria**: Clear visualization of all active contexts with the ability to toggle them on/off

### Page Content Context
- **Functionality**: Automatically provides page metadata (title, URL, description) as context
- **Purpose**: Give AI models basic information about the current page
- **Trigger**: Page loads or content changes
- **Progression**: Page loads → Content script extracts metadata → Calls `navigator.modelContext.provideContext()` → Context visible in popup
- **Success criteria**: Page metadata is correctly extracted and provided as context

### Selected Text Context
- **Functionality**: When user selects text, it's provided as context to the AI
- **Purpose**: Allow AI to understand what specific content the user is focusing on
- **Trigger**: User selects text on any webpage
- **Progression**: User selects text → Selection event fires → Context script provides selected text → AI receives context → Popup shows active selection context
- **Success criteria**: Selected text is captured and provided as context immediately

### User Interaction Context
- **Functionality**: Tracks and provides context about user interactions (clicks, form inputs, navigation)
- **Purpose**: Help AI understand user intent and current task
- **Trigger**: User interacts with page elements
- **Progression**: User clicks/types → Event captured → Interaction summary provided as context → Context shows in popup with timestamp
- **Success criteria**: Meaningful interaction patterns are captured without overwhelming the AI with noise

### Custom Context Builder
- **Functionality**: UI in popup to manually add custom context
- **Purpose**: Let users explicitly provide additional context to the AI
- **Trigger**: User clicks "Add Custom Context" button
- **Progression**: Click add → Text input appears → User types context → Submit → Context provided to AI → Shows in active contexts list
- **Success criteria**: Custom context is successfully provided and visible

### Context History View
- **Functionality**: Timeline view showing all context provided in the current session
- **Purpose**: Transparency and debugging - show users exactly what's been shared
- **Trigger**: User switches to "History" tab in popup
- **Progression**: Click history tab → Timeline renders → Shows all contexts with timestamps → User can click to see details
- **Success criteria**: Complete history of all provided contexts with timestamps and details

## Edge Case Handling

- **API Not Available**: Detect if `navigator.modelContext` is undefined and show helpful message about enabling the feature
- **Context Limit Exceeded**: Handle gracefully if too much context is provided
- **No Page Context**: Handle pages where content extraction fails (e.g., iframes, restricted pages)
- **Rapid Selections**: Debounce selection events to avoid overwhelming the API
- **Extension Disabled**: Clear all contexts when extension is disabled
- **Privacy Mode**: Respect when users are in private browsing

## Design Direction

The design should feel like a sophisticated developer tool with a modern browser extension aesthetic - clean, compact, and information-dense while remaining approachable. Think Chrome DevTools meets a modern AI assistant interface with clear visual hierarchy and excellent readability in a small popup space.

## Color Selection

A refined developer-focused color scheme that works well in both light and dark browser themes, with high contrast for the compact popup space.

- **Primary Color**: Vibrant blue `oklch(0.55 0.22 250)` - Modern and trustworthy, used for active contexts and primary actions
- **Secondary Colors**: 
  - Soft slate `oklch(0.40 0.02 250)` for secondary panels
  - Near-white `oklch(0.98 0.01 250)` for backgrounds
- **Accent Color**: Electric purple `oklch(0.60 0.25 300)` for AI-related indicators and active states
- **Foreground/Background Pairings**: 
  - Background (Near-white `oklch(0.98 0.01 250)`): Dark text `oklch(0.20 0.01 250)` - Ratio 14.2:1 ✓
  - Primary (Vibrant Blue `oklch(0.55 0.22 250)`): White text `oklch(0.99 0 0)` - Ratio 5.8:1 ✓
  - Accent (Electric Purple `oklch(0.60 0.25 300)`): White text `oklch(0.99 0 0)` - Ratio 6.2:1 ✓
  - Cards (Soft Slate `oklch(0.40 0.02 250)`): Light text `oklch(0.96 0.01 250)` - Ratio 10.1:1 ✓

## Font Selection

Typefaces should be highly readable in the compact extension popup space, with clear hierarchy and a modern technical feel.

- **Typographic Hierarchy**: 
  - H1 (Extension Title): Inter SemiBold/18px/tight tracking
  - H2 (Section Headers): Inter Medium/14px/normal tracking
  - H3 (Context Labels): Inter Medium/12px/wide tracking (uppercase)
  - Body (Context Content): Inter Regular/13px/relaxed leading
  - Code (API Output): SF Mono/12px/monospace leading

## Animations

Animations should be swift and purposeful in the compact popup space, providing feedback without delaying interactions.

- Context additions should fade in with 150ms duration
- Toggle switches should animate smoothly over 200ms
- Tab transitions should slide with 250ms ease-out
- New context items should pulse once (300ms) when added
- API status indicators should have a subtle breathing animation (2s loop)
- Expansion of context details should animate height over 200ms

## Component Selection

- **Components**: 
  - `Card` for each context item in the list
  - `Button` for actions (small size for popup space)
  - `Badge` for context types (page, selection, interaction, custom)
  - `Switch` for enabling/disabling contexts
  - `Tabs` for switching between active contexts and history
  - `ScrollArea` for scrollable context lists
  - `Textarea` for custom context input
  - `Separator` between context items
  - `Alert` for API status messages
- **Customizations**: 
  - Custom "context card" component optimized for popup width (380px)
  - Custom "API status indicator" showing if modelContext API is available
  - Custom "context badge" with icons for each context type
  - Custom "timestamp" component for history entries
- **States**: 
  - Buttons: hover (brightness), active (scale 0.98), disabled (opacity 0.5)
  - Context cards: hover (shadow increase), active (border highlight)
  - Switches: smooth toggle animation with color transition
  - Text inputs: focus ring with accent color
- **Icon Selection**: 
  - `Brain` or `Sparkles` for AI/model indicators
  - `FileText` for page content contexts
  - `TextCursor` for selected text contexts
  - `MousePointer` for interaction contexts
  - `PencilSimple` for custom contexts
  - `Clock` for history/timestamps
  - `Toggle` for enable/disable controls
- **Spacing**: 
  - Popup padding: `p-4` (compact for extension)
  - Context card padding: `p-3`
  - Section gaps: `gap-3`
  - Tight grouping: `gap-1.5`
  - List items: `gap-2`
- **Mobile**: 
  - Extension popup is fixed width (380px) and adapts to browser chrome
  - Focus on vertical scrolling for context lists
  - Ensure touch targets are minimum 44px for accessibility
  - Stack action buttons vertically if needed

# Real WhatsApp Integration + Full Responsive Fix

## Global Constraints

- Target workspace: `c:\Users\LENOVO\Documents\AntiGravity`
- Standard style consistency: Use CSS variables from `src/index.css`. Use `.table-wrapper` for scrollable table containers and `.custom-table` for table styling.
- Automatic Sync: Call parent CRM's custom state-setters (`setBookingsCustom`, `setCustomersCustom`, `setCouponsCustom`) to ensure database changes reflect in other views.
- Backend: Single PHP file at `public/api.php` with action-based routing via `$_GET['action']`. Store WhatsApp config in the existing `settings` table as key-value pairs.
- Security: WhatsApp access token must NEVER be exposed to frontend. All API calls to Meta go through `api.php` proxy. Webhook POST payloads must be validated via `X-Hub-Signature-256` HMAC.
- No simulator: The simulator (INITIAL_CHATS, localStorage) is completely replaced. Real chats come from the database.

---

### Task 1: Full Responsive Fix (All Components)

**Files:**
- Modify: [PackagesView.jsx](file:///c:/Users/LENOVO/Documents/AntiGravity/src/components/PackagesView.jsx)
- Modify: [BookingsView.jsx](file:///c:/Users/LENOVO/Documents/AntiGravity/src/components/BookingsView.jsx)
- Modify: [PartnersView.jsx](file:///c:/Users/LENOVO/Documents/AntiGravity/src/components/PartnersView.jsx)
- Modify: [DriverExpensesView.jsx](file:///c:/Users/LENOVO/Documents/AntiGravity/src/components/DriverExpensesView.jsx)
- Modify: [CustomerBookingView.jsx](file:///c:/Users/LENOVO/Documents/AntiGravity/src/components/CustomerBookingView.jsx)
- Modify: [WhatsAppAgentView.jsx](file:///c:/Users/LENOVO/Documents/AntiGravity/src/components/WhatsAppAgentView.jsx)
- Modify: [index.css](file:///c:/Users/LENOVO/Documents/AntiGravity/src/index.css)

**Interfaces:**
- Consumes: Existing CSS variable system and responsive breakpoints in `index.css`
- Produces: All components rendering correctly within viewport bounds at 360px–480px mobile widths

- [ ] **Step 1: Fix PackagesView ghost CSS classes**
  - Change `className="table-responsive"` → `className="table-wrapper"` (2 occurrences at lines 277 and 408)
  - Change `className="table"` → `className="custom-table"` (2 occurrences at lines 278 and 409)
  - Add `flexWrap: 'wrap'` to sub-tab navigation (line 221), header action bars (lines 267 and 375)
  - Change package modal internal 2-col grids from `gridTemplateColumns: '1fr 1fr'` to `gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))'`

- [ ] **Step 2: Fix other component overflow issues**
  - BookingsView: Add `flexWrap: 'wrap'` to action buttons bar (around line 648-663)
  - PartnersView: Add responsive collapse to profiles+overrides 2-col grid; add `flexWrap: 'wrap'` to sub-tabs, card action buttons, invoice layouts; change modal 2-col grids to auto-fit
  - DriverExpensesView: Change notes field `gridColumn: 'span 2'` to `gridColumn: '1 / -1'`
  - CustomerBookingView: Change inline form 2-col grids to auto-fit `minmax(200px, 1fr)`
  - WhatsAppAgentView: Change mobile stacked panel `height: 500px` to `min-height: 400px; max-height: 70vh`

- [ ] **Step 3: Add responsive CSS utilities to index.css**
  - Add media query rules for partner grid collapse at 768px
  - Ensure all new styles use existing CSS variables

- [ ] **Step 4: Build and verify**
  - Run `npm run build` and `npm run lint` — zero errors
  - Visually confirm: at 375px width, no horizontal page-level overflow on any tab

---

### Task 2: Backend WhatsApp API Endpoints (api.php)

**Files:**
- Modify: [api.php](file:///c:/Users/LENOVO/Documents/AntiGravity/public/api.php)

**Interfaces:**
- Consumes: MySQL database connection (same as existing), Meta WhatsApp Cloud API v22.0
- Produces: New API actions for webhook handling, message sending, chat/message retrieval, and config management

- [ ] **Step 1: Create new database tables**
  Add to the `$tables` array:
  ```sql
  whatsapp_chats (
    id VARCHAR(100) PRIMARY KEY,
    customer_phone VARCHAR(50),
    customer_name VARCHAR(255),
    last_message TEXT,
    last_message_time DATETIME,
    unread_count INT DEFAULT 0,
    journey_stage VARCHAR(50) DEFAULT 'New',
    labels TEXT,
    coupon_rewarded INT DEFAULT 0
  )

  whatsapp_messages (
    id VARCHAR(100) PRIMARY KEY,
    chat_id VARCHAR(100),
    sender_type VARCHAR(20),
    message_text TEXT,
    message_type VARCHAR(50) DEFAULT 'text',
    wa_message_id VARCHAR(255),
    timestamp DATETIME,
    status VARCHAR(50) DEFAULT 'sent',
    INDEX idx_chat_id (chat_id),
    INDEX idx_timestamp (timestamp)
  )
  ```

- [ ] **Step 2: Implement webhook verification (GET)**
  Action `whatsapp_webhook` with GET method:
  - Read `hub_mode`, `hub_verify_token`, `hub_challenge` from query params
  - Load `whatsapp_verify_token` from settings table
  - If mode is `subscribe` and token matches, return `hub_challenge` as plain text (not JSON)
  - Otherwise return 403

- [ ] **Step 3: Implement incoming message handler (POST)**
  Action `whatsapp_webhook` with POST method:
  - Validate `X-Hub-Signature-256` header using HMAC-SHA256 with app secret from settings
  - Return 200 immediately
  - Parse the message payload: extract sender phone, message text, message ID, timestamp
  - Find or create a chat in `whatsapp_chats` for this phone number
  - Insert message into `whatsapp_messages`
  - Update chat's `last_message`, `last_message_time`, and increment `unread_count`

- [ ] **Step 4: Implement message send proxy**
  Action `whatsapp_send` with POST:
  - Read access token and phone number ID from settings
  - Accept `{ to: "phone", message: "text" }` from frontend
  - POST to `https://graph.facebook.com/v22.0/{phone_number_id}/messages` with bearer token
  - Store sent message in `whatsapp_messages`
  - Return the API response to frontend

- [ ] **Step 5: Implement chat and message retrieval**
  Action `whatsapp_chats` (GET): Return all chats ordered by `last_message_time DESC`
  Action `whatsapp_messages` (GET, `?chat_id=X`): Return messages for a chat ordered by timestamp
  Action `whatsapp_update_chat` (POST): Update chat fields (journey_stage, labels, unread_count, coupon_rewarded)

- [ ] **Step 6: Implement config management**
  Action `whatsapp_config`:
  - GET: Load all `whatsapp_*` keys from settings table
  - POST: Save `whatsapp_access_token`, `whatsapp_phone_number_id`, `whatsapp_app_secret`, `whatsapp_verify_token`, `whatsapp_business_account_id` to settings table

- [ ] **Step 7: Add to load action**
  Include `whatsapp_chats` and `whatsapp_messages` in the existing `load` action's response (within the `$tables` loop)

---

### Task 3: Frontend WhatsApp Real Integration

**Files:**
- Modify: [WhatsAppAgentView.jsx](file:///c:/Users/LENOVO/Documents/AntiGravity/src/components/WhatsAppAgentView.jsx)
- Modify: [App.jsx](file:///c:/Users/LENOVO/Documents/AntiGravity/src/App.jsx)

**Interfaces:**
- Consumes: New API endpoints from Task 2; existing CRM state props (bookings, packages, coupons, customers and their setters)
- Produces: Real-time WhatsApp messaging UI with API polling, settings panel, and CRM sync

- [ ] **Step 1: Remove simulator infrastructure**
  - Remove `INITIAL_CHATS` array and all hardcoded mock conversations
  - Remove localStorage load/save for chats
  - Remove `processedMsgsRef` mount-time seeding of mock messages
  - Keep the `appendMessage` function but refactor it to call the API
  - Keep the auto-reply engine (`handleAutoReply`), journey pipeline, follow-up timer, and coupon generation

- [ ] **Step 2: Add API integration layer**
  - Accept `apiBase` prop from App.jsx (the API URL base)
  - On mount: fetch chats from `apiBase + '?action=whatsapp_chats'`
  - On chat selection: fetch messages from `apiBase + '?action=whatsapp_messages&chat_id=X'`
  - Refactor `handleSendMessage()`: POST to `apiBase + '?action=whatsapp_send'` with `{ to: chat.customer_phone, message: text }`, then insert the sent message locally and into the API
  - Add `setInterval` polling (every 5 seconds) to re-fetch chats and detect new messages
  - When new incoming message detected, trigger auto-reply engine if enabled

- [ ] **Step 3: Add WhatsApp Settings panel**
  - Add a "⚙ Settings" button in the top bar of the WhatsApp view
  - Settings modal with fields: Access Token (password-masked), Phone Number ID, App Secret (password-masked), Verify Token, Business Account ID
  - Load existing config on mount via `apiBase + '?action=whatsapp_config'`
  - Save config via POST to `apiBase + '?action=whatsapp_config'`
  - Show connection status indicator: green dot = all credentials present, red = missing
  - Show the webhook URL that needs to be configured in Meta dashboard: `{apiBase}?action=whatsapp_webhook`

- [ ] **Step 4: Update App.jsx**
  - Pass `apiBase` prop to WhatsAppAgentView (derive from existing API URL pattern)
  - Pass `setCoupons` prop back (it was removed in Task 3 of previous plan; needed for coupon sync)

- [ ] **Step 5: Build and verify**
  - Run `npm run build` — zero errors
  - Verify settings panel renders and saves/loads credentials
  - Verify empty state renders when no chats exist yet

---

### Task 4: End-to-End Build Verification

- [ ] Run `npm run build` — zero compilation errors
- [ ] Run `npm run lint` — zero lint errors
- [ ] Verify all responsive fixes render correctly
- [ ] Verify WhatsApp view loads without crashes when no config is set

---

## Verification Plan

### Automated Build Check
```bash
npm run build
npm run lint
```

### Manual Verification
1. Open each CRM tab at 375px mobile width — no horizontal page overflow
2. WhatsApp Settings panel saves and loads credentials
3. Webhook endpoint responds to Meta verification GET request
4. Messages received via webhook appear in the chat panel
5. Messages sent from CRM are delivered to customer's WhatsApp

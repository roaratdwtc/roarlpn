# WhatsApp Booking & Sales Agent Simulator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a high-fidelity simulated WhatsApp-style chat sandbox inside the Roar CRM that handles inquiries, builds proposals, creates/reschedules bookings in the CRM, tracks follow-ups, and distributes promo codes.

**Architecture:** Add a new tab `whatsappAgent` in the main CRM layout. Implement `<WhatsAppAgentView />` as an interactive component that manages state for multiple customer chat histories, runs an automated keyword parsing engine, and directly mutates ERP global states (`bookings`, `customers`, `coupons`).

**Tech Stack:** React, Lucide-React, CSS variables.

## Global Constraints
- Target workspace: `c:\Users\LENOVO\Documents\AntiGravity`
- Standard style and design consistency: Use CSS variables from `src/index.css` for background colors, borders, and margins. Use custom scrollbars and smooth transitions.
- Automatic Sync: Call the parent CRM's custom state-setters (`setBookingsCustom`, `setCustomersCustom`, `setCouponsCustom`) to ensure database changes reflect in other views.

---

### Task 1: Navigation and Layout Integration in App.jsx

**Files:**
- Modify: [App.jsx](file:///c:/Users/LENOVO/Documents/AntiGravity/src/App.jsx:1-869)
- Create: [WhatsAppAgentView.jsx](file:///c:/Users/LENOVO/Documents/AntiGravity/src/components/WhatsAppAgentView.jsx) (as a placeholder shell)

**Interfaces:**
- Consumes: `bookings`, `setBookingsCustom`, `packages`, `coupons`, `setCouponsCustom`, `customers`, `setCustomersCustom`
- Produces: Sidebar link "WhatsApp Agent" and imports `WhatsAppAgentView`

- [ ] **Step 1: Create the placeholder file for WhatsAppAgentView**
  Write a minimal shell to `src/components/WhatsAppAgentView.jsx`:
  ```jsx
  import React from 'react';
  export default function WhatsAppAgentView() {
    return <div style={{ padding: '24px' }}><h3>WhatsApp Booking Agent Sandbox</h3></div>;
  }
  ```

- [ ] **Step 2: Update App.jsx imports and state mapping**
  Add `MessageSquare` to the `lucide-react` import list on line 17.
  Import `WhatsAppAgentView` from `./components/WhatsAppAgentView`.
  Add `whatsappAgent: 'WhatsApp Agent & CRM Sandbox'` to `tabTitles`.

- [ ] **Step 3: Render the new tab inside App.jsx**
  Insert the tab in the sidebar nav-links list:
  ```jsx
  <li>
    <div 
      onClick={() => handleTabChange('whatsappAgent')} 
      className={`nav-item ${activeTab === 'whatsappAgent' ? 'active' : ''}`}
    >
      <MessageSquare /> WhatsApp Agent
    </div>
  </li>
  ```
  Insert the panel renderer in the main content container:
  ```jsx
  {activeTab === 'whatsappAgent' && (
    <WhatsAppAgentView 
      bookings={bookings} 
      setBookings={setBookingsCustom} 
      packages={packages}
      coupons={coupons}
      setCoupons={setCouponsCustom}
      customers={customers}
      setCustomers={setCustomersCustom}
    />
  )}
  ```

- [ ] **Step 4: Verify the tab renders in the UI**
  Make sure the page compiles, displays the new sidebar tab, and clicking it displays the placeholder view.

---

### Task 2: Build the Core WhatsApp Agent & Chat Simulator Component

**Files:**
- Modify: [WhatsAppAgentView.jsx](file:///c:/Users/LENOVO/Documents/AntiGravity/src/components/WhatsAppAgentView.jsx)

**Interfaces:**
- Consumes: Props passed from `App.jsx`
- Produces: Full WhatsApp interface layout (Left chat list, Center chat thread, Right journey tracker/CRM panel).

- [ ] **Step 1: Set up initial mock chats state**
  Define initial simulated chat conversations (e.g., John Doe, Sarah Connor, Ali Khan) with distinct labels, journey stages, message history, and countdown timers for follow-ups.

- [ ] **Step 2: Design the visual split layout (Left, Center, Right columns)**
  Implement standard WhatsApp colors, message bubbles, layout grids, scrollbars, and responsiveness.

- [ ] **Step 3: Implement Scenario Quick Simulation buttons**
  Add action buttons in the center panel to simulate customer queries (Inquire Safari, Ask for discount, Confirm Booking, Request Rescheduling) that immediately push message items into the selected conversation.

- [ ] **Step 4: Verify layout elements are aligned**
  Review visually that chats list, bubble logs, and CRM tracker columns align with high-end desert-safari design guidelines (sand hues, warm accents).

---

### Task 3: Build the Automation reply engine and CRM Integration

**Files:**
- Modify: [WhatsAppAgentView.jsx](file:///c:/Users/LENOVO/Documents/AntiGravity/src/components/WhatsAppAgentView.jsx)

**Interfaces:**
- Consumes: `bookings`, `setBookingsCustom`, `packages`, `coupons`, `setCouponsCustom`
- Produces: Live parsing of incoming customer messages and updates state to database.

- [ ] **Step 1: Implement keyword classification**
  Add the parser function that reads customer message strings, detects package names, dates, passenger quantities, and intents, and transitions the conversation's state machine.

- [ ] **Step 2: Implement Booking Flow & Proposals**
  Verify the parser successfully builds booking proposal JSON strings when inputs are matched, calculations are accurate, and prompts the user to type "Confirm".

- [ ] **Step 3: Implement Database Insertion on Confirmation**
  Implement the db insertion trigger when the customer confirms, generating unique booking IDs and pushing them to `bookings` and `customers`.

- [ ] **Step 4: Implement Rescheduling Automation**
  Add the reschedule handler. It parses the booking ID and target date, searches the database, updates the date, and reports the status.

- [ ] **Step 5: Verify booking insertions**
  Simulate a full flow and verify the booking immediately populates the parent bookings list.

---

### Task 4: Build the Customer Journey pipeline and Follow-Up scheduler

**Files:**
- Modify: [WhatsAppAgentView.jsx](file:///c:/Users/LENOVO/Documents/AntiGravity/src/components/WhatsAppAgentView.jsx)

**Interfaces:**
- Consumes: Props and internal component state
- Produces: Journey milestone progress bars, follow-up countdown timers, and auto-coupon generation.

- [ ] **Step 1: Render the Customer Journey timeline**
  Draw the pipeline tracker in the right sidebar. Highlight steps based on the current active chat label.

- [ ] **Step 2: Implement the Follow-up countdown timer**
  Implement the countdown scheduler when labels are set to `"Interested"`. Add the *"Fast-Forward Time"* button to trigger the follow-up message instantly.

- [ ] **Step 3: Build Coupon Generation upon Completion**
  Upon confirming and completing the booking, trigger a message sharing a coupon code. Automatically add the coupon code to the CRM's global `coupons` table.

- [ ] **Step 4: Verify the entire flow**
  Verify that the full client lifecycle from inquiry, booking confirmation, reschedule, follow-up, and coupon generation completes successfully without errors.

---

## Verification Plan

### Automated Build Check
Run `npm run build` to confirm everything builds successfully and there are no bundler or lint errors.

### Manual Walkthrough
1. Switch to the **WhatsApp Agent** tab.
2. Toggle **Auto-Agent** ON.
3. Click "Inquire evening VIP" -> Verify VIP Safari shared rates are printed.
4. Click "Provide details" -> Verify booking card shows 316 AED total.
5. Click "Confirm" -> Verify order ID is returned, booking shows in the CRM Bookings tab, and coupon code is shared.
6. Click "Reschedule" -> Verify the date updates in both views.

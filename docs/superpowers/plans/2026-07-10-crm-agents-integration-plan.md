# CRM Agents Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate the WhatsApp Customer Support Agent and React CRM Admin Assistant into RoarCRM, unifying their data store using the CRM's central MySQL database via `public/api.php` and establishing an automated booking confirmation trigger.

**Architecture:** The Python FastAPI backend acts as a middleware router. It exposes webhook routes for Meta WhatsApp and notify-hooks from `api.php`, as well as a `/api/admin/chat` route for the React front-end. It fetches database state from `api.php?action=load` to feed Claude 3.5 Sonnet's context, and updates are committed back through `api.php` REST endpoints.

**Tech Stack:** FastAPI, React, PHP (api.php), MySQL, Anthropic Python SDK (`claude-3-5-sonnet-20241022`), Google Calendar API, requests, pytest.

## Global Constraints
- Target database for bookings is MySQL accessed via `api.php`.
- FastAPI backend operates on port `8000` (or `3001` based on CRM `.env` context).
- Chat histories and OAuth credentials are saved locally in SQLite `data/database.db` inside `RoarWASupportAgent`.
- No exposed Anthropic Claude API keys in the front-end.
- Ensure zero syntax/lint errors in both React and Python.

---

### Task 1: Add Auto-Confirmation Trigger in `public/api.php`

**Files:**
- Modify: [api.php](file:///c:/Users/LENOVO/Documents/AntiGravity/public/api.php)

**Interfaces:**
- Consumes: PHP standard cURL library.
- Produces: POST webhook call to `http://localhost:8000/api/bookings/notify-new` on every successful booking save.

- [ ] **Step 1: Modify save action in api.php**
  Open [public/api.php](file:///c:/Users/LENOVO/Documents/AntiGravity/public/api.php) and update the save response logic (lines 331–340) to execute cURL when `$table === 'bookings'`:

  ```php
      $sql = "INSERT INTO $table (" . implode(', ', $keys) . ") VALUES (" . implode(', ', $values) . ")
              ON DUPLICATE KEY UPDATE " . implode(', ', $updates);
              
      if ($conn->query($sql)) {
          // POST to FastAPI WhatsApp Agent if booking was saved
          if ($table === 'bookings') {
              $ch = curl_init("http://localhost:8000/api/bookings/notify-new");
              curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
              curl_setopt($ch, CURLOPT_POST, true);
              curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
              curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($item));
              curl_setopt($ch, CURLOPT_TIMEOUT, 2); // non-blocking quick timeout
              curl_exec($ch);
              curl_close($ch);
          }
          echo json_encode(["status" => "success"]);
      } else {
          echo json_encode(["status" => "error", "message" => $conn->error]);
      }
      exit();
  ```

- [ ] **Step 2: Commit Task 1**
  ```bash
  git add public/api.php
  git commit -m "feat: add post-save hook for bookings in api.php"
  ```

---

### Task 2: Implement `/api/bookings/notify-new` in FastAPI

**Files:**
- Modify: [app/main.py](file:///c:/Users/LENOVO/Documents/AntiGravity/RoarWASupportAgent/app/main.py)
- Create: [tests/test_notify.py](file:///c:/Users/LENOVO/Documents/AntiGravity/RoarWASupportAgent/tests/test_notify.py)

**Interfaces:**
- Consumes: Incoming HTTP POST payload matching a booking record.
- Produces: Dispatches a message via `send_whatsapp_message` and appends it to `chat_sessions` history.

- [ ] **Step 1: Add notify-new endpoint in main.py**
  Modify [app/main.py](file:///c:/Users/LENOVO/Documents/AntiGravity/RoarWASupportAgent/app/main.py) to import `save_session`, `get_session` from `app.db` and add `/api/bookings/notify-new`:

  ```python
  from pydantic import BaseModel
  from typing import Optional
  from app.db import save_session, get_session

  class BookingNotifyPayload(BaseModel):
      id: str
      customerName: str
      whatsapp: str
      date: str
      packageName: str
      pickupLocation: str
      roomNo: Optional[str] = ""
      price: float
      pax: int

  @app.post("/api/bookings/notify-new")
  async def notify_new_booking(payload: BookingNotifyPayload):
      phone = payload.whatsapp
      ref_id = payload.id.replace("book-", "").upper() + "ASD"
      
      message = (
          f"🌅 *Booking Confirmed!* 🎉\n\n"
          f"Hi {payload.customerName}, thank you for booking with Roar Adventure Tourism! Here are your booking details:\n\n"
          f"📍 *Ref ID*: {ref_id}\n"
          f"🚗 *Package*: {payload.packageName}\n"
          f"📅 *Date*: {payload.date}\n"
          f"👥 *Guests*: {payload.pax} pax\n"
          f"🏨 *Pickup*: {payload.pickupLocation} {f'Rm {payload.roomNo}' if payload.roomNo else ''}\n"
          f"💰 *Total Price*: AED {payload.price} (Pay on Arrival)\n\n"
          f"If you need to reschedule or cancel, you can chat with me directly right here! Rania | Roar Tourism 🏙️"
      )
      
      # Send WhatsApp message
      send_whatsapp_message(phone, message)
      
      # Append message to Claude chat sessions SQLite DB
      history = get_session(phone)
      history.append({"role": "assistant", "content": message})
      save_session(phone, history)
      
      return {"status": "notified"}
  ```

- [ ] **Step 2: Create unit tests for notify endpoint**
  Create [tests/test_notify.py](file:///c:/Users/LENOVO/Documents/AntiGravity/RoarWASupportAgent/tests/test_notify.py):

  ```python
  import pytest
  from fastapi.testclient import TestClient
  from app.main import app
  from unittest.mock import patch

  client = TestClient(app)

  @patch("app.main.send_whatsapp_message")
  @patch("app.main.get_session")
  @patch("app.main.save_session")
  def test_notify_new_booking_sends_whatsapp(mock_save, mock_get, mock_send):
      mock_get.return_value = []
      payload = {
          "id": "book-123",
          "customerName": "John Doe",
          "whatsapp": "971550000000",
          "date": "2026-10-15",
          "packageName": "Standard Evening Desert Safari",
          "pickupLocation": "Atlantis The Palm",
          "price": 158.00,
          "pax": 2
      }
      res = client.post("/api/bookings/notify-new", json=payload)
      assert res.status_code == 200
      assert res.json() == {"status": "notified"}
      mock_send.assert_called_once()
      assert "John Doe" in mock_send.call_args[0][1]
  ```

- [ ] **Step 3: Run pytest to verify notify tests pass**
  Run: `pytest tests/test_notify.py -v`
  Expected: PASS

- [ ] **Step 4: Commit Task 2**
  ```bash
  git add RoarWASupportAgent/app/main.py RoarWASupportAgent/tests/test_notify.py
  git commit -m "feat: add api/bookings/notify-new endpoint and tests"
  ```

---

### Task 3: Refactor Customer Support Agent Database Layer to MySQL

**Files:**
- Modify: [app/agent.py](file:///c:/Users/LENOVO/Documents/AntiGravity/RoarWASupportAgent/app/agent.py)

**Interfaces:**
- Consumes: `api.php` endpoints (`?action=save`, `?action=load`) using python `requests` library.
- Produces: Updates Claude system prompt with packages from MySQL; redirects tools (`create_booking`, `find_bookings`, `reschedule_booking`, `cancel_booking`) to fetch/write MySQL via `api.php`.

- [ ] **Step 1: Write helper function to communicate with `api.php`**
  Modify [app/agent.py](file:///c:/Users/LENOVO/Documents/AntiGravity/RoarWASupportAgent/app/agent.py).
  At the top, import `requests`. Introduce a base CRM URL:

  ```python
  import requests
  CRM_BASE_URL = "http://localhost/api.php" # Or read from env/settings
  ```

  Update `get_system_prompt()` to download the packages dynamically from `api.php?action=load`:

  ```python
  def get_system_prompt():
      catalog_content = "Failed to load catalog."
      try:
          r = requests.get(f"{CRM_BASE_URL}?action=load", timeout=5)
          if r.status_code == 200:
              data = r.json()
              packages = data.get("data", {}).get("packages", [])
              catalog_content = "Tour Packages Catalog:\n"
              for p in packages:
                  catalog_content += f"- ID: {p['id']}, Name: {p['name']}, Category: {p['category']}, Peak Rate: {p['peakRate']} AED, Off-Peak Rate: {p['offpeakRate']} AED, Type: {p['type']}\n"
      except Exception as e:
          catalog_content = f"Error loading packages: {str(e)}"

      current_date = datetime.now().strftime("%A, %B %d, %Y")
      
      prompt = f"""You are a warm, helpful, and highly experienced travel consultant at Roar Tourism, a premier inbound tourism company in Dubai.
  Your primary role is to assist users in selecting and booking various desert safaris and city tours.
  
  Core Instructions:
  1. Speak naturally, warmly, and empathetically, like a real human offering live support. Use emojis (e.g. 🌅, 🐫, 🚗, 🏙️, 🏨) to match the Dubai tourism context.
  2. Provide pricing and advice based on the user's booking date. Determine seasonal rates from the Catalog:
     - Peak Season: October to April (inclusive).
     - Off-Peak Season: May to September (inclusive).
  3. Do not rush to fill out a form or present a list of questions all at once. Collect the following information conversationally:
     - Full Name
     - Selected Tour Package ID/Name
     - Tour Date
     - Number of Guests
     - Pickup Location (If it is a hotel, ask for the hotel name and politely check if they have a Room Number yet).
  4. Once you have gathered ALL 5 fields, invoke the `create_booking` tool. Do not simulate bookings in text; call the tool to finalize.
  5. After the tool executes, confirm the booking to the customer with all details.
  
  Here is the current tour and pricing catalog:
  {catalog_content}
  
  Today's current date is: {current_date}.
  """
      return prompt
  ```

- [ ] **Step 2: Update tool integrations in run_agent_turn**
  Define extra tools `reschedule_booking`, `cancel_booking`, and `find_bookings` inside `run_agent_turn` block in `agent.py`:

  ```python
  FIND_BOOKINGS_TOOL = {
      "name": "find_bookings",
      "description": "Call this to find bookings associated with the customer's WhatsApp/phone number.",
      "input_schema": {
          "type": "object",
          "properties": {
              "phone_number": {"type": "string", "description": "The customer's phone number."}
          },
          "required": ["phone_number"]
      }
  }

  RESCHEDULE_TOOL = {
      "name": "reschedule_booking",
      "description": "Call this to reschedule an existing booking to a new date.",
      "input_schema": {
          "type": "object",
          "properties": {
              "booking_id": {"type": "string", "description": "The unique ID of the booking (e.g., book-12345)."},
              "new_date": {"type": "string", "description": "The new date of the tour (YYYY-MM-DD)."}
          },
          "required": ["booking_id", "new_date"]
      }
  }

  CANCEL_TOOL = {
      "name": "cancel_booking",
      "description": "Call this to cancel an existing booking.",
      "input_schema": {
          "type": "object",
          "properties": {
              "booking_id": {"type": "string", "description": "The unique ID of the booking."}
          },
          "required": ["booking_id"]
      }
  }
  ```

  Update the tool invocation logic inside `run_agent_turn` to send tool responses via cURL back to Claude.
  *   **`create_booking`**: Saves to `api.php?action=save&table=bookings` instead of SQLite `save_booking`.
  *   **`find_bookings`**: Downloads bookings via `api.php?action=load`, filters by `whatsapp`, returns matches.
  *   **`reschedule_booking`**: Loads the booking, updates date, calls `api.php?action=save&table=bookings`.
  *   **`cancel_booking`**: Loads booking, sets status to `'cancelled'`, calls `api.php?action=save&table=bookings`.

- [ ] **Step 3: Commit Task 3**
  ```bash
  git add RoarWASupportAgent/app/agent.py
  git commit -m "feat: refactor customer agent tools to use CRM api.php"
  ```

---

### Task 4: Implement `/api/admin/chat` Secure Endpoint in FastAPI

**Files:**
- Modify: [app/main.py](file:///c:/Users/LENOVO/Documents/AntiGravity/RoarWASupportAgent/app/main.py)
- Create: [tests/test_admin_chat.py](file:///c:/Users/LENOVO/Documents/AntiGravity/RoarWASupportAgent/tests/test_admin_chat.py)

**Interfaces:**
- Consumes: POST queries from React CRM panel.
- Produces: Returns Claude's response after parsing database context and executing administrative tools (`generate_coupon`, `assign_driver`, `add_expense`, `update_booking_status`).

- [ ] **Step 1: Define Admin Assistant tools and endpoint in main.py**
  Add the `/api/admin/chat` endpoint and Claude tool calls:

  ```python
  ADMIN_CHAT_TOOLS = [
      {
          "name": "generate_coupon",
          "description": "Generate a discount coupon code in the CRM database.",
          "input_schema": {
              "type": "object",
              "properties": {
                  "code": {"type": "string", "description": "The code name, e.g. OFF10."},
                  "packageId": {"type": "string", "description": "The associated package ID."},
                  "customPrice": {"type": "number", "description": "Flat rate price override."},
                  "startDate": {"type": "string", "description": "Start date (YYYY-MM-DD)."},
                  "endDate": {"type": "string", "description": "Expiry date (YYYY-MM-DD)."}
              },
              "required": ["code", "packageId", "customPrice"]
          }
      },
      {
          "name": "assign_driver",
          "description": "Assign a driver to a specific booking.",
          "input_schema": {
              "type": "object",
              "properties": {
                  "booking_id": {"type": "string", "description": "The booking reference code."},
                  "driver_id": {"type": "string", "description": "The ID of the driver."}
              },
              "required": ["booking_id", "driver_id"]
          }
      },
      {
          "name": "record_expense",
          "description": "Save a new expense row for a driver in the database.",
          "input_schema": {
              "type": "object",
              "properties": {
                  "driverId": {"type": "string", "description": "ID of driver."},
                  "date": {"type": "string", "description": "Date of expense (YYYY-MM-DD)."},
                  "salary": {"type": "number"},
                  "carPetrol": {"type": "number"},
                  "campUse": {"type": "number"},
                  "misc": {"type": "number"},
                  "notes": {"type": "string"}
              },
              "required": ["driverId", "date"]
          }
      }
  ]

  class AdminChatPayload(BaseModel):
      messages: list
      query: str

  @app.post("/api/admin/chat")
  async def admin_chat(payload: AdminChatPayload):
      # 1. Fetch current database state from api.php
      db_state = {}
      try:
          r = requests.get(f"{settings.DATABASE_URL.replace('data/database.db', '')}api.php?action=load", timeout=5)
          if r.status_code == 200:
              db_state = r.json().get("data", {})
      except:
          pass

      # 2. Construct system prompt with DB context
      system_prompt = f"""You are the Roar Tourism AI Admin Assistant.
  You help administrators manage booking stats, driver schedules, expenses, cars, and coupons.
  Today is {datetime.now().strftime('%A, %B %d, %Y')}.
  
  Here is the active MySQL database state:
  {json.dumps(db_state, indent=2)}
  
  Answer concisely and carry out actions using tools.
  """
      
      # 3. Request Claude turn
      client = Anthropic(api_key=settings.ANTHROPIC_API_KEY)
      messages = payload.messages + [{"role": "user", "content": payload.query}]
      
      response = client.messages.create(
          model="claude-3-5-sonnet-20241022",
          max_tokens=1000,
          system=system_prompt,
          messages=messages,
          tools=ADMIN_CHAT_TOOLS
      )
      
      reply_text = ""
      if response.stop_reason == "tool_use":
          tool_call = next((block for block in response.content if block.type == "tool_use"), None)
          if tool_call:
              args = tool_call.input
              # Process tool actions
              if tool_call.name == "generate_coupon":
                  args["id"] = f"cpn-{int(datetime.now().timestamp())}"
                  requests.post(f"{settings.DATABASE_URL.replace('data/database.db', '')}api.php?action=save&table=coupons", json=args)
                  reply_text = f"Successfully generated coupon {args['code']}."
              elif tool_call.name == "assign_driver":
                  # Fetch booking, assign driver, post save
                  reply_text = "Driver assigned successfully."
              # etc...
      else:
          reply_text = "".join([block.text for block in response.content if block.type == "text"])
          
      return {"reply": reply_text}
  ```

- [ ] **Step 2: Create unit tests for `/api/admin/chat`**
  Create [tests/test_admin_chat.py](file:///c:/Users/LENOVO/Documents/AntiGravity/RoarWASupportAgent/tests/test_admin_chat.py):

  ```python
  import pytest
  from fastapi.testclient import TestClient
  from app.main import app
  from unittest.mock import patch

  client = TestClient(app)

  @patch("app.main.requests.get")
  @patch("app.main.Anthropic")
  def test_admin_chat_success(mock_anthropic_class, mock_get):
      # Mock the database load request
      mock_get.return_value.status_code = 200
      mock_get.return_value.json.return_value = {"data": {"bookings": []}}
      
      # Mock Claude API response
      mock_client = mock_anthropic_class.return_value
      mock_message = mock_client.messages.create.return_value
      mock_message.stop_reason = "end_turn"
      mock_message.content = [type('obj', (object,), {'type': 'text', 'text': 'Hello Admin'})]
      
      res = client.post("/api/admin/chat", json={"messages": [], "query": "Hello"})
      assert res.status_code == 200
      assert "reply" in res.json()
      assert res.json()["reply"] == "Hello Admin"
  ```

- [ ] **Step 3: Run tests to verify**
  Run: `pytest tests/test_admin_chat.py -v`
  Expected: PASS

- [ ] **Step 4: Commit Task 4**
  ```bash
  git add RoarWASupportAgent/app/main.py RoarWASupportAgent/tests/test_admin_chat.py
  git commit -m "feat: implement admin/chat endpoint and tests"
  ```

---

### Task 5: Implement Admin Assistant Chat UI in React CRM

**Files:**
- Create: [src/components/AdminAssistantView.jsx](file:///c:/Users/LENOVO/Documents/AntiGravity/src/components/AdminAssistantView.jsx)
- Modify: [src/App.jsx](file:///c:/Users/LENOVO/Documents/AntiGravity/src/App.jsx)

**Interfaces:**
- Consumes: Calls FastAPI POST endpoint `http://localhost:8000/api/admin/chat`.
- Produces: Sleek UI chatbot component integrated inside `App.jsx` navigation layout.

- [ ] **Step 1: Create AdminAssistantView component**
  Create [src/components/AdminAssistantView.jsx](file:///c:/Users/LENOVO/Documents/AntiGravity/src/components/AdminAssistantView.jsx):

  ```jsx
  import React, { useState, useEffect, useRef } from "react";
  import { Send, RefreshCw, Compass } from "lucide-react";

  const ASSISTANT_BACKEND_URL = "http://localhost:8000";

  export default function AdminAssistantView() {
    const [messages, setMessages] = useState([]);
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = async (e) => {
      e?.preventDefault();
      if (!query.trim() || loading) return;

      const userMsg = { role: "user", content: query.trim() };
      setMessages((prev) => [...prev, userMsg]);
      setQuery("");
      setLoading(true);

      try {
        const response = await fetch(`${ASSISTANT_BACKEND_URL}/api/admin/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: messages,
            query: userMsg.content
          })
        });
        const data = await response.json();
        setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
      } catch (err) {
        setMessages((prev) => [...prev, { role: "assistant", content: `Error: ${err.message}` }]);
      } finally {
        setLoading(false);
      }
    };

    return (
      <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 120px)", background: "#f8fafc", padding: "20px" }}>
        <div style={{ flex: 1, overflowY: "auto", background: "white", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "20px", marginBottom: "20px" }}>
          {messages.length === 0 && (
            <div style={{ textAlign: "center", color: "#64748b", marginTop: "100px" }}>
              <Compass size={48} style={{ color: "#c9762a", marginBottom: "16px" }} />
              <h3>Welcome to the Admin Assistant!</h3>
              <p>Ask about stats, assign drivers, or create coupons using conversational English.</p>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", marginBottom: "16px" }}>
              <div style={{
                maxWidth: "70%",
                padding: "12px 16px",
                borderRadius: "12px",
                fontSize: "14px",
                background: m.role === "user" ? "#c9762a" : "#f1f5f9",
                color: m.role === "user" ? "white" : "#1e293b",
              }}>
                {m.content}
              </div>
            </div>
          ))}
          {loading && <div style={{ color: "#64748b", fontSize: "14px" }}>Typing...</div>}
          <div ref={messagesEndRef} />
        </div>
        <form onSubmit={handleSendMessage} style={{ display: "flex", gap: "10px" }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask anything or request actions..."
            style={{ flex: 1, padding: "14px", borderRadius: "10px", border: "1.5px solid #dde3ed" }}
          />
          <button type="submit" style={{ padding: "0 24px", background: "#c9762a", color: "white", border: "none", borderRadius: "10px", cursor: "pointer" }}>
            <Send size={18} />
          </button>
        </form>
      </div>
    );
  }
  ```

- [ ] **Step 2: Add Admin Assistant route and sidebar item in App.jsx**
  Modify [src/App.jsx](file:///c:/Users/LENOVO/Documents/AntiGravity/src/App.jsx):
  *   Import `AdminAssistantView` component.
  *   Add `'adminAssistant'` to the tabs list and nav bar rendering (with standard Lucide icon like `Compass`).
  *   Add a conditional block to render `<AdminAssistantView />` when `activeTab === 'adminAssistant'`.

- [ ] **Step 3: Build & verify code compiles**
  Run: `npm run build`
  Expected: Success without lint/syntax failures.

- [ ] **Step 4: Commit Task 5**
  ```bash
  git add src/App.jsx src/components/AdminAssistantView.jsx
  git commit -m "feat: add admin assistant sidebar chat interface in React CRM"
  ```

---

### Task 6: End-to-End Build and Test Verification

**Files:**
- None (Test suite execution)

- [ ] **Step 1: Run all Python backend tests**
  In the folder `RoarWASupportAgent`:
  Run: `pytest`
  Expected: All tests pass.

- [ ] **Step 2: Run all React Frontend compilation checks**
  In the project root:
  Run: `npm run lint`
  Expected: Success.

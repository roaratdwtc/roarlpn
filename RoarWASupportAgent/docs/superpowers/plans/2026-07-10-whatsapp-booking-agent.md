# WhatsApp Tour Booking Agent Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a production-ready Python FastAPI webhook server deployed on Railway that integrates Meta WhatsApp API, Anthropic Claude 3.5 Sonnet, and Google Calendar API to serve as a human-like booking assistant for Roar Tourism.

**Architecture:** A FastAPI application handles WhatsApp message webhooks and Google OAuth callbacks. Message states, confirmed bookings, and OAuth credentials are saved in a local SQLite database. The conversational AI (Claude) uses tool use to book tours, dynamically referencing a markdown configuration file for packages and seasonal pricing.

**Tech Stack:** FastAPI, SQLite, Anthropic Python SDK, Google API Client libraries (`google-auth`, `google-api-python-client`), Uvicorn, Pytest, Python-dotenv.

## Global Constraints
- SQLite DB must be created at `data/database.db`.
- Package catalog is read dynamically from `config/tour_packages.md`.
- Target platform is Windows (local) and Linux (Railway deployment).
- Use `anthropic` SDK with `claude-3-5-sonnet-20241022` or `claude-3-5-sonnet-latest`.
- All environment variables are loaded via a central configuration file.

---

### Task 1: Scaffolding and Environment Configuration

**Files:**
- Create: `requirements.txt`
- Create: `.env.example`
- Create: `app/config.py`
- Create: `Dockerfile`
- Create: `tests/test_config.py`

**Interfaces:**
- Consumes: Environment variables from host.
- Produces: Configuration object `app.config.settings` containing API keys and endpoints.

- [ ] **Step 1: Write the environment settings module**
  Create `app/config.py`:
  ```python
  import os
  from dotenv import load_dotenv

  load_dotenv()

  class Settings:
      ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")
      WHATSAPP_TOKEN: str = os.getenv("WHATSAPP_TOKEN", "")
      WHATSAPP_PHONE_ID: str = os.getenv("WHATSAPP_PHONE_ID", "")
      WHATSAPP_VERIFY_TOKEN: str = os.getenv("WHATSAPP_VERIFY_TOKEN", "")
      GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "")
      GOOGLE_CLIENT_SECRET: str = os.getenv("GOOGLE_CLIENT_SECRET", "")
      GOOGLE_REDIRECT_URI: str = os.getenv("GOOGLE_REDIRECT_URI", "")
      PORT: int = int(os.getenv("PORT", "8000"))
      DATABASE_URL: str = os.getenv("DATABASE_URL", "data/database.db")
      
      def validate(self):
          missing = []
          if not self.ANTHROPIC_API_KEY:
              missing.append("ANTHROPIC_API_KEY")
          if not self.GOOGLE_CLIENT_ID:
              missing.append("GOOGLE_CLIENT_ID")
          if not self.GOOGLE_CLIENT_SECRET:
              missing.append("GOOGLE_CLIENT_SECRET")
          if missing:
              raise ValueError(f"Missing environment variables: {', '.join(missing)}")

  settings = Settings()
  ```

- [ ] **Step 2: Create dependency list and deployment files**
  Create `requirements.txt`:
  ```text
  fastapi==0.111.0
  uvicorn==0.30.1
  anthropic==0.28.0
  google-auth==2.30.0
  google-auth-oauthlib==1.2.0
  google-auth-httplib2==0.2.0
  google-api-python-client==2.133.0
  python-dotenv==1.0.1
  pytest==8.2.2
  requests==2.32.3
  ```

  Create `Dockerfile`:
  ```dockerfile
  FROM python:3.11-slim
  WORKDIR /workspace
  COPY requirements.txt .
  RUN pip install --no-cache-dir -r requirements.txt
  COPY . .
  EXPOSE 8000
  CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
  ```

  Create `.env.example`:
  ```env
  ANTHROPIC_API_KEY=your-claude-api-key
  WHATSAPP_TOKEN=meta-whatsapp-system-user-access-token
  WHATSAPP_PHONE_ID=your-whatsapp-phone-number-id
  WHATSAPP_VERIFY_TOKEN=your-random-webhook-verify-token
  GOOGLE_CLIENT_ID=google-client-id
  GOOGLE_CLIENT_SECRET=google-client-secret
  GOOGLE_REDIRECT_URI=https://your-railway-app.up.railway.app/auth/google/callback
  PORT=8000
  DATABASE_URL=data/database.db
  ```

- [ ] **Step 3: Write configuration validation tests**
  Create `tests/test_config.py`:
  ```python
  import pytest
  from app.config import Settings

  def test_settings_validation_fails_when_empty():
      s = Settings()
      s.ANTHROPIC_API_KEY = ""
      with pytest.raises(ValueError):
          s.validate()
  ```

- [ ] **Step 4: Verify environment tests fail and then pass**
  Run: `pytest tests/test_config.py` (Verify validation behaves correctly).

---

### Task 2: SQLite Database Integration

**Files:**
- Create: `app/db.py`
- Create: `tests/test_db.py`

**Interfaces:**
- Consumes: `app.config.settings.DATABASE_URL`.
- Produces: Database helper methods `init_db()`, `save_credentials()`, `get_credentials()`, `get_session()`, `save_session()`, `save_booking()`.

- [ ] **Step 1: Write SQLite database connection and query layers**
  Create `app/db.py`:
  ```python
  import sqlite3
  import json
  import os
  from datetime import datetime
  from app.config import settings

  def get_db_connection():
      os.makedirs(os.path.dirname(settings.DATABASE_URL), exist_ok=True)
      conn = sqlite3.connect(settings.DATABASE_URL)
      conn.row_factory = sqlite3.Row
      return conn

  def init_db():
      with get_db_connection() as conn:
          conn.execute("""
          CREATE TABLE IF NOT EXISTS google_credentials (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              access_token TEXT NOT NULL,
              refresh_token TEXT NOT NULL,
              token_uri TEXT NOT NULL,
              client_id TEXT NOT NULL,
              client_secret TEXT NOT NULL,
              scopes TEXT NOT NULL,
              expiry TEXT NOT NULL
          )""")
          conn.execute("""
          CREATE TABLE IF NOT EXISTS chat_sessions (
              phone_number TEXT PRIMARY KEY,
              conversation_history TEXT NOT NULL,
              updated_at TEXT NOT NULL
          )""")
          conn.execute("""
          CREATE TABLE IF NOT EXISTS bookings (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              customer_phone TEXT NOT NULL,
              customer_name TEXT NOT NULL,
              num_guests INTEGER NOT NULL,
              pickup_location TEXT NOT NULL,
              tour_date TEXT NOT NULL,
              package_name TEXT NOT NULL,
              calendar_event_id TEXT,
              created_at TEXT NOT NULL
          )""")
          conn.commit()

  def save_credentials(creds_dict):
      with get_db_connection() as conn:
          conn.execute("DELETE FROM google_credentials")  # Keep only one credential
          conn.execute("""
              INSERT INTO google_credentials (access_token, refresh_token, token_uri, client_id, client_secret, scopes, expiry)
              VALUES (?, ?, ?, ?, ?, ?, ?)
          """, (
              creds_dict['access_token'],
              creds_dict['refresh_token'],
              creds_dict['token_uri'],
              creds_dict['client_id'],
              creds_dict['client_secret'],
              creds_dict['scopes'],
              creds_dict['expiry']
          ))
          conn.commit()

  def get_credentials():
      with get_db_connection() as conn:
          row = conn.execute("SELECT * FROM google_credentials ORDER BY id DESC LIMIT 1").fetchone()
          if row:
              return dict(row)
          return None

  def get_session(phone_number):
      with get_db_connection() as conn:
          row = conn.execute("SELECT conversation_history FROM chat_sessions WHERE phone_number = ?", (phone_number,)).fetchone()
          if row:
              return json.loads(row['conversation_history'])
          return []

  def save_session(phone_number, history):
      with get_db_connection() as conn:
          history_json = json.dumps(history)
          now = datetime.utcnow().isoformat()
          conn.execute("""
              INSERT INTO chat_sessions (phone_number, conversation_history, updated_at)
              VALUES (?, ?, ?)
              ON CONFLICT(phone_number) DO UPDATE SET
                  conversation_history=excluded.conversation_history,
                  updated_at=excluded.updated_at
          """, (phone_number, history_json, now))
          conn.commit()

  def save_booking(phone_number, name, guests, pickup, date, package, event_id):
      with get_db_connection() as conn:
          now = datetime.utcnow().isoformat()
          cursor = conn.execute("""
              INSERT INTO bookings (customer_phone, customer_name, num_guests, pickup_location, tour_date, package_name, calendar_event_id, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          """, (phone_number, name, guests, pickup, date, package, event_id, now))
          conn.commit()
          return cursor.lastrowid
  ```

- [ ] **Step 2: Write test for Database operations**
  Create `tests/test_db.py`:
  ```python
  import pytest
  import os
  from app.config import settings

  # Override database for testing
  settings.DATABASE_URL = "data/test_database.db"

  from app.db import init_db, save_session, get_session, save_booking, get_db_connection

  def setup_module(module):
      init_db()

  def teardown_module(module):
      if os.path.exists("data/test_database.db"):
          os.remove("data/test_database.db")

  def test_session_handling():
      save_session("971500000000", [{"role": "user", "content": "Hi"}])
      hist = get_session("971500000000")
      assert len(hist) == 1
      assert hist[0]["content"] == "Hi"

  def test_booking_save():
      bid = save_booking("971500000000", "John Doe", 4, "Hotel Atlantis Rm 101", "2026-10-15", "Evening Safari", "evt_123")
      assert bid > 0
  ```

- [ ] **Step 3: Verify DB tests pass**
  Run: `pytest tests/test_db.py`

---

### Task 3: Google Calendar Integration

**Files:**
- Create: `app/calendar_service.py`
- Create: `tests/test_calendar.py`

**Interfaces:**
- Consumes: Database credentials and Google API client.
- Produces: Authentication redirect generation logic and event writing function `create_calendar_event(booking_details)`.

- [ ] **Step 1: Write calendar authentication and event creation module**
  Create `app/calendar_service.py`:
  ```python
  from google.oauth2.credentials import Credentials
  from googleapiclient.discovery import build
  from google.auth.transport.requests import Request
  from google_auth_oauthlib.flow import Flow
  from app.db import get_credentials, save_credentials
  from app.config import settings
  from datetime import datetime, timedelta

  SCOPES = ['https://www.googleapis.com/auth/calendar.events']

  def get_flow():
      return Flow.from_client_config(
          {
              "web": {
                  "client_id": settings.GOOGLE_CLIENT_ID,
                  "client_secret": settings.GOOGLE_CLIENT_SECRET,
                  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                  "token_uri": "https://oauth2.googleapis.com/token",
                  "redirect_uris": [settings.GOOGLE_REDIRECT_URI]
              }
          },
          scopes=SCOPES
      )

  def get_calendar_service():
      cred_row = get_credentials()
      if not cred_row:
          raise ValueError("Google Calendar is not authorized. Access /auth/google to login.")

      creds = Credentials(
          token=cred_row['access_token'],
          refresh_token=cred_row['refresh_token'],
          token_uri=cred_row['token_uri'],
          client_id=cred_row['client_id'],
          client_secret=cred_row['client_secret'],
          scopes=cred_row['scopes'].split(',')
      )

      if creds.expired and creds.refresh_token:
          creds.refresh(Request())
          save_credentials({
              'access_token': creds.token,
              'refresh_token': creds.refresh_token,
              'token_uri': creds.token_uri,
              'client_id': creds.client_id,
              'client_secret': creds.client_secret,
              'scopes': ','.join(creds.scopes),
              'expiry': creds.expiry.isoformat() if creds.expiry else datetime.utcnow().isoformat()
          })

      return build('calendar', 'v3', credentials=creds)

  def create_calendar_event(name, guests, pickup, date_str, package):
      service = get_calendar_service()
      
      # Event timings (Desert tours typically start around 3 PM, city tours around 9 AM)
      start_hour = 15 if "Evening" in package or "Desert" in package else 9
      start_time = datetime.strptime(f"{date_str} {start_hour}:00", "%Y-%m-%d %H:%M")
      end_time = start_time + timedelta(hours=6)

      event = {
          'summary': f"Booking: {package} - {name} ({guests} Guests)",
          'location': pickup,
          'description': f"WhatsApp Booking details:\nCustomer Name: {name}\nGuests: {guests}\nPackage: {package}\nDate: {date_str}\nPickup Details: {pickup}",
          'start': {
              'dateTime': start_time.isoformat(),
              'timeZone': 'Asia/Dubai',
          },
          'end': {
              'dateTime': end_time.isoformat(),
              'timeZone': 'Asia/Dubai',
          },
      }

      event_result = service.events().insert(calendarId='primary', body=event).execute()
      return event_result.get('id')
  ```

- [ ] **Step 2: Write tests for event object structure**
  Create `tests/test_calendar.py`:
  ```python
  import pytest
  from unittest.mock import MagicMock, patch
  from app.calendar_service import create_calendar_event

  @patch('app.calendar_service.get_calendar_service')
  def test_create_event_formatting(mock_get_service):
      mock_service = MagicMock()
      mock_get_service.return_value = mock_service
      
      mock_events = MagicMock()
      mock_service.events.return_value = mock_events
      mock_insert = MagicMock()
      mock_events.insert.return_value = mock_insert
      mock_insert.execute.return_value = {'id': 'mocked_id_123'}

      event_id = create_calendar_event(
          name="Alice Smith",
          guests=3,
          pickup="Grand Hyatt Hotel Room 405",
          date_str="2026-11-20",
          package="Evening Safari"
      )

      assert event_id == 'mocked_id_123'
      mock_events.insert.assert_called_once()
      args, kwargs = mock_events.insert.call_args
      assert kwargs['body']['summary'] == "Booking: Evening Safari - Alice Smith (3 Guests)"
  ```

- [ ] **Step 3: Verify calendar tests pass**
  Run: `pytest tests/test_calendar.py`

---

### Task 4: WhatsApp Integration

**Files:**
- Create: `app/whatsapp.py`
- Create: `tests/test_whatsapp.py`

**Interfaces:**
- Consumes: Meta access tokens, endpoint configurations, and phone numbers.
- Produces: API utility `send_whatsapp_message(to_phone, text)`.

- [ ] **Step 1: Write Meta Send Message Client**
  Create `app/whatsapp.py`:
  ```python
  import requests
  import logging
  from app.config import settings

  logger = logging.getLogger(__name__)

  def send_whatsapp_message(to_phone: str, text: str):
      if not settings.WHATSAPP_TOKEN or not settings.WHATSAPP_PHONE_ID:
          logger.warning("WhatsApp credentials missing. Skipping send.")
          return False

      url = f"https://graph.facebook.com/v18.0/{settings.WHATSAPP_PHONE_ID}/messages"
      headers = {
          "Authorization": f"Bearer {settings.WHATSAPP_TOKEN}",
          "Content-Type": "application/json"
      }
      payload = {
          "messaging_product": "whatsapp",
          "recipient_type": "individual",
          "to": to_phone,
          "type": "text",
          "text": {
              "preview_url": False,
              "body": text
          }
      }

      response = requests.post(url, json=payload, headers=headers)
      if response.status_code not in [200, 201]:
          logger.error(f"WhatsApp API Error: {response.text}")
          return False
      return True
  ```

- [ ] **Step 2: Write tests for WhatsApp sending payload**
  Create `tests/test_whatsapp.py`:
  ```python
  import pytest
  from unittest.mock import patch, MagicMock
  from app.whatsapp import send_whatsapp_message
  from app.config import settings

  @patch('app.whatsapp.requests.post')
  def test_send_whatsapp_message_success(mock_post):
      settings.WHATSAPP_TOKEN = "test_token"
      settings.WHATSAPP_PHONE_ID = "test_id"
      
      mock_response = MagicMock()
      mock_response.status_code = 200
      mock_post.return_value = mock_response

      result = send_whatsapp_message("971500000000", "Hello Customer! 🌴")
      assert result is True
      mock_post.assert_called_once()
  ```

- [ ] **Step 3: Verify WhatsApp tests pass**
  Run: `pytest tests/test_whatsapp.py`

---

### Task 5: Claude Conversational Agent with Tool Use

**Files:**
- Create: `app/agent.py`
- Create: `tests/test_agent.py`

**Interfaces:**
- Consumes: Configured instructions from `config/tour_packages.md`, database connection, and Anthropic API.
- Produces: `run_agent_turn(phone_number, user_message)` which processes conversation states, runs tools, and constructs responses.

- [ ] **Step 1: Write Anthropic Claude Client, Prompt Assembler, and Tool Handler**
  Create `app/agent.py`:
  ```python
  from anthropic import Anthropic
  import os
  import json
  from datetime import datetime
  from app.config import settings
  from app.db import get_session, save_session, save_booking
  from app.calendar_service import create_calendar_event

  def get_system_prompt():
      catalog_path = "config/tour_packages.md"
      catalog_content = ""
      if os.path.exists(catalog_path):
          with open(catalog_path, "r", encoding="utf-8") as f:
              catalog_content = f.read()

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
   - Selected Tour Package
   - Tour Date
   - Number of Guests
   - Pickup Location (If it is a hotel, ask for the hotel name and politely check if they have a Room Number yet).
4. Once you have gathered ALL 5 fields, invoke the `create_booking` tool. Do not simulate bookings in text; call the tool to finalize.
5. After the tool executes, confirm the booking to the customer with all details, stating that their booking is saved on the Google Calendar.

Here is the current tour and pricing catalog:
{catalog_content}

Today's current date is: {current_date}.
"""
      return prompt

  BOOKING_TOOL = {
      "name": "create_booking",
      "description": "Call this to confirm a booking once the customer has provided all 5 details: name, guest count, pickup location, date, and selected package.",
      "input_schema": {
          "type": "object",
          "properties": {
              "customer_name": {"type": "string", "description": "Full name of the customer."},
              "num_guests": {"type": "integer", "description": "Number of guests joining the tour."},
              "pickup_location": {"type": "string", "description": "Pickup location / hotel name & room number."},
              "tour_date": {"type": "string", "description": "Date of the tour (format: YYYY-MM-DD)."},
              "selected_package": {"type": "string", "description": "The exact tour package selected."}
          },
          "required": ["customer_name", "num_guests", "pickup_location", "tour_date", "selected_package"]
      }
  }

  def run_agent_turn(phone_number: str, user_message: str) -> str:
      client = Anthropic(api_key=settings.ANTHROPIC_API_KEY)
      history = get_session(phone_number)
      
      # Append new user message
      history.append({"role": "user", "content": user_message})
      
      system_prompt = get_system_prompt()
      
      # Call Claude
      response = client.beta.tools.messages.create(
          model="claude-3-5-sonnet-20241022",
          max_tokens=1500,
          system=system_prompt,
          messages=history,
          tools=[BOOKING_TOOL]
      )

      reply_text = ""
      
      # Check if tool use was requested
      if response.stop_reason == "tool_use":
          tool_call = next((block for block in response.content if block.type == "tool_use"), None)
          if tool_call and tool_call.name == "create_booking":
              args = tool_call.input
              
              # Execute booking action
              try:
                  event_id = create_calendar_event(
                      name=args['customer_name'],
                      guests=args['num_guests'],
                      pickup=args['pickup_location'],
                      date_str=args['tour_date'],
                      package=args['selected_package']
                  )
                  
                  # Save to DB
                  save_booking(
                      phone_number=phone_number,
                      name=args['customer_name'],
                      guests=args['num_guests'],
                      pickup=args['pickup_location'],
                      date=args['tour_date'],
                      package=args['selected_package'],
                      event_id=event_id
                  )
                  
                  # Feed tool output back to Claude
                  history.append({"role": "assistant", "content": response.content})
                  history.append({
                      "role": "user",
                      "content": [
                          {
                              "type": "tool_result",
                              "tool_use_id": tool_call.id,
                              "content": json.dumps({"status": "success", "event_id": event_id})
                          }
                      ]
                  })
                  
                  # Get final confirmation from Claude
                  final_response = client.beta.tools.messages.create(
                      model="claude-3-5-sonnet-20241022",
                      max_tokens=1000,
                      system=system_prompt,
                      messages=history,
                      tools=[BOOKING_TOOL]
                  )
                  
                  reply_text = "".join([block.text for block in final_response.content if block.type == "text"])
                  history.append({"role": "assistant", "content": reply_text})
              except Exception as e:
                  reply_text = f"I encountered an error trying to write to the Calendar: {str(e)}"
      else:
          # Normal text reply
          reply_text = "".join([block.text for block in response.content if block.type == "text"])
          history.append({"role": "assistant", "content": reply_text})

      save_session(phone_number, history)
      return reply_text
  ```

- [ ] **Step 2: Write tests for Agent prompting and tool triggering**
  Create `tests/test_agent.py`:
  ```python
  import pytest
  from unittest.mock import patch, MagicMock
  from app.agent import get_system_prompt

  def test_get_system_prompt_includes_catalog():
      prompt = get_system_prompt()
      assert "Roar Tourism" in prompt
      assert "Peak Season" in prompt
  ```

- [ ] **Step 3: Verify Agent tests pass**
  Run: `pytest tests/test_agent.py`

---

### Task 6: FastAPI Server and Routes Integration

**Files:**
- Create: `app/main.py`
- Create: `tests/test_main.py`

**Interfaces:**
- Consumes: Incoming HTTP webhooks, Google OAuth flow logic, and the Conversational Agent.
- Produces: REST endpoints running on Railway server.

- [ ] **Step 1: Write FastAPI server routes and OAuth handlers**
  Create `app/main.py`:
  ```python
  from fastapi import FastAPI, Request, Response, Query, BackgroundTasks
  from fastapi.responses import RedirectResponse
  from app.config import settings
  from app.db import init_db, save_credentials
  from app.calendar_service import get_flow
  from app.agent import run_agent_turn
  from app.whatsapp import send_whatsapp_message
  import logging

  logging.basicConfig(level=logging.INFO)
  logger = logging.getLogger(__name__)

  app = FastAPI(title="Roar Tourism WhatsApp Support Agent")

  @app.on_event("startup")
  def on_startup():
      init_db()

  @app.get("/")
  def read_root():
      return {"status": "ok", "app": "Roar Tourism WhatsApp Support Agent"}

  # Google Calendar OAuth 2.0 routes
  @app.get("/auth/google")
  def auth_google():
      flow = get_flow()
      authorization_url, state = flow.authorization_url(
          access_type='offline',
          include_granted_scopes='true',
          prompt='consent'
      )
      return RedirectResponse(authorization_url)

  @app.get("/auth/google/callback")
  def auth_google_callback(code: str):
      flow = get_flow()
      flow.fetch_token(code=code)
      creds = flow.credentials
      save_credentials({
          'access_token': creds.token,
          'refresh_token': creds.refresh_token,
          'token_uri': creds.token_uri,
          'client_id': creds.client_id,
          'client_secret': creds.client_secret,
          'scopes': ','.join(creds.scopes),
          'expiry': creds.expiry.isoformat() if creds.expiry else ""
      })
      return {"status": "success", "message": "Google Calendar successfully authorized! You can close this tab now."}

  # Meta WhatsApp Webhook routes
  @app.get("/webhook")
  def verify_webhook(
      hub_mode: str = Query(None, alias="hub.mode"),
      hub_challenge: int = Query(None, alias="hub.challenge"),
      hub_verify_token: str = Query(None, alias="hub.verify_token")
  ):
      if hub_mode == "subscribe" and hub_verify_token == settings.WHATSAPP_VERIFY_TOKEN:
          logger.info("Webhook verified successfully.")
          return Response(content=str(hub_challenge))
      return Response(content="Verification failed", status_code=403)

  def process_whatsapp_message(body: dict):
      try:
          entry = body.get("entry", [])[0]
          changes = entry.get("changes", [])[0]
          value = changes.get("value", {})
          messages = value.get("messages", [])
          if not messages:
              return
          
          message = messages[0]
          phone = message.get("from")
          text_body = message.get("text", {}).get("body", "")
          if not phone or not text_body:
              return
          
          # Process conversation via Claude
          reply = run_agent_turn(phone, text_body)
          
          # Send reply via WhatsApp API
          send_whatsapp_message(phone, reply)
      except Exception as e:
          logger.error(f"Error handling WhatsApp Webhook message: {str(e)}")

  @app.post("/webhook")
  async def handle_webhook(request: Request, background_tasks: BackgroundTasks):
      body = await request.json()
      logger.info(f"Received webhook: {body}")
      background_tasks.add_task(process_whatsapp_message, body)
      return {"status": "queued"}
  ```

- [ ] **Step 2: Write integration tests using TestClient**
  Create `tests/test_main.py`:
  ```python
  from fastapi.testclient import TestClient
  from app.main import app
  from app.config import settings

  client = TestClient(app)

  def test_root():
      response = client.get("/")
      assert response.status_code == 200
      assert response.json()["status"] == "ok"

  def test_webhook_verification():
      settings.WHATSAPP_VERIFY_TOKEN = "verify123"
      response = client.get("/webhook?hub.mode=subscribe&hub.challenge=8888&hub.verify_token=verify123")
      assert response.status_code == 200
      assert response.text == "8888"
  ```

- [ ] **Step 3: Run full suite of test files and verify all tests pass**
  Run: `pytest`

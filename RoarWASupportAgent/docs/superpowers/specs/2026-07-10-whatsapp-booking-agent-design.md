# Spec: WhatsApp Tour Booking Agent

This document details the system architecture and implementation design for the WhatsApp customer support and booking agent for Roar Adventures / Roar Tourism.

## Overview
The agent functions as a virtual travel consultant. It communicates with customers via the Meta WhatsApp Cloud API, using Anthropic's Claude 3.5 Sonnet to handle conversations naturally. It collects booking parameters, writes confirmed bookings to a Google Calendar via OAuth 2.0, and stores local data in an SQLite database.

## Architecture

```
                       +-------------------+
                       |    WhatsApp App   |
                       |   (Customer UI)   |
                       +---------+---------+
                                 | (HTTP HTTPS)
                                 v
                       +-------------------+
                       |    Meta Server    |
                       +---------+---------+
                                 | (Webhook Callback)
                                 v
                       +-------------------+
                       |    FastAPI App    | <----> [ SQLite DB ]
                       | (Railway Host)    |
                       +----+---------+----+
                            |         |
      (OAuth / Event API)   |         | (Claude API / Tools)
                            v         v
                 +------------+     +------------+
                 | Google Cal |     | Anthropic  |
                 |    API     |     | Claude AI  |
                 +------------+     +------------+
```

### Components

1. **FastAPI Web Server (`app/main.py`)**
   - `/webhook` (GET): Webhook verification for Meta.
   - `/webhook` (POST): Processes incoming messages, queries Claude, executes tools, and replies via WhatsApp.
   - `/auth/google`: Initiates OAuth 2.0 flow for Google Calendar.
   - `/auth/google/callback`: Receives the OAuth code and stores tokens in SQLite.
   - `/admin/status`: Optional simple dashboard showing active sessions and booking stats.

2. **SQLite Database (`data/database.db`)**
   - Tables: `google_credentials`, `chat_sessions`, `bookings`.

3. **Claude LLM Client (`app/agent.py`)**
   - Integrates with `anthropic` SDK using `claude-3-5-sonnet-20241022` (or current version).
   - Dynamically reads `config/tour_packages.md` and appends it to the system instructions so Claude knows all current pricing, descriptions, and add-ons.
   - Utilizes tool calling for `create_booking()`.

4. **WhatsApp Client (`app/whatsapp.py`)**
   - Sends messages (text, interactive buttons, or list messages) to customers using the Meta Cloud API endpoint.

5. **Google Calendar Client (`app/calendar_service.py`)**
   - Interacts with Google Calendar API using stored credentials.
   - Automatically handles access token refreshing.

---

## Database Schema

```sql
CREATE TABLE IF NOT EXISTS google_credentials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    token_uri TEXT NOT NULL,
    client_id TEXT NOT NULL,
    client_secret TEXT NOT NULL,
    scopes TEXT NOT NULL,
    expiry DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS chat_sessions (
    phone_number TEXT PRIMARY KEY,
    conversation_history TEXT NOT NULL, -- JSON-serialized array of messages
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_phone TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    num_guests INTEGER NOT NULL,
    pickup_location TEXT NOT NULL,
    tour_date TEXT NOT NULL,
    package_name TEXT NOT NULL,
    calendar_event_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## Conversation & Tool Flow

Claude will be configured with a tool schema for booking:

```json
{
  "name": "create_booking",
  "description": "Call this to confirm a booking once the customer has provided all 5 details: full name, guest count, pickup location (with room number if hotel), tour date, and selected package.",
  "input_schema": {
    "type": "object",
    "properties": {
      "customer_name": {
        "type": "string",
        "description": "Full name of the customer."
      },
      "num_guests": {
        "type": "integer",
        "description": "Number of guests joining the tour."
      },
      "pickup_location": {
        "type": "string",
        "description": "Pickup location (hotel name/address and room number if available)."
      },
      "tour_date": {
        "type": "string",
        "description": "Date of the tour in YYYY-MM-DD format."
      },
      "selected_package": {
        "type": "string",
        "description": "The exact tour package selected by the customer."
      }
    },
    "required": ["customer_name", "num_guests", "pickup_location", "tour_date", "selected_package"]
  }
}
```

### Steps for Message Processing
1. A message arrives at `/webhook` from `1234567890`.
2. App retrieves history from `chat_sessions`.
3. System reads `config/tour_packages.md` to load packages and seasonal pricing rules (Peak: Oct-Apr, Off-Peak: May-Sep).
4. App calls Anthropic Messages API with:
   - System instructions (incorporating package info, seasonal rate rules, and personality rules).
   - Conversation history.
   - The user's new message.
   - The `create_booking` tool definition.
5. If Claude replies with text $\rightarrow$ Send text to user via Meta API.
6. If Claude invokes `create_booking` $\rightarrow$ App creates Google Calendar event, logs booking to database, feeds success message back to Claude. Claude replies to confirm, and the app sends this final text to the user.
7. Save updated history to database.

---

## Configuration & Customization File
A key requirement is to allow easy customization of pricing, packages, and seasons. We put this configuration in a Markdown file at `config/tour_packages.md`. The backend reads this file dynamically on every message and injects it into the system prompt. This allows the business owner to update details, seasons, and rates simply by editing the markdown file.

---

## Verification Plan

### Automated Verification
- We will construct unit tests to verify:
  1. Parsing of Meta WhatsApp messages.
  2. Database reads, writes, and schema creation.
  3. Correct format injection of `tour_packages.md` into Claude system prompts.
  4. OAuth credential validation.

### Manual Verification
- Deploying to Railway.
- Triggering `/auth/google` to authorize the calendar.
- Querying `/webhook` with mock payloads using `curl` or Postman.
- Sending live WhatsApp messages to test full integration.

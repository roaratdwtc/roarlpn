# WhatsApp Meta API Agent — Design Spec

**Date:** 2026-07-09  
**Company:** Roar Adventure Tourism (Dubai)  
**Author:** AI Design Session

---

## Overview

Build a real WhatsApp AI agent for Roar Adventure Tourism, powered by Anthropic Claude, that:

1. Receives real customer messages from WhatsApp via Meta Cloud API webhook
2. Replies in a **human-like, conversational tone** using Claude AI
3. Collects all booking information (name, guests, pickup, date, package)
4. Confirms bookings, saves them to the backend JSON store
5. Exposes REST API endpoints so the React CRM can sync data
6. Sends follow-up messages for undecided customers
7. Rewards completed bookings with discount coupon codes
8. Replaces the WhatsApp Sandbox in the CRM with a Live Conversations view

---

## Architecture

```
Customer WhatsApp
        |
        v (real message)
Meta Cloud API
        | webhook POST
        v
[backend/] Node.js Express Server (Railway)
        |-- POST /webhook        <- Meta sends messages here
        |-- GET  /webhook        <- Meta verification handshake
        |-- Claude AI engine     <- Generates human-like replies
        |-- Booking state machine <- Journey pipeline
        |-- JSON flat file store <- conversations, bookings, customers, coupons
        |-- GET  /api/bookings   <- CRM reads confirmed bookings
        |-- GET  /api/customers  <- CRM reads registered customers
        |-- GET  /api/conversations <- CRM reads conversation threads
        |-- GET  /api/coupons    <- CRM reads active coupons
        |-- POST /api/send-message <- CRM agent sends manual message
        +-- POST /api/followup   <- Schedule follow-ups

[frontend/] React CRM (Vercel)
        |-- WhatsApp tab -> replaced with "Live Conversations" view
        |   |-- Real conversation list (polling backend every 5s)
        |   |-- Message thread viewer with manual reply input
        |   |-- Customer pipeline labels
        |   +-- Booking action buttons
        +-- Bookings/Customers tabs <- auto-synced from backend REST API
```

---

## Services & Products

### Desert Safari Tours
- Self Drive Desert Safari — 350 AED per car
- Standard Evening Desert Safari — 75 AED per person
- VIP Evening Desert Safari — 150 AED per person
- VIP Safari Private Car — 799 AED per car
- Morning Desert Safari — 60 AED per person

### City Tours
- Dubai City Tour — 80 AED per person
- Abu Dhabi City Tour — 120 AED per person
- Hatta Mountain Tour — 90 AED per person

### Chauffeur Services
- Airport Transfer — 150 AED per car
- Full Day Chauffeur — 500 AED per car

---

## Booking Information Required (collected in order)

1. Full Name
2. Number of Guests (pax)
3. Selected Package
4. Tour Date
5. Pickup Location (hotel name + room number)

All 5 collected -> Booking Summary -> "Reply Confirm to finalize"

---

## Customer Journey Pipeline

New Lead -> Inquiry -> Interested -> Proposed -> Confirmed -> Followed-up -> Completed

- **New Lead**: First message received
- **Inquiry**: Asks about tours/prices/availability
- **Interested**: Shows interest, hasn't committed
- **Proposed**: Full booking summary sent, awaiting confirmation
- **Confirmed**: Booking saved, confirmation sent
- **Followed-up**: Post-booking discount coupon sent
- **Completed**: Tour date has passed

---

## Claude AI Persona: Rania

- Name: Rania (Roar Adventure Tourism agent)
- Tone: Warm, professional, emoji-enabled, conversational
- Collects info naturally (one question at a time)
- Creates urgency for discounts ("special today only")
- Handles "I'll reply later" -> schedules follow-up
- Never admits to being a bot
- Signs: "Rania | Roar Adventure Tourism"

---

## Follow-Up Logic

- "I'll confirm tonight" -> follow-up in 8 hours
- "I'll reply in the morning" -> follow-up at 9:00 AM next day
- "Let me ask my family" -> follow-up in 24 hours
- No response 4h (Inquiry) -> auto follow-up with offer
- No response 24h (Proposed) -> auto follow-up with urgency + coupon
- Stored in followups.json, checked by cron every minute

---

## Coupon Logic

- After Confirmed booking: generate unique code ROAR-XXXX
- 10% off next booking
- Sent via WhatsApp
- Saved to coupons.json, synced to CRM via /api/coupons

---

## File Structure

```
backend/
  server.js              - Express app entry point
  package.json
  .env.example
  railway.json
  src/
    webhookHandler.js    - Parses Meta webhook events
    claudeEngine.js      - Claude AI conversation engine
    bookingManager.js    - Booking state machine + CRUD
    customerManager.js   - Customer CRUD
    followUpScheduler.js - Cron-based follow-up system
    couponManager.js     - Coupon generation + management
    metaApi.js           - WhatsApp Cloud API send functions
    apiRoutes.js         - REST endpoints for CRM
  data/
    conversations.json
    bookings.json
    customers.json
    coupons.json
    followups.json
  prompts/
    systemPrompt.js      - Rania's full Claude system prompt

src/components/
  WhatsAppAgentView.jsx  - REPLACE Sandbox -> Live API dashboard
```

---

## Environment Variables

```
WHATSAPP_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_VERIFY_TOKEN=
ANTHROPIC_API_KEY=
BACKEND_URL=
CRM_ORIGIN=
```

---

## REST API Contract

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/conversations | All conversations |
| GET | /api/conversations/:phone | Thread for one number |
| GET | /api/bookings | All bookings |
| POST | /api/bookings/:id/confirm | Manually confirm booking |
| GET | /api/customers | All customers |
| GET | /api/coupons | All coupons |
| POST | /api/send-message | Send WhatsApp message |
| POST | /api/followup | Schedule follow-up |

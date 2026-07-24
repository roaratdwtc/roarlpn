# Spec: WhatsApp Support Agent & Admin Assistant CRM Integration

**Date:** 2026-07-10  
**Company:** Roar Adventure Tourism (Dubai)  
**Status:** Approved Design

---

## 1. Overview

This document details the architecture and implementation specifications for integrating two AI agents into RoarCRM:
1.  **Customer Support Agent (WhatsApp)**: Handles customer queries, desert safari and city tour bookings, rescheduling, and cancellations via Meta WhatsApp Cloud API and Claude 3.5 Sonnet.
2.  **Admin Assistant (React CRM)**: Embedded in the CRM admin panel, enabling administrators to query operations (stats, driver assignments, finances) and execute administrative actions via natural language.

Both agents leverage Anthropic Claude 3.5 Sonnet and integrate directly with the CRM's central MySQL database via the PHP bridge (`public/api.php`) to ensure real-time synchronization.

---

## 2. System Architecture & Component Mapping

```
                                  +------------------------------------+
                                  |             React CRM              |
                                  | (Frontend UI / Admin Chat Tab)     |
                                  +--------+------------------+--------+
                                           |                  |
                        (PHP REST actions) |                  | (HTTP /api/admin/chat)
                                           v                  v
+------------------+               +-------+--------+     +---+--------------------+
|  MySQL Database  | <-----------> |    api.php     | <-->|  Python FastAPI Server  |
| (Namecheap Host) |               | (MySQL Bridge) |     | (RoarWASupportAgent)   |
+------------------+               +----------------+     +---+-------+--------+---+
                                                                      |        |
                                                  (WhatsApp Webhook)  |        | (Claude Messages API)
                                                                      v        v
                                                                 +----+--------+-----+
                                                                 |  Meta / Anthropic |
                                                                 |   External APIs   |
                                                                 +-------------------+
```

### Component Details
*   **React CRM (Frontend)**: Includes tabs for dashboard, bookings, packages, etc., and hosts the new **Admin Assistant Chatbot** interface.
*   **`public/api.php`**: The secure database access layer that runs on the MySQL host. Exposes endpoints for CRUD operations. It will be updated with a post-save cURL webhook trigger to notify the WhatsApp backend of new bookings.
*   **Python FastAPI Backend (`RoarWASupportAgent`)**:
    *   Exposes a public webhook `/webhook` (GET/POST) for the Meta WhatsApp Cloud API.
    *   Exposes `/api/admin/chat` (POST) to serve the React CRM's Admin Assistant.
    *   Exposes `/api/bookings/notify-new` (POST) to receive creation hooks from `api.php`.
    *   Maintains a local SQLite database (`data/database.db`) to persist Google OAuth credentials and client WhatsApp session histories.

---

## 3. Customer Support Agent (WhatsApp)

The Customer Support Agent (named Rania) communicates with customers to answer tour queries and manage bookings.

### 3.1. Dynamic Catalog Injection
*   On every customer message, the FastAPI backend fetches packages directly from `api.php?action=load`.
*   The system prompt converts the package array into a markdown catalog, highlighting **Peak Season** (October to April) and **Off-Peak Season** (May to September) rates.
*   Claude dynamically calculates pricing using these rates and optional add-ons (like AC upgrades, falcon photos, camel rides) before invoking tools.

### 3.2. Claude Tool Schema definitions

#### `create_booking`
*   **Description**: Finalizes a booking after collecting name, pax count, pickup details, date, and selected package.
*   **Inputs**:
    *   `customer_name` (string)
    *   `num_guests` (integer)
    *   `pickup_location` (string)
    *   `room_no` (string, optional)
    *   `tour_date` (string, format `YYYY-MM-DD`)
    *   `selected_package` (string)
    *   `addon_names` (string, optional comma-separated list)
    *   `addon_price` (number)
    *   `total_price` (number)
*   **Action**: Calls `api.php?action=save&table=bookings` to save to MySQL and calls the Google Calendar API to write the event.

#### `find_bookings`
*   **Description**: Retrieves active bookings linked to a customer's phone number.
*   **Inputs**:
    *   `phone_number` (string)
*   **Action**: Queries `api.php?action=load` and filters by `whatsapp`. Returns matches to Claude.

#### `reschedule_booking`
*   **Description**: Modifies the date of an existing booking.
*   **Inputs**:
    *   `booking_id` (string)
    *   `new_date` (string, format `YYYY-MM-DD`)
*   **Action**: Retrieves the existing booking record, updates its date, writes back via `api.php?action=save&table=bookings`, and modifies the Google Calendar event.

#### `cancel_booking`
*   **Description**: Cancels an active booking.
*   **Inputs**:
    *   `booking_id` (string)
*   **Action**: Updates `status` to `'cancelled'` in MySQL via `api.php?action=save&table=bookings` and cancels/deletes the Google Calendar event.

---

## 4. Admin Assistant Agent (React CRM Panel)

The Admin Assistant serves as a natural language co-pilot for CRM administrators.

### 4.1. React Chat Interface
*   A clean sidebar chat widget or dedicated tab in `src/App.jsx`.
*   Includes scrolling message view, quick-suggestion action chips (e.g. *"Show today's sales"*, *"Generate coupon for evening tour"*), and responsive CSS variables.

### 4.2. Secure Backend Endpoint (`/api/admin/chat`)
*   React app posts the conversation history and user query to FastAPI.
*   FastAPI downloads the full database state from `api.php?action=load`.
*   FastAPI feeds the database records (bookings, expenses, drivers, cars, coupons, partners) into Claude's system prompt as a structured context.
*   Claude runs with the following administrative tools:

#### `generate_coupon`
*   **Inputs**: `code`, `packageId`, `customPrice`, `startDate`, `endDate`.
*   **Action**: Saves the new coupon to MySQL via `api.php?action=save&table=coupons`.

#### `update_booking_status`
*   **Inputs**: `booking_id`, `status` (`confirmed`, `pending`, `cancelled`, `completed`).
*   **Action**: Updates status in MySQL and Google Calendar.

#### `assign_driver`
*   **Inputs**: `booking_id`, `driver_id`.
*   **Action**: Updates the booking row with `driverId`.

#### `add_expense`
*   **Inputs**: `driverId`, `date`, `salary`, `carPetrol`, `campUse`, `misc`, `notes`.
*   **Action**: Saves a new record to the `expenses` table in MySQL.

---

## 5. CRM Sync & Auto-Confirmation Pipeline

### 5.1. Save Interceptor in `public/api.php`
To automatically trigger WhatsApp confirmations upon booking creation (from the website booking form or admin portal), the PHP save handler is extended:
```php
// In public/api.php action=save
if ($table === 'bookings' && $conn->query($sql)) {
    // Send post-save webhook call to Python FastAPI
    $ch = curl_init("http://localhost:8000/api/bookings/notify-new");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($item));
    curl_setopt($ch, CURLOPT_TIMEOUT, 2); // Quick non-blocking timeout
    curl_exec($ch);
    curl_close($ch);
}
```

### 5.2. Confirmation Notification Receiver in FastAPI
*   FastAPI processes `/api/bookings/notify-new` asynchronously.
*   Formats a detailed confirmation message including the Ref ID, tour details, and pickup notes.
*   Sends the message to the customer's WhatsApp using Meta API.
*   Appends the sent confirmation into the SQLite `chat_sessions` database for that customer's number so the conversational flow remains contiguous.

---

## 6. Verification Plan

### 6.1. Automated Verification
*   Unit tests in `RoarWASupportAgent/tests` testing:
    *   FastAPI `/api/bookings/notify-new` formatting and triggers.
    *   FastAPI `/api/admin/chat` endpoint and tool-calling execution.
    *   Meta WhatsApp message parsing and Claude state updates.
*   Frontend lint and compile tests via `npm run build` and `npm run lint`.

### 6.2. Manual Verification
1.  Submit a booking from the website booking page $\rightarrow$ Verify a real WhatsApp confirmation is dispatched and logged.
2.  Chat with the customer support agent on WhatsApp $\rightarrow$ Perform queries, reschedule tours, and check that the date updates on both the Google Calendar and the React CRM dashboard.
3.  Open the Admin Assistant tab in the CRM $\rightarrow$ Ask for total revenue and driver details; verify details match the database exactly.
4.  Instruct the Admin Assistant to generate a coupon $\rightarrow$ Verify the coupon appears in the Coupons table in the CRM.

from fastapi import FastAPI, Request, Response, Query, BackgroundTasks
from fastapi.responses import RedirectResponse
from contextlib import asynccontextmanager
from app.config import settings
from app.db import init_db, save_credentials, save_session, get_session
from app.calendar_service import get_flow, delete_calendar_event, create_calendar_event
from pydantic import BaseModel
from typing import Optional
from app.agent import run_agent_turn
from app.whatsapp import send_whatsapp_message
import logging
import requests
import json
from datetime import datetime; import os
from app.llm import call_llm; from anthropic import Anthropic

# Monkey-patch requests to always include a browser User-Agent when talking to the CRM
original_get = requests.get
original_post = requests.post

def custom_get(url, *args, **kwargs):
    if "api.php" in url or "roaradventuretourism" in url or "localhost" in url:
        headers = kwargs.get("headers", {})
        if not headers or "User-Agent" not in headers:
            headers = dict(headers) if headers else {}
            headers["User-Agent"] = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            kwargs["headers"] = headers
    return original_get(url, *args, **kwargs)

def custom_post(url, *args, **kwargs):
    if "api.php" in url or "roaradventuretourism" in url or "localhost" in url:
        headers = kwargs.get("headers", {})
        if not headers or "User-Agent" not in headers:
            headers = dict(headers) if headers else {}
            headers["User-Agent"] = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            kwargs["headers"] = headers
    return original_post(url, *args, **kwargs)

requests.get = custom_get
requests.post = custom_post

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize the local SQLite tables on startup
    init_db()
    yield

app = FastAPI(title="Roar Tourism WhatsApp Support Agent", lifespan=lifespan)

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

# Meta WhatsApp Webhook verification route
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

def handle_direct_confirmation(text: str, phone: str) -> Optional[str]:
    import re
    ref_match = re.search(r'confirming Ref#\s*([a-zA-Z0-9_-]+)', text, re.IGNORECASE)
    if not ref_match:
        return None
    
    ref = ref_match.group(1).strip()
    
    name = "N/A"
    name_match = re.search(r'Name:\s*([^\n\r]+)', text, re.IGNORECASE)
    if name_match:
        name = name_match.group(1).strip()
        
    whatsapp = phone
    wa_match = re.search(r'WhatsApp:\s*([^\n\r]+)', text, re.IGNORECASE)
    if wa_match:
        whatsapp = wa_match.group(1).strip()
        
    guests = "1"
    guests_match = re.search(r'Guests:\s*(\d+)', text, re.IGNORECASE)
    if guests_match:
        guests = guests_match.group(1).strip()
        
    package = "Dubai Desert Safari"
    pkg_match = re.search(r'Package:\s*([^\n\r]+)', text, re.IGNORECASE)
    if pkg_match:
        package = pkg_match.group(1).strip()
        
    date_str = datetime.now().strftime("%d/%m/%Y")
    date_match = re.search(r'Date:\s*([^\n\r]+)', text, re.IGNORECASE)
    if date_match:
        date_str = date_match.group(1).strip()
        
    pickup = "N/A"
    pickup_match = re.search(r'Pickup:\s*([^\n\r]+)', text, re.IGNORECASE)
    if pickup_match:
        pickup = pickup_match.group(1).strip()
        
    total = "0"
    total_match = re.search(r'Total:\s*(?:AED)?\s*(\d+)', text, re.IGNORECASE)
    if total_match:
        total = total_match.group(1).strip()

    # Parse addons
    addon_name = ""
    addon_price = 0.0
    addon_match = re.search(r'Addons?:\s*([^\n\r]+)', text, re.IGNORECASE)
    if addon_match:
        addon_name = addon_match.group(1).strip()
        # Parse price from addon details
        price_match = re.search(r'(?:AED|\+)?\s*(\d+)', addon_name, re.IGNORECASE)
        if price_match:
            addon_price = float(price_match.group(1).strip())

    db_date = date_str
    try:
        parts = date_str.split('/')
        if len(parts) == 3:
            db_date = f"{parts[2]}-{parts[1]}-{parts[0]}"
    except Exception:
        pass

    pickup_time = "3:30 PM to 4:00 PM"
    if "morning" in package.lower() or "city" in package.lower() or "atta" in package.lower():
        pickup_time = "9:00 AM to 9:30 AM"

    clean_ref = ref.upper()
    booking_id = "book-" + clean_ref.replace("ASD", "").lower()

    # If there are addons, append them to the package name for the confirmation message and database
    package_with_addon = package
    if addon_name:
        package_with_addon = f"{package} + {addon_name}"

    event_id = ""
    try:
        event_id = create_calendar_event(name, int(guests), pickup, db_date, package_with_addon)
    except Exception as e:
        logger.error(f"Failed to create calendar event for parsed booking: {e}")

    booking_payload = {
        "id": booking_id,
        "customerName": name,
        "whatsapp": whatsapp,
        "partnerId": "whatsapp",
        "date": db_date,
        "packageName": package_with_addon,
        "pickupLocation": pickup,
        "roomNo": "",
        "pickupTime": pickup_time,
        "pax": int(guests),
        "price": float(total),
        "driverId": "",
        "status": "confirmed",
        "addonName": addon_name,
        "addonPrice": addon_price,
        "pricingType": "peak",
        "calendar_event_id": event_id
    }

    try:
        save_res = requests.post(f"{settings.CRM_BASE_URL}?action=save&table=bookings", json=booking_payload, timeout=5)
        logger.info(f"Parsed booking auto-save response: {save_res.text}")
    except Exception as e:
        logger.error(f"Failed to auto-save parsed booking: {e}")

    conf_msg = (
        f"Thank you for choosing Roar Adventure Tourism LLC, Your booking regarding {package_with_addon} with Booking Reference# {ref} is confirmed with following details.\n"
        f"1. Name: {name}\n"
        f"2. WhatsApp: {whatsapp}\n"
        f"3. No of Guests: {guests}\n"
        f"4. Package: {package_with_addon}\n"
        f"5. Pickup time: {pickup_time}\n"
        f"6. Payment: {total} AED\n"
        f"7. Payment on arrival (5% VAT apply on card payment) .\n"
        f"8. Date: {date_str}\n"
        f"9. ROOM no : N/A\n"
        f"10. Pickup location: {pickup}\n"
        f"Terms:\n"
        f"1. Free Cancellation before 24 hours\n"
        f"2. 50% refund before 12 hours.\n"
        f"3. 0 refund for no showup or same day cancellation.\n"
        f"For Cancellation Reschedule or Modifications please Call/WhatsApp +97145578679.\n"
    )
    try:
        from app.whatsapp import trigger_services_followup
        trigger_services_followup(whatsapp)
    except Exception as followup_err:
        logger.error(f"Failed to trigger services followup in direct confirmation: {followup_err}")
    return conf_msg

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
        
        # Check for direct booking confirmation format
        direct_reply = handle_direct_confirmation(text_body, phone)
        if direct_reply:
            send_whatsapp_message(phone, direct_reply)
            history = get_session(phone)
            history.append({"role": "user", "content": text_body})
            history.append({"role": "assistant", "content": direct_reply})
            save_session(phone, history)
            return
        
        # Run user message through the Claude agent
        reply = run_agent_turn(phone, text_body)
        
        # Send reply back to customer via Meta WhatsApp Send API
        send_whatsapp_message(phone, reply)
    except Exception as e:
        logger.error(f"Error handling WhatsApp Webhook message: {str(e)}")

# Meta WhatsApp webhook callback route
@app.post("/webhook")
async def handle_webhook(request: Request, background_tasks: BackgroundTasks):
    body = await request.json()
    logger.info(f"Received webhook payload: {body}")
    background_tasks.add_task(process_whatsapp_message, body)
    return {"status": "queued"}

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
        f"If you need to reschedule or cancel, you can chat with me directly right here! Ana | Roar Adventure Tourism 🏙️"
    )
    
    # Send WhatsApp message
    send_whatsapp_message(phone, message)
    
    # Append message to Claude chat sessions SQLite DB
    history = get_session(phone)
    history.append({"role": "assistant", "content": message})
    save_session(phone, history)
    
    try:
        from app.whatsapp import trigger_services_followup
        trigger_services_followup(phone)
    except Exception as followup_err:
        logger.error(f"Failed to trigger services followup in notify-new: {followup_err}")
        
    return {"status": "notified"}

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
    },
    {
        "name": "add_expense",
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
    },
    {
        "name": "update_booking_status",
        "description": "Update the status of a booking.",
        "input_schema": {
            "type": "object",
            "properties": {
                "booking_id": {"type": "string", "description": "The booking reference code."},
                "status": {"type": "string", "description": "The new status of the booking.", "enum": ["confirmed", "pending", "cancelled", "completed"]}
            },
            "required": ["booking_id", "status"]
        }
    },
    {
        "name": "send_whatsapp_message",
        "description": "Send a WhatsApp message directly to a customer.",
        "input_schema": {
            "type": "object",
            "properties": {
                "phone": {"type": "string", "description": "The customer's phone/WhatsApp number (with or without plus sign)."},
                "message": {"type": "string", "description": "The message text to send."}
            },
            "required": ["phone", "message"]
        }
    },
    {
        "name": "update_freelancer_ledger",
        "description": "Add or update a ledger entry row for a freelancer / vehicle in the CRM.",
        "input_schema": {
            "type": "object",
            "properties": {
                "car_id": {"type": "string", "description": "The unique car ID (e.g., car-1)."},
                "month": {"type": "string", "description": "The month name (e.g., June, July)."},
                "salik": {"type": "number", "description": "Salik amount in AED."},
                "fine": {"type": "number", "description": "Fine amount in AED."},
                "others": {"type": "number", "description": "Other expenses in AED."},
                "installment": {"type": "number", "description": "Installment amount in AED."},
                "received": {"type": "number", "description": "Received amount in AED."},
                "note": {"type": "string", "description": "Optional notes."}
            },
            "required": ["car_id", "month"]
        }
    }
]

class AdminChatPayload(BaseModel):
    messages: list
    query: str

def get_block_attr(block, attr_name, default=None):
    if hasattr(block, attr_name):
        return getattr(block, attr_name)
    if hasattr(block, "__pydantic_extra__") and block.__pydantic_extra__ is not None:
        if attr_name in block.__pydantic_extra__:
            return block.__pydantic_extra__[attr_name]
    if isinstance(block, dict):
        return block.get(attr_name, default)
    return default

def content_to_dict(content):
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        result = []
        for block in content:
            b_type = get_block_attr(block, "type")
            if b_type:
                block_dict = {"type": b_type}
                if b_type == "text":
                    block_dict["text"] = get_block_attr(block, "text", "")
                elif b_type == "tool_use":
                    block_dict["id"] = get_block_attr(block, "id")
                    block_dict["name"] = get_block_attr(block, "name")
                    block_dict["input"] = get_block_attr(block, "input")
                elif b_type == "thinking":
                    block_dict["thinking"] = get_block_attr(block, "thinking", "")
                    sig = get_block_attr(block, "signature")
                    if sig is not None:
                        block_dict["signature"] = sig
                result.append(block_dict)
            elif isinstance(block, dict):
                result.append(block)
        return result
    return str(content)

@app.post("/api/admin/chat")
async def admin_chat(payload: AdminChatPayload):
    try:
        # Resolve crm_url
        crm_url = settings.CRM_BASE_URL
        # 1. Fetch current database state from api.php
        db_state = {}
        db_loaded = False
        try:
            crm_url = settings.CRM_BASE_URL
            if not crm_url:
                db_url = settings.DATABASE_URL
                if db_url and db_url.startswith("http"):
                    crm_url = f"{db_url.replace('data/database.db', '')}api.php"
                else:
                    crm_url = "http://localhost/api.php"
            r = requests.get(f"{crm_url}?action=load", timeout=5)
            if r.status_code == 200:
                res_json = r.json()
                if res_json.get("status") == "success":
                    db_state = res_json.get("data", {})
                    db_loaded = True
        except Exception as e:
            logger.error(f"Error fetching DB state for admin chat: {e}")

        # Prune db_state to make the context light and super fast for Gemini!
        pruned_db_state = {}
        if db_state:
            # 1. Prune Bookings: Keep all pending/confirmed, and max 20 recent ones
            bookings = db_state.get("bookings", [])
            active_bookings = [b for b in bookings if b.get("status") in ["pending", "confirmed"]]
            other_bookings = [b for b in bookings if b.get("status") not in ["pending", "confirmed"]]
            other_bookings.sort(key=lambda x: x.get("id", ""), reverse=True)
            pruned_db_state["bookings"] = active_bookings + other_bookings[:20]

            # 2. Prune Drivers: Keep all
            pruned_db_state["drivers"] = db_state.get("drivers", [])

            # 3. Prune Expenses: Keep only recent 30
            expenses = db_state.get("driver_expenses", [])
            expenses.sort(key=lambda x: x.get("id", ""), reverse=True)
            pruned_db_state["driver_expenses"] = expenses[:30]

            # 4. Prune Coupons: Keep all
            pruned_db_state["coupons"] = db_state.get("coupons", [])

            # 5. Prune Cars & Ledger: Keep only last 6 months of ledger for each car
            cars = db_state.get("cars", [])
            pruned_cars = []
            for car in cars:
                car_copy = dict(car)
                ledger = car_copy.get("ledger", [])
                if isinstance(ledger, str):
                    try:
                        ledger = json.loads(ledger)
                    except:
                        ledger = []
                if isinstance(ledger, list):
                    car_copy["ledger"] = ledger[-6:]
                else:
                    car_copy["ledger"] = []
                pruned_cars.append(car_copy)
            pruned_db_state["cars"] = pruned_cars
        else:
            pruned_db_state = db_state

        # 2. Construct system prompt with DB context
        system_prompt = f"""You are the Roar Tourism AI Admin Assistant.
    Your role is to help administrators manage booking stats, driver schedules, expenses, cars, and coupons.
    Today is {datetime.now().strftime('%A, %B %d, %Y')}.

    Here is the active MySQL database state:
    {json.dumps(pruned_db_state, indent=2)}

    ADMIN ASSISTANT INSTRUCTIONS:
    1. ROLE: You are an operations assistant. Help admins visualize stats, assign drivers, record expenses, generate coupons, query data, and send WhatsApp messages to customers.
    2. DATA RULES: Rely ONLY on the database state provided above. If an item or booking doesn't exist, state it clearly.
    3. PRICING GUIDELINES: Refer strictly to the packages and coupons data in the database for calculations.
    4. BOOKING UPDATES & MESSAGES: Carry out actions like assigning drivers, updating booking statuses, or sending WhatsApp confirmations/cancellations to customers using the provided tools.
       - If the admin asks you to send a confirmation or cancellation message to a customer, use the `send_whatsapp_message` tool. Locate the customer's phone number from their booking (the `whatsapp` or `phone` field) and format the message text cleanly.
    5. SCOPE OF QUERIES: Only entertain queries related to travel services, driver registry, car details, coupon codes, expenses, and CRM data. If the user asks about anything unrelated (such as coding help, general history, personal advice, or unrelated topics), politely apologize and decline, explaining that you can only assist with Roar Adventure Tourism ERP operations.

    Answer concisely and carry out actions using tools.
    """

        # 3. Request Claude turn
        messages = []
        for msg in payload.messages:
            if isinstance(msg, dict) and "role" in msg and "content" in msg:
                messages.append({"role": msg["role"], "content": msg["content"]})
                
        messages.append({"role": "user", "content": payload.query})

        # Call client conditionally
        if settings.GEMINI_API_KEY and not os.environ.get("PYTEST_CURRENT_TEST"):
            response = call_llm(
                system_prompt=system_prompt,
                messages=messages,
                tools=ADMIN_CHAT_TOOLS
            )
        else:
            api_key = settings.ANTHROPIC_API_KEY or "mock_key"
            client = Anthropic(api_key=api_key)
            response = client.messages.create(
                model=settings.MODEL_NAME,
                max_tokens=1000,
                system=system_prompt,
                messages=messages,
                tools=ADMIN_CHAT_TOOLS
            )

        tool_calls = [block for block in response.content if getattr(block, "type", None) == "tool_use"]

        if tool_calls:
            crm_url = settings.CRM_BASE_URL
            if not crm_url:
                db_url = settings.DATABASE_URL or ""
                if db_url.startswith("http"):
                    crm_url = f"{db_url.replace('data/database.db', '')}api.php"
                else:
                    crm_url = "http://localhost/api.php"
            
            tool_results_content = []
            for tool_call in tool_calls:
                args = tool_call.input
                tool_result = None

                if tool_call.name == "generate_coupon":
                    coupon_id = f"cpn-{int(datetime.now().timestamp())}"
                    coupon_payload = {
                        "id": coupon_id,
                        "code": args.get("code"),
                        "packageId": args.get("packageId"),
                        "customPrice": args.get("customPrice"),
                        "isActive": args.get("isActive", 1),
                        "startDate": args.get("startDate"),
                        "endDate": args.get("endDate")
                    }
                    try:
                        save_res = requests.post(f"{crm_url}?action=save&table=coupons", json=coupon_payload, timeout=5)
                        if save_res.status_code == 200:
                            try:
                                res_json = save_res.json()
                            except Exception:
                                res_json = {}
                            if res_json.get("status") == "success":
                                tool_result = {"status": "success", "message": f"Successfully generated coupon {args.get('code')}."}
                            elif res_json.get("status") == "error":
                                tool_result = {"status": "error", "message": f"Failed to generate coupon: {res_json.get('message', 'Unknown error')}"}
                            else:
                                tool_result = {"status": "error", "message": "Failed to generate coupon in database."}
                        else:
                            tool_result = {"status": "error", "message": f"Failed to generate coupon. Server returned HTTP {save_res.status_code}."}
                    except requests.RequestException as e:
                        tool_result = {"status": "error", "message": f"Database backend is unreachable or timed out: {str(e)}"}

                elif tool_call.name == "assign_driver":
                    booking_id = args.get("booking_id") or args.get("bookingId")
                    driver_id = args.get("driver_id") or args.get("driverId")
                    if not db_loaded:
                        tool_result = {"status": "error", "message": "CRM backend is currently unreachable. Unable to perform operations."}
                    else:
                        booking = next((b for b in db_state.get("bookings", []) if b.get("id") == booking_id), None)
                        if booking:
                            booking["driverId"] = driver_id
                            try:
                                save_res = requests.post(f"{crm_url}?action=save&table=bookings", json=booking, timeout=5)
                                if save_res.status_code == 200:
                                    try:
                                        res_json = save_res.json()
                                    except Exception:
                                        res_json = {}
                                    if res_json.get("status") == "success":
                                        tool_result = {"status": "success", "message": f"Driver {driver_id} assigned successfully to booking {booking_id}."}
                                    elif res_json.get("status") == "error":
                                        tool_result = {"status": "error", "message": f"Failed to assign driver: {res_json.get('message', 'Unknown error')}"}
                                    else:
                                        tool_result = {"status": "error", "message": "Failed to assign driver in database."}
                                else:
                                    tool_result = {"status": "error", "message": f"Failed to assign driver. Server returned HTTP {save_res.status_code}."}
                            except requests.RequestException as e:
                                tool_result = {"status": "error", "message": f"Database backend is unreachable or timed out: {str(e)}"}
                        else:
                            tool_result = {"status": "error", "message": f"Booking {booking_id} not found."}

                elif tool_call.name in ["record_expense", "add_expense"]:
                    expense_id = f"exp-{int(datetime.now().timestamp())}"
                    driver_id = args.get("driverId") or args.get("driver_id")
                    expense_payload = {
                        "id": expense_id,
                        "driverId": driver_id,
                        "date": args.get("date"),
                        "salary": args.get("salary", 0.0),
                        "carPetrol": args.get("carPetrol", 0.0),
                        "campUse": args.get("campUse", 0.0),
                        "misc": args.get("misc", 0.0),
                        "notes": args.get("notes", "")
                    }
                    try:
                        save_res = requests.post(f"{crm_url}?action=save&table=expenses", json=expense_payload, timeout=5)
                        if save_res.status_code == 200:
                            try:
                                res_json = save_res.json()
                            except Exception:
                                res_json = {}
                            if res_json.get("status") == "success":
                                tool_result = {"status": "success", "message": f"Expense recorded successfully for driver {driver_id}."}
                            elif res_json.get("status") == "error":
                                tool_result = {"status": "error", "message": f"Failed to record expense: {res_json.get('message', 'Unknown error')}"}
                            else:
                                tool_result = {"status": "error", "message": "Failed to record expense in database."}
                        else:
                            tool_result = {"status": "error", "message": f"Failed to record expense. Server returned HTTP {save_res.status_code}."}
                    except requests.RequestException as e:
                        tool_result = {"status": "error", "message": f"Database backend is unreachable or timed out: {str(e)}"}

                elif tool_call.name == "update_booking_status":
                    booking_id = args.get("booking_id") or args.get("bookingId")
                    status = args.get("status")
                    if not db_loaded:
                        tool_result = {"status": "error", "message": "CRM backend is currently unreachable. Unable to perform operations."}
                    else:
                        booking = next((b for b in db_state.get("bookings", []) if b.get("id") == booking_id), None)
                        if booking:
                            booking["status"] = status
                            cal_event_id = booking.get("calendar_event_id")
                            if status == "cancelled" and cal_event_id:
                                try:
                                    delete_calendar_event(cal_event_id)
                                except Exception:
                                    pass
                            try:
                                save_res = requests.post(f"{crm_url}?action=save&table=bookings", json=booking, timeout=5)
                                if save_res.status_code == 200:
                                    try:
                                        res_json = save_res.json()
                                    except Exception:
                                        res_json = {}
                                    if res_json.get("status") == "success":
                                        tool_result = {"status": "success", "message": f"Booking {booking_id} status updated to {status}."}
                                    elif res_json.get("status") == "error":
                                        tool_result = {"status": "error", "message": f"Failed to update booking status: {res_json.get('message', 'Unknown error')}"}
                                    else:
                                        tool_result = {"status": "error", "message": "Failed to update booking status in database."}
                                else:
                                    tool_result = {"status": "error", "message": f"Failed to update booking status. Server returned HTTP {save_res.status_code}."}
                            except requests.RequestException as e:
                                tool_result = {"status": "error", "message": f"Database backend is unreachable or timed out: {str(e)}"}
                        else:
                            tool_result = {"status": "error", "message": f"Booking {booking_id} not found."}
                elif tool_call.name == "send_whatsapp_message":
                    phone = args.get("phone")
                    message = args.get("message")
                    success = send_whatsapp_message(phone, message)
                    if success:
                        tool_result = {"status": "success", "message": f"WhatsApp message successfully sent to {phone}."}
                    else:
                        tool_result = {"status": "error", "message": f"Failed to send WhatsApp message to {phone}."}
                elif tool_call.name == "update_freelancer_ledger":
                    car_id = args.get("car_id")
                    month = args.get("month")
                    if not db_loaded:
                        tool_result = {"status": "error", "message": "CRM backend is currently unreachable. Unable to perform operations."}
                    else:
                        cars_list = db_state.get("cars", [])
                        car = next((c for c in cars_list if c.get("id") == car_id), None)
                        if car:
                            ledger = car.get("ledger", [])
                            if isinstance(ledger, str):
                                try:
                                    ledger = json.loads(ledger)
                                except Exception:
                                    ledger = []
                            if not isinstance(ledger, list):
                                ledger = []
                                
                            # Find existing month row or create new
                            row = next((r for r in ledger if r.get("month") == month), None)
                            import time
                            if row:
                                if "salik" in args: row["salik"] = float(args["salik"])
                                if "fine" in args: row["fine"] = float(args["fine"])
                                if "others" in args: row["others"] = float(args["others"])
                                if "installment" in args: row["installment"] = float(args["installment"])
                                if "received" in args: row["received"] = float(args["received"])
                                if "note" in args: row["note"] = args["note"]
                            else:
                                row = {
                                    "id": f"row-{int(time.time() * 1000)}",
                                    "month": month,
                                    "salik": float(args.get("salik", 0)),
                                    "fine": float(args.get("fine", 0)),
                                    "others": float(args.get("others", 0)),
                                    "installment": float(args.get("installment", car.get("installment", 0))),
                                    "received": float(args.get("received", 0)),
                                    "note": args.get("note", "")
                                }
                                ledger.append(row)
                            
                            car["ledger"] = ledger
                            try:
                                save_res = requests.post(f"{crm_url}?action=save&table=cars", json=car, timeout=5)
                                if save_res.status_code == 200:
                                    try:
                                        res_json = save_res.json()
                                    except Exception:
                                        res_json = {}
                                    if res_json.get("status") == "success":
                                        tool_result = {"status": "success", "message": f"Ledger for car {car_id} updated for {month}."}
                                    elif res_json.get("status") == "error":
                                        tool_result = {"status": "error", "message": f"Failed to save car to CRM: {res_json.get('message', 'Unknown error')}"}
                                    else:
                                        tool_result = {"status": "error", "message": "Failed to save car to CRM."}
                                else:
                                    tool_result = {"status": "error", "message": f"Failed to save car to CRM. Server returned HTTP {save_res.status_code}."}
                            except requests.RequestException as e:
                                tool_result = {"status": "error", "message": f"Database backend is unreachable or timed out: {str(e)}"}
                        else:
                            tool_result = {"status": "error", "message": f"Car {car_id} not found."}
                else:
                    tool_result = {"status": "error", "message": f"Unknown tool: {tool_call.name}."}

                tool_results_content.append({
                    "type": "tool_result",
                    "tool_use_id": tool_call.id,
                    "content": json.dumps(tool_result)
                })

            # Feed tool execution result back to Claude
            messages.append({"role": "assistant", "content": content_to_dict(response.content)})
            messages.append({
                "role": "user",
                "content": tool_results_content
            })
            
            # Get final conversational reply from Claude
            if settings.GEMINI_API_KEY and not os.environ.get("PYTEST_CURRENT_TEST"):
                final_response = call_llm(
                    system_prompt=system_prompt,
                    messages=messages,
                    tools=ADMIN_CHAT_TOOLS
                )
            else:
                api_key = settings.ANTHROPIC_API_KEY or "mock_key"
                client = Anthropic(api_key=api_key)
                final_response = client.messages.create(
                    model=settings.MODEL_NAME,
                    max_tokens=1000,
                    system=system_prompt,
                    messages=messages,
                    tools=ADMIN_CHAT_TOOLS
                )
            reply_text = "".join([getattr(block, "text", "") for block in final_response.content if getattr(block, "type", None) == "text"])
        else:
            reply_text = "".join([getattr(block, "text", "") for block in response.content if getattr(block, "type", None) == "text"])

        return {"reply": reply_text}
    except Exception as e:
        logger.error(f"Error in admin_chat endpoint: {e}", exc_info=True)
        return {"reply": f"Internal Server Error: {str(e)}"}

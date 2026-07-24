import requests
import re
import time

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
from app.llm import call_llm, content_to_dict; from anthropic import Anthropic
import os
import json
from datetime import datetime
from app.config import settings
from app.db import get_session, save_session
from app.calendar_service import create_calendar_event, update_calendar_event, delete_calendar_event

CRM_BASE_URL = settings.CRM_BASE_URL
if not CRM_BASE_URL:
    db_url = settings.DATABASE_URL or ""
    if not db_url.startswith("http"):
        CRM_BASE_URL = "http://localhost/api.php"
    else:
        CRM_BASE_URL = f"{db_url.replace('data/database.db', '')}api.php"

def normalize_phone(phone):
    if not phone:
        return ""
    return "".join(c for c in phone if c.isdigit())

def phone_matches(phone1, phone2):
    n1 = normalize_phone(phone1)
    n2 = normalize_phone(phone2)
    if not n1 or not n2:
        return False
    if len(n1) >= 9 and len(n2) >= 9:
        return n1[-9:] == n2[-9:]
    return n1 == n2

def is_peak_season(date_str):
    try:
        dt = datetime.strptime(date_str, "%Y-%m-%d")
        month = dt.month
    except Exception:
        try:
            dt = datetime.now()
            month = dt.month
        except Exception:
            month = 10
    
    if month in [10, 11, 12, 1, 2, 3, 4]:
        return True
    return False

def find_matching_package(selected_package, packages):
    if not selected_package:
        return None
    sel = selected_package.strip().lower()
    for p in packages:
        p_id = p.get('id', '').strip().lower()
        p_name = p.get('name', '').strip().lower()
        if sel == p_id or sel == p_name:
            return p
    
    for p in packages:
        p_name = p.get('name', '').strip().lower()
        p_name_clean = re.sub(r'\s*\d+\s*aed$', '', p_name).strip()
        if sel == p_name_clean:
            return p
            
    for p in packages:
        p_id = p.get('id', '').strip().lower()
        p_name = p.get('name', '').strip().lower()
        if sel in p_name or p_name in sel or sel in p_id:
            return p
            
    return None

def calculate_price(package, tour_date, num_guests):
    peak = is_peak_season(tour_date)
    rate = package.get('peakRate') if peak else package.get('offpeakRate')
    if rate is None or rate == 0:
        rate = package.get('rate', 0.0)
    
    rate = float(rate)
    p_type = package.get('type', 'per_person')
    if p_type == 'per_person':
        return rate * int(num_guests)
    else:
        return rate

def fetch_db_data_from_crm():
    r = requests.get(f"{CRM_BASE_URL}?action=load", timeout=5)
    if r.status_code == 200:
        res_json = r.json()
        if res_json.get("status") == "success" and "data" in res_json:
            return res_json.get("data", {})
        else:
            raise ValueError(f"CRM returned failure or missing data: {res_json.get('message', 'No message')}")
    else:
        raise ValueError(f"CRM server error (HTTP {r.status_code})")

def get_system_prompt():
    catalog_content = "Failed to load catalog."
    company_details_content = "Failed to load company details."
    rules_guide = "Failed to load tour packages markdown rules."
    try:
        db_data = fetch_db_data_from_crm()
        packages = db_data.get("packages", [])
        if packages:
            catalog_content = "Tour Packages Catalog:\n"
            for p in packages:
                catalog_content += f"- ID: {p['id']}, Name: {p['name']}, Category: {p['category']}, Standard Rate: {p['peakRate']} AED, Discounted Rate: {p['offpeakRate']} AED, Type: {p['type']}\n"
                addons = p.get('addons')
                if addons:
                    if isinstance(addons, str):
                        try:
                            addons = json.loads(addons)
                        except Exception:
                            addons = []
                    if isinstance(addons, list):
                        addon_strings = []
                        for addon in addons:
                            if isinstance(addon, dict):
                                addon_strings.append(f"{addon.get('name')}: AED {addon.get('price')}")
                        if addon_strings:
                            catalog_content += f"  Optional Add-ons: {', '.join(addon_strings)}\n"
        
        # Load company details
        company_details_list = db_data.get("company_details", [])
        if company_details_list:
            c = company_details_list[0]
            company_details_content = (
                f"Company Name: {c.get('fullName')}\n"
                f"Address: {c.get('address')}\n"
                f"Contact Person: {c.get('contactPerson')}\n"
                f"WhatsApp/Phone: {c.get('whatsapp')}\n"
                f"Email: {c.get('email')}\n"
                f"Registration Date: {c.get('regDate')}\n"
                f"License Details: {c.get('licenseNo')}\n"
                f"Services Offered: {c.get('whatWeOffer')}\n"
            )
            
        # Load tour_packages.md guide
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        config_path = os.path.join(base_dir, "config", "tour_packages.md")
        if os.path.exists(config_path):
            with open(config_path, "r", encoding="utf-8") as f:
                rules_guide = f.read()
    except Exception as e:
        catalog_content = f"Error loading packages: {str(e)}"
        company_details_content = f"Error loading company details: {str(e)}"
        rules_guide = f"Error loading tour packages markdown rules: {str(e)}"

    current_date = datetime.now().strftime("%A, %B %d, %Y")
    
    prompt = f"""You are Ana, a warm, helpful, and highly experienced travel consultant representing "Roar Adventure Tourism" (your name/identity).
Always start your first message of a new conversation with: "Welcome to Roar Adventure Tourism! I am Ana, your booking assistant. How can I help you today?" or similar greeting.

Core Instructions:
1. Speak naturally, warmly, and empathetically. Use emojis (e.g. 🌅, 🐫, 🚗, 🏨) to match the Dubai tourism context.
2. STRICTOR LENGTH LIMIT: Write a maximum of 35-50 words per message to save tokens. Keep everything brief, concise, and straight to the point.
3. NO RAW MARKDOWN STYLING: Do NOT use asterisks (*) or double asterisks (**) in your normal conversation text. Raw markdown looks unprofessional on WhatsApp. Keep your replies as clean, plain text.
4. SEQUENTIAL CONVERSATION & BOOKING FLOW (FOLLOW THESE INSTRUCTIONS IN STRICT ORDER):
   - Step 1: If a customer messages about a desert safari, first ask: "How many guests are joining, and which date are you planning for?"
   - Step 2: Once they answer, share packages and prices. If they ask about packages, posters, brochures, posts, or flyers, you must reply with the exact flyer filename in your message to send them the flyer:
      - Standard Evening Safari: include `eveningpackages.png`
      - Discounted Evening Safari: include `eveningpackages_alt.png`
      - Morning Safari: include `morningpackages.jpg`
      - Quadbike Safari: include `quadpackages.png`
      - Buggy Safari: include `buggypackages.png`
      - Self-drive Safari: include `selfdrivepackages.png`
     - The Evening Desert Safari packages available are: Standard (99 AED), VIP Shared (149 AED), and Private Tour (999 AED). Ask the customer: "Which package would you like to choose?"
     - Only share the details of the package once they pick one or ask for details. When explaining package details, always state that belly dance is included in all evening safari packages.
     - Only quote/share the discounted evening safari packages/rates (offpeakRate) if they explicitly ask for a discount, and include `eveningpackages_alt.png` in your message.
     - Only share other packages (morning safari, self-drive, buggy, etc.) if they explicitly request them, and include their respective flyer filename.
   - Step 3: Ask for the pickup location (hotel name and room number) to schedule the booking.
   - Step 4: Ask about their preferred payment method: "How would you like to book this? You can pay via online card payment, bank transfer, or on the tour date (cash or card to the driver/POS machine)."
     - Add a note: Card transactions (online or at camp) have a 5% VAT. Bank transfers are free with no charges.
5. PAYMENT HELP & BANK DETAILS:
   - If they ask for Bank Transfer details, reply with:
     Bank Name: RAK BANK
     Account Name: Roar Adventure Tourism
     Account No: 0373211257001
     IBAN No: AE170400000373211257001
     Currency: AED
     Swift Code: NRAKAEAK
   - If they choose PayPal, provide: info@roaradventuretourism.com
   - If they ask for a payment link, instruct them to message +97145578679 with their booking details to get the link. Once they confirm, proceed with booking.
   - If they say they are unable to make payment, reply: "Don't worry, you can pay cash on the tour date or via card to the driver on the tour date."
6. STRICT PRICING & DISCOUNTING STRATEGY:
   - Quote catalog prices. Do not mention "peak season", "off-peak", "Standard Rate" or "Discounted Rate" terminology.
   - Quote Standard Rate first. Only quote Discounted Rate if they complain or ask for a discount.
7. Support contact number:
   - The contact phone number for support, bookings, cancellations, or rescheduling is **+97145578679**.
8. SCOPE CONSTRAINT: Apologize and refuse any non-travel/non-booking queries.
9. COMPANY INFORMATION: official details:
{company_details_content}

For City Tours, present the following detailed itineraries and use their catalog prices:
- Abu Dhabi City Tour (Private Car, 1-6 Guests, without tickets): Morning Pickup Window: 07:00 – 08:00 AM.
- Dubai City Tour Private Car 8H: Includes hotel pickup, Gold & Spice Souqs, Burj Khalifa.
- Half-Day Dubai City Tour (Private Land Cruiser CAR): 3-4 hours.

Here is the current tour and pricing catalog:
{catalog_content}

Here are the detailed rules, timings, inclusions, locations, and pricing guidelines:
{rules_guide}

10. STRICT BOOKING CONFIRMATION TEMPLATE:
Once a booking is successfully created using the `create_booking` tool, you MUST respond to the customer with a confirmation message that EXACTLY matches the following template layout (including matching numeric reference IDs without prefix or suffix, and including the terms). (Note: Only in this template can you use the formatting below, but keep standard text clean from asterisks):

Thank you for choosing Roar Adventure Tourism LLC, Your booking regarding [Package Name] (plus add-ons description if any, e.g. "Private Morning 499AED + 2x long camel ride 120AED") with Booking Reference# [booking_id from tool result] is confirmed with following details.   
1. Name: [Customer Name]
2. WhatsApp: [WhatsApp Phone Number]
3. No of Guests: [Number of Guests]
4. Package: [Package Name] (if there are add-ons, you MUST append them to the package name in the format: " + [Quantity]x [Add-on Name] [Add-on Price]AED", e.g. "Private Morning 499AED + 2x long camel ride 120AED")
5. Pickup time: [Pickup Time, e.g., 3:30-4PM for Evening Safari or 9:00-9:30AM for Morning Safari] 
7. Payment: [Total Price]AED Payment on arrival (5% VAT apply on card payment) .   
8. Date: [Tour Date in DD/MM/YYYY format]  
9. Pickup location: [Pickup Location]
Terms:   
1. Free Cancellation before 24 hours  
2. 50% refund before 12 hours.   
3. 0 refund for no showup or same day cancellation.   
For Cancellation Reschedule or Modifications please Call/WhatsApp +97145578679.

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
            "pickup_location": {"type": "string", "description": "Pickup location / hotel name & room number if available."},
            "tour_date": {"type": "string", "description": "Date of the tour (format: YYYY-MM-DD)."},
            "selected_package": {"type": "string", "description": "The exact tour package selected."},
            "addon_names": {
                "type": "array",
                "items": {"type": "string"},
                "description": "Optional list of selected add-on names."
            },
            "addon_price": {
                "type": "number",
                "description": "Optional total price of selected add-ons."
            },
            "total_price": {
                "type": "number",
                "description": "Total price of the booking including any add-ons."
            }
        },
        "required": ["customer_name", "num_guests", "pickup_location", "tour_date", "selected_package", "total_price"]
    }
}

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

ASSIGN_DRIVER_TOOL = {
    "name": "assign_driver",
    "description": "Assign a driver to a specific booking in the CRM database.",
    "input_schema": {
        "type": "object",
        "properties": {
            "booking_id": {"type": "string", "description": "The unique booking ID (e.g. book-123456789)."},
            "driver_id": {"type": "string", "description": "The unique ID of the driver to assign (e.g. driver-1)."}
        },
        "required": ["booking_id", "driver_id"]
    }
}

UPDATE_FREELANCER_LEDGER_TOOL = {
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

GENERATE_REPORT_TOOL = {
    "name": "generate_report",
    "description": "Generate a concise text summary report of bookings, driver schedules, or freelancer statements.",
    "input_schema": {
        "type": "object",
        "properties": {
            "report_type": {
                "type": "string", 
                "enum": ["bookings_summary", "driver_schedule", "freelancer_statement"],
                "description": "The type of report to generate."
            },
            "date": {"type": "string", "description": "Optional date filter (YYYY-MM-DD)."},
            "driver_or_car_id": {"type": "string", "description": "Optional driver or car ID filter."}
        },
        "required": ["report_type"]
    }
}

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

def run_agent_turn(phone_number: str, user_message: str) -> str:
    # Set fallback API key if not configured to prevent startup crashes in testing
    api_key = settings.ANTHROPIC_API_KEY or "mock_key"
    history = get_session(phone_number)
    
    # Append new user message
    history.append({"role": "user", "content": user_message})
    
    system_prompt = get_system_prompt()
    
    # Call client conditionally
    if settings.GEMINI_API_KEY and not os.environ.get("PYTEST_CURRENT_TEST"):
        response = call_llm(
            system_prompt=system_prompt,
            messages=history,
            tools=[BOOKING_TOOL, FIND_BOOKINGS_TOOL, RESCHEDULE_TOOL, CANCEL_TOOL, ASSIGN_DRIVER_TOOL, UPDATE_FREELANCER_LEDGER_TOOL, GENERATE_REPORT_TOOL]
        )
    else:
        client = Anthropic(api_key=api_key)
        response = client.messages.create(
            model=settings.MODEL_NAME,
            max_tokens=1500,
            system=system_prompt,
            messages=history,
            tools=[BOOKING_TOOL, FIND_BOOKINGS_TOOL, RESCHEDULE_TOOL, CANCEL_TOOL, ASSIGN_DRIVER_TOOL, UPDATE_FREELANCER_LEDGER_TOOL, GENERATE_REPORT_TOOL]
        )

    reply_text = ""
    
    # Check if tool use was requested
    if response.stop_reason == "tool_use":
        tool_calls = [block for block in response.content if getattr(block, "type", None) == "tool_use"]
        if tool_calls:
            tool_results_content = []
            for tool_call in tool_calls:
                tool_name = tool_call.name
                args = tool_call.input
                tool_result = None
                
                try:
                    if tool_name == "create_booking":
                        # Generate sequential booking ID starting from 199600
                        try:
                            db_data = fetch_db_data_from_crm()
                            bookings = db_data.get("bookings", [])
                            numeric_ids = []
                            for b in bookings:
                                b_id = b.get("id", "")
                                if b_id.isdigit():
                                    numeric_ids.append(int(b_id))
                            max_id = max(numeric_ids) if numeric_ids else 199600
                            booking_id = str(max_id + 1)
                        except Exception:
                            booking_id = str(int(time.time() * 1000) % 100000 + 199600)
                        
                        # Create calendar event
                        try:
                            event_id = create_calendar_event(
                                name=args['customer_name'],
                                guests=int(args['num_guests']),
                                pickup=args['pickup_location'],
                                date_str=args['tour_date'],
                                package=args['selected_package']
                            )
                        except Exception as e:
                            print(f"Warning: Failed to create calendar event: {e}")
                            event_id = ""
                        
                        # Get packages to calculate price and get correct name
                        db_data = fetch_db_data_from_crm()
                        packages = db_data.get("packages", [])
                        matched_pkg = find_matching_package(args['selected_package'], packages)
                        if matched_pkg:
                            calculated_fallback_price = calculate_price(matched_pkg, args['tour_date'], int(args['num_guests']))
                            package_name_db = matched_pkg.get('name', args['selected_package'])
                        else:
                            calculated_fallback_price = 0.0
                            price_match = re.search(r'(\d+)\s*aed', args['selected_package'], re.IGNORECASE)
                            if price_match:
                                is_flat = any(word in args['selected_package'].lower() for word in ['private', 'car', 'buggy', 'flat'])
                                base_rate = float(price_match.group(1))
                                calculated_fallback_price = base_rate if is_flat else base_rate * int(args['num_guests'])
                            package_name_db = args['selected_package']
                        
                        # Extract room number if present, fallback to empty string
                        room_no = ""
                        room_match = re.search(r'(?:room|rm|room\s*#)\s*([a-zA-Z0-9_-]+)', args['pickup_location'], re.IGNORECASE)
                        if room_match:
                            room_no = room_match.group(1)
                        
                        addon_name = ", ".join(args.get("addon_names", []))
                        addon_price = args.get("addon_price", 0.0)
                        total_price = args.get("total_price")
                        if total_price is None:
                            total_price = calculated_fallback_price
                        
                        pricing_type = "peak" if is_peak_season(args['tour_date']) else "offpeak"
                        
                        booking_payload = {
                            "id": booking_id,
                            "customerName": args['customer_name'],
                            "whatsapp": phone_number,
                            "partnerId": "whatsapp",
                            "date": args['tour_date'],
                            "packageName": package_name_db,
                            "pickupLocation": args['pickup_location'],
                            "roomNo": room_no,
                            "pickupTime": "3:30 PM to 4:00 PM" if "evening" in package_name_db.lower() or "sunset" in package_name_db.lower() else "9:00 AM to 9:30 AM",
                            "pax": int(args['num_guests']),
                            "price": total_price,
                            "driverId": "",
                            "status": "confirmed",
                            "addonName": addon_name,
                            "addonPrice": addon_price,
                            "pricingType": pricing_type,
                            "calendar_event_id": event_id
                        }
                        
                        # Call api.php?action=save&table=bookings
                        save_res = requests.post(f"{CRM_BASE_URL}?action=save&table=bookings", json=booking_payload, timeout=5)
                        if save_res.status_code == 200 and save_res.json().get("status") == "success":
                            tool_result = {"status": "success", "booking_id": booking_id, "event_id": event_id, "price": total_price}
                            try:
                                from app.whatsapp import trigger_services_followup
                                trigger_services_followup(phone_number)
                            except Exception as followup_err:
                                logger.error(f"Failed to trigger services followup in agent turn: {followup_err}")
                        else:
                            msg = save_res.json().get("message") if save_res.status_code == 200 else f"HTTP {save_res.status_code}"
                            tool_result = {"status": "error", "message": f"Failed to save booking to CRM: {msg}"}
                    
                    elif tool_name == "find_bookings":
                        search_phone = args.get("phone_number")
                        r = requests.get(f"{CRM_BASE_URL}?action=load", timeout=5)
                        if r.status_code == 200:
                            res_json = r.json()
                            if res_json.get("status") == "success" and "data" in res_json:
                                bookings = res_json.get("data", {}).get("bookings", [])
                                matched_bookings = []
                                for b in bookings:
                                    if phone_matches(b.get("whatsapp"), search_phone):
                                        matched_bookings.append(b)
                                tool_result = {"status": "success", "bookings": matched_bookings}
                            else:
                                msg = res_json.get("message", "Unknown error or missing data field")
                                tool_result = {"status": "error", "message": f"Failed to load bookings from CRM: {msg}"}
                        else:
                            tool_result = {"status": "error", "message": f"Failed to load bookings from CRM (HTTP {r.status_code})."}
                    
                    elif tool_name == "reschedule_booking":
                        booking_id = args.get("booking_id")
                        new_date = args.get("new_date")
                        r = requests.get(f"{CRM_BASE_URL}?action=load", timeout=5)
                        if r.status_code == 200:
                            res_json = r.json()
                            if res_json.get("status") == "success" and "data" in res_json:
                                data = res_json
                                bookings = data.get("data", {}).get("bookings", [])
                                booking_to_update = None
                                for b in bookings:
                                    if b.get("id") == booking_id:
                                        booking_to_update = b
                                        break
                                
                                if booking_to_update:
                                    booking_to_update["date"] = new_date
                                    # Recalculate price in case season changed!
                                    packages = data.get("data", {}).get("packages", [])
                                    matched_pkg = find_matching_package(booking_to_update.get("packageName"), packages)
                                    if matched_pkg:
                                        booking_to_update["price"] = calculate_price(matched_pkg, new_date, int(booking_to_update.get("pax", 1)))
                                    else:
                                        price_match = re.search(r'(\d+)\s*aed', booking_to_update.get("packageName", ""), re.IGNORECASE)
                                        if price_match:
                                            is_flat = any(word in booking_to_update.get("packageName", "").lower() for word in ['private', 'car', 'buggy', 'flat'])
                                            base_rate = float(price_match.group(1))
                                            booking_to_update["price"] = base_rate if is_flat else base_rate * int(booking_to_update.get("pax", 1))
                                    
                                    # Google Calendar event update
                                    cal_event_id = booking_to_update.get("calendar_event_id", "")
                                    if cal_event_id:
                                        update_calendar_event(
                                            event_id=cal_event_id,
                                            name=booking_to_update.get("customerName", ""),
                                            guests=int(booking_to_update.get("pax", 1)),
                                            pickup=booking_to_update.get("pickupLocation", ""),
                                            date_str=new_date,
                                            package=booking_to_update.get("packageName", "")
                                        )
                                    
                                    save_res = requests.post(f"{CRM_BASE_URL}?action=save&table=bookings", json=booking_to_update, timeout=5)
                                    if save_res.status_code == 200 and save_res.json().get("status") == "success":
                                        tool_result = {"status": "success", "booking_id": booking_id, "new_date": new_date}
                                    else:
                                        msg = save_res.json().get("message") if save_res.status_code == 200 else f"HTTP {save_res.status_code}"
                                        tool_result = {"status": "error", "message": f"Failed to update booking date in CRM: {msg}"}
                                else:
                                    tool_result = {"status": "error", "message": f"Booking ID {booking_id} not found."}
                            else:
                                msg = res_json.get("message", "Unknown error or missing data field")
                                tool_result = {"status": "error", "message": f"Failed to load bookings from CRM: {msg}"}
                        else:
                            tool_result = {"status": "error", "message": f"Failed to load bookings from CRM (HTTP {r.status_code})."}
                    
                    elif tool_name == "cancel_booking":
                        booking_id = args.get("booking_id")
                        r = requests.get(f"{CRM_BASE_URL}?action=load", timeout=5)
                        if r.status_code == 200:
                            res_json = r.json()
                            if res_json.get("status") == "success" and "data" in res_json:
                                data = res_json
                                bookings = data.get("data", {}).get("bookings", [])
                                booking_to_update = None
                                for b in bookings:
                                    if b.get("id") == booking_id:
                                        booking_to_update = b
                                        break
                                
                                if booking_to_update:
                                    booking_to_update["status"] = "cancelled"
                                    
                                    # Google Calendar event delete
                                    cal_event_id = booking_to_update.get("calendar_event_id", "")
                                    if cal_event_id:
                                        delete_calendar_event(cal_event_id)
                                    
                                    save_res = requests.post(f"{CRM_BASE_URL}?action=save&table=bookings", json=booking_to_update, timeout=5)
                                    if save_res.status_code == 200 and save_res.json().get("status") == "success":
                                        tool_result = {"status": "success", "booking_id": booking_id, "booking_status": "cancelled"}
                                    else:
                                        msg = save_res.json().get("message") if save_res.status_code == 200 else f"HTTP {save_res.status_code}"
                                        tool_result = {"status": "error", "message": f"Failed to cancel booking in CRM: {msg}"}
                                else:
                                    tool_result = {"status": "error", "message": f"Booking ID {booking_id} not found."}
                            else:
                                msg = res_json.get("message", "Unknown error or missing data field")
                                tool_result = {"status": "error", "message": f"Failed to load bookings from CRM: {msg}"}
                        else:
                            tool_result = {"status": "error", "message": f"Failed to load bookings from CRM (HTTP {r.status_code})."}
                    
                    elif tool_name == "assign_driver":
                        booking_id = args.get("booking_id")
                        driver_id = args.get("driver_id")
                        db_data = fetch_db_data_from_crm()
                        bookings = db_data.get("bookings", [])
                        booking = next((b for b in bookings if b.get("id") == booking_id), None)
                        if booking:
                            booking["driverId"] = driver_id
                            save_res = requests.post(f"{CRM_BASE_URL}?action=save&table=bookings", json=booking, timeout=5)
                            if save_res.status_code == 200 and save_res.json().get("status") == "success":
                                tool_result = {"status": "success", "message": f"Driver {driver_id} assigned successfully to booking {booking_id}."}
                            else:
                                msg = save_res.json().get("message") if save_res.status_code == 200 else f"HTTP {save_res.status_code}"
                                tool_result = {"status": "error", "message": f"Failed to save booking assignment to CRM: {msg}"}
                        else:
                            tool_result = {"status": "error", "message": f"Booking {booking_id} not found."}
    
                    elif tool_name == "update_freelancer_ledger":
                        car_id = args.get("car_id")
                        month = args.get("month")
                        db_data = fetch_db_data_from_crm()
                        cars_list = db_data.get("cars", [])
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
                            save_res = requests.post(f"{CRM_BASE_URL}?action=save&table=cars", json=car, timeout=5)
                            if save_res.status_code == 200 and save_res.json().get("status") == "success":
                                tool_result = {"status": "success", "message": f"Ledger for car {car_id} updated for {month}."}
                            else:
                                msg = save_res.json().get("message") if save_res.status_code == 200 else f"HTTP {save_res.status_code}"
                                tool_result = {"status": "error", "message": f"Failed to save car to CRM: {msg}"}
                        else:
                            tool_result = {"status": "error", "message": f"Car {car_id} not found."}
    
                    elif tool_name == "generate_report":
                        report_type = args.get("report_type")
                        filter_date = args.get("date")
                        filter_id = args.get("driver_or_car_id")
                        
                        db_data = fetch_db_data_from_crm()
                        
                        if report_type == "bookings_summary":
                            bookings = db_data.get("bookings", [])
                            if filter_date:
                                bookings = [b for b in bookings if b.get("date") == filter_date]
                            
                            total_revenue = sum(float(b.get("price", 0)) for b in bookings)
                            confirmed_count = len([b for b in bookings if b.get("status") == "confirmed"])
                            completed_count = len([b for b in bookings if b.get("status") == "completed"])
                            
                            report_text = f"Bookings Summary Report (Date: {filter_date or 'All Dates'}):\n"
                            report_text += f"- Total Bookings: {len(bookings)}\n"
                            report_text += f"- Confirmed: {confirmed_count}\n"
                            report_text += f"- Completed: {completed_count}\n"
                            report_text += f"- Total Revenue: {total_revenue} AED\n"
                            tool_result = {"status": "success", "report": report_text}
                            
                        elif report_type == "driver_schedule":
                            bookings = db_data.get("bookings", [])
                            drivers = db_data.get("drivers", [])
                            
                            if filter_id:
                                bookings = [b for b in bookings if b.get("driverId") == filter_id]
                                driver_name = next((d.get("name", "Unknown") for d in drivers if d.get("id") == filter_id), filter_id)
                                report_text = f"Schedule for Driver {driver_name}:\n"
                            else:
                                report_text = "All Driver Schedules:\n"
                                
                            if filter_date:
                                bookings = [b for b in bookings if b.get("date") == filter_date]
                                report_text += f"Date: {filter_date}\n"
                                
                            for b in bookings:
                                d_name = next((d.get("name", "Unassigned") for d in drivers if d.get("id") == b.get("driverId")), "Unassigned")
                                report_text += f"- Booking Ref: {b.get('id')} | Customer: {b.get('customerName')} | Package: {b.get('packageName')} | Driver: {d_name} | Status: {b.get('status')}\n"
                            tool_result = {"status": "success", "report": report_text}
                            
                        elif report_type == "freelancer_statement":
                            cars = db_data.get("cars", [])
                            if filter_id:
                                cars = [c for c in cars if c.get("id") == filter_id or c.get("plateNo") == filter_id]
                                
                            report_text = "Freelancer / Car Statements:\n"
                            for car in cars:
                                report_text += f"Vehicle Plate: {car.get('plateNo')} | Owner: {car.get('owner', 'N/A')}\n"
                                ledger = car.get("ledger", [])
                                if isinstance(ledger, str):
                                    try: ledger = json.loads(ledger)
                                    except: ledger = []
                                if isinstance(ledger, list):
                                    for row in ledger:
                                        net = float(row.get("received", 0)) - (float(row.get("salik", 0)) + float(row.get("fine", 0)) + float(row.get("others", 0)) + float(row.get("installment", 0)))
                                        report_text += f"  * Month: {row.get('month')} | Installment: {row.get('installment')} AED | Salik: {row.get('salik')} AED | Fine: {row.get('fine')} AED | Net: {net} AED | Notes: {row.get('note', '')}\n"
                                else:
                                    report_text += "  No ledger records.\n"
                            tool_result = {"status": "success", "report": report_text}
                    
                    else:
                        tool_result = {"status": "error", "message": f"Unknown tool: {tool_name}"}
                except Exception as e:
                    tool_result = {"status": "error", "message": str(e)}
            
                tool_results_content.append({
                    "type": "tool_result",
                    "tool_use_id": tool_call.id,
                    "content": json.dumps(tool_result)
                })
            
            # Feed tool execution results back to Claude
            history.append({"role": "assistant", "content": content_to_dict(response.content)})
            history.append({
                "role": "user",
                "content": tool_results_content
            })
            
            # Get final conversational confirmation from Claude
            if settings.GEMINI_API_KEY and not os.environ.get("PYTEST_CURRENT_TEST"):
                final_response = call_llm(
                    system_prompt=system_prompt,
                    messages=history,
                    tools=[BOOKING_TOOL, FIND_BOOKINGS_TOOL, RESCHEDULE_TOOL, CANCEL_TOOL, ASSIGN_DRIVER_TOOL, UPDATE_FREELANCER_LEDGER_TOOL, GENERATE_REPORT_TOOL]
                )
            else:
                client = Anthropic(api_key=api_key)
                final_response = client.messages.create(
                    model=settings.MODEL_NAME,
                    max_tokens=1000,
                    system=system_prompt,
                    messages=history,
                    tools=[BOOKING_TOOL, FIND_BOOKINGS_TOOL, RESCHEDULE_TOOL, CANCEL_TOOL, ASSIGN_DRIVER_TOOL, UPDATE_FREELANCER_LEDGER_TOOL, GENERATE_REPORT_TOOL]
                )
            
            reply_text = "".join([block.text for block in final_response.content if block.type == "text"])
            history.append({"role": "assistant", "content": reply_text})
    else:
        # Normal text reply
        reply_text = "".join([block.text for block in response.content if block.type == "text"])
        history.append({"role": "assistant", "content": reply_text})

    # Save updated session history back to SQLite
    save_session(phone_number, history)
    return reply_text

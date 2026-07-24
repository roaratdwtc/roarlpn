import requests
import logging
from app.config import settings

logger = logging.getLogger(__name__)

def send_whatsapp_message(to_phone: str, text: str):
    if not settings.WHATSAPP_TOKEN or not settings.WHATSAPP_PHONE_ID:
        logger.warning("WhatsApp credentials missing. Skipping send.")
        return False

    url = f"https://graph.facebook.com/v19.0/{settings.WHATSAPP_PHONE_ID}/messages"
    headers = {
        "Authorization": f"Bearer {settings.WHATSAPP_TOKEN}",
        "Content-Type": "application/json"
    }

    # If the response contains any flyer filename, send it as a WhatsApp image first
    flyers = {
        "eveningpackages.png": "https://bi.roaradventuretourism.com/eveningpackages.png",
        "eveningpackages_alt.png": "https://bi.roaradventuretourism.com/eveningpackages_alt.png",
        "morningpackages.jpg": "https://bi.roaradventuretourism.com/morningpackages.jpg",
        "quadpackages.png": "https://bi.roaradventuretourism.com/quadpackages.png",
        "buggypackages.png": "https://bi.roaradventuretourism.com/buggypackages.png",
        "selfdrivepackages.png": "https://bi.roaradventuretourism.com/selfdrivepackages.png"
    }

    for filename, link in flyers.items():
        if filename in text:
            img_payload = {
                "messaging_product": "whatsapp",
                "recipient_type": "individual",
                "to": to_phone,
                "type": "image",
                "image": {
                    "link": link
                }
            }
            try:
                img_res = requests.post(url, json=img_payload, headers=headers)
                if img_res.status_code not in [200, 201]:
                    logger.error(f"WhatsApp API Image Error status {img_res.status_code} for {filename}: {img_res.text}")
            except Exception as e:
                logger.error(f"Failed to send WhatsApp image {filename}: {str(e)}")
            
            # Clean the text payload
            text = text.replace(filename, "").strip()

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

    try:
        response = requests.post(url, json=payload, headers=headers)
        if response.status_code not in [200, 201]:
            logger.error(f"WhatsApp API Error status {response.status_code}: {response.text}")
            return False
        return True
    except Exception as e:
        logger.error(f"Failed to send WhatsApp message: {str(e)}")
        return False

def trigger_services_followup(phone: str):
    import threading
    import time
    
    def send_followup():
        time.sleep(5)
        services_msg = (
            "Here is a list of other premium services we offer at Roar Adventure Tourism:\n\n"
            "🏙️ *City Tours* - Explore Dubai, Abu Dhabi, and Hatta.\n"
            "🚗 *Chauffeur Services* - Premium luxury cars with professional drivers.\n"
            "✈️ *Private Transfers* - Seamless airport pickups and point-to-point transfers.\n"
            "🛥️ *Marina Cruise Dinner* - Dhow cruise dinners with live entertainment in Dubai Marina.\n\n"
            "Let me know if you would like details or pricing for any of these! 😊"
        )
        send_whatsapp_message(phone, services_msg)
        
        try:
            from app.db import get_session, save_session
            history = get_session(phone)
            if history and history[-1].get("content") == services_msg:
                return
            history.append({"role": "assistant", "content": services_msg})
            save_session(phone, history)
        except Exception as e:
            logger.error(f"Failed to save services follow-up history: {e}")
            
    threading.Thread(target=send_followup, daemon=True).start()

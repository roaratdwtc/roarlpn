import pytest
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

from unittest.mock import patch, MagicMock
from app.main import handle_direct_confirmation

@patch('requests.post')
@patch('app.main.create_calendar_event')
def test_handle_direct_confirmation(mock_calendar, mock_post):
    mock_calendar.return_value = "evt_123"
    
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.text = '{"status":"success"}'
    mock_post.return_value = mock_resp
    
    sample_msg = (
        "Hi Roar Adventure Tourism, confirming Ref# 1783696426351ASD:\n"
        "1. Name: abid ali\n"
        "2. WhatsApp: +971543466557\n"
        "3. Guests: 6 pax\n"
        "4. Package: VIP Safari Private Car 799AED\n"
        "5. Date: 22/07/2026\n"
        "6. Pickup: jvc\n"
        "7. Total: AED 799 (Pay on Arrival)"
    )
    
    reply = handle_direct_confirmation(sample_msg, "+971543466557")
    
    assert "Thank you for choosing Roar Adventure Tourism LLC" in reply
    assert "Booking Reference# 1783696426351ASD" in reply
    assert "1. Name: abid ali" in reply
    assert "3. No of Guests: 6" in reply
    assert "Payment: 799 AED" in reply
    assert "Date: 22/07/2026" in reply
    assert "Pickup location: jvc" in reply
    assert "+97145578679" in reply

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

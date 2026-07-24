import pytest
from fastapi.testclient import TestClient
from app.main import app
from unittest.mock import patch, MagicMock
import requests

client = TestClient(app)

def make_mock_responses(tool_name, tool_input, final_text):
    mock_resp_1 = MagicMock()
    mock_resp_1.stop_reason = "tool_use"
    mock_block = MagicMock()
    mock_block.type = "tool_use"
    mock_block.name = tool_name
    mock_block.id = "tool_1"
    mock_block.input = tool_input
    mock_resp_1.content = [mock_block]

    mock_resp_2 = MagicMock()
    mock_resp_2.stop_reason = "end_turn"
    mock_text = MagicMock()
    mock_text.type = "text"
    mock_text.text = final_text
    mock_resp_2.content = [mock_text]
    
    return [mock_resp_1, mock_resp_2]

@patch("app.main.requests.get")
@patch("app.main.Anthropic")
def test_admin_chat_success(mock_anthropic_class, mock_get):
    # Mock the database load request
    mock_get.return_value.status_code = 200
    mock_get.return_value.json.return_value = {"status": "success", "data": {"bookings": []}}
    
    # Mock Claude API response
    mock_client = mock_anthropic_class.return_value
    mock_message = mock_client.messages.create.return_value
    mock_message.stop_reason = "end_turn"
    
    mock_block = MagicMock()
    mock_block.type = "text"
    mock_block.text = "Hello Admin"
    mock_message.content = [mock_block]
    
    res = client.post("/api/admin/chat", json={"messages": [], "query": "Hello"})
    assert res.status_code == 200
    assert "reply" in res.json()
    assert res.json()["reply"] == "Hello Admin"

@patch("app.main.requests.post")
@patch("app.main.requests.get")
@patch("app.main.Anthropic")
def test_admin_chat_generate_coupon(mock_anthropic_class, mock_get, mock_post):
    mock_get.return_value.status_code = 200
    mock_get.return_value.json.return_value = {"status": "success", "data": {}}
    
    mock_post.return_value.status_code = 200
    mock_post.return_value.json.return_value = {"status": "success"}
    
    mock_client = mock_anthropic_class.return_value
    tool_input = {
        "code": "SUPEROFF",
        "packageId": "pkg-1",
        "customPrice": 99.0,
        "startDate": "2026-07-10",
        "endDate": "2026-07-20"
    }
    mock_client.messages.create.side_effect = make_mock_responses(
        tool_name="generate_coupon",
        tool_input=tool_input,
        final_text="Successfully generated coupon SUPEROFF."
    )
    
    res = client.post("/api/admin/chat", json={"messages": [], "query": "Create coupon"})
    assert res.status_code == 200
    assert "reply" in res.json()
    assert "Successfully generated coupon SUPEROFF" in res.json()["reply"]
    
    mock_post.assert_called_once()
    called_url = mock_post.call_args[0][0]
    called_json = mock_post.call_args[1]["json"]
    assert "table=coupons" in called_url
    assert called_json["code"] == "SUPEROFF"
    assert called_json["packageId"] == "pkg-1"
    assert called_json["customPrice"] == 99.0

@patch("app.main.requests.post")
@patch("app.main.requests.get")
@patch("app.main.Anthropic")
def test_admin_chat_assign_driver(mock_anthropic_class, mock_get, mock_post):
    mock_get.return_value.status_code = 200
    mock_get.return_value.json.return_value = {
        "status": "success",
        "data": {
            "bookings": [
                {"id": "book-123", "customerName": "John", "driverId": ""}
            ]
        }
    }
    
    mock_post.return_value.status_code = 200
    mock_post.return_value.json.return_value = {"status": "success"}
    
    mock_client = mock_anthropic_class.return_value
    tool_input = {
        "booking_id": "book-123",
        "driver_id": "driver-abc"
    }
    mock_client.messages.create.side_effect = make_mock_responses(
        tool_name="assign_driver",
        tool_input=tool_input,
        final_text="Driver driver-abc assigned successfully."
    )
    
    res = client.post("/api/admin/chat", json={"messages": [], "query": "Assign driver"})
    assert res.status_code == 200
    assert "reply" in res.json()
    assert "driver-abc assigned successfully" in res.json()["reply"]
    
    mock_post.assert_called_once()
    called_url = mock_post.call_args[0][0]
    called_json = mock_post.call_args[1]["json"]
    assert "table=bookings" in called_url
    assert called_json["driverId"] == "driver-abc"

@patch("app.main.requests.post")
@patch("app.main.requests.get")
@patch("app.main.Anthropic")
def test_admin_chat_record_expense(mock_anthropic_class, mock_get, mock_post):
    mock_get.return_value.status_code = 200
    mock_get.return_value.json.return_value = {"status": "success", "data": {}}
    mock_post.return_value.status_code = 200
    mock_post.return_value.json.return_value = {"status": "success"}
    
    mock_client = mock_anthropic_class.return_value
    tool_input = {
        "driverId": "driver-xyz",
        "date": "2026-07-10",
        "salary": 150.0,
        "carPetrol": 50.0,
        "campUse": 0.0,
        "misc": 10.0,
        "notes": "Fuel and lunch"
    }
    mock_client.messages.create.side_effect = make_mock_responses(
        tool_name="record_expense",
        tool_input=tool_input,
        final_text="Expense recorded successfully."
    )
    
    res = client.post("/api/admin/chat", json={"messages": [], "query": "Record expense"})
    assert res.status_code == 200
    assert "reply" in res.json()
    assert "recorded successfully" in res.json()["reply"]
    
    mock_post.assert_called_once()
    called_url = mock_post.call_args[0][0]
    called_json = mock_post.call_args[1]["json"]
    assert "table=expenses" in called_url
    assert called_json["driverId"] == "driver-xyz"
    assert called_json["salary"] == 150.0
    assert called_json["carPetrol"] == 50.0

@patch("app.main.requests.post")
@patch("app.main.requests.get")
@patch("app.main.delete_calendar_event")
@patch("app.main.Anthropic")
def test_admin_chat_update_booking_status_cancelled(mock_anthropic_class, mock_delete_cal, mock_get, mock_post):
    mock_get.return_value.status_code = 200
    mock_get.return_value.json.return_value = {
        "status": "success",
        "data": {
            "bookings": [
                {"id": "book-999", "customerName": "Alice", "status": "confirmed", "calendar_event_id": "cal-evt-123"}
            ]
        }
    }
    mock_post.return_value.status_code = 200
    mock_post.return_value.json.return_value = {"status": "success"}
    
    mock_client = mock_anthropic_class.return_value
    tool_input = {
        "booking_id": "book-999",
        "status": "cancelled"
    }
    mock_client.messages.create.side_effect = make_mock_responses(
        tool_name="update_booking_status",
        tool_input=tool_input,
        final_text="Booking book-999 status updated to cancelled."
    )
    
    res = client.post("/api/admin/chat", json={"messages": [], "query": "Cancel booking book-999"})
    assert res.status_code == 200
    assert "reply" in res.json()
    assert "status updated to cancelled" in res.json()["reply"]
    
    mock_delete_cal.assert_called_once_with("cal-evt-123")
    mock_post.assert_called_once()
    called_json = mock_post.call_args[1]["json"]
    assert called_json["status"] == "cancelled"

@patch("app.main.requests.post")
@patch("app.main.requests.get")
@patch("app.main.Anthropic")
def test_admin_chat_db_save_error_status(mock_anthropic_class, mock_get, mock_post):
    # Tests that when api.php returns status == "error" on DB save, we show the error message.
    mock_get.return_value.status_code = 200
    mock_get.return_value.json.return_value = {"status": "success", "data": {}}
    
    # Save returns 200 but status == "error"
    mock_post.return_value.status_code = 200
    mock_post.return_value.json.return_value = {"status": "error", "message": "Duplicate coupon code!"}
    
    mock_client = mock_anthropic_class.return_value
    tool_input = {
        "code": "SUPEROFF",
        "packageId": "pkg-1",
        "customPrice": 99.0,
        "startDate": "2026-07-10",
        "endDate": "2026-07-20"
    }
    mock_client.messages.create.side_effect = make_mock_responses(
        tool_name="generate_coupon",
        tool_input=tool_input,
        final_text="Failed to generate coupon: Duplicate coupon code!"
    )
    
    res = client.post("/api/admin/chat", json={"messages": [], "query": "Create coupon"})
    assert res.status_code == 200
    assert "reply" in res.json()
    assert "Failed to generate coupon: Duplicate coupon code!" in res.json()["reply"]

@patch("app.main.requests.post")
@patch("app.main.requests.get")
@patch("app.main.Anthropic")
def test_admin_chat_post_connection_timeout_exception(mock_anthropic_class, mock_get, mock_post):
    # Tests that when requests.post throws a connection/timeout exception, we return a friendly message
    mock_get.return_value.status_code = 200
    mock_get.return_value.json.return_value = {"status": "success", "data": {}}
    
    # Post throws connection error
    mock_post.side_effect = requests.RequestException("Connection refused")
    
    mock_client = mock_anthropic_class.return_value
    tool_input = {
        "code": "SUPEROFF",
        "packageId": "pkg-1",
        "customPrice": 99.0,
        "startDate": "2026-07-10",
        "endDate": "2026-07-20"
    }
    mock_client.messages.create.side_effect = make_mock_responses(
        tool_name="generate_coupon",
        tool_input=tool_input,
        final_text="Database backend is unreachable or timed out."
    )
    
    res = client.post("/api/admin/chat", json={"messages": [], "query": "Create coupon"})
    assert res.status_code == 200
    assert "reply" in res.json()
    assert "Database backend is unreachable or timed out." in res.json()["reply"]

@patch("app.main.requests.get")
@patch("app.main.Anthropic")
def test_admin_chat_db_not_loaded(mock_anthropic_class, mock_get):
    # Tests that when the DB fails to load, db_loaded is False, and we return the friendly unreachable message
    # rather than saying the booking was not found
    mock_get.return_value.status_code = 500  # failed load
    
    mock_client = mock_anthropic_class.return_value
    tool_input = {
        "booking_id": "book-123",
        "driver_id": "driver-abc"
    }
    mock_client.messages.create.side_effect = make_mock_responses(
        tool_name="assign_driver",
        tool_input=tool_input,
        final_text="CRM backend is currently unreachable. Unable to perform operations."
    )
    
    res = client.post("/api/admin/chat", json={"messages": [], "query": "Assign driver"})
    assert res.status_code == 200
    assert "reply" in res.json()
    assert "CRM backend is currently unreachable. Unable to perform operations." in res.json()["reply"]

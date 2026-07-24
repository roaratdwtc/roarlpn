import pytest
from unittest.mock import patch, MagicMock
import json
import re
from app.agent import get_system_prompt, run_agent_turn

# Dummy packages data to match expectations
MOCK_PACKAGES = [
    {
        "id": "evening_vip",
        "name": "VIP Safari Shared 129AED",
        "category": "Evening Desert Safari",
        "rate": 129.0,
        "peakRate": 149.0,
        "offpeakRate": 129.0,
        "type": "per_person",
        "addons": [
            {"name": "AC Seating Upgrade", "price": 25.0}
        ]
    }
]

@patch('requests.get')
def test_get_system_prompt_includes_catalog(mock_get):
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {
        "status": "success",
        "data": {
            "packages": MOCK_PACKAGES
        }
    }
    mock_get.return_value = mock_resp

    prompt = get_system_prompt()
    assert "Roar Adventure Tourism" in prompt
    assert "Standard Rate" in prompt
    assert "VIP Safari Shared" in prompt
    assert "AC Seating Upgrade" in prompt


@patch('app.agent.Anthropic')
@patch('requests.post')
@patch('requests.get')
@patch('app.agent.create_calendar_event')
def test_run_agent_turn_create_booking(mock_calendar, mock_get, mock_post, mock_anthropic):
    # Setup mocks
    mock_calendar.return_value = "evt_999"
    
    # mock packages and bookings load
    mock_get_resp = MagicMock()
    mock_get_resp.status_code = 200
    mock_get_resp.json.return_value = {
        "status": "success",
        "data": {
            "packages": MOCK_PACKAGES,
            "bookings": []
        }
    }
    mock_get.return_value = mock_get_resp
    
    # mock save response
    mock_post_resp = MagicMock()
    mock_post_resp.status_code = 200
    mock_post_resp.json.return_value = {"status": "success"}
    mock_post.return_value = mock_post_resp
    
    # mock Anthropic client
    mock_client = MagicMock()
    mock_anthropic.return_value = mock_client
    
    # First call: tool use
    mock_resp_1 = MagicMock()
    mock_resp_1.stop_reason = "tool_use"
    mock_tool_call = MagicMock()
    mock_tool_call.type = "tool_use"
    mock_tool_call.name = "create_booking"
    mock_tool_call.id = "tool_1"
    mock_tool_call.input = {
        "customer_name": "Jane Doe",
        "num_guests": 3,
        "pickup_location": "Rove Downtown Hotel Room #305",
        "tour_date": "2026-10-15",
        "selected_package": "VIP Safari Shared"
    }
    mock_resp_1.content = [mock_tool_call]
    
    # Second call: final text
    mock_resp_2 = MagicMock()
    mock_resp_2.stop_reason = "end_turn"
    mock_text = MagicMock()
    mock_text.type = "text"
    mock_text.text = "Confirmed!"
    mock_resp_2.content = [mock_text]
    
    mock_client.messages.create.side_effect = [mock_resp_1, mock_resp_2]
    
    # Run turn
    reply = run_agent_turn("971500000000", "I want to book VIP safari shared for Jane Doe, 3 guests, 2026-10-15, pickup at Rove Downtown Hotel Room 305.")
    
    # Assertions
    assert reply == "Confirmed!"
    mock_calendar.assert_called_once_with(
        name="Jane Doe",
        guests=3,
        pickup="Rove Downtown Hotel Room #305",
        date_str="2026-10-15",
        package="VIP Safari Shared"
    )
    mock_post.assert_called_once()
    saved_payload = mock_post.call_args[1]['json']
    assert saved_payload["customerName"] == "Jane Doe"
    assert saved_payload["whatsapp"] == "971500000000"
    assert saved_payload["roomNo"] == "305"
    assert saved_payload["pax"] == 3
    # VIP Safari Shared is 149 in October (Peak Season). 3 guests * 149 = 447.
    assert saved_payload["price"] == 447.0


@patch('app.agent.Anthropic')
@patch('requests.get')
def test_run_agent_turn_find_bookings(mock_get, mock_anthropic):
    # mock load response with an existing booking
    mock_get_resp = MagicMock()
    mock_get_resp.status_code = 200
    mock_get_resp.json.return_value = {
        "status": "success",
        "data": {
            "bookings": [
                {
                    "id": "book-12345",
                    "customerName": "Jane Doe",
                    "whatsapp": "971500000000",
                    "packageName": "VIP Safari Shared",
                    "date": "2026-10-15",
                    "pax": 3,
                    "status": "confirmed"
                }
            ],
            "packages": MOCK_PACKAGES
        }
    }
    mock_get.return_value = mock_get_resp
    
    # mock Anthropic client
    mock_client = MagicMock()
    mock_anthropic.return_value = mock_client
    
    # First call: tool use (find_bookings)
    mock_resp_1 = MagicMock()
    mock_resp_1.stop_reason = "tool_use"
    mock_tool_call = MagicMock()
    mock_tool_call.type = "tool_use"
    mock_tool_call.name = "find_bookings"
    mock_tool_call.id = "tool_2"
    mock_tool_call.input = {
        "phone_number": "971500000000"
    }
    mock_resp_1.content = [mock_tool_call]
    
    # Second call: final text
    mock_resp_2 = MagicMock()
    mock_resp_2.stop_reason = "end_turn"
    mock_text = MagicMock()
    mock_text.type = "text"
    mock_text.text = "I found your booking book-12345."
    mock_resp_2.content = [mock_text]
    
    mock_client.messages.create.side_effect = [mock_resp_1, mock_resp_2]
    
    # Run turn
    reply = run_agent_turn("971500000000", "Find my booking")
    
    assert reply == "I found your booking book-12345."
    mock_get.assert_called()


@patch('app.agent.Anthropic')
@patch('requests.post')
@patch('requests.get')
def test_run_agent_turn_reschedule_booking(mock_get, mock_post, mock_anthropic):
    # Mock load
    mock_get_resp = MagicMock()
    mock_get_resp.status_code = 200
    mock_get_resp.json.return_value = {
        "status": "success",
        "data": {
            "bookings": [
                {
                    "id": "book-12345",
                    "customerName": "Jane Doe",
                    "whatsapp": "971500000000",
                    "packageName": "VIP Safari Shared",
                    "date": "2026-10-15",
                    "pax": 3,
                    "status": "confirmed"
                }
            ],
            "packages": MOCK_PACKAGES
        }
    }
    mock_get.return_value = mock_get_resp
    
    # Mock save
    mock_post_resp = MagicMock()
    mock_post_resp.status_code = 200
    mock_post_resp.json.return_value = {"status": "success"}
    mock_post.return_value = mock_post_resp
    
    # Mock Anthropic client
    mock_client = MagicMock()
    mock_anthropic.return_value = mock_client
    
    # First call: tool use (reschedule_booking)
    mock_resp_1 = MagicMock()
    mock_resp_1.stop_reason = "tool_use"
    mock_tool_call = MagicMock()
    mock_tool_call.type = "tool_use"
    mock_tool_call.name = "reschedule_booking"
    mock_tool_call.id = "tool_3"
    mock_tool_call.input = {
        "booking_id": "book-12345",
        "new_date": "2026-10-20"
    }
    mock_resp_1.content = [mock_tool_call]
    
    # Second call: final text
    mock_resp_2 = MagicMock()
    mock_resp_2.stop_reason = "end_turn"
    mock_text = MagicMock()
    mock_text.type = "text"
    mock_text.text = "Rescheduled!"
    mock_resp_2.content = [mock_text]
    
    mock_client.messages.create.side_effect = [mock_resp_1, mock_resp_2]
    
    reply = run_agent_turn("971500000000", "Reschedule to 2026-10-20")
    
    assert reply == "Rescheduled!"
    mock_post.assert_called_once()
    saved_payload = mock_post.call_args[1]['json']
    assert saved_payload["date"] == "2026-10-20"


@patch('app.agent.Anthropic')
@patch('requests.post')
@patch('requests.get')
def test_run_agent_turn_cancel_booking(mock_get, mock_post, mock_anthropic):
    # Mock load
    mock_get_resp = MagicMock()
    mock_get_resp.status_code = 200
    mock_get_resp.json.return_value = {
        "status": "success",
        "data": {
            "bookings": [
                {
                    "id": "book-12345",
                    "customerName": "Jane Doe",
                    "whatsapp": "971500000000",
                    "packageName": "VIP Safari Shared",
                    "date": "2026-10-15",
                    "pax": 3,
                    "status": "confirmed"
                }
            ],
            "packages": MOCK_PACKAGES
        }
    }
    mock_get.return_value = mock_get_resp
    
    # Mock save
    mock_post_resp = MagicMock()
    mock_post_resp.status_code = 200
    mock_post_resp.json.return_value = {"status": "success"}
    mock_post.return_value = mock_post_resp
    
    # Mock Anthropic client
    mock_client = MagicMock()
    mock_anthropic.return_value = mock_client
    
    # First call: tool use (cancel_booking)
    mock_resp_1 = MagicMock()
    mock_resp_1.stop_reason = "tool_use"
    mock_tool_call = MagicMock()
    mock_tool_call.type = "tool_use"
    mock_tool_call.name = "cancel_booking"
    mock_tool_call.id = "tool_4"
    mock_tool_call.input = {
        "booking_id": "book-12345"
    }
    mock_resp_1.content = [mock_tool_call]
    
    # Second call: final text
    mock_resp_2 = MagicMock()
    mock_resp_2.stop_reason = "end_turn"
    mock_text = MagicMock()
    mock_text.type = "text"
    mock_text.text = "Cancelled!"
    mock_resp_2.content = [mock_text]
    
    mock_client.messages.create.side_effect = [mock_resp_1, mock_resp_2]
    
    reply = run_agent_turn("971500000000", "Cancel my booking")
    
    assert reply == "Cancelled!"
    mock_post.assert_called_once()
    saved_payload = mock_post.call_args[1]['json']
    assert saved_payload["status"] == "cancelled"


@patch('app.agent.Anthropic')
@patch('requests.post')
@patch('requests.get')
@patch('app.agent.create_calendar_event')
def test_create_booking_with_addons_and_total_price(mock_calendar, mock_get, mock_post, mock_anthropic):
    mock_calendar.return_value = "evt_123"
    
    mock_get_resp = MagicMock()
    mock_get_resp.status_code = 200
    mock_get_resp.json.return_value = {
        "status": "success",
        "data": {
            "packages": MOCK_PACKAGES,
            "bookings": []
        }
    }
    mock_get.return_value = mock_get_resp
    
    mock_post_resp = MagicMock()
    mock_post_resp.status_code = 200
    mock_post_resp.json.return_value = {"status": "success"}
    mock_post.return_value = mock_post_resp
    
    mock_client = MagicMock()
    mock_anthropic.return_value = mock_client
    
    mock_resp_1 = MagicMock()
    mock_resp_1.stop_reason = "tool_use"
    mock_tool_call = MagicMock()
    mock_tool_call.type = "tool_use"
    mock_tool_call.name = "create_booking"
    mock_tool_call.id = "tool_1"
    mock_tool_call.input = {
        "customer_name": "Jane Doe",
        "num_guests": 3,
        "pickup_location": "Rove Downtown Hotel Room #305",
        "tour_date": "2026-10-15",
        "selected_package": "VIP Safari Shared",
        "addon_names": ["AC Seating Upgrade"],
        "addon_price": 25.0,
        "total_price": 500.0
    }
    mock_resp_1.content = [mock_tool_call]
    
    mock_resp_2 = MagicMock()
    mock_resp_2.stop_reason = "end_turn"
    mock_text = MagicMock()
    mock_text.type = "text"
    mock_text.text = "Confirmed!"
    mock_resp_2.content = [mock_text]
    
    mock_client.messages.create.side_effect = [mock_resp_1, mock_resp_2]
    
    reply = run_agent_turn("971500000000", "I want to book VIP safari shared with AC seating upgrade.")
    
    assert reply == "Confirmed!"
    mock_post.assert_called_once()
    saved_payload = mock_post.call_args[1]['json']
    assert saved_payload["addonName"] == "AC Seating Upgrade"
    assert saved_payload["addonPrice"] == 25.0
    assert saved_payload["price"] == 500.0
    assert saved_payload["calendar_event_id"] == "evt_123"
    assert saved_payload["pricingType"] == "peak"
    assert saved_payload["roomNo"] == "305"


@patch('app.agent.Anthropic')
@patch('requests.post')
@patch('requests.get')
@patch('app.agent.create_calendar_event')
def test_create_booking_calendar_failure_still_persists(mock_calendar, mock_get, mock_post, mock_anthropic):
    # calendar event creation raises an exception
    mock_calendar.side_effect = Exception("Calendar API Down")
    
    mock_get_resp = MagicMock()
    mock_get_resp.status_code = 200
    mock_get_resp.json.return_value = {
        "status": "success",
        "data": {
            "packages": MOCK_PACKAGES,
            "bookings": []
        }
    }
    mock_get.return_value = mock_get_resp
    
    mock_post_resp = MagicMock()
    mock_post_resp.status_code = 200
    mock_post_resp.json.return_value = {"status": "success"}
    mock_post.return_value = mock_post_resp
    
    mock_client = MagicMock()
    mock_anthropic.return_value = mock_client
    
    mock_resp_1 = MagicMock()
    mock_resp_1.stop_reason = "tool_use"
    mock_tool_call = MagicMock()
    mock_tool_call.type = "tool_use"
    mock_tool_call.name = "create_booking"
    mock_tool_call.id = "tool_1"
    mock_tool_call.input = {
        "customer_name": "Jane Doe",
        "num_guests": 3,
        "pickup_location": "Rove Downtown Hotel",
        "tour_date": "2026-10-15",
        "selected_package": "VIP Safari Shared"
    }
    mock_resp_1.content = [mock_tool_call]
    
    mock_resp_2 = MagicMock()
    mock_resp_2.stop_reason = "end_turn"
    mock_text = MagicMock()
    mock_text.type = "text"
    mock_text.text = "Confirmed!"
    mock_resp_2.content = [mock_text]
    
    mock_client.messages.create.side_effect = [mock_resp_1, mock_resp_2]
    
    reply = run_agent_turn("971500000000", "I want to book VIP safari shared.")
    
    assert reply == "Confirmed!"
    mock_post.assert_called_once()
    saved_payload = mock_post.call_args[1]['json']
    assert saved_payload["calendar_event_id"] == ""
    assert saved_payload["roomNo"] == ""


@patch('app.agent.Anthropic')
@patch('requests.post')
@patch('requests.get')
@patch('app.agent.update_calendar_event')
def test_reschedule_updates_calendar_event(mock_update_calendar, mock_get, mock_post, mock_anthropic):
    # Mock load returns booking with calendar_event_id
    mock_get_resp = MagicMock()
    mock_get_resp.status_code = 200
    mock_get_resp.json.return_value = {
        "status": "success",
        "data": {
            "bookings": [
                {
                    "id": "book-12345",
                    "customerName": "Jane Doe",
                    "whatsapp": "971500000000",
                    "packageName": "VIP Safari Shared",
                    "date": "2026-10-15",
                    "pax": 3,
                    "status": "confirmed",
                    "calendar_event_id": "evt_123"
                }
            ],
            "packages": MOCK_PACKAGES
        }
    }
    mock_get.return_value = mock_get_resp
    
    # Mock save
    mock_post_resp = MagicMock()
    mock_post_resp.status_code = 200
    mock_post_resp.json.return_value = {"status": "success"}
    mock_post.return_value = mock_post_resp
    
    # Mock Anthropic client
    mock_client = MagicMock()
    mock_anthropic.return_value = mock_client
    
    # reschedule tool
    mock_resp_1 = MagicMock()
    mock_resp_1.stop_reason = "tool_use"
    mock_tool_call = MagicMock()
    mock_tool_call.type = "tool_use"
    mock_tool_call.name = "reschedule_booking"
    mock_tool_call.id = "tool_3"
    mock_tool_call.input = {
        "booking_id": "book-12345",
        "new_date": "2026-10-20"
    }
    mock_resp_1.content = [mock_tool_call]
    
    mock_resp_2 = MagicMock()
    mock_resp_2.stop_reason = "end_turn"
    mock_text = MagicMock()
    mock_text.type = "text"
    mock_text.text = "Rescheduled!"
    mock_resp_2.content = [mock_text]
    
    mock_client.messages.create.side_effect = [mock_resp_1, mock_resp_2]
    
    reply = run_agent_turn("971500000000", "Reschedule to 2026-10-20")
    
    assert reply == "Rescheduled!"
    mock_update_calendar.assert_called_once_with(
        event_id="evt_123",
        name="Jane Doe",
        guests=3,
        pickup="",
        date_str="2026-10-20",
        package="VIP Safari Shared"
    )
    mock_post.assert_called_once()


@patch('app.agent.Anthropic')
@patch('requests.post')
@patch('requests.get')
@patch('app.agent.delete_calendar_event')
def test_cancel_deletes_calendar_event(mock_delete_calendar, mock_get, mock_post, mock_anthropic):
    # Mock load returns booking with calendar_event_id
    mock_get_resp = MagicMock()
    mock_get_resp.status_code = 200
    mock_get_resp.json.return_value = {
        "status": "success",
        "data": {
            "bookings": [
                {
                    "id": "book-12345",
                    "customerName": "Jane Doe",
                    "whatsapp": "971500000000",
                    "packageName": "VIP Safari Shared",
                    "date": "2026-10-15",
                    "pax": 3,
                    "status": "confirmed",
                    "calendar_event_id": "evt_123"
                }
            ],
            "packages": MOCK_PACKAGES
        }
    }
    mock_get.return_value = mock_get_resp
    
    # Mock save
    mock_post_resp = MagicMock()
    mock_post_resp.status_code = 200
    mock_post_resp.json.return_value = {"status": "success"}
    mock_post.return_value = mock_post_resp
    
    # Mock Anthropic client
    mock_client = MagicMock()
    mock_anthropic.return_value = mock_client
    
    # cancel tool
    mock_resp_1 = MagicMock()
    mock_resp_1.stop_reason = "tool_use"
    mock_tool_call = MagicMock()
    mock_tool_call.type = "tool_use"
    mock_tool_call.name = "cancel_booking"
    mock_tool_call.id = "tool_4"
    mock_tool_call.input = {
        "booking_id": "book-12345"
    }
    mock_resp_1.content = [mock_tool_call]
    
    mock_resp_2 = MagicMock()
    mock_resp_2.stop_reason = "end_turn"
    mock_text = MagicMock()
    mock_text.type = "text"
    mock_text.text = "Cancelled!"
    mock_resp_2.content = [mock_text]
    
    mock_client.messages.create.side_effect = [mock_resp_1, mock_resp_2]
    
    reply = run_agent_turn("971500000000", "Cancel my booking")
    
    assert reply == "Cancelled!"
    mock_delete_calendar.assert_called_once_with("evt_123")
    mock_post.assert_called_once()

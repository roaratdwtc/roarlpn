import pytest
from unittest.mock import MagicMock, patch
from app.calendar_service import create_calendar_event

@patch('app.calendar_service.get_calendar_service')
def test_create_event_formatting(mock_get_service):
    mock_service = MagicMock()
    mock_get_service.return_value = mock_service
    
    mock_events = MagicMock()
    mock_service.events.return_value = mock_events
    mock_insert = MagicMock()
    mock_events.insert.return_value = mock_insert
    mock_insert.execute.return_value = {'id': 'mocked_id_123'}

    event_id = create_calendar_event(
        name="Alice Smith",
        guests=3,
        pickup="Grand Hyatt Hotel Room 405",
        date_str="2026-11-20",
        package="Evening Safari"
    )

    assert event_id == 'mocked_id_123'
    mock_events.insert.assert_called_once()
    args, kwargs = mock_events.insert.call_args
    assert kwargs['body']['summary'] == "Booking: Evening Safari - Alice Smith (3 Guests)"

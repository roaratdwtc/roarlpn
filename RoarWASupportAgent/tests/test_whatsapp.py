import pytest
from unittest.mock import patch, MagicMock
from app.whatsapp import send_whatsapp_message
from app.config import settings

@patch('app.whatsapp.requests.post')
def test_send_whatsapp_message_success(mock_post):
    settings.WHATSAPP_TOKEN = "test_token"
    settings.WHATSAPP_PHONE_ID = "test_id"
    
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_post.return_value = mock_response

    result = send_whatsapp_message("971500000000", "Hello Customer! 🌴")
    assert result is True
    mock_post.assert_called_once()

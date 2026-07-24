import pytest
from app.config import Settings

def test_settings_validation_fails_when_empty():
    s = Settings()
    s.ANTHROPIC_API_KEY = ""
    s.GEMINI_API_KEY = ""
    with pytest.raises(ValueError):
        s.validate()

import pytest
import os
from app.config import settings

# Override settings to use a test database
settings.DATABASE_URL = "data/test_database.db"

from app.db import init_db, save_session, get_session, save_booking, get_db_connection

def setup_module(module):
    init_db()

def teardown_module(module):
    if os.path.exists("data/test_database.db"):
        try:
            os.remove("data/test_database.db")
        except PermissionError:
            pass

def test_session_handling():
    save_session("971500000000", [{"role": "user", "content": "Hi"}])
    hist = get_session("971500000000")
    assert len(hist) == 1
    assert hist[0]["content"] == "Hi"

def test_booking_save():
    bid = save_booking("971500000000", "John Doe", 4, "Hotel Atlantis Rm 101", "2026-10-15", "Evening Safari", "evt_123")
    assert bid > 0

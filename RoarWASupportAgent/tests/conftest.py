import pytest
import os
import sys

# Ensure RoarWASupportAgent is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.config import settings
from app.db import init_db

# Set DATABASE_URL to use a test database file inside the data directory
settings.DATABASE_URL = os.path.abspath(os.path.join(os.path.dirname(__file__), "../data/test_database_run.db"))

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    # Make sure parent directory exists
    os.makedirs(os.path.dirname(settings.DATABASE_URL), exist_ok=True)
    init_db()
    yield
    # Clean up after tests run
    if os.path.exists(settings.DATABASE_URL):
        try:
            os.remove(settings.DATABASE_URL)
        except PermissionError:
            pass

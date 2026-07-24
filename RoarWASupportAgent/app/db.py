import sqlite3
import json
import os
from datetime import datetime
from app.config import settings

def get_db_connection():
    # Make sure parent directory exists if it's a relative/absolute file path
    db_dir = os.path.dirname(settings.DATABASE_URL)
    if db_dir:
        os.makedirs(db_dir, exist_ok=True)
    conn = sqlite3.connect(settings.DATABASE_URL)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    with get_db_connection() as conn:
        conn.execute("""
        CREATE TABLE IF NOT EXISTS google_credentials (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            access_token TEXT NOT NULL,
            refresh_token TEXT NOT NULL,
            token_uri TEXT NOT NULL,
            client_id TEXT NOT NULL,
            client_secret TEXT NOT NULL,
            scopes TEXT NOT NULL,
            expiry TEXT NOT NULL
        )""")
        conn.execute("""
        CREATE TABLE IF NOT EXISTS chat_sessions (
            phone_number TEXT PRIMARY KEY,
            conversation_history TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )""")
        conn.execute("""
        CREATE TABLE IF NOT EXISTS bookings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_phone TEXT NOT NULL,
            customer_name TEXT NOT NULL,
            num_guests INTEGER NOT NULL,
            pickup_location TEXT NOT NULL,
            tour_date TEXT NOT NULL,
            package_name TEXT NOT NULL,
            calendar_event_id TEXT,
            created_at TEXT NOT NULL
        )""")
        conn.commit()

def save_credentials(creds_dict):
    with get_db_connection() as conn:
        conn.execute("DELETE FROM google_credentials")  # Keep only one active credential
        conn.execute("""
            INSERT INTO google_credentials (access_token, refresh_token, token_uri, client_id, client_secret, scopes, expiry)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            creds_dict['access_token'],
            creds_dict['refresh_token'],
            creds_dict['token_uri'],
            creds_dict['client_id'],
            creds_dict['client_secret'],
            creds_dict['scopes'],
            creds_dict['expiry']
        ))
        conn.commit()

def get_credentials():
    with get_db_connection() as conn:
        row = conn.execute("SELECT * FROM google_credentials ORDER BY id DESC LIMIT 1").fetchone()
        if row:
            return dict(row)
        return None

def get_session(phone_number):
    with get_db_connection() as conn:
        row = conn.execute("SELECT conversation_history FROM chat_sessions WHERE phone_number = ?", (phone_number,)).fetchone()
        if row:
            return json.loads(row['conversation_history'])
        return []

def save_session(phone_number, history):
    with get_db_connection() as conn:
        history_json = json.dumps(history)
        now = datetime.now().isoformat()
        conn.execute("""
            INSERT INTO chat_sessions (phone_number, conversation_history, updated_at)
            VALUES (?, ?, ?)
            ON CONFLICT(phone_number) DO UPDATE SET
                conversation_history=excluded.conversation_history,
                updated_at=excluded.updated_at
        """, (phone_number, history_json, now))
        conn.commit()

def save_booking(phone_number, name, guests, pickup, date, package, event_id):
    with get_db_connection() as conn:
        now = datetime.now().isoformat()
        cursor = conn.execute("""
            INSERT INTO bookings (customer_phone, customer_name, num_guests, pickup_location, tour_date, package_name, calendar_event_id, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (phone_number, name, guests, pickup, date, package, event_id, now))
        conn.commit()
        return cursor.lastrowid

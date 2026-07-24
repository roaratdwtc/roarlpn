from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from google.auth.transport.requests import Request
from google_auth_oauthlib.flow import Flow
from app.db import get_credentials, save_credentials
from app.config import settings
from datetime import datetime, timedelta

SCOPES = ['https://www.googleapis.com/auth/calendar.events']

def get_flow():
    return Flow.from_client_config(
        {
            "web": {
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": [settings.GOOGLE_REDIRECT_URI]
            }
        },
        scopes=SCOPES
    )

def get_calendar_service():
    cred_row = get_credentials()
    if not cred_row:
        raise ValueError("Google Calendar is not authorized. Access /auth/google to login.")

    creds = Credentials(
        token=cred_row['access_token'],
        refresh_token=cred_row['refresh_token'],
        token_uri=cred_row['token_uri'],
        client_id=cred_row['client_id'],
        client_secret=cred_row['client_secret'],
        scopes=cred_row['scopes'].split(',')
    )

    if creds.expired and creds.refresh_token:
        creds.refresh(Request())
        save_credentials({
            'access_token': creds.token,
            'refresh_token': creds.refresh_token,
            'token_uri': creds.token_uri,
            'client_id': creds.client_id,
            'client_secret': creds.client_secret,
            'scopes': ','.join(creds.scopes),
            'expiry': creds.expiry.isoformat() if creds.expiry else datetime.now().isoformat()
        })

    return build('calendar', 'v3', credentials=creds)

def create_calendar_event(name, guests, pickup, date_str, package):
    try:
        service = get_calendar_service()
        
        # Event timings (Desert tours typically start around 3 PM, city tours around 9 AM)
        start_hour = 15 if "Evening" in package or "Desert" in package else 9
        
        try:
            start_time = datetime.strptime(f"{date_str} {start_hour}:00", "%Y-%m-%d %H:%M")
        except ValueError:
            # Fallback if date is not standard
            start_time = datetime.now() + timedelta(days=1)
            start_time = start_time.replace(hour=start_hour, minute=0, second=0, microsecond=0)

        end_time = start_time + timedelta(hours=6)

        event = {
            'summary': f"Booking: {package} - {name} ({guests} Guests)",
            'location': pickup,
            'description': f"WhatsApp Booking details:\nCustomer Name: {name}\nGuests: {guests}\nPackage: {package}\nDate: {date_str}\nPickup Details: {pickup}",
            'start': {
                'dateTime': start_time.isoformat(),
                'timeZone': 'Asia/Dubai',
            },
            'end': {
                'dateTime': end_time.isoformat(),
                'timeZone': 'Asia/Dubai',
            },
        }

        event_result = service.events().insert(calendarId='primary', body=event).execute()
        return event_result.get('id', '')
    except Exception as e:
        print(f"Warning: Failed to create calendar event: {e}")
        return ""

def update_calendar_event(event_id, name, guests, pickup, date_str, package):
    if not event_id:
        return False
    try:
        service = get_calendar_service()
        
        start_hour = 15 if "Evening" in package or "Desert" in package else 9
        try:
            start_time = datetime.strptime(f"{date_str} {start_hour}:00", "%Y-%m-%d %H:%M")
        except ValueError:
            start_time = datetime.now() + timedelta(days=1)
            start_time = start_time.replace(hour=start_hour, minute=0, second=0, microsecond=0)

        end_time = start_time + timedelta(hours=6)

        event = {
            'summary': f"Booking: {package} - {name} ({guests} Guests)",
            'location': pickup,
            'description': f"WhatsApp Booking details:\nCustomer Name: {name}\nGuests: {guests}\nPackage: {package}\nDate: {date_str}\nPickup Details: {pickup}",
            'start': {
                'dateTime': start_time.isoformat(),
                'timeZone': 'Asia/Dubai',
            },
            'end': {
                'dateTime': end_time.isoformat(),
                'timeZone': 'Asia/Dubai',
            },
        }

        service.events().update(calendarId='primary', eventId=event_id, body=event).execute()
        return True
    except Exception as e:
        print(f"Warning: Failed to update calendar event {event_id}: {e}")
        return False

def delete_calendar_event(event_id):
    if not event_id:
        return False
    try:
        service = get_calendar_service()
        service.events().delete(calendarId='primary', eventId=event_id).execute()
        return True
    except Exception as e:
        print(f"Warning: Failed to delete calendar event {event_id}: {e}")
        return False

import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")
    WHATSAPP_TOKEN: str = os.getenv("WHATSAPP_TOKEN", "")
    WHATSAPP_PHONE_ID: str = os.getenv("WHATSAPP_PHONE_ID", "")
    WHATSAPP_VERIFY_TOKEN: str = os.getenv("WHATSAPP_VERIFY_TOKEN", "")
    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "")
    GOOGLE_CLIENT_SECRET: str = os.getenv("GOOGLE_CLIENT_SECRET", "")
    GOOGLE_REDIRECT_URI: str = os.getenv("GOOGLE_REDIRECT_URI", "")
    PORT: int = int(os.getenv("PORT", "8000"))
    DATABASE_URL: str = os.getenv("DATABASE_URL", "data/database.db")
    CRM_BASE_URL: str = os.getenv("CRM_BASE_URL", "http://localhost/api.php")
    MODEL_NAME: str = os.getenv("MODEL_NAME", "gemini-flash-latest")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    
    def validate(self):
        missing = []
        if not self.ANTHROPIC_API_KEY and not self.GEMINI_API_KEY:
            missing.append("ANTHROPIC_API_KEY or GEMINI_API_KEY")
        if not self.GOOGLE_CLIENT_ID:
            missing.append("GOOGLE_CLIENT_ID")
        if not self.GOOGLE_CLIENT_SECRET:
            missing.append("GOOGLE_CLIENT_SECRET")
        if missing:
            raise ValueError(f"Missing environment variables: {', '.join(missing)}")

settings = Settings()

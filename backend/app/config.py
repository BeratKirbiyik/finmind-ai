import os
from functools import lru_cache

class Settings:
    def __init__(self):
        self.database_url = os.environ.get("DATABASE_URL", "")
        self.gemini_api_key = os.environ.get("GEMINI_API_KEY", "")
        self.secret_key = os.environ.get("SECRET_KEY", "changeme-set-in-production")
        self.environment = os.environ.get("ENVIRONMENT", "production")
        self.supabase_url = os.environ.get("SUPABASE_URL", "")
        self.supabase_anon_key = os.environ.get("SUPABASE_ANON_KEY", "")
        self.supabase_service_key = os.environ.get("SUPABASE_SERVICE_KEY", "")
        self.redis_url = os.environ.get("REDIS_URL", "redis://localhost:6379")

@lru_cache()
def get_settings():
    return Settings()

settings = get_settings()

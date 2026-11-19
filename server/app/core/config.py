import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
MODELS_DIR = BASE_DIR / "models"
MODEL2_DIR = MODELS_DIR / "Model2_Booking_Conversion" / "artifacts" / "model2"
MODEL3_DIR = MODELS_DIR / "Model3_cancellation prediction"
MODEL3_PATH = MODEL3_DIR / "flight_xgboost_model.joblib"
MODEL5_DIR = MODELS_DIR / "Model5_Inventory_Risk" / "artifacts" / "model5"

# Load environment variables from .env
load_dotenv(BASE_DIR / ".env")
load_dotenv(BASE_DIR / "server" / ".env")

# Real-Time Hotel API Settings
HOTEL_API_KEY = os.getenv("HOTEL_API_KEY", "").strip()
HOTEL_API_PROVIDER = os.getenv("HOTEL_API_PROVIDER", "rapidapi").strip().lower()
HOTEL_API_HOST = os.getenv("HOTEL_API_HOST", "booking-com15.p.rapidapi.com").strip()
HOTEL_API_ENDPOINT = os.getenv("HOTEL_API_ENDPOINT", "").strip()

def is_hotel_api_configured() -> bool:
    """Check if the user has supplied a non-empty, valid real-time API key."""
    return bool(
        HOTEL_API_KEY
        and HOTEL_API_KEY != "your_hotel_api_key_here"
        and not HOTEL_API_KEY.startswith("<")
    )

# Register module packages on sys.path for unpickling
model5_src = MODELS_DIR / "Model5_Inventory_Risk" / "src"
model2_src = MODELS_DIR / "Model2_Booking_Conversion" / "src"
if model5_src.exists() and str(model5_src) not in sys.path:
    sys.path.insert(0, str(model5_src))
if model2_src.exists() and str(model2_src) not in sys.path:
    sys.path.insert(0, str(model2_src))

# Environment / Server settings
API_V1_STR = "/api/v1"
PROJECT_NAME = "TBO SmartStock AI - Intelligent Inventory Procurement Engine"
CORS_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
    "*",
]

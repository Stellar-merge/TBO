import os
from typing import List, Dict, Any, Optional
from server.app.services.live_hotel_service import fetch_live_hotels_from_api
from server.app.core.config import is_hotel_api_configured

# Curated seed catalog for offline / prototype operation before live API keys are provided.
# When live API keys (e.g. AMADEUS_API_KEY, MAPBOX_TOKEN) are set in environment,
# the catalog service automatically fetches live real-time API responses instead.

SEED_DESTINATIONS = [
    {
        "id": "bali",
        "name": "Bali, Indonesia",
        "country": "Indonesia",
        "center": {"lat": -8.409518, "lng": 115.188916},
        "hotels": [
            {
                "id": "bali-01",
                "name": "Ayana Resort & Rock Bar",
                "category": "Luxury Resorts",
                "rating": 4.9,
                "reviewsCount": 1420,
                "image": "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80",
                "baseRooms": 42,
                "wholesaleCost": 180.0,
                "retailPrice": 240.0,
                "lat": -8.6705,
                "lng": 115.1388,
            },
            {
                "id": "bali-02",
                "name": "Mandapa, A Ritz-Carlton Reserve",
                "category": "Boutique Stays",
                "rating": 4.95,
                "reviewsCount": 890,
                "image": "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80",
                "baseRooms": 28,
                "wholesaleCost": 220.0,
                "retailPrice": 310.0,
                "lat": -8.5069,
                "lng": 115.2625,
            },
            {
                "id": "bali-03",
                "name": "Seminyak Beachfront Villas",
                "category": "Beachfront Suites",
                "rating": 4.8,
                "reviewsCount": 640,
                "image": "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80",
                "baseRooms": 35,
                "wholesaleCost": 150.0,
                "retailPrice": 205.0,
                "lat": -8.6913,
                "lng": 115.1537,
            },
            {
                "id": "bali-04",
                "name": "Ubud Hanging Gardens Eco Estate",
                "category": "Heritage Villas",
                "rating": 4.75,
                "reviewsCount": 510,
                "image": "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
                "baseRooms": 20,
                "wholesaleCost": 130.0,
                "retailPrice": 185.0,
                "lat": -8.4521,
                "lng": 115.2412,
            },
            {
                "id": "bali-05",
                "name": "Canggu Nomad Business Suite",
                "category": "City Business",
                "rating": 4.65,
                "reviewsCount": 380,
                "image": "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80",
                "baseRooms": 30,
                "wholesaleCost": 95.0,
                "retailPrice": 140.0,
                "lat": -8.6500,
                "lng": 115.1300,
            },
            {
                "id": "bali-06",
                "name": "Ngurah Rai Airport Grand Hub",
                "category": "Airport Hubs",
                "rating": 4.6,
                "reviewsCount": 420,
                "image": "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=800&q=80",
                "baseRooms": 50,
                "wholesaleCost": 85.0,
                "retailPrice": 120.0,
                "lat": -8.7482,
                "lng": 115.1672,
            }
        ],
        "flights": [
            {
                "id": "fl-bali-01",
                "name": "Garuda Indonesia DPS-CGK Seat Allotment",
                "category": "Direct Carrier",
                "rating": 4.8,
                "reviewsCount": 1150,
                "image": "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=800&q=80",
                "baseRooms": 60,
                "wholesaleCost": 75.0,
                "retailPrice": 120.0,
                "lat": -8.7482,
                "lng": 115.1672,
            },
            {
                "id": "fl-bali-02",
                "name": "Singapore Airlines Denpasar Express Block",
                "category": "First & Business",
                "rating": 4.95,
                "reviewsCount": 2100,
                "image": "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=800&q=80",
                "baseRooms": 40,
                "wholesaleCost": 210.0,
                "retailPrice": 320.0,
                "lat": -8.7400,
                "lng": 115.1700,
            },
            {
                "id": "fl-bali-03",
                "name": "AirAsia Southeast Asia Shuttle Fleet",
                "category": "Economy Blocks",
                "rating": 4.55,
                "reviewsCount": 940,
                "image": "https://images.unsplash.com/photo-1508873696983-2df5293cb32f?auto=format&fit=crop&w=800&q=80",
                "baseRooms": 80,
                "wholesaleCost": 55.0,
                "retailPrice": 90.0,
                "lat": -8.7520,
                "lng": 115.1620,
            }
        ]
    },
    {
        "id": "new-york",
        "name": "New York City, US",
        "country": "United States",
        "center": {"lat": 40.7128, "lng": -74.0060},
        "hotels": [
            {
                "id": "nyc-01",
                "name": "The Manhattan Central Luxury",
                "category": "Luxury Resorts",
                "rating": 4.85,
                "reviewsCount": 2100,
                "image": "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80",
                "baseRooms": 60,
                "wholesaleCost": 280.0,
                "retailPrice": 390.0,
                "lat": 40.7580,
                "lng": -73.9855,
            },
            {
                "id": "nyc-02",
                "name": "Wall Street Financial Tower",
                "category": "City Business",
                "rating": 4.7,
                "reviewsCount": 1150,
                "image": "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
                "baseRooms": 55,
                "wholesaleCost": 210.0,
                "retailPrice": 295.0,
                "lat": 40.7070,
                "lng": -74.0090,
            },
            {
                "id": "nyc-03",
                "name": "SoHo Art & Boutique Lofts",
                "category": "Boutique Stays",
                "rating": 4.9,
                "reviewsCount": 780,
                "image": "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80",
                "baseRooms": 32,
                "wholesaleCost": 240.0,
                "retailPrice": 340.0,
                "lat": 40.7233,
                "lng": -74.0030,
            }
        ],
        "flights": [
            {
                "id": "fl-nyc-01",
                "name": "Delta Air Lines JFK Transatlantic Block",
                "category": "First & Business",
                "rating": 4.8,
                "reviewsCount": 1820,
                "image": "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=800&q=80",
                "baseRooms": 50,
                "wholesaleCost": 340.0,
                "retailPrice": 480.0,
                "lat": 40.6413,
                "lng": -73.7781,
            }
        ]
    },
    {
        "id": "london",
        "name": "London, UK",
        "country": "United Kingdom",
        "center": {"lat": 51.5074, "lng": -0.1278},
        "hotels": [
            {
                "id": "lon-01",
                "name": "The Kensington Heritage Palace",
                "category": "Heritage Villas",
                "rating": 4.9,
                "reviewsCount": 1600,
                "image": "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80",
                "baseRooms": 40,
                "wholesaleCost": 220.0,
                "retailPrice": 315.0,
                "lat": 51.5014,
                "lng": -0.1918,
            },
            {
                "id": "lon-02",
                "name": "Canary Wharf Executive Suites",
                "category": "City Business",
                "rating": 4.75,
                "reviewsCount": 940,
                "image": "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80",
                "baseRooms": 48,
                "wholesaleCost": 185.0,
                "retailPrice": 260.0,
                "lat": 51.5054,
                "lng": -0.0208,
            }
        ],
        "flights": [
            {
                "id": "fl-lon-01",
                "name": "British Airways Heathrow Prime Fleet",
                "category": "Direct Carrier",
                "rating": 4.85,
                "reviewsCount": 1940,
                "image": "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=800&q=80",
                "baseRooms": 55,
                "wholesaleCost": 260.0,
                "retailPrice": 375.0,
                "lat": 51.4700,
                "lng": -0.4543,
            }
        ]
    },
    {
        "id": "dubai",
        "name": "Dubai, UAE",
        "country": "United Arab Emirates",
        "center": {"lat": 25.2048, "lng": 55.2708},
        "hotels": [
            {
                "id": "dxb-01",
                "name": "Palm Jumeirah Ultra Luxury",
                "category": "Luxury Resorts",
                "rating": 4.95,
                "reviewsCount": 2800,
                "image": "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80",
                "baseRooms": 65,
                "wholesaleCost": 310.0,
                "retailPrice": 450.0,
                "lat": 25.1124,
                "lng": 55.1390,
            },
            {
                "id": "dxb-02",
                "name": "Downtown Marina Sky Suites",
                "category": "Beachfront Suites",
                "rating": 4.85,
                "reviewsCount": 1400,
                "image": "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80",
                "baseRooms": 45,
                "wholesaleCost": 240.0,
                "retailPrice": 340.0,
                "lat": 25.0805,
                "lng": 55.1403,
            }
        ],
        "flights": [
            {
                "id": "fl-dxb-01",
                "name": "Emirates DXB Flagship Allotment Block",
                "category": "First & Business",
                "rating": 4.98,
                "reviewsCount": 3400,
                "image": "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=800&q=80",
                "baseRooms": 70,
                "wholesaleCost": 380.0,
                "retailPrice": 560.0,
                "lat": 25.2532,
                "lng": 55.3657,
            }
        ]
    }
]

def get_destinations_catalog():
    return [{"id": d["id"], "name": d["name"], "country": d["country"], "center": d["center"]} for d in SEED_DESTINATIONS]

def get_candidates_for_query(
    location: str, 
    category: str = "All Hotels", 
    target_type: str = "hotels",
    checkin_date: Optional[str] = None,
    checkout_date: Optional[str] = None
) -> List[Dict[str, Any]]:
    # 1. Real-Time Hotel API Integration (Active when HOTEL_API_KEY is supplied in .env)
    if target_type == "hotels" and is_hotel_api_configured():
        live_hotels = fetch_live_hotels_from_api(
            location=location,
            checkin_date=checkin_date,
            checkout_date=checkout_date,
            category=category
        )
        if live_hotels:
            filtered = [
                h for h in live_hotels
                if category in ["All Hotels", "All Flights", "All"] or h["category"] == category
            ]
            return filtered if filtered else live_hotels

    # 2. Curated Base Catalog (Used when HOTEL_API_KEY is awaiting user key in .env)
    loc_lower = location.lower()
    matched_dest = None
    for dest in SEED_DESTINATIONS:
        if any(term in loc_lower for term in [dest["id"], dest["name"].lower(), dest["country"].lower()]):
            matched_dest = dest
            break
    if not matched_dest:
        matched_dest = SEED_DESTINATIONS[0] # Default to Bali if unspecified

    items = []
    source_key = "flights" if target_type == "flights" else "hotels"
    raw_list = matched_dest.get(source_key, matched_dest["hotels"])

    for item in raw_list:
        if category not in ["All Hotels", "All Flights", "All"]:
            if item["category"] != category:
                continue
        items.append({**item, "destination_name": matched_dest["name"], "target_type": target_type})
    return items

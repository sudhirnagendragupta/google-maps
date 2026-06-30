from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from dotenv import load_dotenv
import os
import json
import googlemaps
from google import genai
from google.genai import types

# Load environment variables
load_dotenv()

app = FastAPI(title="Journey Planner API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Google Maps Client
maps_key = os.getenv("GOOGLE_MAPS_API_KEY")
gmaps = googlemaps.Client(
    key=maps_key,
    requests_kwargs={"headers": {"Referer": "http://localhost:3000"}}
) if maps_key else None

# Initialize Gemini Client
gemini_key = os.getenv("GEMINI_API_KEY")
gemini_client = genai.Client(api_key=gemini_key) if gemini_key else None

# Pydantic Schemas
class Coords(BaseModel):
    lat: float
    lng: float

class TripDetails(BaseModel):
    destination: str
    accommodationName: str
    accommodationAddress: str
    startDate: str
    endDate: str
    coordinates: Optional[Coords] = None

class Leg(BaseModel):
    id: str
    title: str
    time: str
    duration: str
    location: str
    coords: Coords
    description: str
    transport: Optional[str] = None

class Day(BaseModel):
    id: str
    label: str
    legs: List[Leg]

class Marker(BaseModel):
    id: str
    title: str
    position: Coords
    type: str # "accommodation" | "stop"

class PlanRequest(BaseModel):
    trip_details: TripDetails
    query: str
    current_itinerary: Optional[List[Day]] = None

class PlanResponse(BaseModel):
    itinerary: List[Day]
    markers: List[Marker]
    reply: str

# Google Maps helper tools (direct API execution, raising exceptions on failure)
def geocode_address(address: str) -> Dict[str, Any]:
    """Geocode a text address, landmark, or hotel name into latitude and longitude coordinates.
    
    Args:
        address: The street address, hotel name, or landmark to geocode.
    """
    if not gmaps:
        raise ValueError("Google Maps API key not configured in backend .env")
    res = gmaps.geocode(address)
    if res:
        loc = res[0]["geometry"]["location"]
        return {"lat": loc["lat"], "lng": loc["lng"]}
    raise ValueError(f"Address could not be geocoded: {address}")

def search_places(query: str, location: Optional[str] = None, radius: int = 1500) -> List[Dict[str, Any]]:
    """Search for places (e.g. restaurants, sights, parks, cafes) near a location using Google Places API.
    
    Args:
        query: Search term (e.g., 'Tadich Grill', 'sushi near Union Square').
        location: Optional center coordinate as 'lat,lng'. Highly recommended to pass the accommodation coordinates here to find items near the hotel.
        radius: Optional search radius in meters (default is 1500).
    """
    if not gmaps:
        raise ValueError("Google Maps API key not configured in backend .env")
    loc_bias = None
    if location:
        try:
            lat, lng = map(float, location.split(","))
            loc_bias = f"circle:{radius}@{lat},{lng}"
        except ValueError:
            pass
    res = gmaps.places(query=query, location=loc_bias)
    results = []
    for p in res.get("results", [])[:5]:
        results.append({
            "name": p.get("name"),
            "formatted_address": p.get("formatted_address"),
            "place_id": p.get("place_id"),
            "coords": p.get("geometry", {}).get("location"),
            "rating": p.get("rating"),
            "user_ratings_total": p.get("user_ratings_total")
        })
    return results

def compute_route(origin: str, destination: str, mode: str = "walking") -> Dict[str, Any]:
    """Compute a route between two locations using Google Maps Directions API to find walking/driving distance and duration.
    
    Args:
        origin: Origin address, place name, or 'lat,lng' coordinates.
        destination: Destination address, place name, or 'lat,lng' coordinates.
        mode: Mode of transit (driving, walking, bicycling, or transit). Default is walking.
    """
    if not gmaps:
        raise ValueError("Google Maps API key not configured in backend .env")
    if mode not in ["driving", "walking", "bicycling", "transit"]:
        mode = "walking"
    res = gmaps.directions(origin=origin, destination=destination, mode=mode)
    if res and len(res) > 0:
        leg = res[0]["legs"][0]
        return {
            "distance": leg["distance"]["text"],
            "duration": leg["duration"]["text"],
            "start_address": leg["start_address"],
            "end_address": leg["end_address"],
            "start_coords": leg["start_location"],
            "end_coords": leg["end_location"]
        }
    raise ValueError(f"No routes found between {origin} and {destination}")

def submit_itinerary(itinerary: List[Day], markers: List[Marker], reply: str) -> Dict[str, Any]:
    """Submit the finalized daily itinerary and map markers.
    
    Args:
        itinerary: A list of days representing the daily itinerary.
        markers: A list of map markers including the accommodation and stops.
        reply: A detailed conversational summary.
    """
    # This is a schema holder for the tool. The actual validation is handled in the agent loop.
    return {"status": "success"}

@app.get("/")
def read_root():
    return {
        "message": "Journey Planner Backend is running",
        "maps_configured": gmaps is not None,
        "gemini_configured": gemini_client is not None
    }

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.post("/api/plan", response_model=PlanResponse)
def generate_or_update_plan(request: PlanRequest):
    if not gemini_client:
        raise HTTPException(status_code=500, detail="Gemini client not initialized. Check your backend .env")
    
    trip = request.trip_details
    
    # 1. Geocode accommodation address if coordinates not supplied
    if not trip.coordinates:
        try:
            coords = geocode_address(trip.accommodationAddress)
            trip.coordinates = Coords(lat=coords["lat"], lng=coords["lng"])
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to geocode accommodation address: {str(e)}")
        
    system_prompt = f"""You are Antigravity, a premium agentic travel planner.
Your job is to generate or edit a day-by-day travel plan based on the user's manual inputs and instructions.

TRIP CONTEXT:
- Destination: {trip.destination}
- Accommodation Hotel/Airbnb: {trip.accommodationName} at {trip.accommodationAddress}
- Coordinates of Hotel: {trip.coordinates.lat}, {trip.coordinates.lng}
- Trip Dates: {trip.startDate} to {trip.endDate}

INSTRUCTIONS FOR THE PLANNER:
1. Always start and end each day's active legs at the Accommodation Hotel ({trip.accommodationName}) unless arriving/departing from an airport/station.
2. Ground all places and transport options using Google Maps tools:
   - Search for places using `search_places`. Provide specific venues, rating info, and exact addresses.
   - Geocode any manual places or hotels you cannot find using `geocode_address`.
   - Calculate exact walking or driving distances and durations using `compute_route` from the hotel to the first stop, between consecutive stops, and back to the hotel.
3. Keep travel time in mind: do not plan overlapping activities. Ensure walking distances are reasonable (e.g. walk if under 1 mile, recommend transit or driving/taxi if further).
4. For every stop/leg (except the first leg of the day), compute the transit duration from the previous stop and populate the `transport` field (e.g. "12 min walk (0.6 mi) via Market St" or "15 min drive/taxi").
5. The `markers` list should contain the accommodation itself (type: "accommodation") plus all unique stops (type: "stop").
6. When the user asks to modify an existing itinerary, review the current itinerary, execute tools to find options near the hotel or current stop, calculate the routes, and call `submit_itinerary` with the updated JSON.
7. Be conversational and explain why you structured the itinerary the way you did in your final `reply`.
8. API RESILIENCE: If any tool call (like `search_places` or `compute_route`) returns an error (e.g. REQUEST_DENIED), do not loop or retry the same call. Instead, proceed with the planning using reasonable geographic estimates, complete the itinerary, and mention a warning in your final reply that some Google Maps services are currently propagating/unauthorized.
9. MANDATORY SUBMISSION FORMAT: You MUST call `submit_itinerary` as the final step to submit your travel plan. You must call it with the following structured parameters (do not wrap them in a JSON string, pass them directly):
   - `itinerary`: A list of days (each with `id`, `label`, and a list of `legs`). Each leg must have `id`, `title`, `time`, `duration`, `location`, `coords` (with `lat` and `lng`), `description`, and `transport`.
   - `markers`: A list of markers including the hotel (type: "accommodation") and stops (type: "stop").
   - `reply`: A detailed conversational summary.
   DO NOT submit empty lists/objects. You are NOT allowed to reply only in plain text; a call to `submit_itinerary` is strictly required.
10. CONCISENESS GUIDELINE: Keep leg descriptions brief (under 15 words) and addresses short to ensure the final payload does not get truncated.

CURRENT ITINERARY:
{json.dumps(request.current_itinerary, default=lambda o: o.__dict__) if request.current_itinerary else "None (Generate a brand new itinerary starting with the accommodation as home base)"}
"""

    messages = [
        types.Content(
            role="user",
            parts=[types.Part.from_text(text=request.query)]
        )
    ]
    
    # Tool execution loop
    max_steps = 15
    step = 0
    final_output = None
    
    while step < max_steps:
        step += 1
        try:
            response = gemini_client.models.generate_content(
                model="gemini-3.5-flash",
                contents=messages,
                config=types.GenerateContentConfig(
                    system_instruction=system_prompt,
                    tools=[geocode_address, search_places, compute_route, submit_itinerary],
                    temperature=0.0,
                    tool_config=types.ToolConfig(
                        function_calling_config=types.FunctionCallingConfig(
                            mode="ANY",
                        )
                    ),
                )
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Gemini API Error: {str(e)}")
        
        # Check if Gemini wants to call tools
        function_calls = response.function_calls
        
        # Print assistant text
        assistant_text = response.text
        if assistant_text:
            print(f"Assistant: {assistant_text}")
            
        # If no tool calls, Gemini just replied in text. This shouldn't happen for final submission, but handle it.
        if not function_calls:
            raise HTTPException(
                status_code=500, 
                detail=f"Gemini completed without calling submit_itinerary. Response: {assistant_text}"
            )
            
        # Add Gemini's response to the message history
        # response.candidates[0].content contains the model's parts
        messages.append(response.candidates[0].content)
        
        # Execute tool calls
        tool_responses = []
        for fc in function_calls:
            tool_name = fc.name
            tool_input = fc.args
            
            print(f"Executing tool {tool_name} with input {tool_input}")
            
            result = None
            try:
                if tool_name == "geocode_address":
                    result = geocode_address(tool_input.get("address"))
                elif tool_name == "search_places":
                    result = search_places(
                        query=tool_input.get("query"),
                        location=tool_input.get("location"),
                        radius=tool_input.get("radius", 1500)
                    )
                elif tool_name == "compute_route":
                    result = compute_route(
                        origin=tool_input.get("origin"),
                        destination=tool_input.get("destination"),
                        mode=tool_input.get("mode", "walking")
                    )
                elif tool_name == "submit_itinerary":
                    # Inputs are passed directly as structured arguments for Gemini
                    parsed = tool_input
                    iti = parsed.get("itinerary", [])
                    markers_list = parsed.get("markers", [])
                    reply_text = parsed.get("reply", "")
                    
                    if not iti or not markers_list or not reply_text:
                        result = {
                            "error": "submit_itinerary called with missing or empty parameters. You must supply: "
                                     "1) 'itinerary' (list of days with legs), "
                                     "2) 'markers' (list of markers for accommodation and stops), "
                                     "3) 'reply' (conversational summary). "
                                     "Ensure these are validly nested inside your JSON string."
                        }
                    else:
                        # Validate markers structure
                        invalid_markers = []
                        for idx_m, m in enumerate(markers_list):
                            if not isinstance(m, dict):
                                invalid_markers.append(f"Marker at index {idx_m} is not an object.")
                                continue
                            if "id" not in m or "title" not in m or "position" not in m or "type" not in m:
                                name_val = m.get("name") or m.get("title") or f"index {idx_m}"
                                invalid_markers.append(f"Marker '{name_val}' is missing required fields (id, title, position, type). Found keys: {list(m.keys())}")
                                continue
                            pos = m.get("position")
                            if not isinstance(pos, dict) or "lat" not in pos or "lng" not in pos:
                                invalid_markers.append(f"Marker '{m.get('title')}' is missing lat/lng coordinates under 'position'.")
                                continue
                            if m.get("type") not in ["accommodation", "stop"]:
                                invalid_markers.append(f"Marker '{m.get('title')}' has invalid type '{m.get('type')}'. Must be 'accommodation' or 'stop'.")
                                
                        if invalid_markers:
                            result = {
                                "error": f"Validation failed for 'markers': {'; '.join(invalid_markers)}. "
                                         f"Please map each marker to the exact structure: {{'id': str, 'title': str, 'position': {{'lat': float, 'lng': float}}, 'type': 'accommodation'|'stop'}}. "
                                         f"Do not dump the raw Google Places result directly into markers."
                            }
                        else:
                            # Validate itinerary structure
                            invalid_legs = []
                            for day in iti:
                                day_id = day.get("id", "unknown")
                                legs_list = day.get("legs", [])
                                if not legs_list:
                                    invalid_legs.append(f"Day '{day_id}' has no legs.")
                                for leg in legs_list:
                                    if "id" not in leg or "title" not in leg or "time" not in leg or "location" not in leg or "coords" not in leg or "description" not in leg:
                                        invalid_legs.append(f"Leg '{leg.get('title') or 'unknown'}' in day '{day_id}' is missing required fields (id, title, time, location, coords, description).")
                                        continue
                                    coords = leg.get("coords")
                                    if not isinstance(coords, dict) or "lat" not in coords or "lng" not in coords:
                                        invalid_legs.append(f"Leg '{leg.get('title')}' in day '{day_id}' is missing lat/lng under 'coords'.")
                            
                            if invalid_legs:
                                result = {
                                    "error": f"Validation failed for 'itinerary': {'; '.join(invalid_legs)}. "
                                             f"Please ensure every leg has 'id', 'title', 'time', 'duration', 'location', 'coords': {{'lat': float, 'lng': float}}, and 'description'."
                                }
                            else:
                                final_output = parsed
                                result = {"status": "success"}
                                break
            except Exception as e:
                result = {"error": f"Failed to parse or validate: {str(e)}"}
                
            tool_responses.append(
                types.Part.from_function_response(
                    name=tool_name,
                    response={"result": result}
                )
            )
            
        # Add tool responses to messages
        messages.append(types.Content(role="tool", parts=tool_responses))
        
        if final_output is not None:
            # submit_itinerary called and validated successfully
            break
            
    if final_output is None:
        raise HTTPException(status_code=500, detail="Max agent steps exceeded without submitting itinerary.")
        
    return PlanResponse(
        itinerary=final_output.get("itinerary", []),
        markers=final_output.get("markers", []),
        reply=final_output.get("reply", "")
    )

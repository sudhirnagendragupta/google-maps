import main
from main import PlanRequest, TripDetails, Coords

# Construct the exact request payload sent by the frontend onboarding form
req = PlanRequest(
    trip_details=TripDetails(
        destination="San Francisco, CA",
        accommodationName="Club Quarters Hotel",
        accommodationAddress="400 Sansome St, San Francisco, CA 94111",
        startDate="2026-07-04",
        endDate="2026-07-11"
    ),
    query="Create a wonderful itinerary for my trip to San Francisco, CA from 2026-07-04 to 2026-07-11. I am staying at Club Quarters Hotel located at 400 Sansome St, San Francisco, CA 94111. Plan 3 balanced active legs per day, incorporating top local landmarks, restaurants, and cafes near the hotel. Compute route walking distances/times where appropriate."
)

try:
    print("Invoking Gemini agent and Google Maps tools...")
    res = main.generate_or_update_plan(req)
    print("\n--- AGENT CALL SUCCESS ---")
    print(f"Reply:\n{res.reply}\n")
    print(f"Itinerary Days: {len(res.itinerary)}")
    for day in res.itinerary:
        print(f"  Day {day.id} ({day.label}): {len(day.legs)} legs")
        for leg in day.legs:
            print(f"    - {leg.time}: {leg.title} ({leg.location})")
    print(f"Markers: {len(res.markers)}")
except Exception as e:
    print("\n--- AGENT CALL FAILED ---")
    print(str(e))

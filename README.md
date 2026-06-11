# Journey Planner

*An agentic travel planner exploring Google's Maps Grounding Lite MCP with Claude as the orchestrator.*

This repository is a proof-of-concept project built to experiment with hands-on learnings from the Google Maps Community Day (June 2026).

## The Problem
Travel planning is often a disjointed experience. We book flights and hotels through email, research places to eat on Google Maps, and manage our itinerary in a separate notes app or spreadsheet. Existing planners usually require filling out tedious surveys ("What kind of food do you like?") or offer generic, pre-packaged tours that don't reflect the actual realities of our booked trip.

## The Solution
Journey Planner takes a real trip you've already booked—extracting the facts directly from your Gmail—and produces a personalized, day-by-day plan grounded in live Google Maps data. 

Instead of picking options from dropdown menus, the plan is editable through natural language. You simply tell the AI agent what to change ("Swap Tadich Grill for Yank Sing, but make sure it's still walking distance from my hotel"), and the orchestrator handles the constraints.

## Business Value & Goals
- **Frictionless Onboarding:** By reading your email receipts (using a two-pass verification system to ignore cancelled bookings), the app eliminates the need for manual data entry.
- **Contextual Awareness:** The agent reasons over spatial constraints (distance, travel time, weather) rather than just generating text, reducing hallucinations.
- **Actionable UI:** The frontend provides a "Plan View" for iterative design and a "Today View" for in-trip execution, keeping the user focused on the immediate next step.

## Technologies Leveraged

This project acts as an integration playground for several cutting-edge AI and mapping technologies:

1. **Anthropic Claude (Messages API):** Serves as the core reasoning orchestrator. Claude decides which tools to call, extracts structured data, and handles the scoped iteration of the itinerary.
2. **Model Context Protocol (MCP):** 
   - **Maps Grounding Lite (Google-hosted):** A managed MCP service connecting the LLM to trusted geospatial data (`search_places`, `lookup_weather`, `compute_routes`).
   - **Gmail MCP:** Allows Claude to securely search and read booking confirmations directly from the user's inbox.
   - **Custom Transit MCP:** A custom-built, self-hosted FastAPI wrapper around the Google Routes API to fill the public-transit gap in the standard Grounding Lite tools.
3. **Google Maps Platform:**
   - **Maps JavaScript SDK (React):** For rendering the interactive map.
   - **Agentic UI Toolkit:** A specialized module for binding the UI components directly to the state changes of the backend orchestrator, allowing the frontend to dynamically react to the AI's planning decisions.
4. **Next.js & FastAPI:** A robust, modern stack for the mobile-first frontend and the orchestration backend.

## Status
Active build — proof of concept. The goal is to produce a portfolio artifact that demonstrates product thinking and end-to-end technical execution of the MCP-orchestrated agent pattern in a real domain.

# Journey Planner — Project Knowledge Document

*An agentic travel planner exploring Google's Maps Grounding Lite MCP with Gemini as the orchestrator*

**Status:** Active build — proof of concept · **Started:** May 2026 · **Target demo:** Personal use on SF trip (May 23–30, 2026)

## 1. What this is

A travel planner that lets you manually input your destination, travel dates, and hotel/accommodation base. It then generates a personalized, day-by-day itinerary grounded in live Google Maps data. The plan is editable through natural language: instead of clicking forms or selecting options from dropdowns, you simply type what you want to change.

It is a proof of concept, not a product. The goal is to learn how the MCP-orchestrated agent pattern feels in a real domain, with real APIs and real personal data, and to produce a portfolio artifact that demonstrates product thinking and end-to-end technical execution.

## 2. Why this, why now

Three things happening at once made this the right thing to build right now:
1. Google released Maps Grounding Lite as an MCP-native service in early 2026.
2. MCP has matured to the point where building a multi-source agent is a one-week project.
3. A real trip to plan (San Francisco trip in May) provides honest design pressure.

## 3. Architecture

The system has three parts, each with a clearly bounded role:

### 3.1 Gemini (orchestrator)
Google's Gemini 3.5 Flash API, called from a small FastAPI backend. Gemini does the reasoning work: decides tool calls, reasons over constraints, writes briefing prose, and handles scoped iteration.

### 3.2 Google Maps APIs (grounding environment)
Backend wrapper calling Google Maps Platform APIs:
- `geocode_address`: Geocodes hotel or location names to retrieve coordinates.
- `search_places`: Finds cafes, restaurants, and sights centered around the accommodation.
- `compute_route`: Computes distances and walking durations.

### 3.3 Frontend
A mobile-first web app (Next.js) consuming Gemini's structured plan output and rendering it with the Google Maps JS SDK. 
UI modes:
- **Plan view:** Day-by-day editing surface (timeline + map + briefing card). Includes a manual onboarding setup screen and an edit hotel dialog.
- **Today view:** In-trip execution stepper. One leg at a time, manual advance.

## 4. Key design decisions
- **React to a draft, don't fill out a survey:** Provide simple, high-level accommodation and date details, let the agent generate a draft, and critique/modify it using natural language.
- **Explicit mode toggle, no smart switching:** Single toggle between Plan view and Today view.
- **No automation in Today view:** Advances on tap, not geolocation/time.
- **Maximize button everywhere a map appears:** Consistent behavior.
- **Scoped re-planning, with visible scope:** Agent surfaces exactly what was changed ("I swapped Tadich for Yank Sing...").
- **Manual accommodation entry to establish home base:** Ground route details around the manual hotel base.

## 5. What I expect to learn
- Does manual entry provide a better onboarding experience for a demo/portfolio than OAuth?
- Does Gemini-mediated iteration beat searching Google Maps directly?
- Does shared state beat the separate-apps approach?

## 6. What I'm cutting from V1
- User accounts/auth
- Saving/exporting trips
- Booking integration
- Notifications/push messaging
- Voice interaction
- Offline mode

## 7. Build plan
- **Days 1–2:** Wire Google Maps APIs and Gemini API from backend. Terminal testing.
- **Days 3–4:** Build frontend with Maps SDK (Plan and Today views).
- **Days 5–6:** Polish to demo quality, test on phone.
- **May 23–30:** Use on actual trip.
- **Week after:** Fix issues, write portfolio piece.

## 8. Tech stack
- **LLM:** Gemini (Google GenAI API)
- **Map APIs:** Google Maps Directions, Geocoding, and Places APIs
- **Backend:** Python with FastAPI
- **Frontend:** Next.js (mobile-first)
- **Maps rendering:** Google Maps JavaScript SDK
- **Hosting:** Vercel for frontend, Railway/Fly for backend

## 9. Open questions
- Custom places details vs API summaries?
- Today view leg width in time?
- System prompt structuring for mapping tools?
- State persistence (localStorage vs backend)?

## 10. Portfolio framing
Artifacts produced: The working app, public project page on guptasudhir.com, and a build diary blog post.

## 11. Community Day Insights (June 2026)
- **Agentic UI Toolkit**: Google introduced an Agentic UI Toolkit (https://developers.google.com/maps/ai/agentic-ui-toolkit). The app UI should leverage this for binding views to state changes and creating responsive interfaces that adapt to the backend orchestrator's state.
- **Observability & Context Hygiene**: Best practices for Day Planner Agents emphasize task decomposition, strongly-typed fields, and keeping tool counts low (<20) to avoid tool bloat. This validates our design decision to expose only core geocoding, places search, and direction-routing tools.
- **Maps as an Environment**: The paradigm shift is from Maps as a flat tool to an interactive environment for spatial reasoning, with Maps APIs acting as the crucial link between the LLM and real-world context.

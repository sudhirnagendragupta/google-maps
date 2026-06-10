# Journey Planner — Project Knowledge Document

*An agentic travel planner exploring Google's Maps Grounding Lite MCP with Claude as the orchestrator*

**Status:** Active build — proof of concept · **Started:** May 2026 · **Target demo:** Personal use on SF trip (May 23–30, 2026)

## 1. What this is

A travel planner that takes a real trip you've already booked — extracted from Gmail — and produces a day-by-day plan grounded in live Google Maps data. The plan is editable through natural language: you don't pick from menus, you tell the agent what to change.

It is a proof of concept, not a product. The goal is to learn how the MCP-orchestrated agent pattern feels in a real domain, with real APIs and real personal data, and to produce a portfolio artifact that demonstrates product thinking and end-to-end technical execution.

## 2. Why this, why now

Three things happening at once made this the right thing to build right now:
1. Google released Maps Grounding Lite as an MCP-native service in early 2026.
2. MCP has matured to the point where building a multi-source agent is a one-week project.
3. A real trip to plan (San Francisco trip in May) provides honest design pressure.

## 3. Architecture

The system has four parts, each with a clearly bounded role:

### 3.1 Claude (orchestrator)
Anthropic's Messages API, called from a small backend. Claude does the reasoning work: decides tool calls, extracts structured facts, reasons over constraints, writes briefing prose, and handles scoped iteration.

### 3.2 Maps Grounding Lite MCP (Google-hosted)
Google's MCP service for grounding LLMs in Google Maps data. Used for:
- `search_places`
- `lookup_weather`
- `compute_routes` (drive or walk only)

### 3.3 Gmail MCP (Google-hosted)
Connector that lets Claude search and read user's email. Used to extract bookings. Employs a two-pass verification pattern to check for cancellations/modifications.

### 3.4 Custom MCP (one tool, self-hosted)
A thin FastAPI wrapper around Google's Routes API, exposing one tool: `transit_route` (fills the public-transit gap in Grounding Lite).

### 3.5 Frontend
A mobile-first web app (Next.js) consuming Claude's structured plan output and rendering it with the Google Maps JS SDK. 
UI modes:
- **Plan view:** Day-by-day editing surface (timeline + map + briefing card).
- **Today view:** In-trip stepper. One leg at a time, manual advance.

## 4. Key design decisions
- **React to a draft, don't fill out a survey:** Extract data from Gmail, generate a draft, and let the user critique it.
- **Explicit mode toggle, no smart switching:** Single toggle between Plan view and Today view.
- **No automation in Today view:** Advances on tap, not geolocation/time.
- **Maximize button everywhere a map appears:** Consistent behavior.
- **Scoped re-planning, with visible scope:** Agent surfaces exactly what was changed ("I swapped Tadich for Yank Sing...").
- **Gmail integration for trip facts, not preferences.**

## 5. What I expect to learn
- Is Gmail integration actually valuable?
- Does Claude-mediated iteration beat searching Google Maps directly?
- Does shared state beat the separate-apps approach?

## 6. What I'm cutting from V1
- User accounts/auth beyond basic OAuth for personal Gmail
- Saving/exporting trips
- Booking integration
- Notifications/push messaging
- Voice interaction
- Offline mode

## 7. Build plan
- **Days 1–2:** Wire MCPs to Claude API from backend. Terminal testing.
- **Days 3–4:** Build frontend with Maps SDK (Plan and Today views).
- **Days 5–6:** Polish to demo quality, test on phone.
- **May 23–30:** Use on actual trip.
- **Week after:** Fix issues, write portfolio piece.

## 8. Tech stack
- **LLM:** Claude (Anthropic Messages API)
- **MCPs:** Maps Grounding Lite, Gmail, custom transit_route
- **Backend:** Python with FastAPI
- **Frontend:** Next.js (mobile-first)
- **Maps rendering:** Google Maps JavaScript SDK
- **Hosting:** Vercel for frontend, Railway/Fly for backend

## 9. Open questions
- Custom MCP Place Details vs Grounding Lite summaries?
- Today view leg width in time?
- System prompt structuring for overlapping tools?
- State persistence (localStorage vs backend)?

## 10. Portfolio framing
Artifacts produced: The working app, public project page on guptasudhir.com, and a build diary blog post.

## 11. Community Day Insights (June 2026)
- **Agentic UI Toolkit**: Google introduced an Agentic UI Toolkit (https://developers.google.com/maps/ai/agentic-ui-toolkit). The app UI should leverage this for binding views to state changes and creating responsive interfaces that adapt to the backend orchestrator's state.
- **Observability & Context Hygiene**: Best practices for Day Planner Agents emphasize task decomposition, strongly-typed fields, and keeping tool counts low (<20) to avoid tool bloat. This validates our design decision to keep the custom MCP to exactly one tool (`transit_route`).
- **Maps as an Environment**: The paradigm shift is from Maps as a flat tool to an interactive environment for spatial reasoning, with Grounding Lite acting as the crucial link between the LLM and real-world context.

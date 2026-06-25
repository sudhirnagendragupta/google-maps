# Journey Planner

<p align="center">
  <a href="https://nextjs.org"><img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js" /></a>
  <a href="https://fastapi.tiangolo.com"><img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" /></a>
  <a href="https://anthropic.com"><img src="https://img.shields.io/badge/Claude%20Orchestrator-D97706?style=for-the-badge&logo=anthropic&logoColor=white" alt="Claude Orchestrator" /></a>
  <a href="https://developers.google.com/maps"><img src="https://img.shields.io/badge/Google%20Maps%20Platform-4285F4?style=for-the-badge&logo=googlemaps&logoColor=white" alt="Google Maps Platform" /></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white" alt="Python" />
  <img src="https://img.shields.io/badge/Status-Active_POC-orange?style=flat-square" alt="Status: Active POC" />
  <a href="file:///Users/sudhi/Desktop/Projects/google-maps/CONTRIBUTING.md"><img src="https://img.shields.io/badge/PRs-Welcome-brightgreen.svg?style=flat-square" alt="PRs Welcome" /></a>
</p>

---

*An agentic travel planner exploring Google's Maps Grounding Lite MCP with Claude as the orchestrator.*

This repository is a proof-of-concept project built to experiment with hands-on learnings from the Google Maps Community Day (June 2026).

---

## Table of Contents
1. [The Problem](#the-problem)
2. [The Solution](#the-solution)
3. [Business Value & Goals](#business-value--goals)
4. [Technologies Leveraged](#technologies-leveraged)
5. [Prerequisites](#prerequisites)
6. [Getting Started](#getting-started)
   - [Step 1: Obtain API Keys](#step-1-obtain-api-keys)
   - [Step 2: Configure Environment Variables](#step-2-configure-environment-variables)
   - [Step 3: Setup & Run the Backend](#step-3-setup--run-the-backend)
   - [Step 4: Setup & Run the Frontend](#step-4-setup--run-the-frontend)
7. [Project Diary](#project-diary)

---

## The Problem
Travel planning is often a disjointed experience. We book flights and hotels through email, research places to eat on Google Maps, and manage our itinerary in a separate notes app or spreadsheet. Existing planners usually require filling out tedious surveys ("What kind of food do you like?") or offer generic, pre-packaged tours that don't reflect the actual realities of our booked trip.

## The Solution
Journey Planner allows you to manually input a real or planned trip destination, dates, and accommodation details. It then generates a personalized, day-by-day plan grounded in live Google Maps data. 

Instead of picking options from tedious dropdown menus, the plan is editable through natural language. You simply tell the AI agent what to change (*"Swap Tadich Grill for Yank Sing, but make sure it's still walking distance from my hotel"*), and the orchestrator handles the constraints.

## Business Value & Goals
- **Frictionless Onboarding:** By entering your hotel and destination details manually, the app is instantly usable without the security friction of OAuth email connections.
- **Contextual Awareness:** The agent reasons over spatial constraints (distance, travel time, walkability) rather than just generating text, reducing hallucinations.
- **Actionable UI:** The frontend provides a "Plan View" for iterative design and a "Today View" for in-trip execution, keeping the user focused on the immediate next step.

## Technologies Leveraged
This project acts as an integration playground for several cutting-edge AI and mapping technologies:
1. **Anthropic Claude (Messages API):** Serves as the core reasoning orchestrator. Claude decides which tools to call, reasons over constraints, and handles the scoped iteration of the itinerary.
2. **Google Maps Platform (Server & Client SDKs):**
   - **Maps JavaScript SDK (React):** For rendering the interactive map and custom pins dynamically.
   - **Directions & Geocoding APIs:** To compute real-time walking distances, routing times, and coordinates.
   - **Places API:** To search and ground venue locations relative to the hotel base.
3. **Next.js & FastAPI:** A robust, modern stack for the mobile-first frontend and the orchestration backend.

---

## Prerequisites
Before you begin, ensure you have the following installed on your local machine:
- **Node.js** (v18.0.0 or higher recommended)
- **npm** (v9.0.0 or higher recommended)
- **Python** (v3.9 or higher recommended)
- **pip** (Python package installer)

---

## Getting Started

To get the Journey Planner working locally on your system, follow these setup and configuration instructions.

### Step 1: Obtain API Keys

#### 1. Anthropic API Key
- Go to the [Anthropic Developer Console](https://console.anthropic.com/).
- Create an account or sign in, navigate to **API Keys**, and generate a new secret key.
- Save this key for backend configuration (needed for the Claude Orchestrator model).

#### 2. Google Cloud Platform (GCP) API Keys
We highly recommend creating a **new, dedicated GCP project** specifically for this application. This makes it easy to track API usage/billing in isolation and allows you to clean up all resources instantly by deleting the project when finished.

Within this project, you can generate both keys (no need for two separate projects). Configure **two separate API keys** in the [Google Cloud Console](https://console.cloud.google.com/) with different restrictions to ensure appropriate security (e.g., preventing client-side keys from being used outside your local browser environment or calling unrestricted backend APIs):

1. **Frontend Browser Key** (Restricted):
   - Navigate to **APIs & Services > Credentials** and create an API key.
   - Restrict this key to **HTTP Referrers** (add `http://localhost:3000/*` for local development).
   - Under **API Restrictions**, select only the **Maps JavaScript API**.
2. **Backend Server Key** (Server-to-Server):
   - Create a second API key.
   - Restrict this key to web service APIs or leave it unrestricted for local testing (never deploy unrestricted keys to public systems).
   - Under **API Restrictions**, enable: **Geocoding API**, **Places API**, and **Directions API**.

---

### Step 2: Configure Environment Variables

Create environment configuration files in both the `frontend` and `backend` directories.

#### Backend Environment Configuration
Create a `.env` file at `backend/.env`:
```env
# Anthropic API Key (required for agent orchestration)
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Google Maps Platform - Server Key (Unrestricted/Server-restricted key)
GOOGLE_MAPS_API_KEY=your_backend_maps_key_here

# Backend Port (Default is 8000)
PORT=8000
```

#### Frontend Environment Configuration
Create a `.env.local` file at `frontend/.env.local`:
```env
# Google Maps Platform - Browser Key (Restricted to HTTP referrers)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_frontend_maps_key_here
```

---

### Step 3: Setup & Run the Backend (FastAPI)

1. Open your terminal and navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   # Create a virtual environment named .venv
   python3 -m venv .venv

   # Activate virtual environment (macOS/Linux)
   source .venv/bin/activate

   # Activate virtual environment (Windows)
   # .venv\Scripts\activate
   ```
3. Install all required dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the FastAPI development server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
5. Verify the backend is active:
   - Open `http://localhost:8000/` in your browser. You should receive a status response confirming the server is online.

---

### Step 4: Setup & Run the Frontend (Next.js)

1. Open a new terminal window or tab and navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install the Node package dependencies:
   ```bash
   npm install
   ```
3. Start the Next.js development server:
   ```bash
   npm run dev
   ```
4. Open the application:
   - Navigate to [http://localhost:3000](http://localhost:3000) in your web browser.
   - You will see the premium glassmorphic onboarding welcome screen.
   - Enter your destination, trip dates, hotel name, and hotel address, then click **Generate Itinerary** to test the maps-grounded planning pipeline.

---

## Project Diary

| Date | What We Set to Do | What We Experienced | What We Achieved |
| :--- | :--- | :--- | :--- |
| **June 10, 2026** | Scaffold the application codebase (FastAPI backend + Next.js frontend), integrate Google Maps client-side SDK, and outline initial specifications. | Encountered browser console warnings when using `AdvancedMarkerElement` because it requires a Map ID configured via GCP styles. Dealt with hydration and client-context mismatches under the Next.js App Router structure. | Initialized both Next.js and FastAPI projects. Replaced advanced markers with standard `<Marker>` components pointing to public yellow/blue pin URLs to sidestep Map ID restrictions. Rendered the interactive map component successfully. |
| **June 11, 2026** | Document the application architecture, grounding patterns, and plan the AI orchestration flow based on the Google Maps Innovators Community Day. | Discovered that backend GCP Python client calls reject API keys that have HTTP referrer restrictions set up for client browsers. | Outlined the maps grounding design and established a clean separation of keys (restricted browser key for client-side maps vs unrestricted/IP-restricted server key for backend geocoding/directions/places). |
| **June 24, 2026** | Build the agent planning loop, manual accommodation input, and chat interface. Debug legacy model name issues and fix the empty-itinerary bug (0 days, 0 stops). | Legacy Claude Sonnet v2 model IDs returned 404. Claude Opus 4.8 called `submit_itinerary` with an empty object `{}` due to the `max_tokens=4000` response limit truncating the huge JSON. Invalid marker key structures caused post-loop validation crashes. | Switched to flagship `claude-opus-4-8`. Split GCP keys (frontend browser key vs backend web key). Refactored `submit_itinerary` to accept a flat `itinerary_json` parameter and increased response headroom to `8000` tokens. Added internal validation checks inside the loop so Claude self-corrects invalid payloads before finalization. Completed a fully working, beautiful interactive travel app. |

---

## Contributing

We welcome contributions of all kinds! Please read our [Contributing Guidelines](file:///Users/sudhi/Desktop/Projects/google-maps/CONTRIBUTING.md) to learn how to propose changes, report issues, and follow our development standards.

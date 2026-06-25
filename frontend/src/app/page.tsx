"use client";

import { useState, useEffect, useRef } from "react";
import { Map, Marker, useMap } from "@vis.gl/react-google-maps";
import styles from "./page.module.css";
import { 
  Maximize2, 
  Minimize2, 
  MapPin, 
  Send, 
  Loader2, 
  Calendar, 
  Building, 
  Sparkles, 
  Edit3, 
  Navigation,
  Compass,
  ChevronRight,
  ArrowRight,
  Info
} from "lucide-react";

interface Coords {
  lat: number;
  lng: number;
}

interface TripDetails {
  destination: string;
  accommodationName: string;
  accommodationAddress: string;
  startDate: string;
  endDate: string;
  coordinates?: Coords;
}

interface Leg {
  id: string;
  title: string;
  time: string;
  duration: string;
  location: string;
  coords: Coords;
  description: string;
  transport?: string;
}

interface Day {
  id: string;
  label: string;
  legs: Leg[];
}

interface MarkerData {
  id: string;
  title: string;
  position: Coords;
  type: string; // "accommodation" | "stop"
}

// Inner helper component to pan/fit the map dynamically
function MapController({ markers, activeDay, itinerary }: { markers: MarkerData[], activeDay: string, itinerary: Day[] }) {
  const map = useMap();

  useEffect(() => {
    if (!map || markers.length === 0) return;

    // Filter markers for the active day
    let activeCoords: Coords[] = [];
    
    if (activeDay === "overview") {
      activeCoords = markers.map(m => m.position);
    } else {
      const dayData = itinerary.find(d => d.id === activeDay);
      if (dayData && dayData.legs.length > 0) {
        activeCoords = dayData.legs.map(l => l.coords);
        // Also include accommodation
        const acc = markers.find(m => m.type === "accommodation");
        if (acc) activeCoords.push(acc.position);
      } else {
        activeCoords = markers.map(m => m.position);
      }
    }

    if (activeCoords.length === 0) return;

    // Fit map bounds
    const bounds = new google.maps.LatLngBounds();
    activeCoords.forEach(coord => {
      bounds.extend(new google.maps.LatLng(coord.lat, coord.lng));
    });
    
    map.fitBounds(bounds, {
      top: 50,
      right: 50,
      bottom: 50,
      left: 50
    });
  }, [map, markers, activeDay, itinerary]);

  return null;
}

export default function Home() {
  const [mode, setMode] = useState<"plan" | "today">("plan");
  const [mapMaximized, setMapMaximized] = useState(false);
  
  // Trip State
  const [tripDetails, setTripDetails] = useState<TripDetails | null>(null);
  const [itinerary, setItinerary] = useState<Day[]>([]);
  const [markers, setMarkers] = useState<MarkerData[]>([]);
  const [agentReply, setAgentReply] = useState<string>("");
  
  // UI State
  const [activeDay, setActiveDay] = useState("overview");
  const [selectedLegId, setSelectedLegId] = useState<string | null>(null);
  const [chatQuery, setChatQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("Grounding Maps data & planning...");
  const [initialized, setInitialized] = useState(false);
  
  // Form State for Onboarding / Edit
  const [destInput, setDestInput] = useState("");
  const [hotelNameInput, setHotelNameInput] = useState("");
  const [hotelAddrInput, setHotelAddrInput] = useState("");
  const [startInput, setStartInput] = useState("");
  const [endInput, setEndInput] = useState("");

  const editDialogRef = useRef<HTMLDialogElement>(null);

  // Dynamic loading text cycler
  useEffect(() => {
    if (!loading) {
      setLoadingText("Grounding Maps data & planning...");
      return;
    }

    const steps = [
      "Contacting Claude 4.8 Opus...",
      "Geocoding accommodation base...",
      "Searching local places of interest...",
      "Computing walking route distances...",
      "Assembling daily travel legs...",
      "Finalizing maps-grounded itinerary..."
    ];

    let currentStep = 0;
    setLoadingText(steps[0]);

    const interval = setInterval(() => {
      currentStep = (currentStep + 1) % steps.length;
      setLoadingText(steps[currentStep]);
    }, 2500);

    return () => clearInterval(interval);
  }, [loading]);

  // Load state from localStorage on mount
  useEffect(() => {
    const savedTrip = localStorage.getItem("journey_trip");
    const savedItinerary = localStorage.getItem("journey_itinerary");
    const savedMarkers = localStorage.getItem("journey_markers");
    const savedReply = localStorage.getItem("journey_reply");

    if (savedTrip) {
      const parsedTrip = JSON.parse(savedTrip);
      setTripDetails(parsedTrip);
      setDestInput(parsedTrip.destination);
      setHotelNameInput(parsedTrip.accommodationName);
      setHotelAddrInput(parsedTrip.accommodationAddress);
      setStartInput(parsedTrip.startDate);
      setEndInput(parsedTrip.endDate);
    }
    if (savedItinerary) setItinerary(JSON.parse(savedItinerary));
    if (savedMarkers) setMarkers(JSON.parse(savedMarkers));
    if (savedReply) setAgentReply(savedReply);
    
    setInitialized(true);
  }, []);

  // Save states helper
  const saveTripData = (trip: TripDetails, iti: Day[], mrk: MarkerData[], rep: string) => {
    localStorage.setItem("journey_trip", JSON.stringify(trip));
    localStorage.setItem("journey_itinerary", JSON.stringify(iti));
    localStorage.setItem("journey_markers", JSON.stringify(mrk));
    localStorage.setItem("journey_reply", rep);

    setTripDetails(trip);
    setItinerary(iti);
    setMarkers(mrk);
    setAgentReply(rep);
  };

  // Clear trip helper
  const handleClearTrip = () => {
    if (confirm("Are you sure you want to delete this trip and start over?")) {
      localStorage.clear();
      setTripDetails(null);
      setItinerary([]);
      setMarkers([]);
      setAgentReply("");
      setActiveDay("overview");
      setDestInput("");
      setHotelNameInput("");
      setHotelAddrInput("");
      setStartInput("");
      setEndInput("");
    }
  };

  // Submit onboarding form
  const handleOnboardingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destInput || !hotelNameInput || !hotelAddrInput || !startInput || !endInput) return;

    setLoading(true);
    const tempDetails: TripDetails = {
      destination: destInput,
      accommodationName: hotelNameInput,
      accommodationAddress: hotelAddrInput,
      startDate: startInput,
      endDate: endInput
    };

    try {
      const res = await fetch("http://localhost:8000/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trip_details: tempDetails,
          query: `Create a wonderful itinerary for my trip to ${destInput} from ${startInput} to ${endInput}. I am staying at ${hotelNameInput} located at ${hotelAddrInput}. Plan 3 balanced active legs per day, incorporating top local landmarks, restaurants, and cafes near the hotel. Compute route walking distances/times where appropriate.`,
          current_itinerary: null
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to generate plan");
      }

      const data = await res.json();
      
      // The API returns the geocoded coordinates in the trip details
      const geocodedTrip: TripDetails = {
        ...tempDetails,
        coordinates: data.markers.find((m: MarkerData) => m.type === "accommodation")?.position
      };

      saveTripData(geocodedTrip, data.itinerary, data.markers, data.reply);
      setActiveDay("overview");
    } catch (err: any) {
      alert(err.message || "An error occurred while creating your trip.");
    } finally {
      setLoading(false);
    }
  };

  // Submit Edit Accommodation Dialog form
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tripDetails) return;

    setLoading(true);
    editDialogRef.current?.close();

    const updatedDetails: TripDetails = {
      ...tripDetails,
      destination: destInput,
      accommodationName: hotelNameInput,
      accommodationAddress: hotelAddrInput,
      startDate: startInput,
      endDate: endInput,
      coordinates: undefined // Force backend to re-geocode
    };

    try {
      const res = await fetch("http://localhost:8000/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trip_details: updatedDetails,
          query: `I have updated my hotel to: ${hotelNameInput} at ${hotelAddrInput}. Please re-route and regenerate my itinerary legs so they start and end at my new hotel base, adjusting any walking times accordingly. Keep the activities mostly the same but ensure spatial constraints make sense.`,
          current_itinerary: itinerary
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to update accommodation");
      }

      const data = await res.json();
      
      const geocodedTrip: TripDetails = {
        ...updatedDetails,
        coordinates: data.markers.find((m: MarkerData) => m.type === "accommodation")?.position
      };

      saveTripData(geocodedTrip, data.itinerary, data.markers, data.reply);
    } catch (err: any) {
      alert(err.message || "An error occurred while updating accommodation.");
    } finally {
      setLoading(false);
    }
  };

  // Submit Chat prompt
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatQuery.trim() || !tripDetails) return;

    const userMsg = chatQuery;
    setChatQuery("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:8000/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trip_details: tripDetails,
          query: userMsg,
          current_itinerary: itinerary
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to update plan");
      }

      const data = await res.json();
      saveTripData(tripDetails, data.itinerary, data.markers, data.reply);
    } catch (err: any) {
      alert(err.message || "An error occurred while re-routing your trip.");
    } finally {
      setLoading(false);
    }
  };

  // Custom light dismiss click handler for `<dialog>`
  const handleDialogClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    const dialog = editDialogRef.current;
    if (!dialog) return;
    if (e.target === dialog) {
      const rect = dialog.getBoundingClientRect();
      const isInside = (
        rect.top <= e.clientY &&
        e.clientY <= rect.top + rect.height &&
        rect.left <= e.clientX &&
        e.clientX <= rect.left + rect.width
      );
      if (!isInside) {
        dialog.close();
      }
    }
  };

  if (!initialized) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 className={styles.spinner} size={48} />
        <p>Loading Journey Planner...</p>
      </div>
    );
  }

  // ONBOARDING VIEW
  if (!tripDetails) {
    return (
      <main className={styles.onboardingContainer}>
        <div className={styles.onboardingGlow} />
        <div className={`${styles.onboardingCard} glass-panel`}>
          <div className={styles.onboardingHeader}>
            <div className={styles.sparkleIcon}>
              <Sparkles size={28} />
            </div>
            <h2>Let's Plan Your Journey</h2>
            <p>Input your destination and accommodation manually to generate a tailored, maps-grounded itinerary.</p>
          </div>

          <form onSubmit={handleOnboardingSubmit} className={styles.onboardingForm}>
            <div className={styles.formGroup}>
              <label htmlFor="destination">Where are you going?</label>
              <input
                id="destination"
                type="text"
                placeholder="e.g. San Francisco, CA"
                value={destInput}
                onChange={(e) => setDestInput(e.target.value)}
                required
              />
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="startDate">Start Date</label>
                <input
                  id="startDate"
                  type="date"
                  value={startInput}
                  onChange={(e) => setStartInput(e.target.value)}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="endDate">End Date</label>
                <input
                  id="endDate"
                  type="date"
                  value={endInput}
                  onChange={(e) => setEndInput(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className={styles.divider}>
              <span>Accommodation Details</span>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="hotelName">Hotel / Airbnb Name</label>
              <input
                id="hotelName"
                type="text"
                placeholder="e.g. Club Quarters Hotel"
                value={hotelNameInput}
                onChange={(e) => setHotelNameInput(e.target.value)}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="hotelAddress">Street Address</label>
              <input
                id="hotelAddress"
                type="text"
                placeholder="e.g. 400 Sansome St, San Francisco, CA 94111"
                value={hotelAddrInput}
                onChange={(e) => setHotelAddrInput(e.target.value)}
                required
                autoComplete="street-address"
              />
            </div>

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className={styles.spinner} size={20} />
                  {loadingText}
                </>
              ) : (
                <>
                  Generate Itinerary
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>
        </div>
      </main>
    );
  }

  // MAIN PLANNER VIEW
  const activeDayData = itinerary.find((d) => d.id === activeDay);
  const displayedLegs = activeDayData ? activeDayData.legs : [];

  // Compile list of days for tabs
  const dayTabs = [
    { id: "overview", label: "Overview" },
    ...itinerary.map((d) => ({ id: d.id, label: d.label }))
  ];

  // Get active route/legs for execution in Today View
  // We flatten all legs across all days for sequential execution
  const allLegs = itinerary.flatMap((d) => d.legs);
  const activeLegIndex = allLegs.findIndex((l) => l.id === selectedLegId) >= 0 
    ? allLegs.findIndex((l) => l.id === selectedLegId) 
    : 0;
  const currentTodayLeg = allLegs[activeLegIndex];

  return (
    <main className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerTitleArea}>
          <Compass className={styles.logoIcon} size={24} />
          <h1 className={styles.title}>{tripDetails.destination}</h1>
          <span className={styles.datesBadge}>
            {tripDetails.startDate} to {tripDetails.endDate}
          </span>
        </div>
        
        <div className={styles.headerActions}>
          <div className={styles.modeToggle}>
            <button
              className={`${styles.modeBtn} ${mode === "plan" ? styles.active : ""}`}
              onClick={() => setMode("plan")}
            >
              Plan View
            </button>
            <button
              className={`${styles.modeBtn} ${mode === "today" ? styles.active : ""}`}
              onClick={() => setMode("today")}
              disabled={allLegs.length === 0}
            >
              Today View
            </button>
          </div>
          
          <button className={styles.resetBtn} onClick={handleClearTrip}>
            Reset Trip
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className={styles.content}>
        
        {/* Timeline Sidebar (Hidden if map is maximized) */}
        <aside className={`${styles.timeline} ${mapMaximized ? styles.timelineCollapsed : ""}`}>
          {!mapMaximized && (
            <>
              {/* Accommodation card base */}
              <div className={`${styles.accommodationCard} glass-panel`}>
                <div className={styles.accHeader}>
                  <div className={styles.accInfo}>
                    <Building size={16} className={styles.hotelIcon} />
                    <strong>{tripDetails.accommodationName}</strong>
                    <p>{tripDetails.accommodationAddress}</p>
                  </div>
                  <button 
                    className={styles.editAccBtn} 
                    onClick={() => editDialogRef.current?.showModal()}
                    aria-label="Edit accommodation details"
                  >
                    <Edit3 size={14} />
                  </button>
                </div>
              </div>

              {/* Day Selection Tabs */}
              <div className={styles.dayTabs}>
                {dayTabs.map((d) => (
                  <button
                    key={d.id}
                    className={`${styles.tabBtn} ${activeDay === d.id ? styles.active : ""}`}
                    onClick={() => {
                      setActiveDay(d.id);
                      setSelectedLegId(null);
                    }}
                  >
                    {d.label}
                  </button>
                ))}
              </div>

              {/* Legs Container */}
              <div className={styles.legs}>
                {loading && (
                  <div className={styles.skeletonContainer}>
                    <div className={styles.loadingStatusLabel}>
                      <Sparkles className={styles.loadingSparkle} size={14} />
                      <span>{loadingText}</span>
                    </div>
                    <div className={styles.skeletonCard} />
                    <div className={styles.skeletonCard} />
                    <div className={styles.skeletonCard} />
                  </div>
                )}

                {!loading && activeDay === "overview" && (
                  <div className={styles.overviewContainer}>
                    <div className={styles.overviewIntro}>
                      <Sparkles size={16} color="var(--primary)" />
                      <strong>AI Travel Planner Briefing</strong>
                    </div>
                    {agentReply && <p className={styles.overviewReply}>{agentReply}</p>}
                    <div className={styles.overviewStats}>
                      <div className={styles.statBox}>
                        <span>Total Days</span>
                        <strong>{itinerary.length}</strong>
                      </div>
                      <div className={styles.statBox}>
                        <span>Stops Planned</span>
                        <strong>{allLegs.length}</strong>
                      </div>
                    </div>
                  </div>
                )}

                {!loading && activeDay !== "overview" && displayedLegs.length === 0 && (
                  <div className={styles.emptyLegs}>
                    <Info size={24} />
                    <p>No stops planned for this day yet.</p>
                  </div>
                )}

                {!loading && activeDay !== "overview" && displayedLegs.map((leg, idx) => (
                  <div key={leg.id} className={styles.legWrapper}>
                    {leg.transport && (
                      <div className={styles.transportSeparator}>
                        <div className={styles.transportDottedLine} />
                        <span className={styles.transportText}>{leg.transport}</span>
                      </div>
                    )}
                    <div 
                      className={`${styles.legCard} ${selectedLegId === leg.id ? styles.legCardActive : ""}`}
                      onClick={() => setSelectedLegId(leg.id)}
                    >
                      <div className={styles.legTimeRow}>
                        <span className={styles.legTime}>{leg.time}</span>
                        <span className={styles.legDuration}>{leg.duration}</span>
                      </div>
                      <h4 className={styles.legTitle}>{leg.title}</h4>
                      <span className={styles.legLoc}>
                        <MapPin size={12} />
                        {leg.location}
                      </span>
                      <p className={styles.legDesc}>{leg.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Chat Command Input */}
              <form onSubmit={handleChatSubmit} className={styles.chatForm}>
                <input
                  type="text"
                  placeholder="e.g. Add an evening walk, or swap dinner spot..."
                  value={chatQuery}
                  onChange={(e) => setChatQuery(e.target.value)}
                  disabled={loading}
                />
                <button type="submit" disabled={loading || !chatQuery.trim()} aria-label="Send query">
                  {loading ? <Loader2 className={styles.spinner} size={16} /> : <Send size={16} />}
                </button>
              </form>
            </>
          )}
        </aside>

        {/* Map Container */}
        <section className={styles.mapContainer}>
          <button
            className={styles.maximizeBtn}
            onClick={() => setMapMaximized(!mapMaximized)}
            aria-label="Toggle map size"
          >
            {mapMaximized ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
          </button>
          
          <Map
            defaultCenter={tripDetails.coordinates || { lat: 37.7749, lng: -122.4194 }}
            defaultZoom={14}
            gestureHandling={"greedy"}
            disableDefaultUI={false}
          >
            {/* Dynamic Map Controller */}
            <MapController markers={markers} activeDay={activeDay} itinerary={itinerary} />

            {/* Markers */}
            {markers.map((marker) => {
              const isAccommodation = marker.type === "accommodation";
              const isSelected = selectedLegId === marker.id || (mode === "today" && currentTodayLeg?.id === marker.id);
              
              // Standard pin colors using Google Maps default icons
              let pinUrl = "https://maps.google.com/mapfiles/ms/icons/red-dot.png";
              if (isAccommodation) {
                pinUrl = "https://maps.google.com/mapfiles/ms/icons/blue-dot.png";
              } else if (isSelected) {
                pinUrl = "https://maps.google.com/mapfiles/ms/icons/yellow-dot.png";
              }

              return (
                <Marker 
                  key={marker.id} 
                  position={marker.position}
                  title={marker.title}
                  icon={pinUrl}
                />
              );
            })}
          </Map>

          {/* Plan View: Briefing Overlay when maximized */}
          {mode === "plan" && mapMaximized && (
            <div className={`${styles.briefingOverlay} glass-panel`}>
              <div className={styles.overlayHeader}>
                <Sparkles size={16} color="var(--primary)" />
                <h3>Itinerary Briefing</h3>
              </div>
              <p>{agentReply || "Add accommodations and prompt the planner to generate details."}</p>
            </div>
          )}

          {/* Today View: Execution Stepper */}
          {mode === "today" && currentTodayLeg && (
            <div className={styles.stepperContainer}>
              <div className="glass-panel" style={{ padding: "20px", width: "100%", maxWidth: "500px", margin: "0 auto" }}>
                <span className={styles.stepperSub}>
                  Step {activeLegIndex + 1} of {allLegs.length} • {currentTodayLeg.time}
                </span>
                <h3 style={{ margin: "4px 0 8px 0", fontSize: "1.3rem" }}>{currentTodayLeg.title}</h3>
                <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "4px", margin: "0 0 12px 0" }}>
                  <MapPin size={12} /> {currentTodayLeg.location}
                </p>
                <p style={{ fontSize: "0.95rem", margin: "0 0 16px 0", lineHeight: "1.4" }}>{currentTodayLeg.description}</p>
                
                {currentTodayLeg.transport && (
                  <div className={styles.stepperTransport}>
                    <Navigation size={14} />
                    <span>Travel: {currentTodayLeg.transport}</span>
                  </div>
                )}
                
                <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
                  <button 
                    className={styles.stepperPrevBtn} 
                    onClick={() => activeLegIndex > 0 && setSelectedLegId(allLegs[activeLegIndex - 1].id)}
                    disabled={activeLegIndex === 0}
                  >
                    Previous
                  </button>
                  <button 
                    className={styles.doneBtn}
                    onClick={() => {
                      if (activeLegIndex < allLegs.length - 1) {
                        setSelectedLegId(allLegs[activeLegIndex + 1].id);
                      } else {
                        alert("Congrats! You've completed your itinerary for today!");
                      }
                    }}
                  >
                    {activeLegIndex === allLegs.length - 1 ? "Finish Journey" : "Next Stop"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Edit Accommodation Modal */}
      <dialog 
        ref={editDialogRef} 
        className={`${styles.dialogModal} glass-panel`}
        onClick={handleDialogClick}
        closedby="any"
        aria-labelledby="modalTitle"
      >
        <form onSubmit={handleEditSubmit} className={styles.dialogForm}>
          <h3 id="modalTitle">Edit Trip & Accommodation</h3>
          <p>Changing dates or base hotel will re-calculate transit times and re-position leg starts/ends.</p>

          <div className={styles.formGroup}>
            <label htmlFor="editDest">Destination</label>
            <input
              id="editDest"
              type="text"
              value={destInput}
              onChange={(e) => setDestInput(e.target.value)}
              required
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="editStart">Start Date</label>
              <input
                id="editStart"
                type="date"
                value={startInput}
                onChange={(e) => setStartInput(e.target.value)}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="editEnd">End Date</label>
              <input
                id="editEnd"
                type="date"
                value={endInput}
                onChange={(e) => setEndInput(e.target.value)}
                required
              />
            </div>
          </div>

          <div className={styles.divider}>
            <span>Accommodation Base</span>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="editHotel">Hotel Name</label>
            <input
              id="editHotel"
              type="text"
              value={hotelNameInput}
              onChange={(e) => setHotelNameInput(e.target.value)}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="editAddr">Address</label>
            <input
              id="editAddr"
              type="text"
              value={hotelAddrInput}
              onChange={(e) => setHotelAddrInput(e.target.value)}
              required
              autoComplete="street-address"
            />
          </div>

          <div className={styles.dialogActions}>
            <button 
              type="button" 
              className={styles.dialogCancelBtn} 
              onClick={() => editDialogRef.current?.close()}
            >
              Cancel
            </button>
            <button type="submit" className={styles.dialogSaveBtn}>
              Save & Recalculate
            </button>
          </div>
        </form>
      </dialog>
    </main>
  );
}

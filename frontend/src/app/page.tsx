"use client";

import { useState } from "react";
import { Map, AdvancedMarker } from "@vis.gl/react-google-maps";
// import { AgenticUI } from "@googlemaps/a2ui"; // Will integrate fully later
import styles from "./page.module.css";
import { Maximize2, Minimize2, MapPin } from "lucide-react";

export default function Home() {
  const [mode, setMode] = useState<"plan" | "today">("plan");
  const [mapMaximized, setMapMaximized] = useState(false);
  const [activeDay, setActiveDay] = useState("may-23");

  const days = [
    { id: "overview", label: "Overview" },
    { id: "may-23", label: "May 23 • Sat" },
    { id: "may-24", label: "May 24 • Sun" },
    { id: "may-25", label: "May 25 • Mon" },
  ];

  return (
    <main className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <h1 className={styles.title}>Journey Planner</h1>
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
          >
            Today View
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className={styles.content}>
        {/* Plan View: Timeline */}
        {mode === "plan" && (
          <aside className={`${styles.timeline} ${mapMaximized ? styles.timelineCollapsed : ""}`}>
            {!mapMaximized && (
              <div className={styles.dayTabs}>
                {days.map((d) => (
                  <button
                    key={d.id}
                    className={`${styles.tabBtn} ${activeDay === d.id ? styles.active : ""}`}
                    onClick={() => setActiveDay(d.id)}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            )}
            <div className={styles.legs}>
              {/* Dummy Legs for Scaffold */}
              <div className={styles.legCard}>
                <strong>SFO Arrival</strong>
                <p>11:40 AM</p>
              </div>
              <div className={styles.legCard}>
                <strong>Tadich Grill</strong>
                <p>1:30 PM • Lunch</p>
              </div>
            </div>
          </aside>
        )}

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
            mapId="DEMO_MAP_ID"
            defaultCenter={{ lat: 37.7749, lng: -122.4194 }}
            defaultZoom={13}
            gestureHandling={"greedy"}
            disableDefaultUI={true}
          >
            {/* Markers will go here */}
            <AdvancedMarker position={{ lat: 37.7933, lng: -122.3986 }}>
              <MapPin color="var(--primary)" fill="white" size={32} />
            </AdvancedMarker>
          </Map>

          {/* Plan View: Briefing Overlay when maximized */}
          {mode === "plan" && mapMaximized && (
            <div className={`${styles.briefingOverlay} glass-panel interactive`} style={{ padding: "20px" }}>
              <h3>Tadich Grill</h3>
              <p>California's oldest continuously operating restaurant.</p>
            </div>
          )}

          {/* Today View: Execution Stepper */}
          {mode === "today" && (
            <div className={styles.stepperContainer}>
              <div className="glass-panel" style={{ padding: "20px", marginBottom: "16px" }}>
                <h3>Next Up: Tadich Grill</h3>
                <p>12 min walk down Market St</p>
              </div>
              <button className={styles.doneBtn}>Mark Leg Done</button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

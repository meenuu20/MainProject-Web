import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchEvidenceList } from "../api";

export default function Home() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    let active = true;

    fetchEvidenceList()
      .then((data) => {
        if (active) {
          setEvents(data.items || []);
        }
      })
      .catch(() => {
        if (active) {
          setEvents([]);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="container page-shell">
      <section className="hero card">
        <div className="hero-content">
          <span className="eyebrow">Autonomous Sanitation Intelligence</span>
          <h1>See city dumping events before they disappear into the background.</h1>
          <p className="lead">
            SmartWaste blends detection, evidence review, and field response into one futuristic control surface built for municipal teams.
          </p>

          <div className="hero-ctas">
            <Link to="/alerts" className="btn">View Alerts</Link>
            <Link to="/dashboard" className="btn ghost">Open Dashboard</Link>
          </div>

          <div className="hero-metrics">
            <div className="metric-chip">
              <span className="muted">Tracked events</span>
              <strong>{events.length}</strong>
            </div>
            <div className="metric-chip">
              <span className="muted">Status</span>
              <strong>Live Patrol</strong>
            </div>
            <div className="metric-chip">
              <span className="muted">Response mode</span>
              <strong>Rapid Review</strong>
            </div>
          </div>
        </div>

        <div className="hero-side">
          <div className="holo-panel">
            <div className="scan-line" />
            <div className="signal-pill">Neural surveillance active</div>
            <h3>City Grid Sync</h3>
            <p className="lead">Detection, evidence retention, and dashboard playback stay aligned in one animated command layer.</p>
          </div>
          <div className="holo-panel">
            <div className="signal-pill">Evidence stream</div>
            <div className="stat-number">{events.length}</div>
            <div className="stat-label muted">Events available for review</div>
          </div>
        </div>
      </section>

      <section className="grid two-col">
        <div className="card">
          <div className="section-header">
            <div>
              <p className="muted">Realtime queue</p>
              <h3 className="section-title">Recent Events</h3>
            </div>
            <span className="signal-pill">Updated live</span>
          </div>
          <div className="list">
            {events.slice(0, 5).map((event) => (
              <Link key={event.id} to={`/alerts/${event.id}`} className="card-row">
                <div>
                  <div style={{ fontWeight: 700 }}>Dumping evidence from {event.camera_id}</div>
                  <div className="meta">{new Date(event.timestamp).toLocaleString()} • {event.location}</div>
                </div>
                <div>
                  <span className="btn small">View</span>
                </div>
              </Link>
            ))}
            {events.length === 0 && <div className="empty">No recent events</div>}
          </div>
        </div>

        <aside className="card side">
          <div className="section-header">
            <div>
              <p className="muted">Mission controls</p>
              <h4 className="section-title">Quick Actions</h4>
            </div>
          </div>
          <ul>
            <li><Link to="/alerts">Review alerts</Link></li>
            <li><Link to="/dashboard">Check devices</Link></li>
            <li><Link to="/login">Sign in</Link></li>
          </ul>

          <div style={{ marginTop: 18 }}>
            <h4>Live Feed</h4>
            <div className="empty">No live feed yet. Integrate the camera stream here.</div>
          </div>
        </aside>
      </section>
    </div>
  );
}

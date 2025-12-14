// src/pages/Home.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

// sample data to show UI (you can later load from api)
const sampleEvents = [
  { id: "evt-1", title: "Dumping near Park Gate", time: "2025-12-09T18:12:00Z", location: "Sector 12" },
  { id: "evt-2", title: "Bags dumped at roadside", time: "2025-12-08T06:45:00Z", location: "Old Market" }
];

export default function Home() {
  const [events, setEvents] = useState(sampleEvents);
  useEffect(() => {
  fetch("http://127.0.0.1:5000/api/events")
    .then(res => res.json())
    .then(data => {
      if (Array.isArray(data) && data.length > 0) {
        setEvents(data);
      }
    })
    .catch(err => {
      console.warn("Backend not available, using sample data");
    });
}, []);
  return (
    <div className="container">
      {/* Centered hero */}
      <section className="hero hero-center card">
        <div className="hero-content">
          <h1>Welcome to SmartWaste Monitoring</h1>
          <p className="lead">
            Automatic detection of illegal waste dumping. Review detections, confirm evidence, and assign tasks to field teams.
          </p>

          <div className="hero-ctas">
            <Link to="/alerts" className="btn">View Alerts</Link>
            <Link to="/dashboard" className="btn ghost" style={{marginLeft:12}}>Open Dashboard</Link>
          </div>
        </div>

        <div className="hero-side">
          <div className="stat">
            <div className="stat-number">0</div>
            <div className="stat-label">New Today</div>
          </div>
          <div className="stat" style={{marginTop:12}}>
            <div className="stat-number">{events.length}</div>
            <div className="stat-label">Total Events</div>
          </div>
        </div>
      </section>

      {/* Recent events + quick info */}
      <section className="grid two-col">
        <div className="card">
          <h3 style={{marginTop:0}}>Recent Events</h3>
          <div className="list">
            {events.map(ev => (
              <Link key={ev.id} to={`/alerts/${ev.id}`} className="card-row">
                <div>
                  <div style={{fontWeight:600}}>{ev.title}</div>
                  <div className="meta">{new Date(ev.time).toLocaleString()} • {ev.location}</div>
                </div>
                <div>
                  <button className="btn small">View</button>
                </div>
              </Link>
            ))}
            {events.length === 0 && <div className="empty">No recent events</div>}
          </div>
        </div>

        <aside className="card side">
          <h4 style={{marginTop:0}}>Quick Actions</h4>
          <ul style={{paddingLeft:18}}>
            <li><Link to="/alerts">Review Alerts</Link></li>
            <li><Link to="/dashboard">Check Devices</Link></li>
            <li><Link to="/login">Sign in</Link></li>
          </ul>

          <div style={{marginTop:18}}>
            <h4>Live Feed</h4>
            <div className="empty">No live feed yet — integrate the camera stream here.</div>
          </div>
        </aside>
      </section>
    </div>
  );
}

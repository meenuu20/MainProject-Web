import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { deleteAllEvidence, fetchEvidenceList } from "../api";

export default function Dashboard() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);

  function loadEvents() {
    setLoading(true);
    return fetchEvidenceList()
      .then((data) => {
        setEvents(data.items || []);
      })
      .catch(() => {
        setEvents([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }

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
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  async function handleClearAll() {
    const confirmed = window.confirm("Delete all evidence events from the dashboard?");
    if (!confirmed) {
      return;
    }

    setClearing(true);
    try {
      await deleteAllEvidence();
      await loadEvents();
    } catch {
      window.alert("Failed to clear evidence. Please try again.");
    } finally {
      setClearing(false);
    }
  }

  return (
    <div className="container page-shell">
      <section className="card page-hero">
        <div>
          <p className="muted">Futuristic command center</p>
          <h2 className="page-title">Admin Dashboard</h2>
          <p className="page-subtitle">Overview of cameras, system health, and evidence queues in one immersive surface.</p>
        </div>
        <div className="signal-pill">{events.length} evidence signals</div>
      </section>

      <div className="grid stats-grid">
        <div className="card small-card">
          <p className="muted">Active cameras</p>
          <div className="stat-number">03</div>
        </div>
        <div className="card small-card">
          <p className="muted">Average latency</p>
          <div className="stat-number">120ms</div>
        </div>
        <div className="card small-card">
          <p className="muted">System uptime</p>
          <div className="stat-number">99.9%</div>
        </div>
      </div>

      <div className="grid dashboard-grid">
        <div className="card small-card">
          <h4>Devices</h4>
          <ul>
            <li>CAM-01 - Online</li>
            <li>CAM-02 - Online</li>
            <li>CAM-03 - Offline</li>
          </ul>
        </div>

        <div className="card small-card">
          <h4>System Health</h4>
          <p className="muted">Inference latency, CPU usage, and runtime stability shown in one glance.</p>
          <ul>
            <li>Inference steady state: nominal</li>
            <li>Evidence sync lane: active</li>
            <li>Playback surface: responsive</li>
          </ul>
        </div>
      </div>

      <div className="card">
        <div className="section-header">
          <div>
            <p className="muted">Operations queue</p>
            <h4 className="section-title">Latest Evidence</h4>
          </div>
          <button className="btn small" onClick={handleClearAll} disabled={clearing || loading}>
            {clearing ? "Clearing..." : "Clear All"}
          </button>
        </div>
        {loading && <div className="empty">Loading evidence...</div>}
        {!loading && events.length === 0 && (
          <div className="empty">No pending tasks. Confirmed reports will appear here for field teams.</div>
        )}
        {!loading && events.slice(0, 5).map((event) => (
          <div key={event.id} className="card-row">
            <div>
              <div style={{ fontWeight: 700 }}>{event.location}</div>
              <div className="meta">{event.camera_id} • {new Date(event.timestamp).toLocaleString()}</div>
            </div>
            <Link to={`/alerts/${event.id}`} className="btn small">Open</Link>
          </div>
        ))}
      </div>
    </div>
  );
}

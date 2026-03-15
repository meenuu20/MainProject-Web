import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchEvidenceList } from "../api";

export default function Alerts() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    fetchEvidenceList()
      .then((data) => {
        if (active) {
          setEvents(data.items || []);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err.message);
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

  return (
    <div className="page page-shell">
      <section className="card page-hero">
        <div>
          <p className="muted">Evidence console</p>
          <h2 className="page-title">Alerts</h2>
          <p className="page-subtitle">Review every captured dumping incident with fast visual prioritization.</p>
        </div>
        <div className="signal-pill">{events.length} tracked alerts</div>
      </section>

      {loading && <div className="card">Loading evidence...</div>}
      {error && <div className="card">Failed to load alerts: {error}</div>}
      {!loading && !error && events.length === 0 && (
        <div className="card">No evidence has been uploaded yet.</div>
      )}

      {events.map((event) => (
        <div key={event.id} className="card alert-card">
          <div>
            <div className="signal-pill">Confidence {(event.confidence * 100).toFixed(1)}%</div>
            <h3 style={{ marginBottom: 8 }}>{event.location}</h3>
            <p className="meta">{new Date(event.timestamp).toLocaleString()}</p>
            <p className="muted">Camera: {event.camera_id}</p>
          </div>
          <div className="panel-actions">
            <Link to={`/alerts/${event.id}`} className="btn">Inspect Evidence</Link>
          </div>
        </div>
      ))}
    </div>
  );
}

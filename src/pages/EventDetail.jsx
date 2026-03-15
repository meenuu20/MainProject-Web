import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { API_BASE_URL, fetchEvidenceById } from "../api";

export default function EventDetail() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    fetchEvidenceById(id)
      .then((data) => {
        if (active) {
          setEvent(data);
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
  }, [id]);

  if (loading) {
    return <div className="page"><h2>Event Details</h2><p>Loading evidence...</p></div>;
  }

  if (error) {
    return <div className="page"><h2>Event Details</h2><p>Failed to load evidence: {error}</p></div>;
  }

  if (!event) {
    return <div className="page"><h2>Event Details</h2><p>Evidence not found.</p></div>;
  }

  return (
    <div className="page">
      <h2>Event Details - {id}</h2>
      <p>Camera: {event.camera_id}</p>
      <p>Location: {event.location}</p>
      <p>Timestamp: {new Date(event.timestamp).toLocaleString()}</p>
      <p>Confidence: {(event.confidence * 100).toFixed(1)}%</p>
      <pre>{JSON.stringify(event.details, null, 2)}</pre>
      {event.image_url ? (
        <img
          src={`${API_BASE_URL}${event.image_url}`}
          alt="Dumping evidence"
          style={{ maxWidth: "100%", borderRadius: "12px", marginBottom: "16px" }}
        />
      ) : (
        <p>No image was captured for this event.</p>
      )}
      {event.video_url ? (
        <video
          src={`${API_BASE_URL}${event.video_url}`}
          controls
          playsInline
          preload="metadata"
          style={{ width: "100%", borderRadius: "12px" }}
        />
      ) : (
        <p>No video was captured for this event.</p>
      )}
    </div>
  );
}

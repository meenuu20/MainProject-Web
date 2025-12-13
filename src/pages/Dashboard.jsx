// src/pages/Dashboard.jsx
import React from "react";

export default function Dashboard(){
  return (
    <div className="container">
      <div className="card">
        <h2>Admin Dashboard</h2>
        <p className="muted">Overview of cameras, system health and pending tasks.</p>

        <div className="grid two-col" style={{marginTop:16}}>
          <div className="card small-card">
            <h4>Devices</h4>
            <ul>
              <li>CAM-01 — Online</li>
              <li>CAM-02 — Online</li>
              <li>CAM-03 — Offline</li>
            </ul>
          </div>

          <div className="card small-card">
            <h4>System Health</h4>
            <p className="muted">Inference latency, CPU usage and memory (demo values).</p>
            <ul>
              <li>Avg inference: 120 ms</li>
              <li>Uptime: 99.9%</li>
            </ul>
          </div>
        </div>

        <div style={{marginTop:16}} className="card">
          <h4>Pending Reports</h4>
          <div className="empty">No pending tasks — confirmed reports will appear here for field teams.</div>
        </div>
      </div>
    </div>
  );
}


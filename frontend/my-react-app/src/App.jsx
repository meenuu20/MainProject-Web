// src/App.jsx
import React from "react";
import { Routes, Route } from "react-router-dom";
import Nav from "./components/Nav.jsx";   // matches your file Nav.jsx
import Home from "./pages/Home.jsx";
import Alerts from "./pages/Alerts.jsx";
import EventDetail from "./pages/EventDetail.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Login from "./pages/Login.jsx";
import "./App.css";
import RequireAdmin from "./components/RequireAdmin";

export default function App() {
  return (
    <div className="app-root">
      <Nav />
      <div className="page-wrap">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/alerts/:id" element={<EventDetail />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<RequireAdmin><Dashboard /></RequireAdmin>} />
        </Routes>
      </div>
    </div>
  );
}

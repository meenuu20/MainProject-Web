// src/components/Nav.jsx
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import "../App.css"; // ensure global styles loaded (optional)

export default function Nav() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="brand">
          <span className="brand-accent">Smart</span>Waste
        </Link>

        <nav className="nav-links">
          <Link to="/">Home</Link>
          <Link to="/alerts">Alerts</Link>
          <Link to="/dashboard">Dashboard</Link>

          {user ? (
            <>
              <span style={{ marginLeft: 12, marginRight: 8 }}>{user.name}</span>
              <button className="btn-login" onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <Link to="/login" className="btn-login">Login</Link>
          )}
        </nav>
      </div>
    </header>
  );
}

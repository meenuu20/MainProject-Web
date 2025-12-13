import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem("smart_user");
    if (stored) {
      setUser(JSON.parse(stored));
    }
  }, []);

  function login(email, opts = {}) {
    const name = email.split("@")[0];
    const userObj = { email, name, role: opts.role || "admin" };
    localStorage.setItem("smart_user", JSON.stringify(userObj));
    setUser(userObj);
  }

  function logout() {
    localStorage.removeItem("smart_user");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
}

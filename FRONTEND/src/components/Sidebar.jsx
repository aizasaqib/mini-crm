import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/Customers.css";

const getUser = () => {
  try {
    const u = localStorage.getItem("user");
    if (!u || u === "undefined") return {};
    return JSON.parse(u);
  } catch { return {}; }
};

const NAV_ITEMS = [
  { path: "/dashboard", icon: "▦", label: "Overview" },
  { path: "/leads",     icon: "◎", label: "Leads" },
  { path: "/customers", icon: "●", label: "Customers" },
  { path: "/deals",     icon: "◇", label: "Deals" },
  { path: "/tasks",     icon: "✓", label: "Tasks" },
  { path: "/activities",icon: "◷", label: "Activities" },
  { path: "/reports",   icon: "▤", label: "Reports" },
];

/**
 * Shared Sidebar component used across all CRM pages.
 * Props:
 *   active  – current page path (e.g. "/dashboard") for highlighting
 */
const Sidebar = ({ active }) => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const user      = getUser();
  const activePath = active || location.pathname;

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  const initials = user.fullName
    ? user.fullName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <aside className="customers-sidebar">

      {/* LOGO */}
      <div className="customers-logo">
        <h2>Mini CRM</h2>
        <span>CRM</span>
      </div>

      {/* WORKSPACE */}
      <div className="sidebar-section">
        <p className="sidebar-title">WORKSPACE</p>
        {NAV_ITEMS.map(item => (
          <button
            key={item.path}
            className={`sidebar-item${activePath === item.path ? " active" : ""}`}
            onClick={() => navigate(item.path)}
          >
            <span>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </div>

      {/* MANAGE */}
      <div className="sidebar-section">
        <p className="sidebar-title">MANAGE</p>
      </div>

      {/* USER PROFILE WIDGET */}
      {user.fullName && (
        <button className="sidebar-user" onClick={() => navigate("/profile")}>
          <div className="sidebar-user-avatar">{initials}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user.fullName}</div>
            <div className="sidebar-user-email">{user.role || "ORG ADMIN"}</div>
          </div>
        </button>
      )}

      <button className="sidebar-item logout-item sidebar-logout" onClick={handleLogout}>
        <span>↪</span>Logout
      </button>
    </aside>
  );
};

export default Sidebar;

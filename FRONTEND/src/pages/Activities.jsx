import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Customers.css";
import Sidebar from "../components/Sidebar";

// Icon map for activity types
const TYPE_ICON = {
  Call:       "📞",
  Email:      "✉️",
  Meeting:    "🤝",
  Note:       "📝",
  "Follow-up":"🔔"
};

// Colour map for outcome badges
const OUTCOME_STYLE = {
  Positive: { background: "#dcfce7", color: "#16a34a" },
  Neutral:  { background: "#f3f4f6", color: "#6b7280" },
  Negative: { background: "#fee2e2", color: "#dc2626" },
  "":       { background: "#f3f4f6", color: "#9ca3af" }
};

const Activities = () => {
  const navigate = useNavigate();

  const getToken = () => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr || userStr === "undefined" || userStr === "null") return null;
      return JSON.parse(userStr).token || null;
    } catch { return null; }
  };

  const API = `${import.meta.env.VITE_API_URL}/api/activities`;

  // ── state ────────────────────────────────────────────────
  const [activities, setActivities] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showModal, setShowModal]   = useState(false);
  const [editActivity, setEditActivity] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [search, setSearch]         = useState("");
  const [typeFilter, setTypeFilter] = useState("All");

  const initialForm = {
    type:        "Call",
    title:       "",
    description: "",
    contactName: "",
    date:        new Date().toISOString().slice(0, 10),
    outcome:     ""
  };
  const [formData, setFormData]   = useState(initialForm);
  const [errors, setErrors]       = useState({});
  const [submitError, setSubmitError] = useState("");

  // ── fetch ─────────────────────────────────────────────────
  const fetchActivities = async () => {
    try {
      const token = getToken();
      if (!token) { navigate("/login"); return; }
      const res = await fetch(API, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setActivities(await res.json());
    } catch (err) {
      console.error("Failed to fetch activities", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchActivities(); }, []);

  // ── form helpers ──────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = "Title is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ── modals ────────────────────────────────────────────────
  const openAddModal = () => {
    setEditActivity(null);
    setFormData(initialForm);
    setErrors({});
    setSubmitError("");
    setShowModal(true);
  };

  const openEditModal = (activity) => {
    setEditActivity(activity);
    setFormData({
      type:        activity.type,
      title:       activity.title,
      description: activity.description || "",
      contactName: activity.contactName || "",
      date:        activity.date ? activity.date.slice(0, 10) : new Date().toISOString().slice(0, 10),
      outcome:     activity.outcome || ""
    });
    setErrors({});
    setSubmitError("");
    setOpenMenuId(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditActivity(null);
    setFormData(initialForm);
    setErrors({});
    setSubmitError("");
  };

  // ── save ──────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const token = getToken();
      if (!token) { navigate("/login"); return; }

      const url    = editActivity ? `${API}/${editActivity._id}` : API;
      const method = editActivity ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData)
      });

      if (res.ok) { fetchActivities(); closeModal(); }
      else {
        const err = await res.json().catch(() => ({}));
        setSubmitError(err.message || "Failed to save activity");
      }
    } catch {
      setSubmitError("Network error. Please try again.");
    }
  };

  // ── delete ────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this activity?")) return;
    try {
      const token = getToken();
      const res = await fetch(`${API}/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) fetchActivities();
      else alert("Failed to delete.");
    } catch { alert("Network error."); }
    setOpenMenuId(null);
  };

  // ── filter ────────────────────────────────────────────────
  const filtered = activities.filter(a => {
    const s = search.toLowerCase();
    const matchSearch =
      a.title.toLowerCase().includes(s) ||
      (a.contactName || "").toLowerCase().includes(s) ||
      (a.description || "").toLowerCase().includes(s);
    const matchType = typeFilter === "All" || a.type === typeFilter;
    return matchSearch && matchType;
  });

  // ── stats ─────────────────────────────────────────────────
  const total    = activities.length;
  const calls    = activities.filter(a => a.type === "Call").length;
  const emails   = activities.filter(a => a.type === "Email").length;
  const meetings = activities.filter(a => a.type === "Meeting").length;

  // ── date display ──────────────────────────────────────────
  const formatDate = (d) => {
    if (!d) return "-";
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  // ── render ────────────────────────────────────────────────
  return (
    <div className="customers-layout">

      {openMenuId && (
        <div style={{ position: "fixed", inset: 0, zIndex: 99 }} onClick={() => setOpenMenuId(null)} />
      )}

      {/* ================= SIDEBAR ================= */}
      <Sidebar active="/activities" />

      {/* ================= MAIN CONTENT ================= */}
      <main className="customers-content">
        <div className="customers-page">

          {/* HEADER */}
          <div className="customers-header">
            <div>
              <h1>Activities</h1>
              <p>Track every interaction — calls, emails, meetings and more.</p>
            </div>
            <button className="add-customer-btn" onClick={openAddModal}>+ Log Activity</button>
          </div>

          {/* STAT CARDS */}
          <div className="customer-stats">
            <div className="stat-card">
              <p>Total Activities</p>
              <h2>{total}</h2>
            </div>
            <div className="stat-card">
              <p>Calls</p>
              <h2>{calls}</h2>
            </div>
            <div className="stat-card">
              <p>Emails</p>
              <h2>{emails}</h2>
            </div>
            <div className="stat-card">
              <p>Meetings</p>
              <h2>{meetings}</h2>
            </div>
          </div>

          {/* TABLE CARD */}
          <div className="customers-card">

            {/* TOOLBAR */}
            <div className="customers-toolbar">
              <div className="customer-search">
                <span>⌕</span>
                <input
                  type="text"
                  placeholder="Search activities..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <select className="filter-btn" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                <option value="All">All Types</option>
                <option>Call</option>
                <option>Email</option>
                <option>Meeting</option>
                <option>Note</option>
                <option>Follow-up</option>
              </select>
            </div>

            {/* TABLE */}
            {loading ? (
              <div style={{ textAlign: "center", padding: "60px", color: "#667085" }}>
                <p>Loading activities...</p>
              </div>
            ) : (
              <div className="customers-table">

                {/* HEAD */}
                <div className="activity-table-head">
                  <span>Type</span>
                  <span>Title</span>
                  <span>Contact</span>
                  <span>Date</span>
                  <span>Outcome</span>
                  <span>Actions</span>
                </div>

                {/* ROWS */}
                {filtered.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "60px 0", color: "#98a2b3" }}>
                    <p style={{ fontSize: 36, marginBottom: 10 }}>◷</p>
                    <p style={{ fontSize: 16 }}>No activities found</p>
                  </div>
                ) : (
                  filtered.map(activity => (
                    <div className="activity-table-row" key={activity._id}>

                      {/* TYPE */}
                      <span className="activity-type-badge">
                        <span className="activity-icon">{TYPE_ICON[activity.type] || "•"}</span>
                        {activity.type}
                      </span>

                      {/* TITLE + DESC */}
                      <div className="task-info-cell">
                        <strong>{activity.title}</strong>
                        {activity.description && <span>{activity.description}</span>}
                      </div>

                      {/* CONTACT */}
                      <span>{activity.contactName || "-"}</span>

                      {/* DATE */}
                      <span>{formatDate(activity.date)}</span>

                      {/* OUTCOME */}
                      <span
                        className="activity-outcome"
                        style={OUTCOME_STYLE[activity.outcome] || OUTCOME_STYLE[""]}
                      >
                        {activity.outcome || "—"}
                      </span>

                      {/* ACTIONS */}
                      <span className="customer-actions">
                        <span className="action-menu">
                          <button
                            className="action-menu-btn"
                            onClick={() => setOpenMenuId(openMenuId === activity._id ? null : activity._id)}
                          >⋮</button>
                          {openMenuId === activity._id && (
                            <div className="action-dropdown">
                              <button className="edit-option" onClick={() => openEditModal(activity)}>✏ Edit</button>
                              <button className="delete-option" onClick={() => handleDelete(activity._id)}>🗑 Delete</button>
                            </div>
                          )}
                        </span>
                      </span>

                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* ================= MODAL ================= */}
          {showModal && (
            <div className="modal-overlay">
              <div className="customer-modal">

                <div className="modal-header">
                  <div>
                    <h2>{editActivity ? "Edit Activity" : "Log New Activity"}</h2>
                    <p>{editActivity ? "Update activity details." : "Record a customer interaction."}</p>
                  </div>
                  <button type="button" className="close-modal-btn" onClick={closeModal}>×</button>
                </div>

                <form className="customer-form" onSubmit={handleSubmit}>

                  {/* TYPE + DATE */}
                  <div className="form-row">
                    <div className="form-group">
                      <label>Activity Type</label>
                      <select name="type" value={formData.type} onChange={handleChange}>
                        <option>Call</option>
                        <option>Email</option>
                        <option>Meeting</option>
                        <option>Note</option>
                        <option>Follow-up</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Date</label>
                      <input type="date" name="date" value={formData.date} onChange={handleChange} />
                    </div>
                  </div>

                  {/* TITLE */}
                  <div className="form-group">
                    <label>Title</label>
                    <input
                      type="text"
                      name="title"
                      placeholder="e.g. Call with John about proposal"
                      value={formData.title}
                      onChange={handleChange}
                    />
                    {errors.title && <p className="error">{errors.title}</p>}
                  </div>

                  {/* CONTACT + OUTCOME */}
                  <div className="form-row">
                    <div className="form-group">
                      <label>Contact Name</label>
                      <input
                        type="text"
                        name="contactName"
                        placeholder="Who did you interact with?"
                        value={formData.contactName}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="form-group">
                      <label>Outcome</label>
                      <select name="outcome" value={formData.outcome} onChange={handleChange}>
                        <option value="">— None —</option>
                        <option>Positive</option>
                        <option>Neutral</option>
                        <option>Negative</option>
                      </select>
                    </div>
                  </div>

                  {/* DESCRIPTION */}
                  <div className="form-group">
                    <label>Notes / Description</label>
                    <textarea
                      name="description"
                      placeholder="Add details about this activity..."
                      value={formData.description}
                      onChange={handleChange}
                      rows="3"
                    />
                  </div>

                  {submitError && <p className="error" style={{ textAlign: "center", marginBottom: 8 }}>{submitError}</p>}

                  <div className="modal-actions">
                    <button type="button" className="cancel-btn" onClick={closeModal}>Cancel</button>
                    <button type="submit" className="save-customer-btn">
                      {editActivity ? "Update Activity" : "Log Activity"}
                    </button>
                  </div>

                </form>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default Activities;

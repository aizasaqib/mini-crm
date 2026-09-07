import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import "../styles/Dashboard.css";
import "../styles/Customers.css";

const getUser = () => {
  try {
    const u = localStorage.getItem("user");
    if (!u || u === "undefined") return {};
    return JSON.parse(u);
  } catch { return {}; }
};

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

const STAGE_COLORS = {
  "Prospecting": "#6366f1",
  "Proposal":    "#f59e0b",
  "Negotiation": "#3b82f6",
  "Closed Won":  "#10b981",
  "Closed Lost": "#ef4444",
};

function Dashboard() {
  const navigate = useNavigate();
  const user     = getUser();

  const [report,  setReport]  = useState(null);
  const [leads,   setLeads]   = useState([]);
  const [tasks,   setTasks]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [leadForm, setLeadForm] = useState({
    name: "", email: "", phone: "", status: "New", negotiationDate: ""
  });
  const [leadErrors, setLeadErrors] = useState({});

  const token = user.token;

  const headers = { Authorization: `Bearer ${token}` };
  const base    = import.meta.env.VITE_API_URL;

  useEffect(() => {
    if (!token) { navigate("/login"); return; }

    Promise.all([
      fetch(`${base}/api/reports`,  { headers }).then(r => r.json()),
      fetch(`${base}/api/leads`,    { headers }).then(r => r.json()),
      fetch(`${base}/api/tasks`,    { headers }).then(r => r.json()),
    ]).then(([rep, leds, tks]) => {
      setReport(rep);
      setLeads(Array.isArray(leds) ? leds.slice(0, 5) : []);
      setTasks(Array.isArray(tks)  ? tks.slice(0, 5)  : []);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleLeadChange = (event) => {
    const { name, value } = event.target;
    setLeadForm(previous => ({
      ...previous,
      [name]: value,
      ...(name === "status" && value !== "Negotiation" ? { negotiationDate: "" } : {})
    }));
    setLeadErrors(previous => ({ ...previous, [name]: "" }));
  };

  const handleLeadSubmit = async (event) => {
    event.preventDefault();
    const errors = {};
    if (!leadForm.name.trim()) errors.name = "Name is required";
    if (!leadForm.email.trim()) errors.email = "Email is required";
    if (leadForm.status === "Negotiation" && !leadForm.negotiationDate) {
      errors.negotiationDate = "Negotiation date and time are required";
    }
    if (Object.keys(errors).length) {
      setLeadErrors(errors);
      return;
    }

    try {
      const response = await fetch(`${base}/api/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify(leadForm)
      });
      const data = await response.json();
      if (!response.ok) {
        setLeadErrors({ general: data.message || "Unable to add lead" });
        return;
      }
      setLeads(previous => [data, ...previous].slice(0, 5));
      setLeadForm({ name: "", email: "", phone: "", status: "New", negotiationDate: "" });
      setLeadErrors({});
      setShowLeadModal(false);
    } catch {
      setLeadErrors({ general: "Unable to connect to the server" });
    }
  };

  const fmt = n => (n ?? 0).toLocaleString();

  const winRate = report
    ? report.deals.total > 0
      ? Math.round((report.deals.won / report.deals.total) * 100)
      : 0
    : 0;

  const taskPct = report && report.tasks.total > 0
    ? Math.round((report.tasks.completed / report.tasks.total) * 100)
    : 0;

  const maxStage = report?.deals?.byStage?.length
    ? Math.max(...report.deals.byStage.map(s => s.count), 1)
    : 1;

  const statusBadge = (s) => {
    const map = {
      "New":       "new-status",
      "Negotiation":"negotiation-status",
      "Qualified": "qualified-status",
      "Proposal":  "proposal-status",
      "Lost":      "lost-status",
    };
    return `status ${map[s] || "new-status"}`;
  };

  const priorityBadge = (p) => {
    const map = { High: "priority-high", Medium: "priority-medium", Low: "priority-low" };
    return `task-priority ${map[p] || "priority-medium"}`;
  };

  const formatDate = d => d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "-";

  if (loading) {
    return (
      <div className="customers-layout">
        <Sidebar active="/dashboard" />
        <main className="customers-content" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ textAlign: "center", color: "#667085" }}>
            <div className="report-spinner" style={{ margin: "0 auto 16px" }} />
            <p>Loading dashboard…</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="customers-layout">
      <Sidebar active="/dashboard" />

      <main className="customers-content">
        <div className="customers-page">

          {/* ── HEADER ── */}
          <div className="dash-header">
            <div>
              <h1>{greeting()}, {user.fullName?.split(" ")[0] ?? "there"}! 👋</h1>
              <p>Here's your CRM snapshot for today.</p>
            </div>
            <button className="add-customer-btn" onClick={() => setShowLeadModal(true)}>
              + Add Lead
            </button>
          </div>

          {/* ── TOP STAT CARDS ── */}
          <div className="dash-stat-grid">
            <div className="dash-stat-card" onClick={() => navigate("/leads")}>
              <div className="dash-stat-top">
                <span>Total Leads</span>
                <div className="dash-stat-icon" style={{ background: "#ede9fe", color: "#7c3aed" }}>◎</div>
              </div>
              <h2>{fmt(report?.leads?.total)}</h2>
              <p className="dash-stat-sub">Qualified: {report?.leads?.byStatus?.find(s => s._id === "Qualified")?.count ?? 0}</p>
            </div>

            <div className="dash-stat-card" onClick={() => navigate("/customers")}>
              <div className="dash-stat-top">
                <span>Customers</span>
                <div className="dash-stat-icon" style={{ background: "#dbeafe", color: "#2563eb" }}>●</div>
              </div>
              <h2>{fmt(report?.customers?.total)}</h2>
              <p className="dash-stat-sub">Active: {fmt(report?.customers?.active)}</p>
            </div>

            <div className="dash-stat-card" onClick={() => navigate("/deals")}>
              <div className="dash-stat-top">
                <span>Revenue Won</span>
                <div className="dash-stat-icon" style={{ background: "#dcfce7", color: "#16a34a" }}>$</div>
              </div>
              <h2>${fmt(report?.deals?.revenue)}</h2>
              <p className="dash-stat-sub">Pipeline: ${fmt(report?.deals?.pipelineValue)}</p>
            </div>

            <div className="dash-stat-card" onClick={() => navigate("/tasks")}>
              <div className="dash-stat-top">
                <span>Task Progress</span>
                <div className="dash-stat-icon" style={{ background: "#fef9c3", color: "#ca8a04" }}>✓</div>
              </div>
              <h2>{taskPct}%</h2>
              <p className="dash-stat-sub">{report?.tasks?.completed ?? 0} of {report?.tasks?.total ?? 0} done</p>
            </div>
          </div>

          {/* ── MIDDLE ROW ── */}
          <div className="dash-middle-row">

            {/* DEALS BY STAGE */}
            <div className="dash-card">
              <div className="dash-card-head">
                <div>
                  <h3>Deals by Stage</h3>
                  <p>{report?.deals?.total ?? 0} deals · ${fmt(report?.deals?.pipelineValue)} pipeline</p>
                </div>
                <button className="dash-link-btn" onClick={() => navigate("/deals")}>View all →</button>
              </div>
              {report?.deals?.byStage?.length === 0 ? (
                <p style={{ color: "#9ca3af", textAlign: "center", padding: "30px 0" }}>No deals yet</p>
              ) : (
                <div className="dash-bar-list">
                  {(report?.deals?.byStage || []).map(stage => (
                    <div key={stage._id} className="dash-bar-item">
                      <div className="dash-bar-meta">
                        <span>{stage._id}</span>
                        <strong>{stage.count}</strong>
                      </div>
                      <div className="dash-bar-track">
                        <div
                          className="dash-bar-fill"
                          style={{
                            width: `${(stage.count / maxStage) * 100}%`,
                            background: STAGE_COLORS[stage._id] || "#6366f1"
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* WIN RATE RING */}
            <div className="dash-card dash-ring-card">
              <div className="dash-card-head">
                <div>
                  <h3>Win Rate</h3>
                  <p>Closed Won vs total deals</p>
                </div>
              </div>
              <div className="dash-ring-wrap">
                <svg viewBox="0 0 120 120" width="150" height="150">
                  <circle cx="60" cy="60" r="50" fill="none" stroke="#f3f4f6" strokeWidth="14" />
                  <circle
                    cx="60" cy="60" r="50"
                    fill="none" stroke="#10b981" strokeWidth="14"
                    strokeDasharray={`${2 * Math.PI * 50}`}
                    strokeDashoffset={`${2 * Math.PI * 50 * (1 - winRate / 100)}`}
                    strokeLinecap="round"
                    transform="rotate(-90 60 60)"
                  />
                  <text x="60" y="58" textAnchor="middle" fontSize="20" fontWeight="800" fill="#101828">{winRate}%</text>
                  <text x="60" y="74" textAnchor="middle" fontSize="10" fill="#667085">win rate</text>
                </svg>
              </div>
              <div className="dash-ring-stats">
                <div><strong style={{ color: "#10b981" }}>{report?.deals?.won ?? 0}</strong><p>Won</p></div>
                <div><strong style={{ color: "#ef4444" }}>{report?.deals?.lost ?? 0}</strong><p>Lost</p></div>
                <div><strong style={{ color: "#6366f1" }}>{(report?.deals?.total ?? 0) - (report?.deals?.won ?? 0) - (report?.deals?.lost ?? 0)}</strong><p>Active</p></div>
              </div>
            </div>
          </div>

          {/* ── BOTTOM ROW ── */}
          <div className="dash-bottom-row">

            {/* RECENT LEADS */}
            <div className="dash-card">
              <div className="dash-card-head">
                <div>
                  <h3>Recent Leads</h3>
                  <p>Latest sales opportunities</p>
                </div>
                <button className="dash-link-btn" onClick={() => navigate("/leads")}>View all →</button>
              </div>
              <div className="dash-table">
                <div className="dash-table-head">
                  <span>Name</span>
                  <span>Email</span>
                  <span>Status</span>
                </div>
                {leads.length === 0 ? (
                  <p style={{ color: "#9ca3af", textAlign: "center", padding: "24px 0" }}>No leads yet — <button onClick={() => setShowLeadModal(true)} style={{ color: "#6366f1", border: "none", background: "none", cursor: "pointer", fontWeight: 600 }}>add one</button></p>
                ) : leads.map(lead => (
                  <div className="dash-table-row" key={lead._id}>
                    <span style={{ fontWeight: 600, color: "#101828" }}>{lead.name}</span>
                    <span style={{ color: "#667085", fontSize: 13 }}>{lead.email}</span>
                    <span className={statusBadge(lead.status)}>{lead.status}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* UPCOMING TASKS */}
            <div className="dash-card">
              <div className="dash-card-head">
                <div>
                  <h3>Upcoming Tasks</h3>
                  <p>Your pending work items</p>
                </div>
                <button className="dash-link-btn" onClick={() => navigate("/tasks")}>View all →</button>
              </div>
              <div className="dash-task-list">
                {tasks.length === 0 ? (
                  <p style={{ color: "#9ca3af", textAlign: "center", padding: "24px 0" }}>No tasks — <button onClick={() => navigate("/tasks")} style={{ color: "#6366f1", border: "none", background: "none", cursor: "pointer", fontWeight: 600 }}>create one</button></p>
                ) : tasks.map(task => (
                  <div className="dash-task-item" key={task._id}>
                    <div className="dash-task-left">
                      <span className={priorityBadge(task.priority)}>{task.priority}</span>
                      <div>
                        <p className="dash-task-title">{task.title}</p>
                        <p className="dash-task-due">Due {formatDate(task.dueDate)}</p>
                      </div>
                    </div>
                    <span className={`task-status status-${(task.status || "").toLowerCase().replace(" ", "-")}`}>
                      {task.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {showLeadModal && (
            <div className="modal-overlay" onClick={() => setShowLeadModal(false)}>
              <div className="customer-modal" onClick={event => event.stopPropagation()}>
                <div className="modal-header">
                  <div>
                    <h2>Add New Lead</h2>
                    <p>Add a new sales opportunity.</p>
                  </div>
                  <button type="button" className="close-modal-btn" onClick={() => setShowLeadModal(false)}>×</button>
                </div>
                <form className="customer-form" onSubmit={handleLeadSubmit}>
                  {leadErrors.general && <p className="error">{leadErrors.general}</p>}
                  <div className="form-group">
                    <label>Name</label>
                    <input name="name" value={leadForm.name} onChange={handleLeadChange} placeholder="Enter full name" />
                    {leadErrors.name && <p className="error">{leadErrors.name}</p>}
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input type="email" name="email" value={leadForm.email} onChange={handleLeadChange} placeholder="Enter email" />
                    {leadErrors.email && <p className="error">{leadErrors.email}</p>}
                  </div>
                  <div className="form-group">
                    <label>Phone</label>
                    <input name="phone" value={leadForm.phone} onChange={handleLeadChange} placeholder="Enter phone number" />
                  </div>
                  <div className="form-group">
                    <label>Status</label>
                    <select name="status" value={leadForm.status} onChange={handleLeadChange}>
                      <option value="New">New</option>
                      <option value="Negotiation">Negotiation</option>
                      <option value="Qualified">Qualified</option>
                      <option value="Lost">Lost</option>
                    </select>
                  </div>
                  {leadForm.status === "Negotiation" && (
                    <div className="form-group">
                      <label>Negotiation Date and Time</label>
                      <input type="datetime-local" name="negotiationDate" value={leadForm.negotiationDate} onChange={handleLeadChange} required />
                      {leadErrors.negotiationDate && <p className="error">{leadErrors.negotiationDate}</p>}
                    </div>
                  )}
                  <div className="modal-actions">
                    <button type="button" className="cancel-btn" onClick={() => setShowLeadModal(false)}>Cancel</button>
                    <button type="submit" className="save-customer-btn">Add Lead</button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

export default Dashboard;
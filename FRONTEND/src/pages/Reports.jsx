import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Customers.css";
import "../styles/Reports.css";
import Sidebar from "../components/Sidebar";

const Reports = () => {
  const navigate = useNavigate();

  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  const getToken = () => {
    try {
      return getUser().token || null;
    } catch { return null; }
  };

  // ── fetch aggregate report ────────────────────────────────
  useEffect(() => {
    const fetchReport = async () => {
      try {
        const token = getToken();
        if (!token) { navigate("/login"); return; }

        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/reports`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.ok) {
          setData(await res.json());
        } else {
          setError("Failed to load report data.");
        }
      } catch {
        setError("Network error. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, []);

  // ── helper: get count for a status from byStatus array ───
  const getCount = (arr, key) => {
    if (!arr) return 0;
    const found = arr.find(i => i._id === key);
    return found ? found.count : 0;
  };

  // ── deal stage colours ────────────────────────────────────
  const stageColour = {
    "Prospecting": "#6366f1",
    "Proposal":    "#f59e0b",
    "Negotiation": "#3b82f6",
    "Closed Won":  "#10b981",
    "Closed Lost": "#ef4444",
  };

  // ── activity type colours ─────────────────────────────────
  const typeColour = {
    "Call":      "#6366f1",
    "Email":     "#3b82f6",
    "Meeting":   "#10b981",
    "Note":      "#f59e0b",
    "Follow-up": "#ec4899",
  };

  // ── loading / error states ────────────────────────────────
  if (loading) {
    return (
      <div className="customers-layout">
        <Sidebar active="/reports" />
        <main className="customers-content">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#667085", flexDirection: "column", gap: 14 }}>
            <div className="report-spinner" />
            <p style={{ fontSize: 16 }}>Loading report data…</p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="customers-layout">
        <Sidebar active="/reports" />
        <main className="customers-content">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#ef4444", flexDirection: "column", gap: 14 }}>
            <p style={{ fontSize: 22 }}>⚠️</p>
            <p style={{ fontSize: 16 }}>{error}</p>
            <button className="add-customer-btn" onClick={() => window.location.reload()}>Retry</button>
          </div>
        </main>
      </div>
    );
  }

  const { customers, leads, deals, tasks, activities } = data;

  // total deal pipeline max for percentage bars
  const allStages = deals?.byStage || [];
  const maxDealsCount = Math.max(...allStages.map(s => s.count), 1);

  const allTypes = activities?.byType || [];
  const maxActivities = Math.max(...allTypes.map(t => t.count), 1);

  const tasksDone = tasks?.completed || 0;
  const tasksTotal = tasks?.total || 1;
  const completionRate = Math.round((tasksDone / tasksTotal) * 100);

  return (
    <div className="customers-layout">
      <Sidebar active="/reports" />

      <main className="customers-content">
        <div className="customers-page">

          {/* HEADER */}
          <div className="customers-header">
            <div>
              <h1>Reports</h1>
              <p>A complete snapshot of your CRM activity.</p>
            </div>
            <button className="add-customer-btn" onClick={() => window.location.reload()}>
              ↻ Refresh
            </button>
          </div>

          {/* ── TOP OVERVIEW CARDS ── */}
          <div className="customer-stats">
            <div className="stat-card">
              <p>Total Customers</p>
              <h2>{customers?.total ?? 0}</h2>
              <span className="stat-sub">Active: {customers?.active ?? 0}</span>
            </div>
            <div className="stat-card">
              <p>Total Leads</p>
              <h2>{leads?.total ?? 0}</h2>
              <span className="stat-sub">Qualified: {getCount(leads?.byStatus, "Qualified")}</span>
            </div>
            <div className="stat-card">
              <p>Revenue (Won)</p>
              <h2>${(deals?.revenue ?? 0).toLocaleString()}</h2>
              <span className="stat-sub">Pipeline: ${(deals?.pipelineValue ?? 0).toLocaleString()}</span>
            </div>
            <div className="stat-card">
              <p>Tasks Done</p>
              <h2>{completionRate}%</h2>
              <span className="stat-sub">{tasksDone} of {tasks?.total ?? 0}</span>
            </div>
          </div>

          {/* ── ROW 1: Deals Pipeline + Leads Breakdown ── */}
          <div className="report-row">

            {/* DEALS BY STAGE */}
            <div className="report-card">
              <div className="report-card-header">
                <h3>Deals by Stage</h3>
                <span className="report-badge">{deals?.total ?? 0} total</span>
              </div>
              {allStages.length === 0 ? (
                <p className="report-empty">No deals yet</p>
              ) : (
                <div className="report-bar-list">
                  {allStages.map(stage => (
                    <div key={stage._id} className="report-bar-item">
                      <div className="report-bar-label">
                        <span>{stage._id}</span>
                        <span className="report-bar-count">{stage.count}</span>
                      </div>
                      <div className="report-bar-track">
                        <div
                          className="report-bar-fill"
                          style={{
                            width: `${(stage.count / maxDealsCount) * 100}%`,
                            background: stageColour[stage._id] || "#6366f1"
                          }}
                        />
                      </div>
                      <div className="report-bar-value">${(stage.value || 0).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* LEADS BY STATUS */}
            <div className="report-card">
              <div className="report-card-header">
                <h3>Leads by Status</h3>
                <span className="report-badge">{leads?.total ?? 0} total</span>
              </div>
              {(!leads?.byStatus || leads.byStatus.length === 0) ? (
                <p className="report-empty">No leads yet</p>
              ) : (
                <div className="report-donut-grid">
                  {leads.byStatus.map(s => (
                    <div key={s._id} className="report-donut-item">
                      <div className="report-donut-circle" style={{ "--pct": `${Math.round((s.count / leads.total) * 100)}%` }}>
                        <span className="report-donut-num">{s.count}</span>
                      </div>
                      <span className="report-donut-label">{s._id}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── ROW 2: Tasks + Activities ── */}
          <div className="report-row">

            {/* TASK COMPLETION */}
            <div className="report-card">
              <div className="report-card-header">
                <h3>Task Completion</h3>
                <span className="report-badge">{completionRate}% done</span>
              </div>

              {/* Big progress ring */}
              <div className="report-progress-ring-wrap">
                <svg viewBox="0 0 120 120" width="140" height="140">
                  <circle cx="60" cy="60" r="50" fill="none" stroke="#f3f4f6" strokeWidth="12" />
                  <circle
                    cx="60" cy="60" r="50"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="12"
                    strokeDasharray={`${2 * Math.PI * 50}`}
                    strokeDashoffset={`${2 * Math.PI * 50 * (1 - completionRate / 100)}`}
                    strokeLinecap="round"
                    transform="rotate(-90 60 60)"
                  />
                  <text x="60" y="66" textAnchor="middle" fontSize="18" fontWeight="700" fill="#101828">{completionRate}%</text>
                </svg>
              </div>

              <div className="report-task-row-stats">
                <div className="report-task-stat pending-dot">
                  <span>{tasks?.pending ?? 0}</span><p>Pending</p>
                </div>
                <div className="report-task-stat progress-dot">
                  <span>{tasks?.inProgress ?? 0}</span><p>In Progress</p>
                </div>
                <div className="report-task-stat done-dot">
                  <span>{tasks?.completed ?? 0}</span><p>Completed</p>
                </div>
              </div>
            </div>

            {/* ACTIVITIES BY TYPE */}
            <div className="report-card">
              <div className="report-card-header">
                <h3>Activities by Type</h3>
                <span className="report-badge">{activities?.total ?? 0} logged</span>
              </div>
              {allTypes.length === 0 ? (
                <p className="report-empty">No activities logged yet</p>
              ) : (
                <div className="report-bar-list">
                  {allTypes.map(t => (
                    <div key={t._id} className="report-bar-item">
                      <div className="report-bar-label">
                        <span>{t._id}</span>
                        <span className="report-bar-count">{t.count}</span>
                      </div>
                      <div className="report-bar-track">
                        <div
                          className="report-bar-fill"
                          style={{
                            width: `${(t.count / maxActivities) * 100}%`,
                            background: typeColour[t._id] || "#6366f1"
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── ROW 3: Tasks by Priority ── */}
          <div className="report-row single">
            <div className="report-card wide">
              <div className="report-card-header">
                <h3>Tasks by Priority</h3>
              </div>
              <div className="report-priority-cards">
                {[
                  { label: "High",   key: "High",   color: "#dc2626", bg: "#fee2e2" },
                  { label: "Medium", key: "Medium", color: "#d97706", bg: "#fef3c7" },
                  { label: "Low",    key: "Low",    color: "#16a34a", bg: "#dcfce7" },
                ].map(p => (
                  <div key={p.key} className="report-priority-card" style={{ background: p.bg }}>
                    <h4 style={{ color: p.color }}>{getCount(tasks?.byPriority, p.key)}</h4>
                    <p style={{ color: p.color }}>{p.label} Priority</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default Reports;

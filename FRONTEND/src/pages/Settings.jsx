import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import "../styles/Customers.css";

const getUser = () => {
  try {
    const u = localStorage.getItem("user");
    if (!u || u === "undefined") return {};
    return JSON.parse(u);
  } catch { return {}; }
};

const BASE = import.meta.env.VITE_API_URL;

const Settings = () => {
  const navigate = useNavigate();
  const user     = getUser();
  const token    = user.token;

  // ── Toast ─────────────────────────────────────────────────
  const [toast, setToast] = useState({ msg: "", type: "success" });
  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "success" }), 3000);
  };

  const hdrs = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  // ── Profile ───────────────────────────────────────────────
  const [profile, setProfile] = useState({ fullName: "", email: "", phone: "" });
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    if (!token) { navigate("/login"); return; }
    fetch(`${BASE}/api/profile`, { headers: hdrs })
      .then(r => r.json())
      .then(d => {
        if (d._id) {
          setProfile({ fullName: d.fullName || "", email: d.email || "", phone: d.phone || "" });
        }
      })
      .catch(() => showToast("Could not load profile", "error"));
  }, []);

  const saveProfile = async () => {
    if (!profile.fullName.trim()) { showToast("Full name is required", "error"); return; }
    setProfileLoading(true);
    try {
      const res = await fetch(`${BASE}/api/profile`, {
        method: "PUT",
        headers: hdrs,
        body: JSON.stringify({ fullName: profile.fullName, phone: profile.phone }),
      });
      const data = await res.json();
      if (res.ok) {
        // Update localStorage so sidebar reflects new name immediately
        const stored = getUser();
        localStorage.setItem("user", JSON.stringify({ ...stored, fullName: profile.fullName }));
        showToast("Profile saved successfully!");
      } else {
        showToast(data.message || "Failed to save profile", "error");
      }
    } catch { showToast("Network error", "error"); }
    setProfileLoading(false);
  };

  // ── Password ──────────────────────────────────────────────
  const [passwords, setPasswords] = useState({ current: "", newPass: "", confirm: "" });
  const [passLoading, setPassLoading] = useState(false);

  const changePassword = async () => {
    if (!passwords.current || !passwords.newPass || !passwords.confirm) {
      showToast("All password fields are required", "error"); return;
    }
    if (passwords.newPass !== passwords.confirm) {
      showToast("New passwords do not match", "error"); return;
    }
    if (passwords.newPass.length < 6) {
      showToast("New password must be at least 6 characters", "error"); return;
    }
    setPassLoading(true);
    try {
      const res = await fetch(`${BASE}/api/profile/password`, {
        method: "PUT",
        headers: hdrs,
        body: JSON.stringify({ currentPassword: passwords.current, newPassword: passwords.newPass }),
      });
      const data = await res.json();
      if (res.ok) {
        setPasswords({ current: "", newPass: "", confirm: "" });
        showToast("Password changed successfully!");
      } else {
        showToast(data.message || "Failed to change password", "error");
      }
    } catch { showToast("Network error", "error"); }
    setPassLoading(false);
  };

  // ── Helpers ───────────────────────────────────────────────
  const Field = ({ label, value, onChange, type = "text", disabled = false, placeholder = "" }) => (
    <div className="form-group">
      <label>{label}</label>
      <input
        type={type} value={value} onChange={onChange} disabled={disabled}
        placeholder={placeholder}
        style={disabled ? { background: "#f9fafb", color: "#9ca3af" } : {}}
      />
    </div>
  );

  return (
    <div className="customers-layout">
      <Sidebar active="/profile" />

      <main className="customers-content">
        <div className="customers-page">

          {/* HEADER */}
          <div className="customers-header">
            <div>
              <h1>Profile Settings</h1>
              <p>Manage your profile and account security.</p>
            </div>
            {toast.msg && (
              <div
                className="settings-saved-toast"
                style={toast.type === "error" ? {
                  background: "#fee2e2", color: "#dc2626", border: "1px solid #fecaca"
                } : {}}
              >
                {toast.type === "error" ? "❌" : "✅"} {toast.msg}
              </div>
            )}
          </div>

          <div className="settings-grid">

            {/* ── PROFILE ── */}
            <div className="customers-card settings-section">
              <div className="settings-section-head">
                <div className="settings-icon-wrap" style={{ background: "#ede9fe" }}>👤</div>
                <div><h3>Profile Information</h3><p>Your personal account details</p></div>
              </div>
              <div className="form-row">
                <Field
                  label="Full Name"
                  value={profile.fullName}
                  onChange={e => setProfile(p => ({ ...p, fullName: e.target.value }))}
                  placeholder="Your full name"
                />
                <Field
                  label="Email Address"
                  value={profile.email}
                  onChange={() => {}}
                  disabled
                  placeholder="Your email"
                />
              </div>
              <Field
                label="Phone Number"
                value={profile.phone}
                onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
                placeholder="+1 (555) 000-0000"
              />
              <div className="settings-actions">
                <button className="save-customer-btn" onClick={saveProfile} disabled={profileLoading}>
                  {profileLoading ? "Saving…" : "Save Profile"}
                </button>
              </div>
            </div>

            {/* ── CHANGE PASSWORD ── */}
            <div className="customers-card settings-section">
              <div className="settings-section-head">
                <div className="settings-icon-wrap" style={{ background: "#fef3c7" }}>🔒</div>
                <div><h3>Change Password</h3><p>Update your security credentials</p></div>
              </div>
              <Field
                label="Current Password"
                value={passwords.current}
                type="password"
                onChange={e => setPasswords(p => ({ ...p, current: e.target.value }))}
                placeholder="••••••••"
              />
              <div className="form-row">
                <Field
                  label="New Password"
                  value={passwords.newPass}
                  type="password"
                  onChange={e => setPasswords(p => ({ ...p, newPass: e.target.value }))}
                  placeholder="••••••••"
                />
                <Field
                  label="Confirm New Password"
                  value={passwords.confirm}
                  type="password"
                  onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))}
                  placeholder="••••••••"
                />
              </div>
              <div className="settings-actions">
                <button className="save-customer-btn" onClick={changePassword} disabled={passLoading}>
                  {passLoading ? "Updating…" : "Update Password"}
                </button>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;

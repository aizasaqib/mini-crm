import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Customers.css";
import Sidebar from "../components/Sidebar";

const Leads = () => {

    const navigate = useNavigate();

    const getToken = () => {
        try {
            const userStr = localStorage.getItem("user");
            if (!userStr || userStr === "undefined" || userStr === "null") return null;
            return JSON.parse(userStr).token || null;
        } catch {
            return null;
        }
    };

    // Controls whether the Add Lead modal is visible
    const [showModal, setShowModal] = useState(false);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [openMenuId, setOpenMenuId] = useState(null);
    
    // Lead list
    const [leads, setLeads] = useState([]);

    const fetchLeads = async () => {
        try {
            const token = getToken();
            if (!token) { navigate("/login"); return; }
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/leads`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setLeads(data);
            } else {
                console.error("Failed to fetch leads:", res.status);
            }
        } catch (error) {
            console.error("Failed to fetch leads", error);
        }
    };

    useEffect(() => {
        fetchLeads();
    }, []);

    const [editLead, setEditLead] = useState(null);

    // Form data
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        status: "New",
        negotiationDate: ""
    });

    const [errors, setErrors] = useState({});
    const [successMessage, setSuccessMessage] = useState("");

    const handleEdit = (lead) => {
        setFormData({
            name: lead.name || "",
            email: lead.email || "",
            phone: lead.phone || "",
            status: lead.status || "New",
            negotiationDate: lead.negotiationDate
                ? new Date(lead.negotiationDate).toISOString().slice(0, 16)
                : ""
        });
        setEditLead(lead);
        setErrors({});
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        try {
            const token = getToken();
            if (!token) { navigate("/login"); return; }
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/leads/${id}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                fetchLeads();
                setSuccessMessage("Lead deleted successfully.");
            }
            else setErrors({ general: "Failed to delete lead." });
        } catch { setErrors({ general: "Network error." }); }
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = "Name is required";
        if (!formData.email.trim()) newErrors.email = "Email is required";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
            ...(name === "status" && value !== "Negotiation" ? { negotiationDate: "" } : {})
        });
        if(errors[name]) setErrors({ ...errors, [name]: "" });
    };

    // Add new lead
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        setSuccessMessage("");

        try {
            const token = getToken();
            if (!token) { navigate("/login"); return; }

            const url = editLead
                ? `${import.meta.env.VITE_API_URL}/api/leads/${editLead._id}`
                : `${import.meta.env.VITE_API_URL}/api/leads`;
            const method = editLead ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({
                    ...formData,
                    negotiationDate: formData.status === "Negotiation" && formData.negotiationDate
                        ? new Date(formData.negotiationDate).toISOString()
                        : undefined,
                })
            });

            if (res.ok) {
                fetchLeads();
                setFormData({ name: "", email: "", phone: "", status: "New", negotiationDate: "" });
                setErrors({});
                setEditLead(null);
                setShowModal(false);
                setSuccessMessage(editLead ? "Lead updated successfully." : "Lead added successfully.");
            } else {
                const data = await res.json().catch(() => ({}));
                setErrors({ general: data.message || "Failed to save lead" });
            }
        } catch (error) {
            console.error("Error adding lead", error);
            setErrors({ general: "Unable to connect to the server" });
        }
    };

    const filteredLeads = leads.filter((lead) => {
        const matchesSearch =
            lead.name.toLowerCase().includes(search.toLowerCase()) ||
            lead.email.toLowerCase().includes(search.toLowerCase()) ||
            (lead.phone && lead.phone.includes(search));

        const matchesStatus =
            statusFilter === "All" || lead.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    return (
        <div className="customers-layout">
            {openMenuId && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setOpenMenuId(null)} />
            )}
            {/* ================= SIDEBAR ================= */}
            <Sidebar active="/leads" />

            {/* ================= MAIN CONTENT ================= */}
            <main className="customers-content">
                <div className="customers-page">
                    <div className="customers-header">
                        <div>
                            <h1>Leads</h1>
                            <p>Manage and keep track of your new sales opportunities.</p>
                        </div>
                        {successMessage && <p className="action-success-message">{successMessage}</p>}
                        <button className="add-customer-btn" onClick={() => setShowModal(true)}>+ Add Lead</button>
                    </div>

                    {/* STAT CARDS */}
                    <div className="customer-stats">
                        <div className="stat-card">
                            <p>Total Leads</p>
                            <h2>{leads.length}</h2>
                        </div>
                        <div className="stat-card">
                            <p>New Leads</p>
                            <h2>{leads.filter(l => l.status === "New").length}</h2>
                        </div>
                        <div className="stat-card">
                            <p>Qualified</p>
                            <h2>{leads.filter(l => l.status === "Qualified").length}</h2>
                        </div>
                        <div className="stat-card">
                            <p>Lost</p>
                            <h2>{leads.filter(l => l.status === "Lost").length}</h2>
                        </div>
                    </div>

                    <div className="customers-card">
                        <div className="customers-toolbar">
                            <div className="customer-search">
                                <span>⌕</span>
                                <input type="text" placeholder="Search leads..." value={search} onChange={(e) => setSearch(e.target.value)} />
                            </div>
                            <select className="filter-btn" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                                <option value="All">All</option>
                                <option value="New">New</option>
                                <option value="Negotiation">Negotiation</option>
                                <option value="Qualified">Qualified</option>
                                <option value="Lost">Lost</option>
                            </select>
                        </div>

                        <div className="customers-table leads-table">
                            <div className="leads-table-head">
                                <span>Lead</span>
                                <span>Email</span>
                                <span>Phone</span>
                                <span>Status</span>
                                <span>Actions</span>
                            </div>
                            {filteredLeads.map((lead, index) => (
                                    <div className="leads-table-row" key={index}>
                                        <span>{lead.name}</span>
                                        <span>{lead.email}</span>
                                        <span>{lead.phone || '-'}</span>
                                        <span className="status active-status">{lead.status}</span>
                                        <span className="customer-actions">
                                            <span className="action-menu">
                                                <button
                                                    className="action-menu-btn"
                                                    onClick={() => setOpenMenuId(openMenuId === lead._id ? null : lead._id)}
                                                >⋮</button>
                                                {openMenuId === lead._id && (
                                                    <div className="action-dropdown">
                                                        <button className="edit-option" onClick={() => { handleEdit(lead); setOpenMenuId(null); }}>✏ Edit</button>
                                                        <button className="delete-option" onClick={() => { handleDelete(lead._id); setOpenMenuId(null); }}>🗑 Delete</button>
                                                    </div>
                                                )}
                                            </span>
                                        </span>
                                    </div>
                            ))}
                        </div>
                    </div>

                    {/* ================= ADD LEAD MODAL ================= */}
                    {showModal && (
                        <div className="modal-overlay">
                            <div className="customer-modal">
                                <div className="modal-header">
                                    <div>
                                        <h2>{editLead ? "Edit Lead" : "Add New Lead"}</h2>
                                        <p>{editLead ? "Update lead details." : "Add a new sales opportunity."}</p>
                                    </div>
                                    <button type="button" className="close-modal-btn" onClick={() => { setShowModal(false); setEditLead(null); }}>×</button>
                                </div>
                                <form className="customer-form" onSubmit={handleSubmit}>
                                    <div className="form-group">
                                        <label>Name</label>
                                        <input type="text" name="name" placeholder="Enter full name" value={formData.name} onChange={handleChange} />
                                        {errors.name && <p className="error">{errors.name}</p>}
                                    </div>
                                    <div className="form-group">
                                        <label>Email</label>
                                        <input type="email" name="email" placeholder="Enter email" value={formData.email} onChange={handleChange} />
                                        {errors.email && <p className="error">{errors.email}</p>}
                                    </div>
                                    <div className="form-group">
                                        <label>Phone</label>
                                        <input type="text" name="phone" placeholder="Enter phone number" value={formData.phone} onChange={handleChange} />
                                    </div>
                                    <div className="form-group">
                                        <label>Status</label>
                                        <select name="status" value={formData.status} onChange={handleChange}>
                                            <option value="New">New</option>
                                            <option value="Negotiation">Negotiation</option>
                                            <option value="Qualified">Qualified</option>
                                            <option value="Lost">Lost</option>
                                        </select>
                                    </div>
                                    {formData.status === "Negotiation" && (
                                        <div className="form-group">
                                            <label>Negotiation Date and Time</label>
                                            <input
                                                type="datetime-local"
                                                name="negotiationDate"
                                                value={formData.negotiationDate}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                    )}
                                    {errors.general && <p className="error">{errors.general}</p>}
                                    <div className="modal-actions">
                                        <button type="button" className="cancel-btn" onClick={() => setShowModal(false)}>Cancel</button>
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
};

export default Leads;

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Customers.css";
import Sidebar from "../components/Sidebar";

const Deals = () => {

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

    // Controls whether the Add Deal modal is visible
    const [showModal, setShowModal] = useState(false);
    const [search, setSearch] = useState("");
    const [stageFilter, setStageFilter] = useState("All");
    const [openMenuId, setOpenMenuId] = useState(null);
    
    // Deal list
    const [deals, setDeals] = useState([]);
    const [customers, setCustomers] = useState([]);

    const fetchDeals = async () => {
        try {
            const token = getToken();
            if (!token) { navigate("/login"); return; }
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/deals`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setDeals(data);
            } else {
                console.error("Failed to fetch deals:", res.status);
            }
        } catch (error) {
            console.error("Failed to fetch deals", error);
        }
    };

    useEffect(() => {
        fetchDeals();
        const token = getToken();
        if (token) {
            fetch(`${import.meta.env.VITE_API_URL}/api/customers`, {
                headers: { "Authorization": `Bearer ${token}` }
            }).then(res => res.ok ? res.json() : []).then(setCustomers).catch(() => {});
        }
    }, []);

    const [editDeal, setEditDeal] = useState(null);

    // Form data
    const [formData, setFormData] = useState({
        title: "",
        value: "",
        stage: "Prospecting",
        customer: ""
    });

    const [errors, setErrors] = useState({});
    const [successMessage, setSuccessMessage] = useState("");

    const handleEdit = (deal) => {
        setFormData({
            title: deal.title || "",
            value: deal.value || "",
            stage: deal.stage || "Prospecting",
            customer: deal.customer?._id || deal.customer || ""
        });
        setEditDeal(deal);
        setErrors({});
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        try {
            const token = getToken();
            if (!token) { navigate("/login"); return; }
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/deals/${id}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                fetchDeals();
                setSuccessMessage("Deal deleted successfully.");
            }
            else setErrors({ general: "Failed to delete deal." });
        } catch { setErrors({ general: "Network error." }); }
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.title.trim()) newErrors.title = "Title is required";
        if (!formData.value) newErrors.value = "Value is required";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        if(errors[name]) setErrors({ ...errors, [name]: "" });
    };

    // Add new deal
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        setSuccessMessage("");

        try {
            const token = getToken();
            if (!token) { navigate("/login"); return; }

            const dealData = {
                ...formData,
                value: Number(formData.value),
                ...(formData.customer ? { customer: formData.customer } : { customer: undefined })
            };
            const url = editDeal
                ? `${import.meta.env.VITE_API_URL}/api/deals/${editDeal._id}`
                : `${import.meta.env.VITE_API_URL}/api/deals`;
            const method = editDeal ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify(dealData)
            });

            if (res.ok) {
                fetchDeals();
                setFormData({ title: "", value: "", stage: "Prospecting", customer: "" });
                setErrors({});
                setEditDeal(null);
                setShowModal(false);
                setSuccessMessage(editDeal ? "Deal updated successfully." : "Deal added successfully.");
            } else {
                const data = await res.json().catch(() => ({}));
                setErrors({ general: data.message || "Failed to save deal" });
            }
        } catch (error) {
            console.error("Error adding deal", error);
            setErrors({ general: "Unable to connect to the server" });
        }
    };

    const filteredDeals = deals.filter((deal) => {
        const matchesSearch =
            (deal.title || "").toLowerCase().includes(search.toLowerCase());

        const matchesStage =
            stageFilter === "All" || deal.stage === stageFilter;

        return matchesSearch && matchesStage;
    });

    return (
        <div className="customers-layout">
            {openMenuId && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setOpenMenuId(null)} />
            )}
            {/* ================= SIDEBAR ================= */}
            <Sidebar active="/deals" />

            {/* ================= MAIN CONTENT ================= */}
            <main className="customers-content">
                <div className="customers-page">
                    <div className="customers-header">
                        <div>
                            <h1>Deals</h1>
                            <p>Track your pipeline and closed deals.</p>
                        </div>
                        {successMessage && <p className="action-success-message">{successMessage}</p>}
                        <button className="add-customer-btn" onClick={() => setShowModal(true)}>+ Add Deal</button>
                    </div>

                    {/* STAT CARDS */}
                    <div className="customer-stats">
                        <div className="stat-card">
                            <p>Total Deals</p>
                            <h2>{deals.length}</h2>
                        </div>
                        <div className="stat-card">
                            <p>Won Deals</p>
                            <h2>{deals.filter(d => d.stage === "Closed Won").length}</h2>
                        </div>
                        <div className="stat-card">
                            <p>Pipeline Value</p>
                            <h2>${deals.filter(d => d.stage !== "Closed Lost").reduce((sum, d) => sum + (d.value || 0), 0).toLocaleString()}</h2>
                        </div>
                        <div className="stat-card">
                            <p>Avg Deal Size</p>
                            <h2>${deals.length ? Math.round(deals.reduce((sum, d) => sum + (d.value || 0), 0) / deals.length).toLocaleString() : 0}</h2>
                        </div>
                    </div>

                    <div className="customers-card">
                        <div className="customers-toolbar">
                            <div className="customer-search">
                                <span>⌕</span>
                                <input type="text" placeholder="Search deals..." value={search} onChange={(e) => setSearch(e.target.value)} />
                            </div>
                            <select className="filter-btn" value={stageFilter} onChange={(e) => setStageFilter(e.target.value)}>
                                <option value="All">All Stages</option>
                                <option value="Prospecting">Prospecting</option>
                                <option value="Proposal">Proposal</option>
                                <option value="Negotiation">Negotiation</option>
                                <option value="Closed Won">Closed Won</option>
                                <option value="Closed Lost">Closed Lost</option>
                            </select>
                        </div>

                        <div className="customers-table deals-table-wrap">
                            <div className="deals-table-head">
                                <span>Title</span>
                                <span>Customer</span>
                                <span>Previous Value</span>
                                <span>New Value</span>
                                <span>Stage</span>
                                <span>Actions</span>
                            </div>
                            {filteredDeals.map((deal, index) => (
                                <div className="deals-table-row" key={index}>
                                    <span>{deal.title}</span>
                                    <span>{deal.customer ? deal.customer.name : '-'}</span>
                                    <span className="previous-deal-value">
                                        {deal.previousValue === null || deal.previousValue === undefined
                                            ? "-"
                                            : `$${deal.previousValue.toLocaleString()}`}
                                    </span>
                                    <span className="new-deal-value">${(deal.value || 0).toLocaleString()}</span>
                                    <span className="status active-status">{deal.stage}</span>
                                    <span className="customer-actions">
                                        <span className="action-menu">
                                            <button
                                                className="action-menu-btn"
                                                onClick={() => setOpenMenuId(openMenuId === deal._id ? null : deal._id)}
                                            >⋮</button>
                                            {openMenuId === deal._id && (
                                                <div className="action-dropdown">
                                                    <button className="edit-option" onClick={() => { handleEdit(deal); setOpenMenuId(null); }}>✏ Edit</button>
                                                    <button className="delete-option" onClick={() => { handleDelete(deal._id); setOpenMenuId(null); }}>🗑 Delete</button>
                                                </div>
                                            )}
                                        </span>
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ================= ADD DEAL MODAL ================= */}
                    {showModal && (
                        <div className="modal-overlay">
                            <div className="customer-modal">
                                <div className="modal-header">
                                    <div>
                                        <h2>{editDeal ? "Edit Deal" : "Add New Deal"}</h2>
                                        <p>{editDeal ? "Update deal details." : "Create a new deal for your pipeline."}</p>
                                    </div>
                                    <button type="button" className="close-modal-btn" onClick={() => { setShowModal(false); setEditDeal(null); }}>×</button>
                                </div>
                                <form className="customer-form" onSubmit={handleSubmit}>
                                    <div className="form-group">
                                        <label>Title</label>
                                        <input type="text" name="title" placeholder="Deal title" value={formData.title} onChange={handleChange} />
                                        {errors.title && <p className="error">{errors.title}</p>}
                                    </div>
                                    <div className="form-group">
                                        <label>Value ($)</label>
                                        <input type="number" name="value" placeholder="Deal value" value={formData.value} onChange={handleChange} />
                                        {errors.value && <p className="error">{errors.value}</p>}
                                    </div>
                                    <div className="form-group">
                                        <label>Customer</label>
                                        <select name="customer" value={formData.customer} onChange={handleChange}>
                                            <option value="">Select customer</option>
                                            {customers.map(customer => (
                                                <option key={customer._id} value={customer._id}>{customer.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Stage</label>
                                        <select name="stage" value={formData.stage} onChange={handleChange}>
                                            <option value="Prospecting">Prospecting</option>
                                            <option value="Proposal">Proposal</option>
                                            <option value="Negotiation">Negotiation</option>
                                            <option value="Closed Won">Closed Won</option>
                                            <option value="Closed Lost">Closed Lost</option>
                                        </select>
                                    </div>
                                    {errors.general && <p className="error">{errors.general}</p>}
                                    <div className="modal-actions">
                                        <button type="button" className="cancel-btn" onClick={() => setShowModal(false)}>Cancel</button>
                                        <button type="submit" className="save-customer-btn">Add Deal</button>
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

export default Deals;

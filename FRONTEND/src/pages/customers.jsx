import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Customers.css";
import Sidebar from "../components/Sidebar";

const Customers = () => {

    const navigate = useNavigate();

    // Safely reads token from localStorage — handles "undefined" string
    const getToken = () => {
        try {
            const userStr = localStorage.getItem("user");
            if (!userStr || userStr === "undefined" || userStr === "null") return null;
            return JSON.parse(userStr).token || null;
        } catch {
            return null;
        }
    };

    // Controls whether the Add Customer modal is visible
    const [showModal, setShowModal] = useState(false);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [openMenuId, setOpenMenuId] = useState(null);
    const [purchaseCustomer, setPurchaseCustomer] = useState(null);
    const [purchases, setPurchases] = useState([]);
    const [purchaseForm, setPurchaseForm] = useState({ title: "", amount: "" });
    const [purchaseError, setPurchaseError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    

    // Customer list
    const [customers, setCustomers] = useState([]);

    const fetchCustomers = async () => {
        try {
            const token = getToken();
            if (!token) { navigate("/login"); return; }

            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/customers`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setCustomers(data);
            } else {
                console.error("Failed to fetch customers:", res.status);
            }
        } catch (error) {
            console.error("Failed to fetch customers", error);
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    // Track which customer is being edited (null = add mode)
    const [editCustomer, setEditCustomer] = useState(null);

    // Form data
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        company: "",
        status: "Active",
        notes: ""
    });

    const [errors, setErrors] = useState({});
    const [submitError, setSubmitError] = useState("");

    // Open edit modal pre-filled with customer data
    const handleEdit = (customer) => {
        const [firstName, ...rest] = (customer.name || "").split(" ");
        setFormData({
            firstName: firstName || "",
            lastName: rest.join(" ") || "",
            email: customer.email || "",
            phone: customer.phone || "",
            company: customer.company || "",
            status: customer.status || "Active",
            notes: ""
        });
        setEditCustomer(customer);
        setErrors({});
        setSubmitError("");
        setShowModal(true);
    };

    // Delete a customer
    const handleDelete = async (id) => {
        try {
            const token = getToken();
            if (!token) { navigate("/login"); return; }
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/customers/${id}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                fetchCustomers();
                setSuccessMessage("Customer deleted successfully.");
            } else {
                setSubmitError("Failed to delete customer.");
            }
        } catch {
            setSubmitError("Network error while deleting.");
        }
    };

    const openPurchases = (customer) => {
        setPurchaseCustomer(customer);
        setPurchases(customer.purchases || []);
        setPurchaseForm({ title: "", amount: "" });
        setPurchaseError("");
    };

    const handlePurchaseSubmit = async (event) => {
        event.preventDefault();
        if (!purchaseForm.title.trim() || purchaseForm.amount === "" || Number(purchaseForm.amount) < 0) {
            setPurchaseError("Enter a title and a valid amount.");
            return;
        }

        try {
            const token = getToken();
            if (!token) { navigate("/login"); return; }
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/customers/${purchaseCustomer._id}/purchases`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify(purchaseForm)
            });
            const data = await response.json();
            if (!response.ok) {
                setPurchaseError(data.message || "Failed to add purchase.");
                return;
            }
            setPurchases(previous => [data, ...previous]);
            setCustomers(previous => previous.map(customer => customer._id === purchaseCustomer._id
                ? {
                    ...customer,
                    purchases: [data, ...(customer.purchases || [])],
                    balance: (customer.balance || 0) + data.amount
                }
                : customer
            ));
            setPurchaseCustomer(previous => ({
                ...previous,
                purchases: [data, ...(previous.purchases || [])],
                balance: (previous.balance || 0) + data.amount
            }));
            setPurchaseForm({ title: "", amount: "" });
            setPurchaseError("");
            setSuccessMessage("Purchase added successfully.");
        } catch {
            setPurchaseError("Network error while adding purchase.");
        }
    };

    const validateForm = () => {

    const newErrors = {};

    // First name
    if (!formData.firstName.trim()) {
        newErrors.firstName = "First name is required";
    }

    // Email
    if (!formData.email.trim()) {
        newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = "Enter a valid email address";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
};


    // Handle input changes
    const handleChange = (e) => {

        const { name, value } = e.target;

        setFormData({
            ...formData,
            [name]: value
        });

        if(errors[name]) {
            setErrors({
                ...errors,
                [name]: ""
            });
        }
    };


    // Add or update customer
   const handleSubmit = async (e) => {

    e.preventDefault();
    setSubmitError("");
    setSuccessMessage("");

    if (!validateForm()) return;

    const customerData = {
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        email: formData.email,
        phone: formData.phone,
        company: formData.company,
        status: formData.status,
    };

    try {
        const token = getToken();
        if (!token) { setSubmitError("Session expired. Please log in again."); navigate("/login"); return; }

        const url = editCustomer
            ? `${import.meta.env.VITE_API_URL}/api/customers/${editCustomer._id}`
            : `${import.meta.env.VITE_API_URL}/api/customers`;
        const method = editCustomer ? "PUT" : "POST";

        const res = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
            body: JSON.stringify(customerData)
        });

        if (res.ok) {
            fetchCustomers();
            setFormData({ firstName: "", lastName: "", email: "", phone: "", company: "", status: "Active", notes: "" });
            setErrors({});
            setSubmitError("");
            setEditCustomer(null);
            setShowModal(false);
            setSuccessMessage(editCustomer ? "Customer updated successfully." : "Customer added successfully.");
        } else {
            const errData = await res.json().catch(() => ({}));
            setSubmitError(errData.message || `Error ${res.status}: Failed to save customer`);
        }
    } catch (error) {
        setSubmitError("Network error. Please check your connection.");
        console.error("Error saving customer", error);
    }
};
const filteredCustomers = customers.filter((customer) => {

    const matchesSearch =
        (customer.name || "").toLowerCase().includes(search.toLowerCase()) ||
        (customer.email || "").toLowerCase().includes(search.toLowerCase()) ||
        (customer.phone || "").includes(search) ||
        (customer.company || "").toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
        statusFilter === "All" ||
        customer.status === statusFilter;

    return matchesSearch && matchesStatus;
});
    return (
        <div className="customers-layout">

            {/* Click-outside overlay to close any open dropdown */}
            {openMenuId && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setOpenMenuId(null)} />
            )}


            {/* ================= SIDEBAR ================= */}
            <Sidebar active="/customers" />

            {/* ================= MAIN CONTENT ================= */}


            <main className="customers-content">

                <div className="customers-page">


                    {/* HEADER */}

                    <div className="customers-header">

                        <div>

                            <h1>
                                Customers
                            </h1>

                            <p>
                                Manage and keep track of your customer relationships.
                            </p>

                        </div>


                        {successMessage && <p className="action-success-message">{successMessage}</p>}
                        <button
                            className="add-customer-btn"
                            onClick={() => setShowModal(true)}
                        >
                            + Add Customer
                        </button>

                    </div>


                    {/* STATISTICS */}

                    <div className="customer-stats">

                        <div className="stat-card">

                            <p>Total Customers</p>

                            <h2>
                                {customers.length}
                            </h2>

                        </div>


                        <div className="stat-card">

                            <p>Active Customers</p>

                            <h2>
                                {
                                    customers.filter(
                                        customer => customer.status === "Active"
                                    ).length
                                }
                            </h2>

                        </div>


                        <div className="stat-card">

                            <p>InActive Customers</p>

                            <h2>
                                {customers.filter(
                                    customer => customer.status === "Inactive"
                                ).length}
                            </h2>

                        </div>

                    </div>


                    {/* CUSTOMERS TABLE */}

                    <div className="customers-card">


                        {/* SEARCH */}

                        <div className="customers-toolbar">

                            <div className="customer-search">

                                <span>⌕</span>

                                <input
                                    type="text"
                                    placeholder="Search customers..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />

                            </div>


                      <select
    className="filter-btn"
    value={statusFilter}
    onChange={(e) => setStatusFilter(e.target.value)}
>
    <option value="All">All</option>
    <option value="Active">Active</option>
    <option value="Inactive">InActive</option>
</select>
                        </div>


                        {/* TABLE */}

                        <div className="customers-table customer-list">


                            {/* TABLE HEADER */}

                            <div className="table-head">

                                <span>Customer</span>
                                <span>Email</span>
                                <span>Phone</span>
                                <span>Company</span>
                                <span>Status</span>
                                <span>Balance</span>
                                <span>Actions</span>

                            </div>


                            {/* CUSTOMER ROWS */}

                            {filteredCustomers.map((customer, index) => (

                                <div
                                    className="customer-row"
                                    key={index}
                                >

                                    <span>
                                        {customer.name}
                                    </span>

                                    <span>
                                        {customer.email}
                                    </span>

                                    <span>
                                        {customer.phone}
                                    </span>

                                    <span>
                                        {customer.company}
                                    </span>

                                    <span
                                        className={`status ${
                                            customer.status === "Active"
                                                ? "active-status"
                                                : "lead-status"
                                        }`}
                                    >
                                        {customer.status === "Inactive" ? "InActive" : customer.status}
                                    </span>

                                    <span className="customer-balance">
                                        ${(customer.balance ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>

                                    <span className="customer-actions">
                                        <span className="action-menu">
                                            <button
                                                className="action-menu-btn"
                                                onClick={() => setOpenMenuId(openMenuId === customer._id ? null : customer._id)}
                                            >⋮</button>
                                            {openMenuId === customer._id && (
                                                <div className="action-dropdown">
                                                    <button className="edit-option" onClick={() => { handleEdit(customer); setOpenMenuId(null); }}>✏ Edit</button>
                                                        <button className="purchase-option" onClick={() => { openPurchases(customer); setOpenMenuId(null); }}>🛒 Purchases</button>
                                                    <button className="delete-option" onClick={() => { handleDelete(customer._id); setOpenMenuId(null); }}>🗑 Delete</button>
                                                </div>
                                            )}
                                        </span>
                                    </span>

                                </div>

                            ))}

                        </div>

                    </div>


                    {/* ================= ADD CUSTOMER MODAL ================= */}

                    {showModal && (

                        <div className="modal-overlay">

                            <div className="customer-modal">


                                {/* MODAL HEADER */}

                                <div className="modal-header">
                                    <div>
                                        <h2>{editCustomer ? "Edit Customer" : "Add New Customer"}</h2>
                                        <p>{editCustomer ? "Update customer details." : "Add a new customer to your CRM."}</p>
                                    </div>
                                    <button
                                        type="button"
                                        className="close-modal-btn"
                                        onClick={() => { setShowModal(false); setEditCustomer(null); setSubmitError(""); }}
                                    >
                                        ×
                                    </button>
                                </div>


                                {/* FORM */}

                                <form
                                    className="customer-form"
                                    onSubmit={handleSubmit}
                                >


                                    {/* FIRST + LAST NAME */}

                                    <div className="form-row">

                                        <div className="form-group">

                                            <label>
                                                First Name
                                            </label>

                                            <input
                                                type="text"
                                                name="firstName"
                                                placeholder="Enter first name"
                                                value={formData.firstName}
                                                onChange={handleChange}
                                            />

                                            {errors.firstName && (
                                                <p className="error">{errors.firstName}</p>
                                            )}

                                        </div>


                                        <div className="form-group">

                                            <label>
                                                Last Name
                                            </label>

                                            <input
                                                type="text"
                                                name="lastName"
                                                placeholder="Enter last name"
                                                value={formData.lastName}
                                                onChange={handleChange}
                                            />

                                            {errors.lastName && (
                                                <p className="error">{errors.lastName}</p>
                                            )}

                                        </div>

                                    </div>


                                    {/* EMAIL + PHONE */}

                                    <div className="form-row">

                                        <div className="form-group">

                                            <label>
                                                Email
                                            </label>

                                            <input
                                                type="email"
                                                name="email"
                                                placeholder="Enter email"
                                                value={formData.email}
                                                onChange={handleChange}
                                            />

                                            {errors.email && (
                                                <p className="error">{errors.email}</p>
                                            )}

                                        </div>


                                        <div className="form-group">

                                            <label>
                                                Phone
                                            </label>

                                            <input
                                                type="text"
                                                name="phone"
                                                placeholder="Enter phone number"
                                                value={formData.phone}
                                                onChange={handleChange}
                                            />

                                            {errors.phone && (
                                                <p className="error">{errors.phone}</p>
                                            )}

                                        </div>

                                    </div>


                                    {/* COMPANY + STATUS */}

                                    <div className="form-row">

                                        <div className="form-group">

                                            <label>
                                                Company Name
                                            </label>

                                            <input
                                                type="text"
                                                name="company"
                                                placeholder="Enter company"
                                                value={formData.company}
                                                onChange={handleChange}
                                            />

                                            {errors.company && (
                                                <p className="error">{errors.company}</p>
                                            )}

                                        </div>


                                        <div className="form-group">

                                            <label>
                                                Status
                                            </label>

                                            <select
                                                name="status"
                                                value={formData.status}
                                                onChange={handleChange}
                                            >

                                                <option value="Active">
                                                    Active
                                                </option>

                                                <option value="Lead">
                                                    Lead
                                                </option>

                                                <option value="Inactive">
                                                    Inactive
                                                </option>

                                            </select>

                                        </div>

                                    </div>


                                    {/* NOTES */}

                                    <div className="form-group">

                                        <label>
                                            Notes
                                        </label>

                                        <textarea
                                            name="notes"
                                            rows="4"
                                            placeholder="Add notes about this customer..."
                                            value={formData.notes}
                                            onChange={handleChange}
                                        ></textarea>

                                        {errors.notes && (
                                            <p className="error">{errors.notes}</p>
                                        )}

                                    </div>


                                    {/* BUTTONS */}

                                    {submitError && (
                                        <p className="error" style={{ marginBottom: "8px", textAlign: "center" }}>{submitError}</p>
                                    )}

                                    <div className="modal-actions">

                                        <button
                                            type="button"
                                            className="cancel-btn"
                                            onClick={() => { setShowModal(false); setSubmitError(""); }}
                                        >
                                            Cancel
                                        </button>


                                        <button
                                            type="submit"
                                            className="save-customer-btn"
                                        >
                                            Add Customer
                                        </button>

                                    </div>

                                </form>

                            </div>

                        </div>

                    )}

                    {purchaseCustomer && (
                        <div className="modal-overlay" onClick={() => setPurchaseCustomer(null)}>
                            <div className="customer-modal purchase-modal" onClick={event => event.stopPropagation()}>
                                <div className="modal-header">
                                    <div>
                                        <h2>Purchases</h2>
                                        <p>{purchaseCustomer.name}'s purchase history</p>
                                    </div>
                                    <button type="button" className="close-modal-btn" onClick={() => setPurchaseCustomer(null)}>×</button>
                                </div>

                                <div className="purchase-history">
                                    {purchases.length === 0 ? (
                                        <p className="purchase-empty">No purchases yet.</p>
                                    ) : purchases.map(purchase => (
                                        <div className="purchase-row" key={purchase._id}>
                                            <span>{purchase.title}</span>
                                            <strong>${purchase.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                                        </div>
                                    ))}
                                </div>

                                <form className="customer-form purchase-form" onSubmit={handlePurchaseSubmit}>
                                    <h3>Add New Purchase</h3>
                                    <div className="form-group">
                                        <label>Title</label>
                                        <input value={purchaseForm.title} onChange={event => setPurchaseForm({ ...purchaseForm, title: event.target.value })} placeholder="Purchase title" />
                                    </div>
                                    <div className="form-group">
                                        <label>Amount</label>
                                        <input type="number" min="0" step="0.01" value={purchaseForm.amount} onChange={event => setPurchaseForm({ ...purchaseForm, amount: event.target.value })} placeholder="0.00" />
                                    </div>
                                    {purchaseError && <p className="error">{purchaseError}</p>}
                                    {successMessage && <p className="action-success-message">{successMessage}</p>}
                                    <div className="modal-actions">
                                        <button type="submit" className="save-customer-btn">Add New Purchase</button>
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

export default Customers;
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Customers.css";

const Customers = () => {

    const navigate = useNavigate();

    // Controls whether the Add Customer modal is visible
    const [showModal, setShowModal] = useState(false);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    

    // Customer list
    const [customers, setCustomers] = useState([
        {
            name: "John Doe",
            email: "john@example.com",
            phone: "0300-1234567",
            company: "Acme Inc.",
            status: "Active",
            deals: 4
        },
        {
            name: "Sarah Khan",
            email: "sarah@example.com",
            phone: "0312-7654321",
            company: "XYZ Corp.",
            status: "Active",
            deals: 2
        },
        {
            name: "Mike Brown",
            email: "mike@example.com",
            phone: "0321-4567890",
            company: "Tech Solutions",
            status: "Lead",
            deals: 1
        }
    ]);

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

    const validateForm = () => {

    const newErrors = {};

    // First name
    if (!formData.firstName.trim()) {
        newErrors.firstName = "First name is required";
    } else if (!/^[A-Za-z]+$/.test(formData.firstName)) {
        newErrors.firstName = "First name should contain only letters";
    }

    // Last name
    if (!formData.lastName.trim()) {
        newErrors.lastName = "Last name is required";
    } else if (!/^[A-Za-z]+$/.test(formData.lastName)) {
        newErrors.lastName = "Last name should contain only letters";
    }

    // Email
    if (!formData.email.trim()) {
        newErrors.email = "Email is required";
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
        newErrors.email = "Enter a valid email address";
    }

    // Phone
    if (!formData.phone.trim()) {
        newErrors.phone = "Phone number is required";
    } else if (!/^\d+$/.test(formData.phone)) {
        newErrors.phone = "Phone number should contain only digits";
    } else if (formData.phone.length !== 11) {
        newErrors.phone = "Phone number must be exactly 11 digits";
    }

    // Company
    if (!formData.company.trim()) {
        newErrors.company = "Company is required";
    }

    // Status
    if (!formData.status) {
        newErrors.status = "Status is required";
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


    // Add new customer
   const handleSubmit = (e) => {

    e.preventDefault();

    // Stop if validation fails
    if (!validateForm()) {
        return;
    }

    const newCustomer = {
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        phone: formData.phone,
        company: formData.company,
        status: formData.status,
        deals: 0
    };

    setCustomers([
        ...customers,
        newCustomer
    ]);

    // Clear form
    setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        company: "",
        status: "Active",
        notes: ""
    });

    // Clear errors
    setErrors({});

    // Close modal
    setShowModal(false);
};
const filteredCustomers = customers.filter((customer) => {

    const matchesSearch =
        customer.name.toLowerCase().includes(search.toLowerCase()) ||
        customer.email.toLowerCase().includes(search.toLowerCase()) ||
        customer.phone.includes(search) ||
        customer.company.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
        statusFilter === "All" ||
        customer.status === statusFilter;

    return matchesSearch && matchesStatus;
});
    return (
        <div className="customers-layout">


            {/* ================= SIDEBAR ================= */}

            <aside className="customers-sidebar">

                <div className="customers-logo">
                    <h2>Mini CRM</h2>
                    <span>CRM</span>
                </div>


                <div className="sidebar-section">

                    <p className="sidebar-title">
                        WORKSPACE
                    </p>

                    <button
                        className="sidebar-item"
                        onClick={() => navigate("/dashboard")}
                    >
                        <span>▦</span>
                        Overview
                    </button>

                    <button className="sidebar-item">
                        <span>◎</span>
                        Leads
                    </button>

                    <button className="sidebar-item active">
                        <span>●</span>
                        Customers
                    </button>

                    <button className="sidebar-item">
                        <span>◇</span>
                        Deals
                    </button>

                    <button className="sidebar-item">
                        <span>✓</span>
                        Tasks
                    </button>

                    <button className="sidebar-item">
                        <span>◷</span>
                        Activities
                    </button>

                    <button className="sidebar-item">
                        <span>▤</span>
                        Reports
                    </button>

                </div>


                <div className="sidebar-section">

                    <p className="sidebar-title">
                        MANAGE
                    </p>

                    <button className="sidebar-item">
                        <span>⚙</span>
                        Settings
                    </button>

                    <button className="sidebar-item">
                        <span>♙</span>
                        Team Members
                    </button>

                    <button
                        className="sidebar-item logout-item"
                        onClick={() => {

                            localStorage.removeItem("user");

                            navigate("/login");
                        }}
                    >
                        <span>↪</span>
                        Logout
                    </button>

                </div>

            </aside>


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

                            <p>New This Month</p>

                            <h2>86</h2>

                        </div>


                        <div className="stat-card">

                            <p>Growth</p>

                            <h2>+12.4%</h2>

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
    <option value="Lead">Lead</option>
    <option value="Inactive">Inactive</option>
</select>
                            <button className="sort-btn">
                                Sort
                            </button>

                        </div>


                        {/* TABLE */}

                        <div className="customers-table">


                            {/* TABLE HEADER */}

                            <div className="table-head">

                                <span>Customer</span>
                                <span>Email</span>
                                <span>Phone</span>
                                <span>Company</span>
                                <span>Status</span>
                                <span>Deals</span>
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
                                        {customer.status}
                                    </span>

                                    <span>
                                        {customer.deals}
                                    </span>

                                    <span className="customer-actions">
                                        ⋮
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

                                        <h2>
                                            Add New Customer
                                        </h2>

                                        <p>
                                            Add a new customer to your CRM.
                                        </p>

                                    </div>


                                    <button
                                        type="button"
                                        className="close-modal-btn"
                                        onClick={() => setShowModal(false)}
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
                                                Company
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

                                    <div className="modal-actions">

                                        <button
                                            type="button"
                                            className="cancel-btn"
                                            onClick={() => setShowModal(false)}
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

                </div>

            </main>

        </div>
    );
};

export default Customers;
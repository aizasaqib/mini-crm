import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaSearch,
  FaPlus,
  FaEllipsisV,
  FaTimes,
  FaEdit,
  FaTrash,
  FaCheckCircle,
  FaTasks,
  FaCalendarAlt,
  FaSpinner
} from "react-icons/fa";

import "../styles/Customers.css";
import Sidebar from "../components/Sidebar";

const Tasks = () => {
  const navigate = useNavigate();


  // ── helpers ──────────────────────────────────────────────
  const getToken = () => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr || userStr === "undefined" || userStr === "null") return null;
      return JSON.parse(userStr).token || null;
    } catch {
      return null;
    }
  };

  const API = `${import.meta.env.VITE_API_URL}/api/tasks`;

  // ── state ────────────────────────────────────────────────
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [activeMenu, setActiveMenu] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [priorityFilter, setPriorityFilter] = useState("All Priorities");

  const initialForm = {
    title: "",
    description: "",
    dueDate: "",
    priority: "Medium",
    status: "Pending",
    assignedTo: ""
  };
  const [formData, setFormData] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // ── fetch all tasks ───────────────────────────────────────
  const fetchTasks = async () => {
    try {
      const token = getToken();
      if (!token) { navigate("/login"); return; }
      const res = await fetch(API, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (err) {
      console.error("Failed to fetch tasks", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTasks(); }, []);

  // ── form helpers ─────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = "Task title is required";
    if (!formData.dueDate) newErrors.dueDate = "Due date is required";
    if (!formData.assignedTo.trim()) newErrors.assignedTo = "Assigned person is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ── open modals ───────────────────────────────────────────
  const openAddModal = () => {
    setEditingTask(null);
    setFormData(initialForm);
    setErrors({});
    setSubmitError("");
    setShowModal(true);
  };

  const openEditModal = (task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || "",
      dueDate: task.dueDate ? task.dueDate.slice(0, 10) : "",
      priority: task.priority,
      status: task.status,
      assignedTo: task.assignedTo || ""
    });
    setErrors({});
    setSubmitError("");
    setActiveMenu(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingTask(null);
    setFormData(initialForm);
    setErrors({});
    setSubmitError("");
  };

  // ── save (add or update) ──────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const token = getToken();
      if (!token) { navigate("/login"); return; }

      const url = editingTask ? `${API}/${editingTask._id}` : API;
      const method = editingTask ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        fetchTasks();
        closeModal();
        setSuccessMessage(editingTask ? "Task updated successfully." : "Task added successfully.");
      } else {
        const err = await res.json().catch(() => ({}));
        setSubmitError(err.message || "Failed to save task");
      }
    } catch {
      setSubmitError("Network error. Please try again.");
    }
  };

  // ── delete ────────────────────────────────────────────────
  const handleDelete = async (id) => {
    try {
      const token = getToken();
      if (!token) { navigate("/login"); return; }
      const res = await fetch(`${API}/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchTasks();
        setSuccessMessage("Task deleted successfully.");
      }
      else setSubmitError("Failed to delete task.");
    } catch {
      setSubmitError("Network error.");
    }
    setActiveMenu(null);
  };

  // ── filter logic ──────────────────────────────────────────
  const filteredTasks = tasks.filter(t => {
    const s = searchTerm.toLowerCase();
    const matchSearch =
      t.title.toLowerCase().includes(s) ||
      (t.description || "").toLowerCase().includes(s) ||
      (t.assignedTo || "").toLowerCase().includes(s);
    const matchStatus  = statusFilter === "All Status" || t.status === statusFilter;
    const matchPriority = priorityFilter === "All Priorities" || t.priority === priorityFilter;
    return matchSearch && matchStatus && matchPriority;
  });

  // ── stat counts ───────────────────────────────────────────
  const totalTasks     = tasks.length;
  const pendingTasks   = tasks.filter(t => t.status === "Pending").length;
  const inProgressTasks = tasks.filter(t => t.status === "In Progress").length;
  const completedTasks = tasks.filter(t => t.status === "Completed").length;

  // ── date formatter ────────────────────────────────────────
  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric"
    });
  };

  // ── render ────────────────────────────────────────────────
  return (
    <div className="customers-layout">

      {/* click-outside overlay to close menus */}
      {activeMenu && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 99 }}
          onClick={() => setActiveMenu(null)}
        />
      )}

      {/* ================= SIDEBAR ================= */}
      <Sidebar active="/tasks" />

      {/* ================= MAIN CONTENT ================= */}
      <main className="customers-content">
        <div className="customers-page">

          {/* HEADER */}
          <div className="customers-header">
            <div>
              <h1>Tasks</h1>
              <p>Manage your tasks and stay on top of your work.</p>
            </div>
            {successMessage && <p className="action-success-message">{successMessage}</p>}
            <button className="add-customer-btn" onClick={openAddModal}>
              <FaPlus style={{ marginRight: 8, fontSize: 13 }} />
              Add Task
            </button>
          </div>

          {/* STAT CARDS */}
          <div className="customer-stats">
            <div className="stat-card">
              <p>Total Tasks</p>
              <h2>{totalTasks}</h2>
            </div>
            <div className="stat-card">
              <p>Pending</p>
              <h2>{pendingTasks}</h2>
            </div>
            <div className="stat-card">
              <p>In Progress</p>
              <h2>{inProgressTasks}</h2>
            </div>
            <div className="stat-card">
              <p>Completed</p>
              <h2>{completedTasks}</h2>
            </div>
          </div>

          {/* TABLE CARD */}
          <div className="customers-card">

            {/* TOOLBAR */}
            <div className="customers-toolbar">
              <div className="customer-search">
                <span><FaSearch /></span>
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              <select className="filter-btn" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option>All Status</option>
                <option>Pending</option>
                <option>In Progress</option>
                <option>Completed</option>
              </select>
              <select className="filter-btn" value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
                <option>All Priorities</option>
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </div>

            {/* TABLE */}
            {loading ? (
              <div style={{ textAlign: "center", padding: "60px", color: "#667085" }}>
                <FaSpinner style={{ fontSize: 28, animation: "spin 1s linear infinite" }} />
                <p style={{ marginTop: 12 }}>Loading tasks...</p>
              </div>
            ) : (
              <div className="customers-table">

                {/* TABLE HEAD */}
                <div className="task-table-head">
                  <span>Task</span>
                  <span>Due Date</span>
                  <span>Priority</span>
                  <span>Status</span>
                  <span>Assigned To</span>
                  <span>Actions</span>
                </div>

                {/* ROWS */}
                {filteredTasks.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "60px 0", color: "#98a2b3" }}>
                    <FaTasks style={{ fontSize: 36, marginBottom: 12 }} />
                    <p style={{ fontSize: 16 }}>No tasks found</p>
                  </div>
                ) : (
                  filteredTasks.map(task => (
                    <div className="task-table-row" key={task._id}>

                      {/* TITLE + DESC */}
                      <div className="task-info-cell">
                        <strong>{task.title}</strong>
                        {task.description && <span>{task.description}</span>}
                      </div>

                      {/* DUE DATE */}
                      <div className="task-date-cell">
                        <FaCalendarAlt style={{ marginRight: 6, color: "#9ca3af" }} />
                        {formatDate(task.dueDate)}
                      </div>

                      {/* PRIORITY */}
                      <span className={`task-priority priority-${task.priority.toLowerCase()}`}>
                        {task.priority}
                      </span>

                      {/* STATUS */}
                      <span className={`task-status status-${task.status.toLowerCase().replace(" ", "-")}`}>
                        {task.status === "Completed" && <FaCheckCircle style={{ marginRight: 5 }} />}
                        {task.status}
                      </span>

                      {/* ASSIGNED */}
                      <span className="task-assigned">{task.assignedTo || "-"}</span>

                      {/* ACTIONS */}
                      <span className="customer-actions">
                        <span className="action-menu">
                          <button
                            className="action-menu-btn"
                            onClick={() => setActiveMenu(activeMenu === task._id ? null : task._id)}
                          >⋮</button>
                          {activeMenu === task._id && (
                            <div className="action-dropdown">
                              <button className="edit-option" onClick={() => openEditModal(task)}>✏ Edit</button>
                              <button className="delete-option" onClick={() => handleDelete(task._id)}>🗑 Delete</button>
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
                    <h2>{editingTask ? "Edit Task" : "Add New Task"}</h2>
                    <p>{editingTask ? "Update task details." : "Create a new task."}</p>
                  </div>
                  <button type="button" className="close-modal-btn" onClick={closeModal}>×</button>
                </div>

                <form className="customer-form" onSubmit={handleSubmit}>

                  {/* TITLE */}
                  <div className="form-group">
                    <label>Task Title</label>
                    <input
                      type="text"
                      name="title"
                      placeholder="Enter task title"
                      value={formData.title}
                      onChange={handleChange}
                    />
                    {errors.title && <p className="error">{errors.title}</p>}
                  </div>

                  {/* DESCRIPTION */}
                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      name="description"
                      placeholder="Enter task description"
                      value={formData.description}
                      onChange={handleChange}
                      rows="3"
                    />
                  </div>

                  {/* DUE DATE + PRIORITY */}
                  <div className="form-row">
                    <div className="form-group">
                      <label>Due Date</label>
                      <input
                        type="date"
                        name="dueDate"
                        value={formData.dueDate}
                        onChange={handleChange}
                      />
                      {errors.dueDate && <p className="error">{errors.dueDate}</p>}
                    </div>
                    <div className="form-group">
                      <label>Priority</label>
                      <select name="priority" value={formData.priority} onChange={handleChange}>
                        <option>High</option>
                        <option>Medium</option>
                        <option>Low</option>
                      </select>
                    </div>
                  </div>

                  {/* STATUS + ASSIGNED */}
                  <div className="form-row">
                    <div className="form-group">
                      <label>Status</label>
                      <select name="status" value={formData.status} onChange={handleChange}>
                        <option>Pending</option>
                        <option>In Progress</option>
                        <option>Completed</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Assigned To</label>
                      <input
                        type="text"
                        name="assignedTo"
                        placeholder="Enter team member"
                        value={formData.assignedTo}
                        onChange={handleChange}
                      />
                      {errors.assignedTo && <p className="error">{errors.assignedTo}</p>}
                    </div>
                  </div>

                  {submitError && <p className="error" style={{ textAlign: "center", marginBottom: 8 }}>{submitError}</p>}

                  <div className="modal-actions">
                    <button type="button" className="cancel-btn" onClick={closeModal}>Cancel</button>
                    <button type="submit" className="save-customer-btn">
                      {editingTask ? "Update Task" : "Add Task"}
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

export default Tasks;
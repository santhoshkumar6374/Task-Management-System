import { useEffect, useState, useCallback } from 'react';
import api from '../../api/axios';
import Navbar from '../../components/Navbar';
import Pagination from '../../components/Pagination';
import { StatusBadge, PriorityBadge } from '../../components/StatusBadge';

const STATUS_OPTIONS = ['Not Started', 'Pending', 'In Progress', 'Completed'];

const EmployeeDashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  // Modal state
  const [modal, setModal] = useState(null); // { taskId, newStatus }
  const [note, setNote] = useState('');

  const fetchTasks = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const { data } = await api.get('/tasks/my-tasks', {
        params: { page, limit: 8, search: search || undefined, status: statusFilter || undefined },
      });
      setTasks(data.tasks);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load your tasks');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    const timeout = setTimeout(() => fetchTasks(1), 350);
    return () => clearTimeout(timeout);
  }, [fetchTasks]);

  // Step 1: employee picks a new status → open modal
  const handleStatusSelect = (taskId, newStatus) => {
    setNote('');
    setModal({ taskId, newStatus });
  };

  // Step 2: employee submits modal with note → call API
  const handleModalSubmit = async () => {
    if (!modal) return;
    const { taskId, newStatus } = modal;
    setError('');
    setSuccess('');
    setUpdatingId(taskId);
    setModal(null);
    try {
      await api.patch(`/tasks/${taskId}/status`, { status: newStatus, note });
      setSuccess('Status updated. Admin has been notified by email.');
      setTasks((prev) =>
        prev.map((t) => (t._id === taskId ? { ...t, status: newStatus, statusNote: note } : t))
      );
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update task status');
    } finally {
      setUpdatingId(null);
      setNote('');
    }
  };

  const handleModalCancel = () => {
    setModal(null);
    setNote('');
  };

  return (
    <div className="page">
      <Navbar />
      <main className="container">
        <h1>My Tasks</h1>
        <p className="text-muted">Tasks assigned to you — update the status as you make progress</p>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div className="filter-bar">
          <input
            className="search-input"
            placeholder="Search your tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <p>Loading your tasks...</p>
        ) : (
          <>
            <div className="task-cards">
              {tasks.length === 0 ? (
                <p className="text-muted">No tasks found.</p>
              ) : (
                tasks.map((task) => (
                  <div className="task-card" key={task._id}>
                    <div className="task-card-header">
                      <h3>{task.title}</h3>
                      <PriorityBadge priority={task.priority} />
                    </div>
                    <p>{task.description}</p>
                    {task.statusNote && (
                      <div className="task-note">
                        <span className="task-note-label">📝 Note:</span> {task.statusNote}
                      </div>
                    )}
                    <div className="task-card-meta">
                      <span>Assigned by: {task.assignedBy?.name}</span>
                      <span>Created: {new Date(task.createdAt).toLocaleDateString()}</span>
                      <span>Updated: {new Date(task.updatedAt).toLocaleDateString()}</span>
                    </div>
                    <div className="task-card-footer">
                      <StatusBadge status={task.status} />
                      <select
                        value={task.status}
                        disabled={updatingId === task._id}
                        onChange={(e) => handleStatusSelect(task._id, e.target.value)}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))
              )}
            </div>
            <Pagination page={pagination.page} pages={pagination.pages} onPageChange={fetchTasks} />
          </>
        )}
      </main>

      {/* ── Status Update Modal ── */}
      {modal && (
        <div className="modal-overlay" onClick={handleModalCancel}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Update Task Status</h2>
            <p className="modal-subtitle">
              Changing status to <strong className="modal-status-highlight">{modal.newStatus}</strong>
            </p>
            <label className="modal-label">Reason / Progress Note <span className="modal-optional">(optional)</span></label>
            <textarea
              className="modal-textarea"
              rows={4}
              placeholder="Describe what you've done or why the status is changing..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              autoFocus
            />
            <div className="modal-actions">
              <button className="btn btn-primary" onClick={handleModalSubmit}>
                ✓ Confirm Update
              </button>
              <button className="btn btn-outline" onClick={handleModalCancel}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeDashboard;

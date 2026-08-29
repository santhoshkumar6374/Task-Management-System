import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../api/axios';
import Navbar from '../../components/Navbar';
import Pagination from '../../components/Pagination';
import { StatusBadge, PriorityBadge } from '../../components/StatusBadge';

const emptyForm = { title: '', description: '', assignedTo: '', priority: 'Medium' };

const TaskList = () => {
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const fetchTasks = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const { data } = await api.get('/tasks', {
        params: { page, limit: 8, search: search || undefined, status: statusFilter || undefined },
      });
      setTasks(data.tasks);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  const fetchEmployees = async () => {
    try {
      const { data } = await api.get('/employees');
      setEmployees(data.employees.filter((e) => e.isActive));
    } catch (err) {
      // silently ignore — employee dropdown just won't populate
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => fetchTasks(1), 350); // debounce search
    return () => clearTimeout(timeout);
  }, [fetchTasks]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);
    try {
      await api.post('/tasks', form);
      setSuccess(`Task "${form.title}" assigned successfully. Employee notified by email.`);
      setForm(emptyForm);
      setShowForm(false);
      fetchTasks(1);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create task');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (taskId, taskTitle) => {
    if (!window.confirm(`Delete task "${taskTitle}"? This cannot be undone.`)) return;
    setDeletingId(taskId);
    setError('');
    try {
      await api.delete(`/tasks/${taskId}`);
      setSuccess(`Task "${taskTitle}" deleted.`);
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete task');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="page">
      <Navbar />
      <main className="container">
        <div className="page-header">
          <h1>Tasks</h1>
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : '+ Assign Task'}
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {showForm && (
          <form className="card-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <div>
                <label>Task Title</label>
                <input name="title" value={form.title} onChange={handleChange} required />
              </div>
              <div>
                <label>Assign To</label>
                <select name="assignedTo" value={form.assignedTo} onChange={handleChange} required>
                  <option value="">Select employee</option>
                  {employees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.name} ({emp.department})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <label>Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} required rows={3} />
            <div>
              <label>Priority</label>
              <select name="priority" value={form.priority} onChange={handleChange}>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
            <div style={{ marginTop: '20px' }}>
              <button className="btn btn-primary" type="submit" disabled={submitting}>
                {submitting ? 'Assigning...' : 'Assign Task'}
              </button>
            </div>
          </form>
        )}

        <div className="filter-bar">
          <input
            className="search-input"
            placeholder="Search tasks by title or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All statuses</option>
            <option value="Not Started">Not Started</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

        {loading ? (
          <p>Loading tasks...</p>
        ) : (
          <>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Assigned To</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Employee Note</th>
                  <th>Created</th>
                  <th>Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tasks.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-muted text-center">
                      No tasks found.
                    </td>
                  </tr>
                ) : (
                  tasks.map((task) => (
                    <tr key={task._id}>
                      <td>
                        <strong>{task.title}</strong>
                        <div className="text-muted text-sm">{task.description}</div>
                      </td>
                      <td>{task.assignedTo?.name || 'N/A'}</td>
                      <td><PriorityBadge priority={task.priority} /></td>
                      <td><StatusBadge status={task.status} /></td>
                      <td>
                        {task.statusNote
                          ? <span className="employee-note">{task.statusNote}</span>
                          : <span className="text-muted" style={{fontSize:'0.78rem'}}>—</span>}
                      </td>
                      <td>{new Date(task.createdAt).toLocaleDateString()}</td>
                      <td>{new Date(task.updatedAt).toLocaleDateString()}</td>
                      <td>
                        <button
                          className="btn btn-danger btn-sm"
                          disabled={deletingId === task._id}
                          onClick={() => handleDelete(task._id, task.title)}
                        >
                          {deletingId === task._id ? 'Deleting…' : 'Delete'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <Pagination page={pagination.page} pages={pagination.pages} onPageChange={fetchTasks} />
          </>
        )}
      </main>
    </div>
  );
};

export default TaskList;

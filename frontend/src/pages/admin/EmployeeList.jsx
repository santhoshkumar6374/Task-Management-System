import { useEffect, useState } from 'react';
import api from '../../api/axios';
import Navbar from '../../components/Navbar';

const emptyForm    = { name: '', email: '', password: '', department: '' };
const emptyEditForm = { name: '', email: '', department: '', password: '' };

const EmployeeList = () => {
  const [employees, setEmployees]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [success, setSuccess]       = useState('');
  const [showForm, setShowForm]     = useState(false);
  const [form, setForm]             = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  // Edit modal state
  const [editEmp, setEditEmp]         = useState(null); // employee being edited
  const [editForm, setEditForm]       = useState(emptyEditForm);
  const [editSubmitting, setEditSub]  = useState(false);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/employees');
      setEmployees(data.employees);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEmployees(); }, []);

  const handleChange     = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleEditChange = (e) => setEditForm({ ...editForm, [e.target.name]: e.target.value });

  // ── Create employee ──────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess(''); setSubmitting(true);
    try {
      await api.post('/employees', form);
      setSuccess(`Employee "${form.name}" created successfully`);
      setForm(emptyForm);
      setShowForm(false);
      fetchEmployees();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create employee');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Open edit modal pre-filled ───────────────────────────────
  const openEdit = (emp) => {
    setEditEmp(emp);
    setEditForm({ name: emp.name, email: emp.email, department: emp.department || '', password: '' });
    setError(''); setSuccess('');
  };

  // ── Save edits ───────────────────────────────────────────────
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess(''); setEditSub(true);
    try {
      const payload = {
        name:       editForm.name,
        email:      editForm.email,
        department: editForm.department,
      };
      if (editForm.password) payload.password = editForm.password;

      await api.put(`/employees/${editEmp._id}`, payload);
      setSuccess(`Employee "${editForm.name}" updated successfully`);
      setEditEmp(null);
      fetchEmployees();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update employee');
    } finally {
      setEditSub(false);
    }
  };

  // ── Toggle active/inactive ───────────────────────────────────
  const toggleStatus = async (id) => {
    try {
      await api.patch(`/employees/${id}/status`);
      fetchEmployees();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status');
    }
  };

  return (
    <div className="page">
      <Navbar />
      <main className="container">
        <div className="page-header">
          <h1>Employees</h1>
          <button className="btn btn-primary" onClick={() => { setShowForm(!showForm); setEditEmp(null); }}>
            {showForm ? 'Cancel' : '+ Add Employee'}
          </button>
        </div>

        {error   && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {/* ── Create form ── */}
        {showForm && (
          <form className="card-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <div>
                <label>Full Name</label>
                <input name="name" value={form.name} onChange={handleChange} required />
              </div>
              <div>
                <label>Email</label>
                <input type="email" name="email" value={form.email} onChange={handleChange} required />
              </div>
            </div>
            <div className="form-row">
              <div>
                <label>Password</label>
                <input type="password" name="password" value={form.password} onChange={handleChange} required minLength={6} />
              </div>
              <div>
                <label>Department</label>
                <input name="department" value={form.department} onChange={handleChange} placeholder="e.g. Engineering" />
              </div>
            </div>
            <div style={{ marginTop: '20px' }}>
              <button className="btn btn-primary" type="submit" disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Employee'}
              </button>
            </div>
          </form>
        )}

        {/* ── Employee table ── */}
        {loading ? (
          <p>Loading employees...</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Department</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-muted text-center">
                    No employees yet. Click "Add Employee" to create one.
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp._id}>
                    <td>{emp.name}</td>
                    <td>{emp.email}</td>
                    <td>{emp.department}</td>
                    <td>
                      <span className={`badge ${emp.isActive ? 'badge-green' : 'badge-gray'}`}>
                        {emp.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button className="btn btn-outline btn-sm" onClick={() => openEdit(emp)}>
                        ✏️ Edit
                      </button>
                      <button className="btn btn-outline btn-sm" onClick={() => toggleStatus(emp._id)}>
                        {emp.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </main>

      {/* ── Edit Employee Modal ── */}
      {editEmp && (
        <div className="modal-overlay" onClick={() => setEditEmp(null)}>
          <div className="modal-box" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Edit Employee Profile</h2>
            <p className="modal-subtitle">
              Editing <strong style={{ color: 'var(--accent)' }}>{editEmp.name}</strong>
            </p>

            <form onSubmit={handleEditSubmit}>
              <div className="form-row">
                <div>
                  <label>Full Name</label>
                  <input name="name" value={editForm.name} onChange={handleEditChange} required />
                </div>
                <div>
                  <label>Email</label>
                  <input type="email" name="email" value={editForm.email} onChange={handleEditChange} required />
                </div>
              </div>
              <div className="form-row">
                <div>
                  <label>Department</label>
                  <input name="department" value={editForm.department} onChange={handleEditChange} placeholder="e.g. Engineering" />
                </div>
                <div>
                  <label>New Password <span className="modal-optional">(leave blank to keep current)</span></label>
                  <input
                    type="password"
                    name="password"
                    value={editForm.password}
                    onChange={handleEditChange}
                    minLength={6}
                    placeholder="••••••"
                  />
                </div>
              </div>

              <div className="modal-actions" style={{ marginTop: '20px' }}>
                <button className="btn btn-primary" type="submit" disabled={editSubmitting}>
                  {editSubmitting ? 'Saving...' : '✓ Save Changes'}
                </button>
                <button className="btn btn-outline" type="button" onClick={() => setEditEmp(null)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeList;

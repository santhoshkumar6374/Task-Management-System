import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import Navbar from '../../components/Navbar';

const StatCard = ({ label, value, color, onClick }) => (
  <div
    className={`stat-card ${color} ${onClick ? 'stat-card-clickable' : ''}`}
    onClick={onClick}
    title={onClick ? `View ${label} tasks` : undefined}
  >
    <div className="stat-value">{value}</div>
    <div className="stat-label">{label}</div>
    {onClick && <div className="stat-card-hint">Click to view →</div>}
  </div>
);

const ActionCard = ({ href, icon, gradient, title, description, badge, badgeColor }) => (
  <a href={href} className="action-card" style={{ '--ac-gradient': gradient }}>
    <div className="action-card-icon">{icon}</div>
    <div className="action-card-body">
      <div className="action-card-title">{title}</div>
      <div className="action-card-desc">{description}</div>
      {badge && (
        <span className="action-card-badge" style={{ background: badgeColor }}>
          {badge}
        </span>
      )}
    </div>
    <div className="action-card-arrow">→</div>
  </a>
);

const AdminDashboard = () => {
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get('/tasks/stats');
        setStats(data.stats);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load statistics');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const goToTasks = (status) =>
    navigate(`/admin/tasks${status ? `?status=${encodeURIComponent(status)}` : ''}`);

  return (
    <div className="page">
      <Navbar />
      <main className="container">
        <h1>Admin Dashboard</h1>
        <p className="text-muted">Overview of all tasks across the organization. Click a card to view those tasks.</p>

        {error && <div className="alert alert-error">{error}</div>}

        {loading ? (
          <p>Loading statistics...</p>
        ) : (
          <div className="stats-grid">
            <StatCard label="Total Tasks" value={stats.total}                             color="stat-purple" onClick={() => goToTasks('')} />
            <StatCard label="Not Started" value={stats['Not Started']}                    color="stat-gray"   onClick={() => goToTasks('Not Started')} />
            <StatCard label="In Progress" value={stats['Pending'] + stats['In Progress']} color="stat-blue"   onClick={() => goToTasks('In Progress')} />
            <StatCard label="Completed"   value={stats['Completed']}                      color="stat-green"  onClick={() => goToTasks('Completed')} />
          </div>
        )}

        <div className="action-cards-section">
          <h2 className="action-cards-heading">Quick Actions</h2>
          <div className="action-cards-grid">
            <ActionCard
              href="/admin/employees"
              icon="👥"
              gradient="linear-gradient(135deg, #3D1DAF 0%, #6B46C1 60%, #9F67E4 100%)"
              title="Manage Employees"
              description="Add new members, edit profiles, activate or deactivate accounts, and keep your team directory up to date."
              badge="Team Directory"
              badgeColor="rgba(159,103,228,0.25)"
            />
            <ActionCard
              href="/admin/tasks"
              icon="📋"
              gradient="linear-gradient(135deg, #0D4EA6 0%, #1A6FD4 60%, #3B9EFF 100%)"
              title="View & Assign Tasks"
              description="Create tasks, assign them to employees, track progress across all statuses, and manage the full task lifecycle."
              badge="Task Management"
              badgeColor="rgba(59,158,255,0.25)"
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;

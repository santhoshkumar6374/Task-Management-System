import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => { logout(); navigate('/login'); };
  const isActive = (path) => location.pathname === path;

  return (
    <header className="navbar">
      {/* ── Brand (left) ── */}
      <div className="navbar-brand" onClick={() => navigate(user?.role === 'admin' ? '/admin' : '/employee')} style={{ cursor: 'pointer' }}>
        <div className="navbar-logo"><span>📋</span></div>
        <div className="navbar-brand-text">
          <span className="navbar-brand-name">TaskFlow</span>
          <span className="navbar-brand-sub">Management System</span>
        </div>
      </div>

      {/* ── Right side: nav links + user info + logout ── */}
      <div className="navbar-right">
        {user?.role === 'admin' && (
          <nav className="navbar-nav">
            <button className={`navbar-nav-link ${isActive('/admin') ? 'active' : ''}`} onClick={() => navigate('/admin')}>
              Dashboard
            </button>
            <button className={`navbar-nav-link ${isActive('/admin/tasks') ? 'active' : ''}`} onClick={() => navigate('/admin/tasks')}>
              Tasks
            </button>
            <button className={`navbar-nav-link ${isActive('/admin/employees') ? 'active' : ''}`} onClick={() => navigate('/admin/employees')}>
              Employees
            </button>
          </nav>
        )}

        <div className="navbar-divider" />

        <div className="navbar-avatar" title={user?.name}>
          {user?.name?.charAt(0).toUpperCase()}
        </div>
        <div className="navbar-user-info">
          <span className="navbar-user-name">{user?.name}</span>
          <span className={`navbar-role-pill ${user?.role === 'admin' ? 'role-admin' : 'role-employee'}`}>
            {user?.role}
          </span>
        </div>
        <button className="navbar-logout" onClick={handleLogout}>
          ⎋ Logout
        </button>
      </div>
    </header>
  );
};

export default Navbar;

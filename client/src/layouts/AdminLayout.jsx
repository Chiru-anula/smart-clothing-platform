import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const links = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/customers', label: 'Customers' },
  { to: '/store-managers', label: 'Store Managers' },
  { to: '/roles', label: 'User Roles' },
  { to: '/reviews', label: 'Reviews' },
  { to: '/orders', label: 'Orders' },
  { to: '/reports', label: 'Sales & Analytics' },
  { to: '/settings', label: 'System Settings' },
];

function AdminLayout() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate('/login');
  }

  return (
    <div className="admin-app">
      <aside className="sidebar">
        <div className="logo">
          <h2>Smart Clothing</h2>
          <span>ADMIN PANEL</span>
        </div>

        <nav>
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">Ceylon Gem Clothing</p>
            <h1>Admin Console</h1>
          </div>

          <div className="admin-profile">
            <div className="profile-circle">
              {(profile?.full_name || 'A').charAt(0).toUpperCase()}
            </div>
            <div>
              <strong>{profile?.full_name || 'Administrator'}</strong>
              <small>{profile?.email}</small>
            </div>
            <button type="button" className="ghost-btn" onClick={handleSignOut}>
              Sign out
            </button>
          </div>
        </header>

        <Outlet />
      </main>
    </div>
  );
}

export default AdminLayout;

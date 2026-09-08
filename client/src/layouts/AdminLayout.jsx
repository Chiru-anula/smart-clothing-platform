import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context';

const links = [
  { to: '/', label: 'Dashboard', end: true, icon: '📊' },
  { to: '/customers', label: 'Customers', icon: '👥' },
  { to: '/store-managers', label: 'Store Managers', icon: '👔' },
  { to: '/roles', label: 'User Roles', icon: '🛡️' },
  { to: '/reviews', label: 'Reviews', icon: '⭐' },
  { to: '/orders', label: 'Orders', icon: '📦' },
  { to: '/reports', label: 'Sales & Analytics', icon: '📈' },
  { to: '/settings', label: 'System Settings', icon: '⚙️' },
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
        <div>
          <div className="logo">
            <span className="logo-badge">Enterprise Admin</span>
            <h2>Ceylon Gem</h2>
            <span>Smart Clothing Platform</span>
          </div>

          <nav>
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
              >
                <span>{link.icon}</span>
                <span>{link.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="sidebar-footer">
          <p>IE3121 Sprint 1 • Project ID: ISE_WD_0101_12</p>
          <p style={{ marginTop: '4px', opacity: 0.8 }}>Sirimanna H.D.S.S (IT24100908)</p>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">Ceylon Gem Clothing • Admin Console</p>
            <h1>Business Management</h1>
          </div>

          <div className="topbar-right">
            <div className="admin-profile">
              <div className="profile-circle">
                {(profile?.full_name || 'A').charAt(0).toUpperCase()}
              </div>
              <div>
                <strong>{profile?.full_name || 'Administrator'}</strong>
                <small>{profile?.email || 'admin@smartclothing.lk'}</small>
              </div>
              <button
                type="button"
                className="ghost-btn"
                onClick={handleSignOut}
                title="Sign out of Admin Panel"
                style={{ padding: '6px 12px', fontSize: '12px' }}
              >
                Sign out
              </button>
            </div>
          </div>
        </header>

        <Outlet />
      </main>
    </div>
  );
}

export default AdminLayout;

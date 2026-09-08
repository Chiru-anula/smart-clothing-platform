import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

function ProtectedRoute({ children }) {
  const { loading, session, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="page-message" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Loading Admin Console…</p>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return (
      <div className="login-page">
        <div className="login-card">
          <h1>Admin access required</h1>
          <p>
            This account is signed in, but it does not have active administrator privileges.
            Please sign in with an administrator account (e.g. <code>admin@smartclothing.lk</code>).
          </p>
          <a href="/login" className="primary-btn" style={{ marginTop: '14px', textAlign: 'center' }}>
            Back to Sign in
          </a>
        </div>
      </div>
    );
  }

  return children;
}

export default ProtectedRoute;

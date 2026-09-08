import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ children }) {
  const { loading, session, isAdmin, configError } = useAuth();

  if (configError) {
    return (
      <div className="login-page">
        <div className="login-card">
          <h1>Supabase is not configured</h1>
          <p>{configError}</p>
          <p>Copy <code>client/.env.example</code> to <code>client/.env</code> and add your project keys.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="page-message">Loading…</div>;
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
            This account is signed in, but it is not an active administrator.
            Link the Auth user to a <code>profiles</code> row with role = admin.
          </p>
        </div>
      </div>
    );
  }

  return children;
}

export default ProtectedRoute;

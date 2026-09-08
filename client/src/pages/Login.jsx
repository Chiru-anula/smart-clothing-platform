import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context';

function Login() {
  const { session, isAdmin, signIn, configError, connStatus } = useAuth();
  const [email, setEmail] = useState('admin@smartclothing.lk');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(configError || '');
  const [submitting, setSubmitting] = useState(false);

  if (session && isAdmin) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    const { error: signInError } = await signIn(email, password);
    setSubmitting(false);
    if (signInError) {
      setError(signInError.message);
    }
  }

  function handleFillDemo() {
    setEmail('admin@smartclothing.lk');
    setPassword('Admin@123');
    setError('');
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <div>
          <p className="eyebrow">Ceylon Gem Clothing</p>
          <h1>Admin Portal</h1>
          <p>Smart Clothing Business Management Platform • Sprint 1</p>
        </div>

        {error ? <div className="alert">{error}</div> : null}

        <div className="demo-credentials-box">
          <div>
            <strong>Quick Demo Sign-in:</strong>
            <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#166534' }}>
              admin@smartclothing.lk / Admin@123
            </p>
          </div>
          <button type="button" className="demo-fill-btn" onClick={handleFillDemo}>
            Fill Credentials
          </button>
        </div>

        <label>
          Admin Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@smartclothing.lk"
            required
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
        </label>

        <button type="submit" className="primary-btn" disabled={submitting} style={{ width: '100%', padding: '12px' }}>
          {submitting ? 'Authenticating…' : 'Sign in to Admin Console'}
        </button>

        <div style={{ textAlign: 'center', marginTop: '4px' }}>
          <small style={{ color: '#9ca3af', fontSize: '11px' }}>
            System mode: {connStatus?.label || 'Local / Supabase'}
          </small>
        </div>
      </form>
    </div>
  );
}

export default Login;

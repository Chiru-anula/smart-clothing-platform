import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context';

function Login() {
  const { session, isAdmin, signIn, configError } = useAuth();
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

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <div>
          <p className="eyebrow">Ceylon Gem Clothing</p>
          <h1>Admin Portal</h1>
          <p>Smart Clothing Business Management Platform</p>
        </div>

        {error ? <div className="alert">{error}</div> : null}

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

        <button type="submit" className="primary-btn" disabled={submitting} style={{ width: '100%', padding: '12px', marginTop: '6px' }}>
          {submitting ? 'Signing in…' : 'Sign in to Admin Console'}
        </button>
      </form>
    </div>
  );
}

export default Login;

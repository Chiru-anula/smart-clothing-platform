import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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
        <p className="eyebrow">Smart Clothing Platform</p>
        <h1>Admin sign in</h1>
        <p>Use the Supabase Auth user you created for the administrator.</p>

        {error ? <div className="alert">{error}</div> : null}

        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        <button type="submit" className="primary-btn" disabled={submitting || Boolean(configError)}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}

export default Login;

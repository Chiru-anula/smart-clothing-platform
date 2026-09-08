import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

function Settings() {
  const { profile } = useAuth();
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  async function load() {
    const { data, error: loadError } = await supabase
      .from('system_settings')
      .select('key, value, label')
      .order('key');

    if (loadError) {
      setError(loadError.message);
      return;
    }
    setRows(data || []);
  }

  useEffect(() => {
    load();
  }, []);

  function updateValue(key, value) {
    setRows((current) => current.map((row) => (row.key === key ? { ...row, value } : row)));
    setSaved(false);
  }

  async function handleSave(event) {
    event.preventDefault();
    setError('');
    const { error: saveError } = await supabase.from('system_settings').upsert(
      rows.map((row) => ({
        key: row.key,
        value: row.value,
        label: row.label,
        updated_by: profile?.id || null,
      })),
    );
    if (saveError) {
      setError(saveError.message);
      return;
    }
    setSaved(true);
  }

  return (
    <section className="dashboard-section">
      <div className="section-header">
        <div>
          <h2>System Settings</h2>
          <p>Basic platform configuration stored in Supabase</p>
        </div>
      </div>

      {error ? <div className="alert">{error}</div> : null}
      {saved ? <div className="alert success">Settings saved.</div> : null}

      <form className="settings-form" onSubmit={handleSave}>
        {rows.map((row) => (
          <label key={row.key}>
            {row.label || row.key}
            <input
              value={row.value}
              onChange={(e) => updateValue(row.key, e.target.value)}
            />
          </label>
        ))}
        <button type="submit" className="primary-btn">Save settings</button>
      </form>
    </section>
  );
}

export default Settings;

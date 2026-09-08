import { useEffect, useState } from 'react';
import { getSystemSettings, saveSystemSettings, resetLocalData } from '../services/dataService';
import { useAuth } from '../context';

function Settings() {
  const { profile } = useAuth();
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  async function loadData() {
    setLoading(true);
    try {
      const data = await getSystemSettings();
      setSettings(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load system settings');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let isMounted = true;
    getSystemSettings()
      .then((data) => {
        if (isMounted) setSettings(data || []);
      })
      .catch((err) => {
        if (isMounted) setError(err.message || 'Failed to load system settings');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  function handleValueChange(key, value) {
    setSettings((current) =>
      current.map((item) => (item.key === key ? { ...item, value } : item)),
    );
    setSuccessMsg('');
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccessMsg('');

    try {
      await saveSystemSettings(settings, profile?.id || null);
      setSuccessMsg('System configuration and operational rules saved successfully.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.message || 'Failed to save system settings');
    } finally {
      setSaving(false);
    }
  }

  function handleResetDefaults() {
    if (!window.confirm('Reset all system settings to Ceylon Gem factory defaults?')) return;
    resetLocalData();
    loadData();
    setSuccessMsg('Settings reset to platform defaults.');
    setTimeout(() => setSuccessMsg(''), 4000);
  }

  const generalSettings = settings.filter((s) => ['business_name', 'currency', 'support_email', 'support_phone'].includes(s.key));
  const operationSettings = settings.filter((s) => ['delivery_fee', 'free_shipping_threshold', 'low_stock_alert', 'tax_rate_percent'].includes(s.key));
  const systemSettingsList = settings.filter((s) => ['allow_new_registrations', 'maintenance_mode'].includes(s.key));

  return (
    <section className="dashboard-section">
      <div className="section-header">
        <div>
          <h2>Platform System Settings</h2>
          <p>Configure business rules, customer contact details, delivery parameters, and system maintenance</p>
        </div>
        <button type="button" className="ghost-btn" onClick={handleResetDefaults}>
          ↺ Reset Defaults
        </button>
      </div>

      {error ? <div className="alert">{error}</div> : null}
      {successMsg ? <div className="alert success">{successMsg}</div> : null}

      {loading ? (
        <div className="empty-row">Loading configuration…</div>
      ) : (
        <form className="settings-form" onSubmit={handleSave}>
          {/* General Information Group */}
          <div className="settings-group">
            <h3>🏢 General Store Information</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              {generalSettings.map((item) => (
                <label key={item.key}>
                  {item.label || item.key}
                  <input
                    type="text"
                    value={item.value}
                    onChange={(e) => handleValueChange(item.key, e.target.value)}
                    required
                  />
                </label>
              ))}
            </div>
          </div>

          {/* Business & Logistics Parameters */}
          <div className="settings-group">
            <h3>🚚 Business Operations & Fulfilment Rules</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              {operationSettings.map((item) => (
                <label key={item.key}>
                  {item.label || item.key}
                  <input
                    type="number"
                    value={item.value}
                    onChange={(e) => handleValueChange(item.key, e.target.value)}
                    required
                  />
                </label>
              ))}
            </div>
          </div>

          {/* Platform Maintenance & Access */}
          <div className="settings-group">
            <h3>🔒 Security & Maintenance Controls</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              {systemSettingsList.map((item) => (
                <label key={item.key}>
                  {item.label || item.key}
                  <select
                    value={item.value}
                    onChange={(e) => handleValueChange(item.key, e.target.value)}
                  >
                    <option value="true">Enabled (True)</option>
                    <option value="false">Disabled (False)</option>
                  </select>
                </label>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
            <button type="submit" className="primary-btn" disabled={saving} style={{ padding: '12px 24px' }}>
              {saving ? 'Saving Changes…' : 'Save System Settings'}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

export default Settings;

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { formatDate } from '../lib/format';

const emptyForm = {
  full_name: '',
  email: '',
  phone: '',
  city: '',
  address_line: '',
  postal_code: '',
  status: 'active',
};

function Customers() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function load() {
    const { data, error: loadError } = await supabase
      .from('profiles')
      .select('id, full_name, email, phone, status, created_at, customer_details (city, address_line, postal_code)')
      .eq('role', 'customer')
      .order('created_at', { ascending: false });

    if (loadError) {
      setError(loadError.message);
      return;
    }
    setRows(data || []);
  }

  useEffect(() => {
    load();
  }, []);

  function startEdit(row) {
    setEditingId(row.id);
    setForm({
      full_name: row.full_name || '',
      email: row.email || '',
      phone: row.phone || '',
      city: row.customer_details?.city || '',
      address_line: row.customer_details?.address_line || '',
      postal_code: row.customer_details?.postal_code || '',
      status: row.status,
    });
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');

    const profilePayload = {
      full_name: form.full_name,
      email: form.email,
      phone: form.phone,
      role: 'customer',
      status: form.status,
    };

    let profileId = editingId;
    if (editingId) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update(profilePayload)
        .eq('id', editingId);
      if (updateError) {
        setSaving(false);
        setError(updateError.message);
        return;
      }
    } else {
      const { data, error: insertError } = await supabase
        .from('profiles')
        .insert(profilePayload)
        .select('id')
        .single();
      if (insertError) {
        setSaving(false);
        setError(insertError.message);
        return;
      }
      profileId = data.id;
    }

    const { error: detailError } = await supabase.from('customer_details').upsert({
      profile_id: profileId,
      city: form.city,
      address_line: form.address_line,
      postal_code: form.postal_code,
    });

    setSaving(false);
    if (detailError) {
      setError(detailError.message);
      return;
    }

    resetForm();
    load();
  }

  async function handleDelete(id) {
    if (!window.confirm('Remove this customer record?')) return;
    const { error: deleteError } = await supabase.from('profiles').delete().eq('id', id);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    load();
  }

  return (
    <section className="dashboard-section">
      <div className="section-header">
        <div>
          <h2>Customers</h2>
          <p>Create, update and deactivate registered customers</p>
        </div>
      </div>

      {error ? <div className="alert">{error}</div> : null}

      <form className="form-grid" onSubmit={handleSubmit}>
        <input
          placeholder="Full name"
          value={form.full_name}
          onChange={(e) => setForm({ ...form, full_name: e.target.value })}
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
        <input
          placeholder="Phone"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />
        <input
          placeholder="City"
          value={form.city}
          onChange={(e) => setForm({ ...form, city: e.target.value })}
        />
        <input
          placeholder="Address"
          value={form.address_line}
          onChange={(e) => setForm({ ...form, address_line: e.target.value })}
        />
        <input
          placeholder="Postal code"
          value={form.postal_code}
          onChange={(e) => setForm({ ...form, postal_code: e.target.value })}
        />
        <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
          <option value="active">active</option>
          <option value="inactive">inactive</option>
          <option value="suspended">suspended</option>
        </select>
        <div className="form-actions">
          <button type="submit" className="primary-btn" disabled={saving}>
            {editingId ? 'Save customer' : 'Add customer'}
          </button>
          {editingId ? (
            <button type="button" className="ghost-btn" onClick={resetForm}>
              Cancel
            </button>
          ) : null}
        </div>
      </form>

      <div className="data-table">
        <div className="table-header cols-6">
          <span>Name</span>
          <span>Email</span>
          <span>City</span>
          <span>Status</span>
          <span>Joined</span>
          <span></span>
        </div>
        {rows.map((row) => (
          <div className="table-row cols-6" key={row.id}>
            <span>{row.full_name}</span>
            <span>{row.email}</span>
            <span>{row.customer_details?.city || '—'}</span>
            <span className={`status ${row.status}`}>{row.status}</span>
            <span>{formatDate(row.created_at)}</span>
            <span className="row-actions">
              <button type="button" onClick={() => startEdit(row)}>Edit</button>
              <button type="button" onClick={() => handleDelete(row.id)}>Delete</button>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Customers;

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const emptyForm = {
  full_name: '',
  email: '',
  phone: '',
  status: 'active',
  store_id: '',
};

function StoreManagers() {
  const [rows, setRows] = useState([]);
  const [stores, setStores] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');

  async function load() {
    const [managers, storeRows] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, full_name, email, phone, status, stores (id, name)')
        .eq('role', 'store_manager')
        .order('full_name'),
      supabase.from('stores').select('id, name, manager_id').order('name'),
    ]);

    if (managers.error || storeRows.error) {
      setError(managers.error?.message || storeRows.error?.message);
      return;
    }
    setRows(managers.data || []);
    setStores(storeRows.data || []);
  }

  useEffect(() => {
    load();
  }, []);

  function startEdit(row) {
    setEditingId(row.id);
    setForm({
      full_name: row.full_name,
      email: row.email,
      phone: row.phone || '',
      status: row.status,
      store_id: row.stores?.[0]?.id || '',
    });
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    const payload = {
      full_name: form.full_name,
      email: form.email,
      phone: form.phone,
      role: 'store_manager',
      status: form.status,
    };

    let managerId = editingId;
    if (editingId) {
      const { error: updateError } = await supabase.from('profiles').update(payload).eq('id', editingId);
      if (updateError) {
        setError(updateError.message);
        return;
      }
    } else {
      const { data, error: insertError } = await supabase.from('profiles').insert(payload).select('id').single();
      if (insertError) {
        setError(insertError.message);
        return;
      }
      managerId = data.id;
    }

    await supabase.from('stores').update({ manager_id: null }).eq('manager_id', managerId);
    if (form.store_id) {
      const { error: storeError } = await supabase
        .from('stores')
        .update({ manager_id: managerId })
        .eq('id', form.store_id);
      if (storeError) {
        setError(storeError.message);
        return;
      }
    }

    resetForm();
    load();
  }

  return (
    <section className="dashboard-section">
      <div className="section-header">
        <div>
          <h2>Store Managers</h2>
          <p>Assign managers to Ceylon Gem stores</p>
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
        <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
          <option value="active">active</option>
          <option value="inactive">inactive</option>
          <option value="suspended">suspended</option>
        </select>
        <select value={form.store_id} onChange={(e) => setForm({ ...form, store_id: e.target.value })}>
          <option value="">No store assigned</option>
          {stores.map((store) => (
            <option key={store.id} value={store.id}>
              {store.name}
            </option>
          ))}
        </select>
        <div className="form-actions">
          <button type="submit" className="primary-btn">
            {editingId ? 'Save manager' : 'Add manager'}
          </button>
          {editingId ? (
            <button type="button" className="ghost-btn" onClick={resetForm}>
              Cancel
            </button>
          ) : null}
        </div>
      </form>

      <div className="data-table">
        <div className="table-header cols-5">
          <span>Name</span>
          <span>Email</span>
          <span>Store</span>
          <span>Status</span>
          <span></span>
        </div>
        {rows.map((row) => (
          <div className="table-row cols-5" key={row.id}>
            <span>{row.full_name}</span>
            <span>{row.email}</span>
            <span>{row.stores?.[0]?.name || 'Unassigned'}</span>
            <span className={`status ${row.status}`}>{row.status}</span>
            <span className="row-actions">
              <button type="button" onClick={() => startEdit(row)}>Edit</button>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default StoreManagers;

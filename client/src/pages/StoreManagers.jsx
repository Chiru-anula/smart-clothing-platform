import { useEffect, useState, useCallback } from 'react';
import { getStoreManagers, saveStoreManager, updateUserStatus, subscribeToUsers } from '../services/dataService';

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
  const [filteredRows, setFilteredRows] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const applyFilters = useCallback((data, search) => {
    if (!search.trim()) {
      setFilteredRows(data);
      return;
    }
    const q = search.toLowerCase();
    const res = data.filter(
      (m) =>
        m.full_name?.toLowerCase().includes(q) ||
        m.email?.toLowerCase().includes(q) ||
        m.phone?.includes(q) ||
        m.stores?.[0]?.name?.toLowerCase().includes(q),
    );
    setFilteredRows(res);
  }, []);

  const loadData = useCallback(async () => {
    try {
      const data = await getStoreManagers();
      setRows(data.managers || []);
      setStores(data.stores || []);
      applyFilters(data.managers || [], searchTerm);
    } catch (err) {
      setError(err.message || 'Failed to load store managers');
    } finally {
      setLoading(false);
    }
  }, [applyFilters, searchTerm]);

  useEffect(() => {
    let isMounted = true;
    getStoreManagers()
      .then((data) => {
        if (isMounted) {
          setRows(data.managers || []);
          setStores(data.stores || []);
          applyFilters(data.managers || [], searchTerm);
        }
      })
      .catch((err) => {
        if (isMounted) setError(err.message || 'Failed to load store managers');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    const unsubscribe = subscribeToUsers(() => {
      if (isMounted) {
        getStoreManagers().then((data) => {
          if (isMounted) {
            setRows(data.managers || []);
            setStores(data.stores || []);
            applyFilters(data.managers || [], searchTerm);
          }
        });
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [applyFilters, searchTerm]);

  function handleSearchChange(e) {
    const val = e.target.value;
    setSearchTerm(val);
    applyFilters(rows, val);
  }

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setIsFormOpen(true);
    setError('');
  }

  function startEdit(row) {
    setEditingId(row.id);
    setForm({
      full_name: row.full_name || '',
      email: row.email || '',
      phone: row.phone || '',
      status: row.status || 'active',
      store_id: row.stores?.[0]?.id || '',
    });
    setIsFormOpen(true);
    setError('');
  }

  function closeForm() {
    setIsFormOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccessMsg('');

    try {
      await saveStoreManager(form, editingId);
      setSuccessMsg(
        editingId
          ? 'Store manager profile updated successfully.'
          : 'New store manager registered and assigned successfully.',
      );
      closeForm();
      await loadData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.message || 'Failed to save store manager');
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(manager) {
    const nextStatus = manager.status === 'active' ? 'inactive' : 'active';
    try {
      await updateUserStatus(manager.id, nextStatus);
      setSuccessMsg(`Status for ${manager.full_name} set to ${nextStatus}.`);
      await loadData();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update manager status');
    }
  }

  return (
    <section className="dashboard-section">
      <div className="section-header">
        <div>
          <h2>Store Manager Management</h2>
        </div>
        <button type="button" className="primary-btn" onClick={openCreate}>
          + Add Store Manager
        </button>
      </div>

      {error ? <div className="alert">{error}</div> : null}
      {successMsg ? <div className="alert success">{successMsg}</div> : null}

      <div className="filter-bar">
        <input
          type="text"
          className="search-input"
          placeholder="🔍 Search manager by name, email, store…"
          value={searchTerm}
          onChange={handleSearchChange}
        />
        <div style={{ fontSize: '13px', color: '#6b7280' }}>
          Registered Managers: <strong>{rows.length}</strong> | Total Stores:{' '}
          <strong>{stores.length}</strong>
        </div>
      </div>

      {/* Add / Edit Store Manager Modal */}
      {isFormOpen && (
        <div className="modal-overlay" onClick={closeForm}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingId ? 'Edit Store Manager' : 'Add Store Manager'}</h3>
              <button type="button" className="close-btn" onClick={closeForm}>
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <label>
                  Manager Full Name *
                  <input
                    placeholder="e.g. Nimal Perera"
                    value={form.full_name}
                    onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                    required
                  />
                </label>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <label>
                    Corporate Email *
                    <input
                      type="email"
                      placeholder="e.g. nimal@smartclothing.lk"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      required
                    />
                  </label>
                  <label>
                    Contact Hotline
                    <input
                      placeholder="e.g. 0771111111"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    />
                  </label>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <label>
                    Assigned Store Branch
                    <select
                      value={form.store_id}
                      onChange={(e) => setForm({ ...form, store_id: e.target.value })}
                    >
                      <option value="">-- No store assigned --</option>
                      {stores.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Employment Status
                    <select
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="ghost-btn" onClick={closeForm}>
                  Cancel
                </button>
                <button type="submit" className="primary-btn" disabled={saving}>
                  {saving ? 'Saving…' : editingId ? 'Update Manager' : 'Create Manager'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Managers Table */}
      <div className="data-table">
        <div className="table-header cols-5">
          <span>Manager Name</span>
          <span>Contact Details</span>
          <span>Assigned Store Branch</span>
          <span>Status</span>
          <span>Actions</span>
        </div>
        {loading ? (
          <div className="empty-row">Loading store managers…</div>
        ) : filteredRows.length === 0 ? (
          <div className="empty-row">No store managers found matching criteria.</div>
        ) : (
          filteredRows.map((row) => (
            <div className="table-row cols-5" key={row.id}>
              <div>
                <strong style={{ display: 'block' }}>{row.full_name}</strong>
                <small style={{ color: '#6b7280' }}>ID: {row.id.slice(0, 8)}…</small>
              </div>
              <div>
                <div>{row.email}</div>
                <small style={{ color: '#6b7280' }}>{row.phone || 'No phone'}</small>
              </div>
              <span>
                {row.stores?.[0] ? (
                  <strong style={{ color: '#1f2937' }}>📍 {row.stores[0].name}</strong>
                ) : (
                  <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Unassigned</span>
                )}
              </span>
              <span>
                <span className={`status ${row.status}`}>{row.status}</span>
              </span>
              <span className="row-actions">
                <button type="button" onClick={() => startEdit(row)}>
                  Edit
                </button>
                <button
                  type="button"
                  style={{ color: row.status === 'active' ? '#d97706' : '#166534' }}
                  onClick={() => toggleStatus(row)}
                >
                  {row.status === 'active' ? 'Deactivate' : 'Activate'}
                </button>
              </span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

export default StoreManagers;

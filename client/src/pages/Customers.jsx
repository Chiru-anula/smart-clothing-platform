import { useEffect, useState } from 'react';
import { getCustomers, saveCustomer, deleteCustomer } from '../services/dataService';
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
  const [filteredRows, setFilteredRows] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [viewingCustomer, setViewingCustomer] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  async function loadData() {
    setLoading(true);
    try {
      const data = await getCustomers();
      setRows(data || []);
      applyFilters(data || [], searchTerm, statusFilter);
    } catch (err) {
      setError(err.message || 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let isMounted = true;
    getCustomers()
      .then((data) => {
        if (isMounted) {
          setRows(data || []);
          setFilteredRows(data || []);
        }
      })
      .catch((err) => {
        if (isMounted) setError(err.message || 'Failed to load customers');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  function applyFilters(data, search, status) {
    let result = [...data];
    if (status !== 'all') {
      result = result.filter((r) => r.status === status);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.full_name?.toLowerCase().includes(q) ||
          r.email?.toLowerCase().includes(q) ||
          r.phone?.includes(q) ||
          r.customer_details?.city?.toLowerCase().includes(q),
      );
    }
    setFilteredRows(result);
  }

  function handleSearchChange(e) {
    const val = e.target.value;
    setSearchTerm(val);
    applyFilters(rows, val, statusFilter);
  }

  function handleFilterChange(newStatus) {
    setStatusFilter(newStatus);
    applyFilters(rows, searchTerm, newStatus);
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
      city: row.customer_details?.city || '',
      address_line: row.customer_details?.address_line || '',
      postal_code: row.customer_details?.postal_code || '',
      status: row.status || 'active',
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
      await saveCustomer(form, editingId);
      setSuccessMsg(editingId ? 'Customer account updated successfully.' : 'New customer registered successfully.');
      closeForm();
      await loadData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.message || 'Failed to save customer');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id, name) {
    if (!window.confirm(`Are you sure you want to remove customer "${name}"?`)) return;
    try {
      await deleteCustomer(id);
      setSuccessMsg(`Customer ${name} was removed.`);
      await loadData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.message || 'Failed to remove customer');
    }
  }

  const activeCount = rows.filter((r) => r.status === 'active').length;
  const inactiveCount = rows.filter((r) => r.status !== 'active').length;

  return (
    <section className="dashboard-section">
      <div className="section-header">
        <div>
          <h2>Customer Account Management</h2>
          <p>
            Total: {rows.length} customers ({activeCount} Active, {inactiveCount} Inactive/Suspended)
          </p>
        </div>
        <button type="button" className="primary-btn" onClick={openCreate}>
          + Register Customer
        </button>
      </div>

      {error ? <div className="alert">{error}</div> : null}
      {successMsg ? <div className="alert success">{successMsg}</div> : null}

      {/* Search & Filter Toolbar */}
      <div className="filter-bar">
        <input
          type="text"
          className="search-input"
          placeholder="🔍 Search name, email, phone, city…"
          value={searchTerm}
          onChange={handleSearchChange}
        />

        <div className="filter-tabs">
          {['all', 'active', 'inactive', 'suspended'].map((st) => (
            <button
              key={st}
              type="button"
              className={`tab-btn ${statusFilter === st ? 'active' : ''}`}
              onClick={() => handleFilterChange(st)}
            >
              {st.charAt(0).toUpperCase() + st.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Add / Edit Form Modal */}
      {isFormOpen && (
        <div className="modal-overlay" onClick={closeForm}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingId ? 'Edit Customer Record' : 'Register New Customer'}</h3>
              <button type="button" className="close-btn" onClick={closeForm}>
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <label>
                    Full Name *
                    <input
                      placeholder="e.g. Amaya Silva"
                      value={form.full_name}
                      onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                      required
                    />
                  </label>
                  <label>
                    Email Address *
                    <input
                      type="email"
                      placeholder="e.g. amaya@example.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      required
                    />
                  </label>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <label>
                    Phone Number
                    <input
                      placeholder="e.g. 0711111111"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    />
                  </label>
                  <label>
                    Account Status
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

                <label>
                  Delivery Street Address
                  <input
                    placeholder="e.g. 12 Galle Road"
                    value={form.address_line}
                    onChange={(e) => setForm({ ...form, address_line: e.target.value })}
                  />
                </label>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <label>
                    City
                    <input
                      placeholder="e.g. Colombo"
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                    />
                  </label>
                  <label>
                    Postal Code
                    <input
                      placeholder="e.g. 00300"
                      value={form.postal_code}
                      onChange={(e) => setForm({ ...form, postal_code: e.target.value })}
                    />
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="ghost-btn" onClick={closeForm}>
                  Cancel
                </button>
                <button type="submit" className="primary-btn" disabled={saving}>
                  {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Register Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Details Drawer / Modal */}
      {viewingCustomer && (
        <div className="modal-overlay" onClick={() => setViewingCustomer(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Customer Information</h3>
              <button type="button" className="close-btn" onClick={() => setViewingCustomer(null)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
                <div className="profile-circle" style={{ width: '48px', height: '48px', fontSize: '18px' }}>
                  {(viewingCustomer.full_name || 'C').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 style={{ fontSize: '16px', margin: 0 }}>{viewingCustomer.full_name}</h4>
                  <small style={{ color: '#6b7280' }}>{viewingCustomer.email}</small>
                </div>
                <span className={`status ${viewingCustomer.status}`} style={{ marginLeft: 'auto' }}>
                  {viewingCustomer.status}
                </span>
              </div>

              <div style={{ background: '#f9fafb', padding: '16px', borderRadius: '10px', fontSize: '13px' }}>
                <p><strong>Phone:</strong> {viewingCustomer.phone || 'Not provided'}</p>
                <p style={{ marginTop: '8px' }}>
                  <strong>Address:</strong> {viewingCustomer.customer_details?.address_line || '—'}
                </p>
                <p style={{ marginTop: '8px' }}>
                  <strong>City:</strong> {viewingCustomer.customer_details?.city || '—'}
                </p>
                <p style={{ marginTop: '8px' }}>
                  <strong>Postal Code:</strong> {viewingCustomer.customer_details?.postal_code || '—'}
                </p>
                <p style={{ marginTop: '8px' }}>
                  <strong>Registered On:</strong> {formatDate(viewingCustomer.created_at)}
                </p>
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="primary-btn"
                onClick={() => {
                  const target = viewingCustomer;
                  setViewingCustomer(null);
                  startEdit(target);
                }}
              >
                Edit Customer Record
              </button>
              <button type="button" className="ghost-btn" onClick={() => setViewingCustomer(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Data Table */}
      <div className="data-table">
        <div className="table-header cols-6">
          <span>Customer Name</span>
          <span>Email</span>
          <span>Phone</span>
          <span>City</span>
          <span>Status</span>
          <span>Actions</span>
        </div>
        {loading ? (
          <div className="empty-row">Loading customer records…</div>
        ) : filteredRows.length === 0 ? (
          <div className="empty-row">
            No customers found matching &quot;{searchTerm}&quot; {statusFilter !== 'all' ? `with status "${statusFilter}"` : ''}.
          </div>
        ) : (
          filteredRows.map((row) => (
            <div className="table-row cols-6" key={row.id}>
              <span style={{ fontWeight: 600 }}>{row.full_name}</span>
              <span>{row.email}</span>
              <span>{row.phone || '—'}</span>
              <span>{row.customer_details?.city || '—'}</span>
              <span>
                <span className={`status ${row.status}`}>{row.status}</span>
              </span>
              <span className="row-actions">
                <button type="button" onClick={() => setViewingCustomer(row)}>
                  View
                </button>
                <button type="button" onClick={() => startEdit(row)}>
                  Edit
                </button>
                <button
                  type="button"
                  className="danger"
                  onClick={() => handleDelete(row.id, row.full_name)}
                >
                  Delete
                </button>
              </span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

export default Customers;

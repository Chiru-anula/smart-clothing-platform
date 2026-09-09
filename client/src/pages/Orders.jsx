import { useEffect, useState, useCallback } from 'react';
import { getOrders, updateOrderStatus, createOrder, deleteOrder, subscribeToOrders } from '../services/dataService';
import { formatMoney, formatDate } from '../lib/format';

const STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

const emptyOrderForm = {
  order_number: '',
  customer_name: '',
  customer_email: '',
  store_name: 'Ceylon Gem — Colombo',
  total_amount: '',
  status: 'pending',
  items_count: 1,
};

function Orders() {
  const [rows, setRows] = useState([]);
  const [filteredRows, setFilteredRows] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [orderForm, setOrderForm] = useState(emptyOrderForm);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const applyFilters = useCallback((data, search, status) => {
    let result = [...data];
    if (status !== 'all') {
      result = result.filter((r) => r.status === status);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.order_number?.toLowerCase().includes(q) ||
          r.customer_name?.toLowerCase().includes(q) ||
          r.customer_email?.toLowerCase().includes(q) ||
          r.store_name?.toLowerCase().includes(q),
      );
    }
    setFilteredRows(result);
  }, []);

  const loadData = useCallback(async () => {
    try {
      const data = await getOrders();
      setRows(data || []);
      applyFilters(data || [], searchTerm, statusFilter);
    } catch (err) {
      setError(err.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [applyFilters, searchTerm, statusFilter]);

  useEffect(() => {
    let isMounted = true;
    getOrders()
      .then((data) => {
        if (isMounted) {
          setRows(data || []);
          applyFilters(data || [], searchTerm, statusFilter);
        }
      })
      .catch((err) => {
        if (isMounted) setError(err.message || 'Failed to load orders');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    const unsubscribe = subscribeToOrders(() => {
      if (isMounted) {
        getOrders().then((data) => {
          if (isMounted) {
            setRows(data || []);
            applyFilters(data || [], searchTerm, statusFilter);
          }
        });
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [applyFilters, searchTerm, statusFilter]);

  function handleFilter(status) {
    setStatusFilter(status);
    applyFilters(rows, searchTerm, status);
  }

  function handleSearch(e) {
    const val = e.target.value;
    setSearchTerm(val);
    applyFilters(rows, val, statusFilter);
  }

  function openCreateModal() {
    setOrderForm({
      ...emptyOrderForm,
      order_number: `ORD-${Date.now().toString().slice(-5)}`,
    });
    setIsCreateOpen(true);
    setError('');
  }

  async function handleCreateOrder(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccessMsg('');

    try {
      await createOrder({
        ...orderForm,
        total_amount: Number(orderForm.total_amount) || 0,
      });
      setSuccessMsg(`Order ${orderForm.order_number} created successfully.`);
      setIsCreateOpen(false);
      setOrderForm(emptyOrderForm);
      await loadData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.message || 'Failed to create order');
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(order, nextStatus) {
    if (order.status === nextStatus) return;

    try {
      await updateOrderStatus(order.id, nextStatus);
      setSuccessMsg(`Order ${order.order_number} marked as ${nextStatus}.`);
      await loadData();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update order status');
    }
  }

  async function handleDeleteOrder(order) {
    if (!window.confirm(`Are you sure you want to permanently delete order "${order.order_number}"?`)) return;
    try {
      await deleteOrder(order.id);
      setSuccessMsg(`Order ${order.order_number} was removed.`);
      await loadData();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to delete order');
    }
  }

  const pendingCount = rows.filter((r) => r.status === 'pending').length;
  const processingCount = rows.filter((r) => r.status === 'processing').length;
  const shippedCount = rows.filter((r) => r.status === 'shipped').length;
  const deliveredCount = rows.filter((r) => r.status === 'delivered').length;
  const cancelledCount = rows.filter((r) => r.status === 'cancelled').length;

  return (
    <section className="dashboard-section">
      <div className="section-header">
        <div>
          <h2>Order Fulfilment Management</h2>
        </div>
        <button type="button" className="primary-btn" onClick={openCreateModal}>
          + Create Order
        </button>
      </div>

      {error ? <div className="alert">{error}</div> : null}
      {successMsg ? <div className="alert success">{successMsg}</div> : null}

      {/* Filter and Search Bar */}
      <div className="filter-bar">
        <input
          type="text"
          className="search-input"
          placeholder="🔍 Search order number, customer, or store branch…"
          value={searchTerm}
          onChange={handleSearch}
        />

        <div className="filter-tabs">
          <button
            type="button"
            className={`tab-btn ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => handleFilter('all')}
          >
            All ({rows.length})
          </button>
          <button
            type="button"
            className={`tab-btn ${statusFilter === 'pending' ? 'active' : ''}`}
            onClick={() => handleFilter('pending')}
          >
            Pending ({pendingCount})
          </button>
          <button
            type="button"
            className={`tab-btn ${statusFilter === 'processing' ? 'active' : ''}`}
            onClick={() => handleFilter('processing')}
          >
            Processing ({processingCount})
          </button>
          <button
            type="button"
            className={`tab-btn ${statusFilter === 'shipped' ? 'active' : ''}`}
            onClick={() => handleFilter('shipped')}
          >
            Shipped ({shippedCount})
          </button>
          <button
            type="button"
            className={`tab-btn ${statusFilter === 'delivered' ? 'active' : ''}`}
            onClick={() => handleFilter('delivered')}
          >
            Delivered ({deliveredCount})
          </button>
          <button
            type="button"
            className={`tab-btn ${statusFilter === 'cancelled' ? 'active' : ''}`}
            onClick={() => handleFilter('cancelled')}
          >
            Cancelled ({cancelledCount})
          </button>
        </div>
      </div>

      {/* Create Order Modal */}
      {isCreateOpen && (
        <div className="modal-overlay" onClick={() => setIsCreateOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create New Order</h3>
              <button type="button" className="close-btn" onClick={() => setIsCreateOpen(false)}>
                ×
              </button>
            </div>
            <form onSubmit={handleCreateOrder}>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <label>
                    Order Number *
                    <input
                      placeholder="e.g. ORD-1004"
                      value={orderForm.order_number}
                      onChange={(e) => setOrderForm({ ...orderForm, order_number: e.target.value })}
                      required
                    />
                  </label>
                  <label>
                    Store Branch
                    <select
                      value={orderForm.store_name}
                      onChange={(e) => setOrderForm({ ...orderForm, store_name: e.target.value })}
                    >
                      <option value="Ceylon Gem — Colombo">Ceylon Gem — Colombo</option>
                      <option value="Ceylon Gem — Kandy">Ceylon Gem — Kandy</option>
                    </select>
                  </label>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <label>
                    Customer Full Name *
                    <input
                      placeholder="e.g. Nimal Silva"
                      value={orderForm.customer_name}
                      onChange={(e) => setOrderForm({ ...orderForm, customer_name: e.target.value })}
                      required
                    />
                  </label>
                  <label>
                    Customer Email Address
                    <input
                      type="email"
                      placeholder="e.g. nimal@example.com"
                      value={orderForm.customer_email}
                      onChange={(e) => setOrderForm({ ...orderForm, customer_email: e.target.value })}
                    />
                  </label>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <label>
                    Total Amount (LKR) *
                    <input
                      type="number"
                      step="0.01"
                      placeholder="e.g. 7500"
                      value={orderForm.total_amount}
                      onChange={(e) => setOrderForm({ ...orderForm, total_amount: e.target.value })}
                      required
                    />
                  </label>
                  <label>
                    Initial Status
                    <select
                      value={orderForm.status}
                      onChange={(e) => setOrderForm({ ...orderForm, status: e.target.value })}
                    >
                      {STATUSES.map((st) => (
                        <option key={st} value={st}>
                          {st.charAt(0).toUpperCase() + st.slice(1)}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="ghost-btn" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary-btn" disabled={saving}>
                  {saving ? 'Creating…' : 'Create Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Orders Data Table */}
      <div className="data-table">
        <div className="table-header cols-6">
          <span>Order Number</span>
          <span>Customer</span>
          <span>Store Branch</span>
          <span>Total Amount</span>
          <span>Date Placed</span>
          <span>Workflow Status</span>
        </div>
        {loading ? (
          <div className="empty-row">Loading order records…</div>
        ) : filteredRows.length === 0 ? (
          <div className="empty-row" style={{ padding: '36px 16px', textAlign: 'center' }}>
            <p style={{ margin: 0, fontWeight: 500 }}>No orders found in &quot;{statusFilter}&quot; filter.</p>
            <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#6b7280' }}>
              Click <strong>+ Create Order</strong> above to record your first transaction.
            </p>
          </div>
        ) : (
          filteredRows.map((row) => (
            <div className="table-row cols-6" key={row.id}>
              <div>
                <span
                  style={{
                    display: 'inline-block',
                    background: '#f1f5f9',
                    color: '#334155',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontWeight: 700,
                    fontFamily: 'monospace',
                    fontSize: '12px',
                  }}
                >
                  {row.order_number}
                </span>
              </div>
              <div>
                <strong style={{ display: 'block' }}>{row.customer_name}</strong>
                <small style={{ color: '#64748b' }}>{row.customer_email || '—'}</small>
              </div>
              <span style={{ color: '#334155', fontSize: '13px' }}>{row.store_name}</span>
              <span style={{ fontWeight: 600, color: '#0f172a' }}>{formatMoney(row.total_amount)}</span>
              <span style={{ fontSize: '12px', color: '#64748b' }}>{formatDate(row.created_at)}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <select
                  value={row.status}
                  onChange={(e) => handleStatusChange(row, e.target.value)}
                  className={`status-select ${row.status}`}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => handleDeleteOrder(row)}
                  style={{
                    background: '#fee2e2',
                    border: '1px solid #fecaca',
                    color: '#991b1b',
                    borderRadius: '8px',
                    padding: '4px 8px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                  title="Delete order"
                >
                  ✕
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

export default Orders;

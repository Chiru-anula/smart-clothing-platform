import { useEffect, useState } from 'react';
import { getOrders, getOrderDetails, updateOrderStatus } from '../services/dataService';
import { useAuth } from '../context';
import { formatMoney, formatDate } from '../lib/format';

const STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

function Orders() {
  const { profile } = useAuth();
  const [rows, setRows] = useState([]);
  const [filteredRows, setFilteredRows] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [viewingOrder, setViewingOrder] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  async function loadData() {
    setLoading(true);
    try {
      const data = await getOrders();
      setRows(data || []);
      applyFilters(data || [], searchTerm, statusFilter);
    } catch (err) {
      setError(err.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let isMounted = true;
    getOrders()
      .then((data) => {
        if (isMounted) {
          setRows(data || []);
          setFilteredRows(data || []);
        }
      })
      .catch((err) => {
        if (isMounted) setError(err.message || 'Failed to load orders');
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
          r.order_number?.toLowerCase().includes(q) ||
          r.profiles?.full_name?.toLowerCase().includes(q) ||
          r.shipping_address?.toLowerCase().includes(q),
      );
    }
    setFilteredRows(result);
  }

  function handleSearch(e) {
    const val = e.target.value;
    setSearchTerm(val);
    applyFilters(rows, val, statusFilter);
  }

  function handleStatusFilter(status) {
    setStatusFilter(status);
    applyFilters(rows, searchTerm, status);
  }

  async function openOrderDetails(order) {
    setViewingOrder(order);
    setDetailsLoading(true);
    try {
      const details = await getOrderDetails(order.id);
      setOrderDetails(details);
    } catch (err) {
      setError(err.message || 'Failed to load order breakdown');
    } finally {
      setDetailsLoading(false);
    }
  }

  function closeOrderDetails() {
    setViewingOrder(null);
    setOrderDetails(null);
  }

  async function handleStatusChange(order, nextStatus) {
    if (order.status === nextStatus) return;

    if (nextStatus === 'cancelled') {
      const confirmed = window.confirm(
        `Are you sure you want to cancel order ${order.order_number}? This action will record a cancellation in the audit trail.`,
      );
      if (!confirmed) return;
    }

    try {
      const note = `Status changed from ${order.status} to ${nextStatus} via Admin Console`;
      await updateOrderStatus(order.id, order.status, nextStatus, note, profile?.id || null);
      setSuccessMsg(`Order ${order.order_number} status updated to "${nextStatus}".`);
      await loadData();
      if (viewingOrder && viewingOrder.id === order.id) {
        const details = await getOrderDetails(order.id);
        setOrderDetails(details);
        setViewingOrder({ ...viewingOrder, status: nextStatus });
      }
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.message || 'Failed to update order status');
    }
  }

  return (
    <section className="dashboard-section">
      <div className="section-header">
        <div>
          <h2>Order Fulfilment & Tracking</h2>
          <p>Supervise order processing, logistics status, and status change audit histories</p>
        </div>
        <div style={{ fontSize: '13px', color: '#6b7280' }}>
          Total Orders: <strong>{rows.length}</strong>
        </div>
      </div>

      {error ? <div className="alert">{error}</div> : null}
      {successMsg ? <div className="alert success">{successMsg}</div> : null}

      {/* Filter and Search Bar */}
      <div className="filter-bar">
        <input
          type="text"
          className="search-input"
          placeholder="🔍 Search order #, customer, address…"
          value={searchTerm}
          onChange={handleSearch}
        />

        <div className="filter-tabs">
          {['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((st) => (
            <button
              key={st}
              type="button"
              className={`tab-btn ${statusFilter === st ? 'active' : ''}`}
              onClick={() => handleStatusFilter(st)}
            >
              {st.charAt(0).toUpperCase() + st.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Order Details Modal */}
      {viewingOrder && (
        <div className="modal-overlay" onClick={closeOrderDetails}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 style={{ margin: 0 }}>Order Details: {viewingOrder.order_number}</h3>
                <small style={{ color: '#6b7280' }}>
                  Placed on {formatDate(viewingOrder.created_at)}
                </small>
              </div>
              <button type="button" className="close-btn" onClick={closeOrderDetails}>
                ×
              </button>
            </div>

            <div className="modal-body">
              {detailsLoading ? (
                <div className="empty-row">Retrieving order details…</div>
              ) : orderDetails ? (
                <>
                  {/* Customer and Store Info */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', background: '#f9fafb', padding: '16px', borderRadius: '10px', fontSize: '13px' }}>
                    <div>
                      <strong>Customer:</strong>
                      <p style={{ margin: '2px 0 0' }}>{orderDetails.order.profiles?.full_name || 'Customer'}</p>
                      <small style={{ color: '#6b7280' }}>{orderDetails.order.profiles?.email}</small>
                      <br />
                      <small style={{ color: '#6b7280' }}>Phone: {orderDetails.order.profiles?.phone || '—'}</small>
                    </div>
                    <div>
                      <strong>Delivery Destination:</strong>
                      <p style={{ margin: '2px 0 0' }}>{orderDetails.order.shipping_address || 'Standard Delivery'}</p>
                      <small style={{ color: '#6b7280' }}>Fulfilled by: {orderDetails.order.stores?.name || 'Central Warehouse'}</small>
                    </div>
                  </div>

                  {/* Order Line Items */}
                  <div>
                    <h4 style={{ fontSize: '14px', marginBottom: '8px', color: '#111827' }}>Purchased Items</h4>
                    <div className="order-items-list">
                      {orderDetails.items.length === 0 ? (
                        <div style={{ padding: '12px', textAlign: 'center', color: '#6b7280' }}>No item breakdown recorded.</div>
                      ) : (
                        orderDetails.items.map((item) => (
                          <div className="order-item-row" key={item.id}>
                            <div>
                              <strong>{item.product_name}</strong>
                              <span style={{ color: '#6b7280', marginLeft: '6px' }}>× {item.quantity}</span>
                            </div>
                            <div>
                              <span style={{ color: '#6b7280', marginRight: '8px' }}>@ {formatMoney(item.unit_price)}</span>
                              <strong>{formatMoney(item.line_total)}</strong>
                            </div>
                          </div>
                        ))
                      )}
                      <div className="order-item-row" style={{ background: '#f9fafb', fontWeight: 700 }}>
                        <span>Total Amount</span>
                        <span style={{ color: '#166534', fontSize: '15px' }}>
                          {formatMoney(orderDetails.order.total_amount)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Payment & Status */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f9fafb', padding: '12px 16px', borderRadius: '8px', fontSize: '13px' }}>
                    <div>
                      <strong>Payment Status: </strong>
                      <span className={`status ${orderDetails.payment?.status || 'pending'}`}>
                        {orderDetails.payment ? `${orderDetails.payment.status} (${orderDetails.payment.method})` : 'Unpaid'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong>Fulfilment:</strong>
                      <select
                        value={orderDetails.order.status}
                        onChange={(e) => handleStatusChange(orderDetails.order, e.target.value)}
                        style={{ width: 'auto', padding: '4px 8px' }}
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Audit History Timeline */}
                  <div>
                    <h4 style={{ fontSize: '14px', marginBottom: '10px', color: '#111827' }}>Status Transition Audit History</h4>
                    <div className="order-history-timeline">
                      {orderDetails.history.length === 0 ? (
                        <p style={{ color: '#6b7280', fontSize: '13px' }}>Initial pending status placed with order.</p>
                      ) : (
                        orderDetails.history.map((h) => (
                          <div className="history-entry" key={h.id}>
                            <strong>
                              {h.from_status} → <span style={{ color: '#4f46e5' }}>{h.to_status}</span>
                            </strong>
                            <p style={{ margin: '2px 0 0', color: '#4b5563' }}>{h.note}</p>
                            <span className="history-meta">{formatDate(h.created_at)}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              ) : null}
            </div>

            <div className="modal-footer">
              <button type="button" className="ghost-btn" onClick={closeOrderDetails}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Orders Table */}
      <div className="data-table">
        <div className="table-header cols-6">
          <span>Order Number</span>
          <span>Customer & Destination</span>
          <span>Fulfilment Branch</span>
          <span>Amount</span>
          <span>Date Placed</span>
          <span>Update Status</span>
        </div>
        {loading ? (
          <div className="empty-row">Loading customer orders…</div>
        ) : filteredRows.length === 0 ? (
          <div className="empty-row">No orders found matching criteria.</div>
        ) : (
          filteredRows.map((row) => (
            <div className="table-row cols-6" key={row.id}>
              <div>
                <button
                  type="button"
                  onClick={() => openOrderDetails(row)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#4f46e5',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: '14px',
                    padding: 0,
                    textAlign: 'left',
                  }}
                >
                  {row.order_number} 🔍
                </button>
              </div>

              <div>
                <strong>{row.profiles?.full_name || 'Customer'}</strong>
                <small style={{ color: '#6b7280', display: 'block' }}>
                  {row.shipping_address || 'Standard Shipping'}
                </small>
              </div>

              <span>{row.stores?.name || 'Central Store'}</span>

              <span style={{ fontWeight: 600 }}>{formatMoney(row.total_amount)}</span>

              <span style={{ fontSize: '13px', color: '#6b7280' }}>
                {formatDate(row.created_at)}
              </span>

              <span>
                <select
                  value={row.status}
                  onChange={(e) => handleStatusChange(row, e.target.value)}
                  style={{ fontWeight: 600 }}
                >
                  {STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

export default Orders;

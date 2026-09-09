import { useEffect, useState, useCallback } from 'react';
import { getReviews, moderateReview, createReview, deleteReview, subscribeToReviews } from '../services/dataService';
import { formatDate } from '../lib/format';

const emptyReviewForm = {
  customer_name: '',
  customer_email: '',
  product_name: '',
  rating: 5,
  comment: '',
  status: 'pending',
};

function Reviews() {
  const [rows, setRows] = useState([]);
  const [filteredRows, setFilteredRows] = useState([]);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [form, setForm] = useState(emptyReviewForm);

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
          r.customer_name?.toLowerCase().includes(q) ||
          r.customer_email?.toLowerCase().includes(q) ||
          r.product_name?.toLowerCase().includes(q) ||
          r.comment?.toLowerCase().includes(q),
      );
    }
    setFilteredRows(result);
  }, []);

  const loadData = useCallback(async () => {
    try {
      const data = await getReviews();
      setRows(data || []);
      applyFilters(data || [], searchTerm, statusFilter);
    } catch (err) {
      setError(err.message || 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  }, [applyFilters, searchTerm, statusFilter]);

  useEffect(() => {
    let isMounted = true;
    getReviews()
      .then((data) => {
        if (isMounted) {
          setRows(data || []);
          applyFilters(data || [], searchTerm, statusFilter);
        }
      })
      .catch((err) => {
        if (isMounted) setError(err.message || 'Failed to load reviews');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    const unsubscribe = subscribeToReviews(() => {
      if (isMounted) {
        getReviews().then((data) => {
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

  function openAddModal() {
    setForm(emptyReviewForm);
    setIsAddOpen(true);
    setError('');
  }

  async function handleAddReview(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccessMsg('');

    try {
      await createReview({
        ...form,
        rating: Number(form.rating) || 5,
      });
      setSuccessMsg(`Review for "${form.product_name}" submitted to moderation queue.`);
      setIsAddOpen(false);
      setForm(emptyReviewForm);
      await loadData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.message || 'Failed to submit review');
    } finally {
      setSaving(false);
    }
  }

  async function handleModerate(review, nextStatus) {
    try {
      await moderateReview(review.id, nextStatus);
      setSuccessMsg(`Review for "${review.product_name}" has been ${nextStatus}.`);
      await loadData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.message || 'Failed to moderate review');
    }
  }

  async function handleDeleteReview(review) {
    if (!window.confirm(`Are you sure you want to permanently delete the review for "${review.product_name}"?`)) return;
    try {
      await deleteReview(review.id);
      setSuccessMsg(`Review for "${review.product_name}" was deleted.`);
      await loadData();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to delete review');
    }
  }

  const pendingCount = rows.filter((r) => r.status === 'pending').length;
  const approvedCount = rows.filter((r) => r.status === 'approved').length;
  const rejectedCount = rows.filter((r) => r.status === 'rejected').length;

  return (
    <section className="dashboard-section">
      <div className="section-header">
        <div>
          <h2>Customer Review Moderation</h2>
        </div>
        <button type="button" className="primary-btn" onClick={openAddModal}>
          + Submit Review
        </button>
      </div>

      {error ? <div className="alert">{error}</div> : null}
      {successMsg ? <div className="alert success">{successMsg}</div> : null}

      {/* Filter and Search Bar */}
      <div className="filter-bar">
        <input
          type="text"
          className="search-input"
          placeholder="🔍 Search reviewer, product, or comment content…"
          value={searchTerm}
          onChange={handleSearch}
        />

        <div className="filter-tabs">
          <button
            type="button"
            className={`tab-btn ${statusFilter === 'pending' ? 'active' : ''}`}
            onClick={() => handleFilter('pending')}
          >
            Pending ({pendingCount})
          </button>
          <button
            type="button"
            className={`tab-btn ${statusFilter === 'approved' ? 'active' : ''}`}
            onClick={() => handleFilter('approved')}
          >
            Approved ({approvedCount})
          </button>
          <button
            type="button"
            className={`tab-btn ${statusFilter === 'rejected' ? 'active' : ''}`}
            onClick={() => handleFilter('rejected')}
          >
            Rejected ({rejectedCount})
          </button>
          <button
            type="button"
            className={`tab-btn ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => handleFilter('all')}
          >
            All Reviews ({rows.length})
          </button>
        </div>
      </div>

      {/* Submit Review Modal */}
      {isAddOpen && (
        <div className="modal-overlay" onClick={() => setIsAddOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Submit Customer Review</h3>
              <button type="button" className="close-btn" onClick={() => setIsAddOpen(false)}>
                ×
              </button>
            </div>
            <form onSubmit={handleAddReview}>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <label>
                    Customer Full Name *
                    <input
                      placeholder="e.g. Kasun Jayawardena"
                      value={form.customer_name}
                      onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                      required
                    />
                  </label>
                  <label>
                    Customer Email
                    <input
                      type="email"
                      placeholder="e.g. kasun@example.com"
                      value={form.customer_email}
                      onChange={(e) => setForm({ ...form, customer_email: e.target.value })}
                    />
                  </label>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <label>
                    Product Name *
                    <input
                      placeholder="e.g. Classic Cotton Polo Shirt"
                      value={form.product_name}
                      onChange={(e) => setForm({ ...form, product_name: e.target.value })}
                      required
                    />
                  </label>
                  <label>
                    Star Rating (1 - 5) *
                    <select
                      value={form.rating}
                      onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })}
                    >
                      <option value="5">⭐⭐⭐⭐⭐ (5 Stars - Excellent)</option>
                      <option value="4">⭐⭐⭐⭐ (4 Stars - Good)</option>
                      <option value="3">⭐⭐⭐ (3 Stars - Average)</option>
                      <option value="2">⭐⭐ (2 Stars - Poor)</option>
                      <option value="1">⭐ (1 Star - Terrible)</option>
                    </select>
                  </label>
                </div>

                <label>
                  Customer Feedback / Comment *
                  <textarea
                    rows="3"
                    placeholder="e.g. The fabric quality is exceptional and the delivery arrived on time."
                    value={form.comment}
                    onChange={(e) => setForm({ ...form, comment: e.target.value })}
                    required
                  />
                </label>
              </div>

              <div className="modal-footer">
                <button type="button" className="ghost-btn" onClick={() => setIsAddOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary-btn" disabled={saving}>
                  {saving ? 'Submitting…' : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reviews Table */}
      <div className="data-table">
        <div className="table-header cols-6">
          <span>Customer</span>
          <span>Product Item</span>
          <span>Rating</span>
          <span>Customer Feedback</span>
          <span>Status</span>
          <span>Moderation Actions</span>
        </div>
        {loading ? (
          <div className="empty-row">Loading customer reviews…</div>
        ) : filteredRows.length === 0 ? (
          <div className="empty-row" style={{ padding: '36px 16px', textAlign: 'center' }}>
            <p style={{ margin: 0, fontWeight: 500 }}>No reviews in &quot;{statusFilter}&quot; queue.</p>
            <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#64748b' }}>
              Click <strong>+ Submit Review</strong> above to add customer feedback.
            </p>
          </div>
        ) : (
          filteredRows.map((row) => (
            <div className="table-row cols-6" key={row.id}>
              <div>
                <strong style={{ display: 'block' }}>{row.customer_name}</strong>
                <small style={{ color: '#64748b' }}>{formatDate(row.created_at)}</small>
              </div>

              <div>
                <strong style={{ color: '#0f172a' }}>{row.product_name}</strong>
              </div>

              <span style={{ fontSize: '14px', color: '#f59e0b', letterSpacing: '2px' }}>
                {'★'.repeat(row.rating || 0)}
                <span style={{ color: '#cbd5e1' }}>{'★'.repeat(Math.max(0, 5 - (row.rating || 0)))}</span>
              </span>

              <span style={{ fontStyle: 'italic', color: '#334155', fontSize: '13px' }}>
                &ldquo;{row.comment}&rdquo;
              </span>

              <span>
                <span className={`status ${row.status}`}>{row.status}</span>
              </span>

              <span className="row-actions">
                {row.status !== 'approved' && (
                  <button
                    type="button"
                    style={{ color: '#166534', fontWeight: 600, background: '#f0fdf4', padding: '4px 8px', borderRadius: '6px' }}
                    onClick={() => handleModerate(row, 'approved')}
                  >
                    ✓ Approve
                  </button>
                )}
                {row.status !== 'rejected' && (
                  <button
                    type="button"
                    style={{ color: '#991b1b', fontWeight: 600, background: '#fef2f2', padding: '4px 8px', borderRadius: '6px' }}
                    onClick={() => handleModerate(row, 'rejected')}
                  >
                    ✕ Reject
                  </button>
                )}
                <button
                  type="button"
                  style={{ color: '#64748b', fontWeight: 600, background: '#f1f5f9', padding: '4px 8px', borderRadius: '6px' }}
                  onClick={() => handleDeleteReview(row)}
                  title="Delete review"
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

export default Reviews;

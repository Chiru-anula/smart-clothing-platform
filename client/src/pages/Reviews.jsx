import { useEffect, useState } from 'react';
import { getReviews, moderateReview } from '../services/dataService';
import { useAuth } from '../context';
import { formatDate } from '../lib/format';

function Reviews() {
  const { profile } = useAuth();
  const [rows, setRows] = useState([]);
  const [filteredRows, setFilteredRows] = useState([]);
  const [statusFilter, setStatusFilter] = useState('pending'); // default to pending for moderation
  const [searchTerm, setSearchTerm] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  async function loadData() {
    setLoading(true);
    try {
      const data = await getReviews();
      setRows(data || []);
      applyFilters(data || [], searchTerm, statusFilter);
    } catch (err) {
      setError(err.message || 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let isMounted = true;
    getReviews()
      .then((data) => {
        if (isMounted) {
          setRows(data || []);
          const pendingOnly = (data || []).filter((r) => r.status === 'pending');
          setFilteredRows(pendingOnly);
        }
      })
      .catch((err) => {
        if (isMounted) setError(err.message || 'Failed to load reviews');
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
          r.profiles?.full_name?.toLowerCase().includes(q) ||
          r.products?.name?.toLowerCase().includes(q) ||
          r.comment?.toLowerCase().includes(q),
      );
    }
    setFilteredRows(result);
  }

  function handleSearch(e) {
    const val = e.target.value;
    setSearchTerm(val);
    applyFilters(rows, val, statusFilter);
  }

  function handleFilter(status) {
    setStatusFilter(status);
    applyFilters(rows, searchTerm, status);
  }

  async function handleModerate(review, nextStatus) {
    try {
      await moderateReview(review.id, nextStatus, profile?.id || null);
      setSuccessMsg(`Review for "${review.products?.name}" has been ${nextStatus}.`);
      await loadData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.message || 'Failed to moderate review');
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
          <p>
            Review customer feedback before publishing to the public storefront ({pendingCount} pending moderation)
          </p>
        </div>
      </div>

      {error ? <div className="alert">{error}</div> : null}
      {successMsg ? <div className="alert success">{successMsg}</div> : null}

      {/* Filter and Search Bar */}
      <div className="filter-bar">
        <input
          type="text"
          className="search-input"
          placeholder="🔍 Search reviewer, product, or comment…"
          value={searchTerm}
          onChange={handleSearch}
        />

        <div className="filter-tabs">
          <button
            type="button"
            className={`tab-btn ${statusFilter === 'pending' ? 'active' : ''}`}
            onClick={() => handleFilter('pending')}
          >
            Pending Moderation ({pendingCount})
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

      {/* Reviews Table */}
      <div className="data-table">
        <div className="table-header cols-6">
          <span>Customer</span>
          <span>Product Item</span>
          <span>Rating</span>
          <span>Comment & Feedback</span>
          <span>Status</span>
          <span>Moderation Actions</span>
        </div>
        {loading ? (
          <div className="empty-row">Loading customer reviews…</div>
        ) : filteredRows.length === 0 ? (
          <div className="empty-row">
            No reviews found in &quot;{statusFilter}&quot; queue.
          </div>
        ) : (
          filteredRows.map((row) => (
            <div className="table-row cols-6" key={row.id}>
              <div>
                <strong>{row.profiles?.full_name || 'Customer'}</strong>
                <small style={{ color: '#6b7280', display: 'block' }}>
                  {formatDate(row.created_at)}
                </small>
              </div>

              <div>
                <strong>{row.products?.name || 'Item'}</strong>
                {row.products?.sku && (
                  <small style={{ color: '#6b7280', display: 'block' }}>{row.products.sku}</small>
                )}
              </div>

              <span className="star-rating">
                {'★'.repeat(row.rating || 0)}
                {'☆'.repeat(5 - (row.rating || 0))}
                <span style={{ fontSize: '12px', color: '#6b7280', marginLeft: '4px' }}>
                  ({row.rating}/5)
                </span>
              </span>

              <span style={{ fontStyle: 'italic', color: '#374151' }}>
                &ldquo;{row.comment}&rdquo;
              </span>

              <span>
                <span className={`status ${row.status}`}>{row.status}</span>
              </span>

              <span className="row-actions">
                {row.status !== 'approved' && (
                  <button
                    type="button"
                    style={{ color: '#166534', fontWeight: 700 }}
                    onClick={() => handleModerate(row, 'approved')}
                  >
                    ✓ Approve
                  </button>
                )}
                {row.status !== 'rejected' && (
                  <button
                    type="button"
                    className="danger"
                    onClick={() => handleModerate(row, 'rejected')}
                  >
                    ✕ Reject
                  </button>
                )}
              </span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

export default Reviews;

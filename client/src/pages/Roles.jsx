import { useEffect, useState, useCallback } from 'react';
import { getUsersForRoles, updateUserRole, updateUserStatus, createUserWithRole, subscribeToUsers } from '../services/dataService';
import { formatDate } from '../lib/format';

function Roles() {
  const [rows, setRows] = useState([]);
  const [filteredRows, setFilteredRows] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    role: 'store_manager',
    status: 'active',
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const applyFilters = useCallback((data, search, role) => {
    let result = [...data];
    if (role !== 'all') {
      result = result.filter((r) => r.role === role);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.full_name?.toLowerCase().includes(q) ||
          r.email?.toLowerCase().includes(q),
      );
    }
    setFilteredRows(result);
  }, []);

  const loadData = useCallback(async () => {
    try {
      const data = await getUsersForRoles();
      setRows(data || []);
      applyFilters(data || [], searchTerm, roleFilter);
    } catch (err) {
      setError(err.message || 'Failed to load user roles');
    } finally {
      setLoading(false);
    }
  }, [applyFilters, searchTerm, roleFilter]);

  useEffect(() => {
    let isMounted = true;
    getUsersForRoles()
      .then((data) => {
        if (isMounted) {
          setRows(data || []);
          applyFilters(data || [], searchTerm, roleFilter);
        }
      })
      .catch((err) => {
        if (isMounted) setError(err.message || 'Failed to load user roles');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    const unsubscribe = subscribeToUsers(() => {
      if (isMounted) {
        getUsersForRoles().then((data) => {
          if (isMounted) {
            setRows(data || []);
            applyFilters(data || [], searchTerm, roleFilter);
          }
        });
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [applyFilters, searchTerm, roleFilter]);

  function handleSearch(e) {
    const val = e.target.value;
    setSearchTerm(val);
    applyFilters(rows, val, roleFilter);
  }

  function handleRoleFilter(selectedRole) {
    setRoleFilter(selectedRole);
    applyFilters(rows, searchTerm, selectedRole);
  }

  async function handleRoleChange(user, nextRole) {
    if (user.role === nextRole) return;

    if (user.role === 'admin' && nextRole !== 'admin') {
      const confirmed = window.confirm(
        `CAUTION: You are demoting administrator "${user.full_name}" to "${nextRole}". This user will lose access to the Admin Console. Proceed?`,
      );
      if (!confirmed) {
        await loadData();
        return;
      }
    }

    try {
      await updateUserRole(user.id, nextRole);
      setSuccessMsg(`Role for ${user.full_name} changed to "${nextRole}".`);
      await loadData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.message || 'Failed to update user role');
    }
  }

  async function handleStatusChange(user, nextStatus) {
    if (user.status === nextStatus) return;
    try {
      await updateUserStatus(user.id, nextStatus);
      setSuccessMsg(`Account status for ${user.full_name} set to "${nextStatus}".`);
      await loadData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.message || 'Failed to update account status');
    }
  }

  async function handleAddUser(e) {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    try {
      await createUserWithRole(newUserForm);
      setSuccessMsg(`User "${newUserForm.full_name}" created with role "${newUserForm.role}".`);
      setIsAddUserOpen(false);
      setNewUserForm({
        full_name: '',
        email: '',
        phone: '',
        role: 'store_manager',
        status: 'active',
      });
      await loadData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.message || 'Failed to create user');
    }
  }

  return (
    <section className="dashboard-section">
      <div className="section-header">
        <div>
          <h2>User Role & Access Management</h2>
        </div>
        <button type="button" className="primary-btn" onClick={() => setIsAddUserOpen(true)}>
          + Create Privileged User
        </button>
      </div>

      {error ? <div className="alert">{error}</div> : null}
      {successMsg ? <div className="alert success">{successMsg}</div> : null}

      {/* Filter and Search Bar */}
      <div className="filter-bar">
        <input
          type="text"
          className="search-input"
          placeholder="🔍 Search user name or email…"
          value={searchTerm}
          onChange={handleSearch}
        />

        <div className="filter-tabs">
          {['all', 'admin', 'store_manager', 'customer'].map((r) => (
            <button
              key={r}
              type="button"
              className={`tab-btn ${roleFilter === r ? 'active' : ''}`}
              onClick={() => handleRoleFilter(r)}
            >
              {r === 'all'
                ? 'All Users'
                : r === 'store_manager'
                ? 'Store Managers'
                : r.charAt(0).toUpperCase() + r.slice(1) + 's'}
            </button>
          ))}
        </div>
      </div>

      {/* Add User Modal */}
      {isAddUserOpen && (
        <div className="modal-overlay" onClick={() => setIsAddUserOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create User with Role</h3>
              <button type="button" className="close-btn" onClick={() => setIsAddUserOpen(false)}>
                ×
              </button>
            </div>
            <form onSubmit={handleAddUser}>
              <div className="modal-body">
                <label>
                  Full Name *
                  <input
                    placeholder="e.g. Priyantha Dissanayake"
                    value={newUserForm.full_name}
                    onChange={(e) => setNewUserForm({ ...newUserForm, full_name: e.target.value })}
                    required
                  />
                </label>

                <label>
                  Email Address *
                  <input
                    type="email"
                    placeholder="e.g. staff@smartclothing.lk"
                    value={newUserForm.email}
                    onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                    required
                  />
                </label>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <label>
                    Assign Role *
                    <select
                      value={newUserForm.role}
                      onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
                    >
                      <option value="admin">Administrator</option>
                      <option value="store_manager">Store Manager</option>
                      <option value="customer">Customer</option>
                    </select>
                  </label>
                  <label>
                    Account Status
                    <select
                      value={newUserForm.status}
                      onChange={(e) => setNewUserForm({ ...newUserForm, status: e.target.value })}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="ghost-btn" onClick={() => setIsAddUserOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary-btn">
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Roles Table */}
      <div className="data-table">
        <div className="table-header cols-5">
          <span>User Name & Email</span>
          <span>Role Badge</span>
          <span>Modify Role</span>
          <span>Account Status</span>
          <span>Member Since</span>
        </div>
        {loading ? (
          <div className="empty-row">Loading user privileges…</div>
        ) : filteredRows.length === 0 ? (
          <div className="empty-row">No users found matching query.</div>
        ) : (
          filteredRows.map((row) => (
            <div className="table-row cols-5" key={row.id}>
              <div>
                <strong>{row.full_name}</strong>
                <small style={{ color: '#6b7280', display: 'block' }}>{row.email}</small>
              </div>
              <span>
                <span className={`status ${row.role}`}>
                  {row.role === 'store_manager' ? 'Store Manager' : row.role}
                </span>
              </span>
              <span>
                <select
                  value={row.role}
                  onChange={(e) => handleRoleChange(row, e.target.value)}
                  style={{ fontWeight: 500 }}
                >
                  <option value="admin">Admin</option>
                  <option value="store_manager">Store Manager</option>
                  <option value="customer">Customer</option>
                </select>
              </span>
              <span>
                <select
                  value={row.status}
                  onChange={(e) => handleStatusChange(row, e.target.value)}
                >
                  <option value="active">active</option>
                  <option value="inactive">inactive</option>
                  <option value="suspended">suspended</option>
                </select>
              </span>
              <span style={{ fontSize: '12px', color: '#6b7280' }}>
                {row.created_at ? formatDate(row.created_at) : '—'}
              </span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

export default Roles;

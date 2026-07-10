import React, { useEffect, useState } from 'react';
import { useAuth } from '../../auth/hooks/useAuth.js';
import { useAdmin } from '../hooks/useAdmin.js';
import '../styles/admin.scss';

/**
 * AdminDashboardPage view
 */
const AdminDashboardPage = () => {
  const { user: currentUser } = useAuth();
  const { 
    usersList, 
    listUsers, 
    updateUserRole, 
    deleteUser, 
    actionLoading 
  } = useAdmin();

  // Filters state
  const [includeDeleted, setIncludeDeleted] = useState(false);

  // Delete User Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  // Load users on mount and when filters toggle
  useEffect(() => {
    listUsers(includeDeleted);
  }, [includeDeleted, listUsers]);

  // Handle Role Update
  const handleRoleChange = async (userId, newRole) => {
    if (actionLoading) return;
    await updateUserRole(userId, newRole);
  };

  // Open Soft-Delete Confirmation
  const openDeleteConfirmation = (user) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  // Handle Soft-Delete execution
  const handleConfirmDelete = async () => {
    if (!userToDelete || actionLoading) return;
    setIsDeleteModalOpen(false);
    await deleteUser(userToDelete.id);
    setUserToDelete(null);
  };

  // Date formatter
  const formatDate = (dateStr) => {
    if (!dateStr) return '…';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="admin-container">
      {/* Header Panel */}
      <div className="admin-header">
        <div className="admin-header__title">
          <h1>User Management</h1>
          <p>Promote roles, audit accounts, and manage user accessibility states</p>
        </div>

        {/* Filters and switches */}
        <div className="admin-header__controls">
          <label className="toggle-control">
            <input
              type="checkbox"
              checked={includeDeleted}
              onChange={(e) => setIncludeDeleted(e.target.checked)}
              disabled={actionLoading}
            />
            <div className="toggle-control__track" aria-hidden="true">
              <div className="toggle-control__thumb" />
            </div>
            <span>Show deactivated users</span>
          </label>
        </div>
      </div>

      {/* Desktop view: Tabular Table */}
      <div className="users-table-container">
        <table className="users-table" role="grid">
          <thead>
            <tr role="row">
              <th role="columnheader">User Details</th>
              <th role="columnheader">Role</th>
              <th role="columnheader">Status</th>
              <th role="columnheader">Joined</th>
              <th role="columnheader" style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {usersList.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '32px 0', color: '#999999' }}>
                  No users found
                </td>
              </tr>
            ) : (
              usersList.map((user) => {
                const avatarLetter = user.name ? user.name.charAt(0).toUpperCase() : 'U';
                const isSelf = user.id === currentUser?.id;

                return (
                  <tr key={user.id} role="row">
                    {/* User Profile Cell */}
                    <td>
                      <div className="users-table__user-cell">
                        <div className="users-table__avatar" aria-hidden="true">
                          {avatarLetter}
                        </div>
                        <div className="users-table__user-info">
                          <span className="users-table__user-name">
                            {user.name} {isSelf && <span style={{ fontWeight: 400, color: '#999999' }}>(You)</span>}
                          </span>
                          <span className="users-table__user-email">{user.email}</span>
                        </div>
                      </div>
                    </td>

                    {/* Role Dropdown */}
                    <td>
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        disabled={actionLoading || isSelf || user.isDeleted}
                        className="admin-select"
                        aria-label={`Change role for ${user.name}`}
                      >
                        <option value="USER">USER</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    </td>

                    {/* Status Badges */}
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {user.isDeleted ? (
                          <span className="badge-pill badge-pill--deleted">Deactivated</span>
                        ) : user.isActive ? (
                          <span className="badge-pill badge-pill--active">Active</span>
                        ) : (
                          <span className="badge-pill">Inactive</span>
                        )}
                        {user.role === 'ADMIN' && (
                          <span className="badge-pill badge-pill--admin">Admin</span>
                        )}
                      </div>
                    </td>

                    {/* Date */}
                    <td>{formatDate(user.createdAt)}</td>

                    {/* Actions */}
                    <td style={{ textAlign: 'right' }}>
                      <div className="action-btn-group" style={{ justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          onClick={() => openDeleteConfirmation(user)}
                          disabled={actionLoading || isSelf || user.isDeleted}
                          className="table-action-btn table-action-btn--danger"
                          title={isSelf ? 'Cannot deactivate yourself' : 'Deactivate User'}
                          aria-label={`Deactivate user ${user.name}`}
                        >
                          <i className="ri-delete-bin-line" aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile view: Stacked card lists */}
      <div className="users-card-list">
        {usersList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: '#999999' }}>
            No users found
          </div>
        ) : (
          usersList.map((user) => {
            const avatarLetter = user.name ? user.name.charAt(0).toUpperCase() : 'U';
            const isSelf = user.id === currentUser?.id;

            return (
              <div key={user.id} className="user-item-card">
                <div className="user-item-card__header">
                  <div className="user-item-card__avatar" aria-hidden="true">
                    {avatarLetter}
                  </div>
                  <div className="user-item-card__info">
                    <span className="user-item-card__name">
                      {user.name} {isSelf && <span style={{ fontWeight: 400, color: '#999999' }}>(You)</span>}
                    </span>
                    <span className="user-item-card__email">{user.email}</span>
                  </div>
                </div>

                <div className="user-item-card__badges">
                  {user.isDeleted ? (
                    <span className="badge-pill badge-pill--deleted">Deactivated</span>
                  ) : user.isActive ? (
                    <span className="badge-pill badge-pill--active">Active</span>
                  ) : (
                    <span className="badge-pill">Inactive</span>
                  )}
                  {user.role === 'ADMIN' && (
                    <span className="badge-pill badge-pill--admin">Admin</span>
                  )}
                </div>

                <div className="user-item-card__details">
                  <div>
                    <span>Joined:</span>
                    <span>{formatDate(user.createdAt)}</span>
                  </div>
                  <div>
                    <span>Role Selector:</span>
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      disabled={actionLoading || isSelf || user.isDeleted}
                      className="admin-select"
                      aria-label={`Change role for ${user.name}`}
                    >
                      <option value="USER">USER</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </div>
                </div>

                <div className="user-item-card__actions">
                  <button
                    type="button"
                    onClick={() => openDeleteConfirmation(user)}
                    disabled={actionLoading || isSelf || user.isDeleted}
                    className="button-danger"
                    style={{ height: '32px', padding: '0 12px', fontSize: '12px' }}
                    title={isSelf ? 'Cannot deactivate yourself' : 'Deactivate User'}
                  >
                    <i className="ri-delete-bin-line" style={{ marginRight: '6px' }} aria-hidden="true" />
                    <span>Deactivate</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Confirmation Modal */}
      {isDeleteModalOpen && userToDelete && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="admin-modal-title">
          <div className="modal-content">
            <div className="modal-content__header" aria-hidden="true">
              <i className="ri-error-warning-line" />
              <span className="modal-content__title" id="admin-modal-title">Confirm Deactivation</span>
            </div>
            <div className="modal-content__description">
              Are you sure you want to deactivate <strong>{userToDelete.name}</strong>? This user will be soft-deleted, preventing them from logging in and accessing projects.
            </div>
            <div className="modal-content__actions">
              <button
                type="button"
                className="button-secondary"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="button-primary"
                style={{ backgroundColor: '#ef4444', color: '#ffffff' }}
                onClick={handleConfirmDelete}
                disabled={actionLoading}
              >
                {actionLoading ? 'Deactivating…' : 'Yes, Deactivate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboardPage;

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../hooks/useAuth.js';

/**
 * ProfilePage view
 */
const ProfilePage = () => {
  const { 
    user, 
    updateProfile, 
    changePassword, 
    deleteAccount, 
    actionLoading 
  } = useAuth();
  const navigate = useNavigate();

  // Update Profile Form State
  const [isEditing, setIsEditing] = useState(false);
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileEmail, setProfileEmail] = useState(user?.email || '');
  const [profileErrors, setProfileErrors] = useState({});

  // Sync profile form states when user changes
  useEffect(() => {
    if (user) {
      setProfileName(user.name || '');
      setProfileEmail(user.email || '');
    }
  }, [user]);

  const handleCancelEdit = () => {
    setProfileName(user?.name || '');
    setProfileEmail(user?.email || '');
    setProfileErrors({});
    setIsEditing(false);
  };

  // Change Password Form State
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordErrors, setPasswordErrors] = useState({});

  const handleCancelPasswordEdit = () => {
    setCurrentPassword('');
    setNewPassword('');
    setPasswordErrors({});
    setIsEditingPassword(false);
  };

  // Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Focus Management Refs
  const profileNameRef = useRef(null);
  const profileEmailRef = useRef(null);
  const currentPasswordRef = useRef(null);
  const newPasswordRef = useRef(null);

  // Handle Profile Update Submit
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (actionLoading) return;

    const errors = {};
    if (!profileName.trim()) {
      errors.name = 'Name is required';
    }
    if (!profileEmail.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(profileEmail)) {
      errors.email = 'Please enter a valid email address';
    }

    if (Object.keys(errors).length > 0) {
      setProfileErrors(errors);
      if (errors.name) {
        profileNameRef.current?.focus();
      } else if (errors.email) {
        profileEmailRef.current?.focus();
      }
      return;
    }

    setProfileErrors({});
    const res = await updateProfile(profileName, profileEmail);
    if (res.success) {
      setIsEditing(false);
    } else if (res.errors && Array.isArray(res.errors)) {
      const backendErrors = {};
      res.errors.forEach((err) => {
        backendErrors[err.path] = err.msg;
      });
      setProfileErrors(backendErrors);
      if (backendErrors.name) {
        profileNameRef.current?.focus();
      } else if (backendErrors.email) {
        profileEmailRef.current?.focus();
      }
    }
  };

  // Handle Password Change Submit
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (actionLoading) return;

    const errors = {};
    if (!currentPassword) {
      errors.currentPassword = 'Current password is required';
    }
    if (!newPassword) {
      errors.newPassword = 'New password is required';
    } else if (newPassword.length < 6) {
      errors.newPassword = 'New password must be at least 6 characters long';
    }

    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      if (errors.currentPassword) {
        currentPasswordRef.current?.focus();
      } else if (errors.newPassword) {
        newPasswordRef.current?.focus();
      }
      return;
    }

    setPasswordErrors({});
    const res = await changePassword(currentPassword, newPassword);
    if (res.success) {
      setCurrentPassword('');
      setNewPassword('');
      setIsEditingPassword(false);
    } else if (res.errors && Array.isArray(res.errors)) {
      const backendErrors = {};
      res.errors.forEach((err) => {
        backendErrors[err.path] = err.msg;
      });
      setPasswordErrors(backendErrors);
      if (backendErrors.currentPassword) {
        currentPasswordRef.current?.focus();
      } else if (backendErrors.newPassword) {
        newPasswordRef.current?.focus();
      }
    }
  };

  // Handle Self Deactivation
  const handleConfirmDelete = async () => {
    setIsDeleteModalOpen(false);
    const res = await deleteAccount();
    if (res.success) {
      navigate('/login');
    }
  };

  // Format Created At Date nicely (e.g. June 10, 2026)
  const formatDate = (dateStr) => {
    if (!dateStr) return '…';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const avatarLetter = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

  return (
    <div className="profile-container">
      <div className="profile-grid">
        
        {/* Left Column - Section 1: Profile Details */}
        <section aria-labelledby="profile-details-title">
          <div className="dashboard-card text-center">
            <h2 id="profile-details-title" className="dashboard-card__title">
              <i className="ri-profile-line" aria-hidden="true" />
              <span>My Profile</span>
            </h2>
            <div className="profile-details">
              <div className="profile-details__avatar" aria-hidden="true">
                {avatarLetter}
              </div>
              <div className="profile-details__info">
                <h3 className="profile-details__name">{user?.name}</h3>
                <p className="profile-details__email">{user?.email}</p>
                <div style={{ marginTop: '8px' }}>
                  <span className={`badge-pill badge-pill--${user?.role === 'ADMIN' ? 'admin' : 'active'}`}>
                    {user?.role}
                  </span>
                </div>
              </div>
              <div className="profile-details__meta">
                <i className="ri-calendar-line" aria-hidden="true" />
                <span>Member since {formatDate(user?.createdAt)}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Right Column - Forms & Danger Zone */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Section 2: Update Profile */}
          <section aria-labelledby="update-profile-title">
            <div className="dashboard-card">
              <h2 id="update-profile-title" className="dashboard-card__title">
                <i className="ri-user-settings-line" aria-hidden="true" />
                <span>Account Settings</span>
              </h2>
              <form onSubmit={handleProfileSubmit} className="dashboard-card__form" noValidate>
                <div className="dashboard-card__row">
                  
                  {/* Name field */}
                  <div className="form-group">
                    <label htmlFor="profile-name-input">Full Name</label>
                    <input
                      ref={profileNameRef}
                      id="profile-name-input"
                      type="text"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      placeholder="Jane Doe…"
                      className={`text-input ${profileErrors.name ? 'text-input--error' : ''}`}
                      autoComplete="name"
                      disabled={actionLoading || !isEditing}
                      required
                    />
                    {profileErrors.name && (
                      <span className="form-error-text" id="profile-name-error">
                        <i className="ri-error-warning-fill" aria-hidden="true" />
                        {profileErrors.name}
                      </span>
                    )}
                  </div>

                  {/* Email field */}
                  <div className="form-group">
                    <label htmlFor="profile-email-input">Email Address</label>
                    <input
                      ref={profileEmailRef}
                      id="profile-email-input"
                      type="email"
                      value={profileEmail}
                      onChange={(e) => setProfileEmail(e.target.value)}
                      placeholder="jane.doe@example.com…"
                      className={`text-input ${profileErrors.email ? 'text-input--error' : ''}`}
                      autoComplete="email"
                      spellCheck={false}
                      disabled={actionLoading || !isEditing}
                      required
                    />
                    {profileErrors.email && (
                      <span className="form-error-text" id="profile-email-error">
                        <i className="ri-error-warning-fill" aria-hidden="true" />
                        {profileErrors.email}
                      </span>
                    )}
                  </div>

                </div>

                <div className="dashboard-card__footer">
                  {!isEditing ? (
                    <button
                      type="button"
                      className="button-secondary"
                      onClick={() => setIsEditing(true)}
                      disabled={actionLoading}
                    >
                      <i className="ri-edit-line" style={{ marginRight: '6px' }} aria-hidden="true" />
                      <span>Edit Profile</span>
                    </button>
                  ) : (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        className="button-secondary"
                        onClick={handleCancelEdit}
                        disabled={actionLoading}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="button-primary"
                        disabled={actionLoading}
                      >
                        {actionLoading ? 'Saving…' : 'Save Changes'}
                      </button>
                    </div>
                  )}
                </div>
              </form>
            </div>
          </section>

          {/* Section 3: Change Password */}
          <section aria-labelledby="change-password-title">
            <div className="dashboard-card">
              <h2 id="change-password-title" className="dashboard-card__title">
                <i className="ri-key-2-line" aria-hidden="true" />
                <span>Security</span>
              </h2>
              <form onSubmit={handlePasswordSubmit} className="dashboard-card__form" noValidate>
                <div className="dashboard-card__row">
                  
                  {/* Current Password Field */}
                  <div className="form-group">
                    <label htmlFor="current-password-input">Current Password</label>
                    <input
                      ref={currentPasswordRef}
                      id="current-password-input"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className={`text-input ${passwordErrors.currentPassword ? 'text-input--error' : ''}`}
                      autoComplete="current-password"
                      disabled={actionLoading || !isEditingPassword}
                      required
                    />
                    {passwordErrors.currentPassword && (
                      <span className="form-error-text" id="current-password-error">
                        <i className="ri-error-warning-fill" aria-hidden="true" />
                        {passwordErrors.currentPassword}
                      </span>
                    )}
                  </div>

                  {/* New Password Field */}
                  <div className="form-group">
                    <label htmlFor="new-password-input">New Password</label>
                    <input
                      ref={newPasswordRef}
                      id="new-password-input"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min. 6 characters…"
                      className={`text-input ${passwordErrors.newPassword ? 'text-input--error' : ''}`}
                      autoComplete="new-password"
                      disabled={actionLoading || !isEditingPassword}
                      required
                    />
                    {passwordErrors.newPassword && (
                      <span className="form-error-text" id="new-password-error">
                        <i className="ri-error-warning-fill" aria-hidden="true" />
                        {passwordErrors.newPassword}
                      </span>
                    )}
                  </div>

                </div>

                <div className="dashboard-card__footer">
                  {!isEditingPassword ? (
                    <button
                      type="button"
                      className="button-secondary"
                      onClick={() => setIsEditingPassword(true)}
                      disabled={actionLoading}
                    >
                      <i className="ri-key-line" style={{ marginRight: '6px' }} aria-hidden="true" />
                      <span>Change Password</span>
                    </button>
                  ) : (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        className="button-secondary"
                        onClick={handleCancelPasswordEdit}
                        disabled={actionLoading}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="button-primary"
                        disabled={actionLoading}
                      >
                        {actionLoading ? 'Updating…' : 'Update Password'}
                      </button>
                    </div>
                  )}
                </div>
              </form>
            </div>
          </section>

          {/* Section 4: Danger Zone */}
          <section aria-labelledby="danger-zone-title">
            <div className="dashboard-card danger-zone">
              <h2 id="danger-zone-title" className="dashboard-card__title">
                <i className="ri-alert-line" aria-hidden="true" />
                <span>Danger Zone</span>
              </h2>
              <div className="danger-zone__description">
                Deactivating your account will soft-delete your user record. You will be logged out immediately and lose access to all your configured projects.
              </div>
              <button
                type="button"
                className="button-danger danger-zone__btn"
                onClick={() => setIsDeleteModalOpen(true)}
                disabled={actionLoading}
              >
                Deactivate Account
              </button>
            </div>
          </section>

        </div>
      </div>

      {/* Confirmation Deactivation Modal */}
      {isDeleteModalOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <div className="modal-content">
            <div className="modal-content__header" aria-hidden="true">
              <i className="ri-error-warning-line" />
              <span className="modal-content__title" id="modal-title">Deactivate Account?</span>
            </div>
            <div className="modal-content__description">
              Are you absolutely sure you want to deactivate your account? This action will disable your profile and log you out. You can contact support if you need to recover your profile.
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

export default ProfilePage;

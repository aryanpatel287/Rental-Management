import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router';
import { useAuth } from '../../auth/hooks/useAuth.js';

const Sidebar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const isActive = (path) => location.pathname === path;

    // Render first letter of name as a fallback avatar
    const avatarLetter = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

    const closeSidebar = () => setIsOpen(false);

    return (
        <>
            {/* Mobile Top Toggle Bar */}
            <header className="sidebar-mobile-bar">
                <Link
                    to="/dashboard"
                    className="sidebar-mobile-bar__brand"
                    aria-label="Home"
                >
                    <i className="ri-command-fill" aria-hidden="true" />
                    <span>Goat Template</span>
                </Link>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="sidebar-mobile-bar__toggle"
                    aria-label="Toggle navigation menu"
                    aria-expanded={isOpen}
                >
                    <i className={isOpen ? 'ri-close-line' : 'ri-menu-line'} />
                </button>
            </header>

            {/* Overlay for mobile drawer */}
            <div
                className={`sidebar-overlay ${isOpen ? 'sidebar-overlay--visible' : ''}`}
                onClick={closeSidebar}
                aria-hidden="true"
            />

            {/* Sidebar Panel Container */}
            <aside className={`sidebar ${isOpen ? 'sidebar--open' : ''}`}>
                {/* Brand Brand logo */}
                <Link
                    to="/dashboard"
                    className="sidebar__header"
                    onClick={closeSidebar}
                    aria-label="Home"
                >
                    <i className="ri-command-fill" aria-hidden="true" />
                    <span>Goat Template</span>
                </Link>

                {/* Navigation Items */}
                <nav
                    className="sidebar__nav"
                    role="navigation"
                    aria-label="Main Navigation"
                >
                    <Link
                        to="/dashboard"
                        className={`sidebar__link ${isActive('/dashboard') ? 'sidebar__link--active' : ''}`}
                        onClick={closeSidebar}
                        aria-current={
                            isActive('/dashboard') ? 'page' : undefined
                        }
                    >
                        <i className="ri-dashboard-3-line" aria-hidden="true" />
                        <span>Dashboard</span>
                    </Link>

                    <Link
                        to="/profile"
                        className={`sidebar__link ${isActive('/profile') ? 'sidebar__link--active' : ''}`}
                        onClick={closeSidebar}
                        aria-current={isActive('/profile') ? 'page' : undefined}
                    >
                        <i className="ri-user-line" aria-hidden="true" />
                        <span>My Profile</span>
                    </Link>

                    {user?.role === 'ADMIN' && (
                        <Link
                            to="/admin/users"
                            className={`sidebar__link ${isActive('/admin/users') ? 'sidebar__link--active' : ''}`}
                            onClick={closeSidebar}
                            aria-current={
                                isActive('/admin/users') ? 'page' : undefined
                            }
                        >
                            <i
                                className="ri-shield-user-line"
                                aria-hidden="true"
                            />
                            <span>Admin Portal</span>
                        </Link>
                    )}


                </nav>

                {/* User profile and actions */}
                {user && (
                    <div className="sidebar__footer">
                        <div
                            className="sidebar__user-plate"
                            title={`Logged in as ${user.name}`}
                        >
                            <div className="sidebar__avatar" aria-hidden="true">
                                {avatarLetter}
                            </div>
                            <div className="sidebar__user-info">
                                <span className="sidebar__user-name">
                                    {user.name}
                                </span>
                                <span className="badge-pill sidebar__role-badge">
                                    {user.role}
                                </span>
                            </div>
                        </div>

                        <button
                            onClick={handleLogout}
                            className="button-secondary sidebar__logout-btn"
                            aria-label="Log out of your account"
                        >
                            <i
                                className="ri-logout-box-r-line"
                                aria-hidden="true"
                            />
                            <span>Log Out</span>
                        </button>
                    </div>
                )}
            </aside>
        </>
    );
};

export default Sidebar;

import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const Logout = () => {
    const { handleLogout } = useAuth();
    const navigate = useNavigate();
    const handleLogoutClick = () => {
        handleLogout();
        navigate('/login');
    };

    return (
        <button className="btn btn-primary" onClick={handleLogoutClick}>
            Logout
        </button>
    );
};

export default Logout;

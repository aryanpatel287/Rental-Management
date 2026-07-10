import React, { useEffect, useRef, useState } from 'react';
import { Navigate } from 'react-router';
import { useAuth } from '../hooks/useAuth';

const ProtectedRoute = ({ children }) => {
    const { user, loading, error, handleGetMe } = useAuth();
    const [hasChecked, setHasChecked] = useState(false);
    const hasRequestedRef = useRef(false);

    useEffect(() => {
        if (hasRequestedRef.current) {
            return;
        }

        hasRequestedRef.current = true;

        const loadUser = async () => {
            try {
                await handleGetMe();
            } finally {
                setHasChecked(true);
            }
        };

        loadUser();
    }, [handleGetMe]);

    if (!hasChecked || (loading && !error && !user)) {
        return <div>Loading...</div>;
    }

    if (error) {
        console.error('Error fetching user data:', error);
        return <Navigate to="/login" replace />;
    }

    if (!user && !loading) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

export default ProtectedRoute;

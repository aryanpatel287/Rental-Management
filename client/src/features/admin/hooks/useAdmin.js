import { useContext } from 'react';
import { AdminContext } from '../AdminContext.jsx';

/**
 * A custom hook to access the admin context
 */
export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};

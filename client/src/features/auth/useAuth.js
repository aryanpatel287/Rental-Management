import { useContext } from 'react';
import { AuthContext } from './authContext';

export const useAuth = () => {
  const { user, login, logout } = useContext(AuthContext);
  return { user, login, logout };
};

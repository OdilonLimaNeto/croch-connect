import React from 'react';
import { AuthContext, useAuthState } from '@/hooks/useAuth';
import { LoadingScreen } from './loading-spinner';

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const authState = useAuthState();

  if (authState.loading) {
    return <LoadingScreen />;
  }

  return (
    <AuthContext.Provider value={authState}>
      {children}
    </AuthContext.Provider>
  );
};
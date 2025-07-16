
import { useContext as useReactContext } from 'react';
import { AuthContext, AuthContextValue } from '../contexts/AuthContext'; // Import from the context file

export const useAuth = (): AuthContextValue => {
  const context = useReactContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

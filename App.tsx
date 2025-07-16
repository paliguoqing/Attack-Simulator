import React from 'react';
import { AuthProvider } from './contexts/AuthContext'; 
import { useAuth } from './hooks'; // Updated import path
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';

// This component will be wrapped by AuthProvider and use the context
const AppDisplayLogic: React.FC = () => {
  const { isAuthenticated } = useAuth(); 
  return <>{isAuthenticated ? <Dashboard /> : <Login />}</>;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppDisplayLogic />
    </AuthProvider>
  );
};

export default App;
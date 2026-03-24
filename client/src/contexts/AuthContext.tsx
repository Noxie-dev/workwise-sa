import * as React from 'react';
import { User } from 'firebase/auth';
import { auth, onAuthChange } from '@/lib/firebase';

interface AuthContextType {
  currentUser: User | null;
  user: User | null; // Added for compatibility with WiseUpPage
  role: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = React.createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);
  const [role, setRole] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = onAuthChange(async (user) => {
      setCurrentUser(user);

      if (!user) {
        setRole(null);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('authToken');
        setIsLoading(false);
        return;
      }

      try {
        const [token, tokenResult] = await Promise.all([
          user.getIdToken(),
          user.getIdTokenResult(),
        ]);
        localStorage.setItem('auth_token', token);
        localStorage.setItem('authToken', token);
        setRole(typeof tokenResult.claims.role === 'string' ? tokenResult.claims.role : null);
      } catch (error) {
        console.error('Failed to hydrate auth token claims', error);
        setRole(null);
      }

      setIsLoading(false);
    });

    // Cleanup subscription on unmount
    return unsubscribe;
  }, []);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = React.useMemo(() => ({
    currentUser,
    user: currentUser, // For compatibility with WiseUpPage
    role,
    isLoading,
    isAuthenticated: !!currentUser,
  }), [currentUser, role, isLoading]);

  return (
    <AuthContext.Provider value={contextValue}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};

// Custom hook for using auth context
export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

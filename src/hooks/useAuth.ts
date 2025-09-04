import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { onAuthChange } from '@/lib/firebase';

/**
 * Custom hook for Firebase authentication state
 */
export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return {
    user,
    loading,
    isAuthenticated: !!user,
  };
};

export default useAuth;
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

/**
 * Custom hook to manage job favorites
 * Stores favorites in localStorage and provides methods to add/remove favorites
 */
export const useJobFavorites = () => {
  const [favorites, setFavorites] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Load favorites from localStorage on mount
  useEffect(() => {
    try {
      const storedFavorites = localStorage.getItem('jobFavorites');
      if (storedFavorites) {
        setFavorites(JSON.parse(storedFavorites));
      }
    } catch (error) {
      console.error('Error loading favorites from localStorage:', error);
      toast({
        variant: 'destructive',
        title: 'Error loading favorites',
        description: 'Your saved jobs could not be loaded'
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Save favorites to localStorage whenever they change
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem('jobFavorites', JSON.stringify(favorites));
      } catch (error) {
        console.error('Error saving favorites to localStorage:', error);
        toast({
          variant: 'destructive',
          title: 'Error saving favorites',
          description: 'Your job could not be saved'
        });
      }
    }
  }, [favorites, isLoading, toast]);

  // Add a job to favorites
  const addFavorite = useCallback((jobId: number) => {
    setFavorites(prev => {
      if (prev.includes(jobId)) return prev;
      return [...prev, jobId];
    });
  }, []);

  // Remove a job from favorites
  const removeFavorite = useCallback((jobId: number) => {
    setFavorites(prev => prev.filter(id => id !== jobId));
  }, []);

  // Toggle a job's favorite status
  const toggleFavorite = useCallback((jobId: number) => {
    setFavorites(prev => {
      if (prev.includes(jobId)) {
        return prev.filter(id => id !== jobId);
      } else {
        return [...prev, jobId];
      }
    });
  }, []);

  // Check if a job is in favorites
  const isFavorite = useCallback((jobId: number) => {
    return favorites.includes(jobId);
  }, [favorites]);

  return {
    favorites,
    isLoading,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite
  };
};

export default useJobFavorites;

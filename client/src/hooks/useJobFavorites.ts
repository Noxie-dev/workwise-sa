import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import jobsService from '@/services/jobsService';

/**
 * Custom hook to manage job favorites
 * Stores favorites in localStorage and provides methods to add/remove favorites
 */
export const useJobFavorites = () => {
  const [favorites, setFavorites] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { currentUser } = useAuth();

  useEffect(() => {
    const loadFavorites = async () => {
      if (!currentUser) {
        setFavorites([]);
        setIsLoading(false);
        return;
      }

      try {
        const jobs = await jobsService.getFavoriteJobs();
        setFavorites(jobs.map(job => job.id));
      } catch (error) {
        console.error('Error loading saved jobs:', error);
        toast({
          variant: 'destructive',
          title: 'Error loading saved jobs',
          description: 'Your saved jobs could not be loaded.',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadFavorites();
  }, [currentUser, toast]);

  const requireAuthenticatedUser = useCallback(() => {
    if (currentUser) {
      return true;
    }

    toast({
      variant: 'destructive',
      title: 'Sign in required',
      description: 'Sign in to save jobs to your account.',
    });
    return false;
  }, [currentUser, toast]);

  const addFavorite = useCallback(
    async (jobId: number) => {
      if (!requireAuthenticatedUser()) {
        return;
      }

      setFavorites(prev => (prev.includes(jobId) ? prev : [...prev, jobId]));

      try {
        await jobsService.toggleFavorite(jobId, true);
      } catch (error) {
        setFavorites(prev => prev.filter(id => id !== jobId));
        toast({
          variant: 'destructive',
          title: 'Error saving job',
          description: 'This job could not be saved right now.',
        });
      }
    },
    [requireAuthenticatedUser, toast]
  );

  const removeFavorite = useCallback(
    async (jobId: number) => {
      if (!requireAuthenticatedUser()) {
        return;
      }

      const previousFavorites = favorites;
      setFavorites(prev => prev.filter(id => id !== jobId));

      try {
        await jobsService.toggleFavorite(jobId, false);
      } catch (error) {
        setFavorites(previousFavorites);
        toast({
          variant: 'destructive',
          title: 'Error updating saved jobs',
          description: 'This saved job could not be updated right now.',
        });
      }
    },
    [favorites, requireAuthenticatedUser, toast]
  );

  const toggleFavorite = useCallback(
    async (jobId: number) => {
      if (!requireAuthenticatedUser()) {
        return;
      }

      if (favorites.includes(jobId)) {
        await removeFavorite(jobId);
        return;
      }

      await addFavorite(jobId);
    },
    [addFavorite, favorites, removeFavorite, requireAuthenticatedUser]
  );

  // Check if a job is in favorites
  const isFavorite = useCallback(
    (jobId: number) => {
      return favorites.includes(jobId);
    },
    [favorites]
  );

  return {
    favorites,
    isLoading,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
  };
};

export default useJobFavorites;

import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { sovereign } from '@/api/apiClient';
import { signInUrlWithReturn } from '@/utils';
import { toast } from 'sonner';

/**
 * Shared favorites state for Explore cards (avoids N+1 queries per card).
 */
export function useBarberFavorites() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => sovereign.auth.me().catch(() => null),
    staleTime: 1000 * 60 * 5,
  });

  const { data: favorites = [] } = useQuery({
    queryKey: ['favorites', user?.id],
    queryFn: () => (user ? sovereign.entities.Favorite.filter({ user_id: user.id }) : []),
    enabled: !!user,
    staleTime: 1000 * 60 * 2,
  });

  const isFavorited = useCallback(
    (targetId, targetType = 'barber') =>
      favorites.some((f) => f.target_id === targetId && f.target_type === targetType),
    [favorites]
  );

  const toggleFavorite = useCallback(
    async (targetId, targetType = 'barber', e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }

      if (!user) {
        toast.error('Please sign in to save favorites');
        navigate(signInUrlWithReturn());
        return;
      }

      const favorited = favorites.some(
        (f) => f.target_id === targetId && f.target_type === targetType
      );

      try {
        if (favorited) {
          const fav = favorites.find(
            (f) => f.target_id === targetId && f.target_type === targetType
          );
          if (fav) await sovereign.entities.Favorite.delete(fav.id);
        } else {
          await sovereign.entities.Favorite.create({
            user_id: user.id,
            target_id: targetId,
            target_type: targetType,
          });
        }
        queryClient.invalidateQueries({ queryKey: ['favorites', user.id] });
      } catch {
        toast.error('Failed to update favorites');
      }
    },
    [user, favorites, queryClient, navigate]
  );

  return {
    user,
    favorites,
    isFavorited,
    toggleFavorite,
  };
}

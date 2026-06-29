import { createContext, useContext, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';

const WishlistContext = createContext();

export function WishlistProvider({ children }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await sovereign.auth.me();
        setUser(currentUser);
      } catch {
        setUser(null);
      }
    };
    loadUser();
  }, []);

  const { data: wishlistItems = [] } = useQuery({
    queryKey: ['wishlist', user?.id],
    queryFn: async () => {
      if (!user) return [];
      return await sovereign.entities.WishlistItem.filter({ user_id: user.id });
    },
    enabled: !!user
  });

  const addToWishlistMutation = useMutation({
    mutationFn: async ({ product, notifyOnPriceDrop = false }) => {
      if (!user) {
        sovereign.auth.redirectToLogin(window.location.href);
        throw new Error('User not authenticated');
      }
      
      return await sovereign.entities.WishlistItem.create({
        user_id: user.id,
        product_id: product.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    }
  });

  const removeFromWishlistMutation = useMutation({
    mutationFn: async (productId) => {
      const item = wishlistItems.find(w => w.product_id === productId);
      if (item) {
        await sovereign.entities.WishlistItem.delete(item.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    }
  });

  const toggleWishlist = async (product, notifyOnPriceDrop = false) => {
    if (isInWishlist(product.id)) {
      await removeFromWishlistMutation.mutateAsync(product.id);
    } else {
      await addToWishlistMutation.mutateAsync({ product, notifyOnPriceDrop });
    }
  };

  const isInWishlist = (productId) => {
    return wishlistItems.some(item => item.product_id === productId);
  };

  const getWishlistCount = () => {
    return wishlistItems.length;
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlistItems,
        addToWishlist: (product, notify) => addToWishlistMutation.mutate({ product, notifyOnPriceDrop: notify }),
        removeFromWishlist: (productId) => removeFromWishlistMutation.mutate(productId),
        toggleWishlist,
        isInWishlist,
        getWishlistCount
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
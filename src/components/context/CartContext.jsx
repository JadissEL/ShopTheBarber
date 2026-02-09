import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { sovereign } from '@/api/apiClient';
import { useAuth } from '@/lib/AuthContext';

const CART_STORAGE_KEY = 'sovereign_cart';

const CartContext = createContext();

function loadGuestCart() {
    try {
        const raw = localStorage.getItem(CART_STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function saveGuestCart(items) {
    try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
        console.warn('Could not save guest cart', e);
    }
}

export function CartProvider({ children }) {
    const { isAuthenticated } = useAuth();
    const [items, setItems] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const hydrateFromApi = useCallback(async () => {
        if (!isAuthenticated) return;
        setIsLoading(true);
        try {
            const data = await sovereign.cart.get();
            setItems(Array.isArray(data) ? data : []);
        } catch {
            setItems([]);
        } finally {
            setIsLoading(false);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        if (isAuthenticated) {
            const guest = loadGuestCart();
            if (guest.length > 0) {
                mergeGuestCartIntoApi();
            } else {
                hydrateFromApi();
            }
        } else {
            setItems(loadGuestCart());
        }
    }, [isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

    const addItem = useCallback(async (productId, quantity = 1, productSnapshot = null) => {
        const q = Math.max(1, Math.min(99, quantity));
        if (isAuthenticated) {
            try {
                await sovereign.cart.add(productId, q);
                await hydrateFromApi();
            } catch (e) {
                throw e;
            }
        } else {
            const guest = loadGuestCart();
            const existing = guest.find((i) => i.product_id === productId);
            if (existing) {
                existing.quantity = Math.min(99, existing.quantity + q);
            } else {
                guest.push({
                    product_id: productId,
                    quantity: q,
                    name: productSnapshot?.name,
                    price: productSnapshot?.price,
                    image_url: productSnapshot?.image_url,
                    vendor_name: productSnapshot?.vendor_name,
                    product: productSnapshot ? { name: productSnapshot.name, price: productSnapshot.price, image_url: productSnapshot.image_url, vendor_name: productSnapshot.vendor_name } : null,
                });
            }
            saveGuestCart(guest);
            setItems([...guest]);
        }
    }, [isAuthenticated, hydrateFromApi]);

    const updateQuantity = useCallback(async (productId, quantity) => {
        const q = Math.max(0, Math.min(99, quantity));
        if (isAuthenticated) {
            if (q === 0) {
                await sovereign.cart.remove(productId);
            } else {
                await sovereign.cart.updateQuantity(productId, q);
            }
            await hydrateFromApi();
        } else {
            const guest = loadGuestCart();
            if (q === 0) {
                const next = guest.filter((i) => i.product_id !== productId);
                saveGuestCart(next);
                setItems(next);
            } else {
                const item = guest.find((i) => i.product_id === productId);
                if (item) {
                    item.quantity = q;
                    saveGuestCart(guest);
                    setItems([...guest]);
                }
            }
        }
    }, [isAuthenticated, hydrateFromApi]);

    const removeItem = useCallback(async (productId) => {
        if (isAuthenticated) {
            await sovereign.cart.remove(productId);
            await hydrateFromApi();
        } else {
            const guest = loadGuestCart().filter((i) => i.product_id !== productId);
            saveGuestCart(guest);
            setItems(guest);
        }
    }, [isAuthenticated, hydrateFromApi]);

    const clearCart = useCallback(async () => {
        if (isAuthenticated) {
            await sovereign.cart.clear();
            await hydrateFromApi();
        } else {
            saveGuestCart([]);
            setItems([]);
        }
    }, [isAuthenticated, hydrateFromApi]);

    const mergeGuestCartIntoApi = useCallback(async () => {
        const guest = loadGuestCart();
        if (guest.length === 0) return;
        for (const it of guest) {
            try {
                await sovereign.cart.add(it.product_id, it.quantity);
            } catch (e) {
                console.warn('Merge cart item failed', it, e);
            }
        }
        saveGuestCart([]);
        await hydrateFromApi();
    }, [hydrateFromApi]);

    const normalizedItems = items.map((i) => {
        const product = i.product || (i.product_id && { name: i.name, price: i.price, image_url: i.image_url, vendor_name: i.vendor_name });
        return {
            id: i.id,
            product_id: i.product_id,
            quantity: i.quantity,
            product: product || { name: 'Product', price: 0, image_url: '', vendor_name: '' },
        };
    });

    const itemCount = normalizedItems.reduce((sum, i) => sum + (i.quantity || 0), 0);

    const value = {
        items: normalizedItems,
        itemCount,
        isLoading,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        hydrateFromApi,
        mergeGuestCartIntoApi,
    };

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
    const ctx = useContext(CartContext);
    if (!ctx) throw new Error('useCart must be used within CartProvider');
    return ctx;
}

'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { api, ApiClientError } from '@/lib/api';
import { useAuth } from '@/lib/auth-provider';
import {
  buildAddCartItemBody,
  cartItemCount,
  cartLineKey,
  cartSubtotal,
  computeUnitPrice,
  EMPTY_CART,
  upsertCartLine,
  validateSelections,
  type CartLine,
  type CartStateShape,
} from '@/lib/cart-utils';
import type { MenuItem, SelectedOption, ServerCart, ServerCartItem } from '@/lib/types';

const STORAGE_KEY = 'foodflow_customer_cart';

interface AddLineInput {
  item: MenuItem;
  restaurantName?: string;
  quantity?: number;
  selectedOptions?: SelectedOption[];
  notes?: string;
}

interface CartContextValue {
  cart: CartStateShape;
  itemCount: number;
  subtotal: number;
  isSyncing: boolean;
  notice: string | null;
  error: string | null;
  dismissMessages: () => void;
  addLine: (input: AddLineInput) => void;
  setQuantity: (key: string, quantity: number) => void;
  removeLine: (key: string) => void;
  clearCart: () => void;
  applyPromo: (code: string) => Promise<void>;
  removePromo: () => void;
  /** Server-cart snapshot after order placement cleared it. */
  markOrderPlaced: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}

function loadStoredCart(): CartStateShape {
  if (typeof window === 'undefined') return EMPTY_CART;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_CART;
    const parsed = JSON.parse(raw) as CartStateShape;
    if (!parsed || !Array.isArray(parsed.items)) return EMPTY_CART;
    return {
      restaurantId: parsed.restaurantId ?? null,
      restaurantName: parsed.restaurantName ?? '',
      items: parsed.items,
      promoCode: parsed.promoCode,
      discount: Number(parsed.discount) || 0,
    };
  } catch {
    return EMPTY_CART;
  }
}

function persistCart(cart: CartStateShape): void {
  try {
    if (cart.items.length === 0) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        restaurantId: cart.restaurantId,
        restaurantName: cart.restaurantName,
        promoCode: cart.promoCode,
        discount: cart.discount,
        items: cart.items.map(({ serverId: _serverId, ...line }) => line),
      }),
    );
  } catch {
    // Storage full/blocked — cart still lives in memory.
  }
}

function selectedOptionsFromServer(item: ServerCartItem): SelectedOption[] {
  const raw = Array.isArray(item.selectedOptions) ? item.selectedOptions : [];
  const options = item.menuItem?.options ?? [];
  return raw.flatMap((entry) => {
    if (!entry || typeof entry !== 'object') return [];
    const record = entry as Record<string, unknown>;
    const optionId = String(record.optionId ?? record.option_id ?? '');
    const valueId = String(record.valueId ?? record.value_id ?? '');
    const option = options.find((o) => o.id === optionId);
    const value = option?.values.find((v) => v.id === valueId);
    return [
      {
        optionId,
        valueId,
        optionName: option?.name ?? '',
        valueName: value?.value ?? (typeof record.value === 'string' ? record.value : ''),
        priceModifier: Number(value?.priceModifier ?? record.priceModifier ?? 0),
      },
    ];
  });
}

function lineFromServerItem(item: ServerCartItem, restaurantId: string): CartLine {
  const selectedOptions = selectedOptionsFromServer(item);
  return {
    key: cartLineKey(item.menuItemId, selectedOptions),
    menuItemId: item.menuItemId,
    name: item.menuItem?.name ?? 'Item',
    imageUrl: item.menuItem?.imageUrl ?? undefined,
    quantity: item.quantity,
    unitPrice: Number(item.unitPrice) || 0,
    selectedOptions,
    notes: item.notes ?? undefined,
    serverId: item.id,
  };
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isAuthChecked } = useAuth();
  const [cart, setCart] = useState<CartStateShape>(EMPTY_CART);
  const [hydrated, setHydrated] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const syncedSession = useRef(false);

  useEffect(() => {
    setCart(loadStoredCart());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) persistCart(cart);
  }, [cart, hydrated]);

  const dismissMessages = useCallback(() => {
    setNotice(null);
    setError(null);
  }, []);

  const hydrateFromServer = useCallback(async () => {
    const serverCart = await api.get<ServerCart>('/cart');
    if (!serverCart.restaurantId || serverCart.items.length === 0) {
      setCart((current) =>
        current.items.length === 0
          ? { ...EMPTY_CART }
          : current, // local guest items survive; server cart is empty
      );
      return;
    }
    setCart((current) => ({
      restaurantId: serverCart.restaurantId,
      restaurantName:
        current.restaurantId === serverCart.restaurantId ? current.restaurantName : '',
      items: serverCart.items.map((item) => lineFromServerItem(item, serverCart.restaurantId!)),
      promoCode: serverCart.promotionCode ?? current.promoCode,
      discount: serverCart.promotionCode === current.promoCode ? current.discount : 0,
    }));
  }, []);

  // Push local lines to the server cart, then hydrate server truth.
  const pushLocalToServer = useCallback(async () => {
    const stored = loadStoredCart();
    const localItems = stored.items;
    if (localItems.length === 0 || !stored.restaurantId) {
      await hydrateFromServer();
      return;
    }
    const restaurantId = stored.restaurantId;
    await api.delete('/cart');
    for (const line of localItems) {
      await api.post('/cart/items', buildAddCartItemBody(restaurantId, line));
    }
    const serverCart = await api.get<ServerCart>('/cart');
    setCart((current) => ({
      restaurantId: serverCart.restaurantId ?? restaurantId,
      restaurantName: current.restaurantName,
      items: (serverCart.items ?? []).map((item) =>
        lineFromServerItem(item, serverCart.restaurantId ?? restaurantId),
      ),
      promoCode: serverCart.promotionCode ?? current.promoCode,
      discount: current.discount,
    }));
  }, [hydrateFromServer]);

  // After login, reconcile the local guest cart with the server cart once.
  useEffect(() => {
    if (!isAuthChecked || !isAuthenticated || syncedSession.current) return;
    syncedSession.current = true;
    setIsSyncing(true);
    pushLocalToServer()
      .catch(() => setError('Could not sync your cart with the server.'))
      .finally(() => setIsSyncing(false));
  }, [isAuthChecked, isAuthenticated, pushLocalToServer]);

  useEffect(() => {
    if (!isAuthenticated) syncedSession.current = false;
  }, [isAuthenticated]);

  const addLine = useCallback(
    ({ item, restaurantName, quantity = 1, selectedOptions = [], notes }: AddLineInput) => {
      const invalid = validateSelections(item, selectedOptions);
      if (invalid === 'CART_OPTION_REQUIRED') {
        setError('Select the required options first.');
        return;
      }
      if (invalid) {
        setError('Those options are not available.');
        return;
      }

      const line: CartLine = {
        key: cartLineKey(item.id, selectedOptions),
        menuItemId: item.id,
        name: item.name,
        imageUrl: item.imageUrl || undefined,
        quantity,
        unitPrice: computeUnitPrice(item.basePrice, selectedOptions),
        selectedOptions,
        notes: notes?.trim() || undefined,
      };

      let switchedRestaurant = false;
      setCart((current) => {
        const name =
          restaurantName ?? (current.restaurantId === item.restaurantId ? current.restaurantName : '');
        if (current.restaurantId && current.restaurantId !== item.restaurantId) {
          switchedRestaurant = true;
          return {
            ...EMPTY_CART,
            restaurantId: item.restaurantId,
            restaurantName: name,
            items: [line],
          };
        }
        return {
          ...current,
          restaurantId: current.restaurantId ?? item.restaurantId,
          restaurantName: name,
          items: upsertCartLine(current.items, line),
        };
      });

      if (switchedRestaurant) {
        setNotice('Your cart was switched to this restaurant.');
        setError(null);
      } else {
        setError(null);
      }

      if (isAuthenticated) {
        void api
          .post('/cart/items', buildAddCartItemBody(item.restaurantId, line))
          .then(() => hydrateFromServer().catch(() => undefined))
          .catch((err: unknown) => {
            if (err instanceof ApiClientError && (err.status === 401 || err.status === 403)) return;
            setError('Item added locally; it will sync when the connection recovers.');
          });
      }
    },
    [isAuthenticated, hydrateFromServer],
  );

  const setQuantity = useCallback(
    (key: string, quantity: number) => {
      if (quantity < 1) return;
      let serverId: string | undefined;
      setCart((current) => {
        const nextItems = current.items.map((line) => {
          if (line.key !== key) return line;
          serverId = line.serverId;
          return { ...line, quantity };
        });
        return { ...current, items: nextItems };
      });
      if (isAuthenticated && serverId) {
        void api
          .patch(`/cart/items/${serverId}`, { quantity })
          .catch((err: unknown) => {
            if (err instanceof ApiClientError && (err.status === 401 || err.status === 403)) return;
            setError('Could not update quantity on the server.');
          });
      }
    },
    [isAuthenticated],
  );

  const removeLine = useCallback(
    (key: string) => {
      let serverId: string | undefined;
      setCart((current) => {
        const target = current.items.find((line) => line.key === key);
        serverId = target?.serverId;
        const items = current.items.filter((line) => line.key !== key);
        if (items.length === 0) return { ...EMPTY_CART };
        return { ...current, items };
      });
      if (isAuthenticated && serverId) {
        void api.delete(`/cart/items/${serverId}`).catch(() => {
          setError('Could not remove the item on the server.');
        });
      }
    },
    [isAuthenticated],
  );

  const clearCart = useCallback(() => {
    setCart(EMPTY_CART);
    if (isAuthenticated) {
      void api.delete('/cart').catch(() => undefined);
    }
  }, [isAuthenticated]);

  const applyPromo = useCallback(
    async (code: string) => {
      const trimmed = code.trim();
      if (!trimmed) return;
      try {
        const result = await api.post<{ code: string; discount: number; subtotal: number }>(
          '/cart/apply-promotion',
          { code: trimmed },
        );
        setCart((current) => ({ ...current, promoCode: result.code, discount: result.discount }));
        setError(null);
      } catch (err) {
        const apiError = err as ApiClientError;
        setError(apiError?.detail || apiError?.message || 'Promotion code could not be applied.');
        throw err;
      }
    },
    [],
  );

  const removePromo = useCallback(() => {
    setCart((current) => ({ ...current, promoCode: undefined, discount: 0 }));
  }, []);

  const markOrderPlaced = useCallback(() => {
    setCart(EMPTY_CART);
  }, []);

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      itemCount: cartItemCount(cart.items),
      subtotal: cartSubtotal(cart.items),
      isSyncing,
      notice,
      error,
      dismissMessages,
      addLine,
      setQuantity,
      removeLine,
      clearCart,
      applyPromo,
      removePromo,
      markOrderPlaced,
    }),
    [
      cart,
      isSyncing,
      notice,
      error,
      dismissMessages,
      addLine,
      setQuantity,
      removeLine,
      clearCart,
      applyPromo,
      removePromo,
      markOrderPlaced,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

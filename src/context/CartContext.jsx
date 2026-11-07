import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "./AuthContext";

const CartContext = createContext(null);
const CART_STORAGE_KEY = "savestate_market_cart";

const readStoredCart = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || "[]");
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
};

export function CartProvider({ children }) {
  const [items, setItems] = useState(readStoredCart);

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  // Logout (manual ou por 401): o carrinho não passa para a próxima conta.
  // O CartProvider fica dentro do AuthProvider (App.jsx), então enxerga o token.
  const { token } = useAuth();
  const hadToken = useRef(Boolean(token));
  useEffect(() => {
    if (hadToken.current && !token) setItems([]);
    hadToken.current = Boolean(token);
  }, [token]);

  const addItem = useCallback((product) => {
    setItems((currentItems) => {
      const existing = currentItems.find((item) => String(item.id) === String(product.id));
      if (existing) {
        return currentItems.map((item) =>
          String(item.id) === String(product.id)
            ? { ...item, quantity: Number(item.quantity || 1) + 1 }
            : item,
        );
      }
      return [...currentItems, { ...product, quantity: 1 }];
    });
  }, []);

  const removeItem = useCallback((productId) => {
    setItems((currentItems) => currentItems.filter((item) => String(item.id) !== String(productId)));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);
  const itemCount = items.reduce((count, item) => count + Number(item.quantity || 1), 0);
  const value = useMemo(
    () => ({ items, itemCount, addItem, removeItem, clearCart }),
    [items, itemCount, addItem, removeItem, clearCart],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart precisa ser usado dentro de CartProvider.");
  return context;
}
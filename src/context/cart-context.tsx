
"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { CartItem, Product, ProductVariant } from "@/lib/types";

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product, quantity?: number, variant?: ProductVariant) => void;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, newQuantity: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Helper to generate a unique ID for a cart item based on product and variant
const getCartItemId = (productId: string, variantId?: string) => {
  return variantId ? `${productId}-${variantId}` : productId;
};


export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const storedCart = localStorage.getItem("cart");
    if (storedCart) {
      setCartItems(JSON.parse(storedCart));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product: Product, quantity: number = 1, variant?: ProductVariant) => {
    setCartItems((prevItems) => {
      const cartItemId = getCartItemId(product.id, variant?.id);
      const existingItem = prevItems.find(
        (item) => getCartItemId(item.product.id, item.variant?.id) === cartItemId
      );

      if (existingItem) {
        return prevItems.map((item) =>
          getCartItemId(item.product.id, item.variant?.id) === cartItemId
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prevItems, { product, quantity, variant }];
    });
  };

  const removeFromCart = (cartItemId: string) => {
    setCartItems((prevItems) =>
      prevItems.filter((item) => getCartItemId(item.product.id, item.variant?.id) !== cartItemId)
    );
  };

  const updateQuantity = (cartItemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(cartItemId);
    } else {
      setCartItems((prevItems) =>
        prevItems.map((item) =>
          getCartItemId(item.product.id, item.variant?.id) === cartItemId
            ? { ...item, quantity: newQuantity }
            : item
        )
      );
    }
  };

  const clearCart = () => {
    setCartItems([]);
  }

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const cartTotal = cartItems.reduce(
    (acc, item) => {
      const price = item.variant?.salePrice ?? item.variant?.price ?? item.product.salePrice ?? item.product.defaultPrice;
      return acc + price * item.quantity;
    }, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartCount,
        cartTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

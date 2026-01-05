
"use client";
import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import type { CartItem, PopulatedCartItem, Product, ProductVariant, UserProfile } from "@/lib/types";
import { useDoc, useFirestore, useUser, useMemoFirebase, useCollection } from "@/firebase";
import { collection, doc, setDoc, getDoc } from 'firebase/firestore';
import { useVendorPricing } from "@/hooks/useVendor";

interface CartContextType {
  cartItems: PopulatedCartItem[];
  addToCart: (product: Product, quantity?: number, variant?: ProductVariant) => boolean;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, newQuantity: number) => boolean;
  clearCart: () => void;
  getCartQuantity: (cartItemId: string) => number;
  cartCount: number;
  cartTotal: number;
  isCartLoading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Helper to generate a unique ID for a cart item based on product and variant
const getCartItemId = (productId: string, variantId?: string) => {
  return variantId ? `${productId}-${variantId}` : productId;
};


export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartLoading, setIsCartLoading] = useState(true);
  const { getPrice } = useVendorPricing();

  // This ref is just for products, which are public and can be fetched once.
  const productsCollectionRef = useMemoFirebase(() => collection(firestore, 'products'), [firestore]);
  const { data: allProducts, isLoading: isProductsLoading } = useCollection<Product>(productsCollectionRef, { listen: false });

  // Function to save guest cart to local storage
  const updateGuestCart = (newCart: CartItem[]) => {
    localStorage.setItem("guestCart", JSON.stringify(newCart));
  }

  // Function to persist cart to Firestore for logged-in users
  const updateFirestoreCart = useCallback(async (userId: string, newCart: CartItem[]) => {
    if (!firestore) return;
    const userDocRef = doc(firestore, 'users', userId);
    try {
      // Sanitize cart before writing to firestore
      const sanitizedCart = newCart.map(item => {
        const { ...rest } = item;
        // Ensure no undefined values are being sent
        if (rest.variantId === undefined) {
          delete rest.variantId;
        }
        return rest;
      });
      await setDoc(userDocRef, { cart: sanitizedCart }, { merge: true });
    } catch (error) {
      console.error("Failed to update Firestore cart:", error);
    }
  }, [firestore]);


  useEffect(() => {
    const handleAuthChange = async () => {
      if (isUserLoading || isProductsLoading) {
        setIsCartLoading(true);
        return; // Wait until auth state and products are determined
      }

      if (user) {
        // USER IS LOGGED IN
        setIsCartLoading(true);
        const userDocRef = doc(firestore, 'users', user.uid);

        // 1. Read guest cart from localStorage FIRST
        const guestCartJson = localStorage.getItem("guestCart");
        const guestCart: CartItem[] = guestCartJson ? JSON.parse(guestCartJson) : [];

        // 2. Read user cart from Firestore SECOND
        const userDocSnap = await getDoc(userDocRef);
        const userProfile = userDocSnap.data() as UserProfile | undefined;
        let userCart: CartItem[] = userProfile?.cart || [];

        // 3. Merge carts if guest cart exists
        let finalCart = [...userCart];
        let needsUpdate = false;

        if (guestCart.length > 0) {
          needsUpdate = true;
          const finalCartMap = new Map(finalCart.map(item => [getCartItemId(item.productId, item.variantId), item]));

          guestCart.forEach(guestItem => {
            const guestCartId = getCartItemId(guestItem.productId, guestItem.variantId);
            const existingItem = finalCartMap.get(guestCartId);
            if (existingItem) {
              existingItem.quantity += guestItem.quantity;
            } else {
              finalCartMap.set(guestCartId, guestItem);
            }
          });
          finalCart = Array.from(finalCartMap.values());
        }

        setCart(finalCart);

        if (needsUpdate) {
          await updateFirestoreCart(user.uid, finalCart);
          localStorage.removeItem("guestCart");
        }
        setIsCartLoading(false);

      } else {
        // USER IS A GUEST
        const storedGuestCart = localStorage.getItem("guestCart");
        setCart(storedGuestCart ? JSON.parse(storedGuestCart) : []);
        setIsCartLoading(false);
      }
    };

    handleAuthChange();

  }, [user, isUserLoading, isProductsLoading, firestore, updateFirestoreCart]);


  const addToCart = (product: Product, quantity: number = 1, variant?: ProductVariant): boolean => {
    // Get available stock
    const availableStock = variant?.stock ?? product.stock;

    // If no stock info, allow (assume unlimited)
    if (availableStock === undefined) {
      setCart(prevCart => {
        const newCart = [...prevCart];
        const cartItemId = getCartItemId(product.id, variant?.id);

        const existingItemIndex = newCart.findIndex(
          (item) => getCartItemId(item.productId, item.variantId) === cartItemId
        );

        if (existingItemIndex > -1) {
          newCart[existingItemIndex].quantity += quantity;
        } else {
          newCart.push({
            productId: product.id,
            quantity,
            variantId: variant?.id
          });
        }

        if (user) {
          updateFirestoreCart(user.uid, newCart);
        } else {
          updateGuestCart(newCart);
        }
        return newCart;
      });
      return true;
    }

    // Check current quantity in cart
    const cartItemId = getCartItemId(product.id, variant?.id);
    const currentCartItem = cart.find(
      (item) => getCartItemId(item.productId, item.variantId) === cartItemId
    );
    const currentQuantity = currentCartItem?.quantity || 0;
    const newTotalQuantity = currentQuantity + quantity;

    // Validate against stock
    if (newTotalQuantity > availableStock) {
      console.warn(`Cannot add ${quantity} items. Only ${availableStock - currentQuantity} more available in stock.`);
      return false;
    }

    setCart(prevCart => {
      const newCart = [...prevCart];
      const existingItemIndex = newCart.findIndex(
        (item) => getCartItemId(item.productId, item.variantId) === cartItemId
      );

      if (existingItemIndex > -1) {
        newCart[existingItemIndex].quantity += quantity;
      } else {
        newCart.push({
          productId: product.id,
          quantity,
          variantId: variant?.id
        });
      }

      if (user) {
        updateFirestoreCart(user.uid, newCart);
      } else {
        updateGuestCart(newCart);
      }
      return newCart;
    });
    return true;
  };

  const removeFromCart = (cartItemId: string) => {
    const newCart = cart.filter((item) => getCartItemId(item.productId, item.variantId) !== cartItemId);
    setCart(newCart);
    if (user) {
      updateFirestoreCart(user.uid, newCart);
    } else {
      updateGuestCart(newCart);
    }
  };

  const updateQuantity = (cartItemId: string, newQuantity: number): boolean => {
    if (newQuantity <= 0) {
      removeFromCart(cartItemId);
      return true;
    }

    // Find the cart item to get product and variant info
    const cartItem = cart.find(item => getCartItemId(item.productId, item.variantId) === cartItemId);
    if (!cartItem) return false;

    // Find the product in allProducts
    const product = allProducts?.find(p => p.id === cartItem.productId);
    if (!product) return false;

    // Get variant if applicable
    const variant = product.variants?.find(v => v.id === cartItem.variantId);

    // Get available stock
    const availableStock = variant?.stock ?? product.stock;

    // If no stock info, allow (assume unlimited)
    if (availableStock === undefined) {
      const newCart = cart.map((item) =>
        getCartItemId(item.productId, item.variantId) === cartItemId
          ? { ...item, quantity: newQuantity }
          : item
      );
      setCart(newCart);
      if (user) {
        updateFirestoreCart(user.uid, newCart);
      } else {
        updateGuestCart(newCart);
      }
      return true;
    }

    // Validate against stock
    if (newQuantity > availableStock) {
      console.warn(`Cannot update quantity to ${newQuantity}. Only ${availableStock} available in stock.`);
      return false;
    }

    const newCart = cart.map((item) =>
      getCartItemId(item.productId, item.variantId) === cartItemId
        ? { ...item, quantity: newQuantity }
        : item
    );
    setCart(newCart);
    if (user) {
      updateFirestoreCart(user.uid, newCart);
    } else {
      updateGuestCart(newCart);
    }
    return true;
  };

  const clearCart = () => {
    setCart([]);
    if (user) {
      updateFirestoreCart(user.uid, []);
    } else {
      updateGuestCart([]);
    }
  };

  const getCartQuantity = (cartItemId: string): number => {
    const item = cart.find(item => getCartItemId(item.productId, item.variantId) === cartItemId);
    return item?.quantity || 0;
  };

  // Populate cart items with full product details
  const populatedCartItems: PopulatedCartItem[] = cart
    .map(cartItem => {
      const product = allProducts?.find(p => p.id === cartItem.productId);
      if (!product) return null;

      const variant = product.variants?.find(v => v.id === cartItem.variantId);

      return {
        product,
        quantity: cartItem.quantity,
        variant,
      } as PopulatedCartItem;
    })
    .filter((item): item is PopulatedCartItem => item !== null);


  const cartCount = populatedCartItems.reduce((acc, item) => acc + item.quantity, 0);

  const cartTotal = populatedCartItems.reduce(
    (acc, item) => {
      const basePrice = item.variant?.salePrice ?? item.variant?.price ?? item.product.salePrice ?? item.product.defaultPrice;
      const finalPrice = getPrice(basePrice, item.product.id, item.quantity);
      return acc + finalPrice * item.quantity;
    }, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems: populatedCartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartQuantity,
        cartCount,
        cartTotal,
        isCartLoading: isCartLoading || isUserLoading || isProductsLoading,
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

"use client";

import { useCart } from "@/context/cart-context";
import { ShoppingCart } from "lucide-react";

export default function CartIcon() {
  const { cartCount } = useCart();

  return (
    <div className="relative">
      <ShoppingCart className="h-5 w-5" />
      <span className="sr-only">Shopping Cart</span>
      {cartCount > 0 && (
        <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
          {cartCount}
        </span>
      )}
    </div>
  );
}


"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/context/cart-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Minus, Plus, Trash2, XCircle, Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatPrice } from "@/lib/utils";

const getCartItemId = (productId: string, variantId?: string) => {
  return variantId ? `${productId}-${variantId}` : productId;
};

export default function CartPage() {
  const { cartItems, updateQuantity, removeFromCart, cartTotal, cartCount, isCartLoading } = useCart();

  return (
    <div className="container mx-auto px-4 py-8 md:py-16 lg:py-24 pt-28 sm:pt-8">
      <div className="text-center mb-8 md:mb-12">
        <h1 className="text-3xl md:text-5xl font-headline font-bold">
          Your Shopping Cart
        </h1>
        <p className="mt-4 max-w-2xl mx-auto text-lg md:text-xl font-semibold text-muted-foreground">
          Review your items and proceed to checkout.
        </p>
      </div>

      {isCartLoading ? (
        <div className="flex justify-center items-center h-64">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      ) : cartItems.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <XCircle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold">Your cart is empty</h2>
          <p className="text-muted-foreground mt-2 font-medium">
            Looks like you haven't added anything to your cart yet.
          </p>
          <Button asChild className="mt-6">
            <Link href="/products">Start Shopping</Link>
          </Button>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map(({ product, quantity, variant }) => {
              const cartItemId = getCartItemId(product.id, variant?.id);
              const price = variant?.price ?? product.defaultPrice;
              const salePrice = variant?.salePrice ?? product.salePrice;
              const displayPrice = salePrice ?? price;


              return (
              <Card key={cartItemId} className="flex items-start md:items-center p-4">
                <div className="relative h-20 w-20 md:h-24 md:w-24 rounded-md overflow-hidden mr-4 flex-shrink-0">
                  <Image
                    src={product.image.url}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 80px, 96px"
                  />
                </div>
                <div className="flex-1 flex flex-col md:flex-row md:items-center md:justify-between">
                  <div className="flex-1">
                    <Link href={`/products/${product.slug}`} className="font-semibold hover:underline leading-tight">
                      {product.name}
                    </Link>
                    {variant && <p className="text-sm text-muted-foreground">{variant.name}</p>}
                    <div className="flex items-baseline gap-2 md:hidden mt-1">
                      {salePrice ? (
                        <>
                          <p className="font-semibold text-destructive"><span className="font-currency">₹</span>{formatPrice(salePrice)}</p>
                          <p className="text-muted-foreground line-through text-sm"><span className="font-currency">₹</span>{formatPrice(price)}</p>
                        </>
                      ) : (
                        <p className="font-semibold">
                          <span className="font-currency">₹</span>{formatPrice(price)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center mt-2 md:mt-0 md:justify-center md:w-48">
                    <div className="flex items-center border rounded-md">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateQuantity(cartItemId, quantity - 1)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Input
                        type="number"
                        value={quantity}
                        onChange={(e) => updateQuantity(cartItemId, parseInt(e.target.value) || 1)}
                        className="w-16 h-8 text-center border-0 focus-visible:ring-0"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateQuantity(cartItemId, quantity + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                     <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive md:hidden ml-2"
                        onClick={() => removeFromCart(cartItemId)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                  </div>
                  <div className="hidden md:flex items-center justify-end w-40">
                    <p className="font-semibold text-right mr-4"><span className="font-currency">₹</span>{formatPrice(displayPrice * quantity)}</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => removeFromCart(cartItemId)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            )})}
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal ({cartCount} items)</span>
                  <span><span className="font-currency">₹</span>{formatPrice(cartTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>Free</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span><span className="font-currency">₹</span>{formatPrice(cartTotal)}</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button asChild size="lg" className="w-full text-lg rounded-lg">
                  <Link href="/checkout">Proceed to Checkout</Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

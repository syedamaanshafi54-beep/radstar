"use client";
import { useMemo } from "react";
import { useFirestore, useDoc } from "@/firebase";
import { doc } from "firebase/firestore";

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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import ProductDetails from "@/components/product-details";
import { useToast } from "@/hooks/use-toast";
import { useVendorPricing } from "@/hooks/useVendor";
import { Badge } from "@/components/ui/badge";

const getCartItemId = (productId: string, variantId?: string) => {
  return variantId ? `${productId}-${variantId}` : productId;
};

export default function CartPage() {
  const { cartItems, updateQuantity, removeFromCart, cartTotal, cartCount, isCartLoading } = useCart();
  const { toast } = useToast();
  const { isVendor, getPrice, getDiscount, vendor } = useVendorPricing();

  const originalTotal = cartItems.reduce((acc, item) => {
    const price = item.variant?.salePrice ?? item.variant?.price ?? item.product.salePrice ?? item.product.defaultPrice;
    return acc + (price * item.quantity);
  }, 0);

  const totalSavings = originalTotal - cartTotal;

  const firestore = useFirestore();
  const shippingDocRef = useMemo(() => doc(firestore, "site-config", "shipping"), [firestore]);
  const { data: shippingConfig, isLoading: isLoadingShipping } = useDoc<any>(shippingDocRef);

  const shippingCost = useMemo(() => {
    if (!shippingConfig) return 0;
    if (shippingConfig.freeShippingThreshold > 0 && cartTotal >= shippingConfig.freeShippingThreshold) {
      return 0;
    }
    // For cart page, we'll show flat rate if it's the strategy, 
    // or default pincode rate if that's the strategy (as we don't have zip yet)
    if (shippingConfig.strategy === 'pincode') {
      return shippingConfig.defaultPincodeRate || 0;
    }
    return shippingConfig.flatRate || 0;
  }, [shippingConfig, cartTotal]);

  const grandTotal = cartTotal + shippingCost;

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
              const vendorPrice = isVendor ? getPrice(displayPrice, product.id, quantity) : displayPrice;
              const vendorDiscount = isVendor ? getDiscount(product.id, quantity) : 0;


              return (
                <Dialog key={cartItemId}>
                  <Card className="flex items-start md:items-center p-4">
                    <DialogTrigger asChild>
                      <div className="relative h-20 w-20 md:h-24 md:w-24 rounded-md overflow-hidden mr-4 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity">
                        <Image
                          src={product.image.url}
                          alt={product.name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 80px, 96px"
                        />
                      </div>
                    </DialogTrigger>
                    <div className="flex-1 flex flex-col md:flex-row md:items-center md:justify-between">
                      <div className="flex-1">
                        <DialogTrigger asChild>
                          <button className="font-headline text-xl font-semibold hover:text-primary transition-colors leading-tight text-left">
                            {product.name}
                          </button>
                        </DialogTrigger>
                        {variant && <p className="text-sm text-muted-foreground">{variant.name}</p>}
                        <div className="flex flex-col gap-1 md:hidden mt-1">
                          {isVendor ? (
                            <>
                              <div className="flex flex-col">
                                <span className="text-[10px] uppercase font-bold text-muted-foreground">MRP: <span className="font-currency">₹</span>{formatPrice(price)}</span>
                                <p className="font-semibold text-green-600"><span className="font-currency">₹</span>{formatPrice(vendorPrice)}</p>
                              </div>
                              <Badge variant="secondary" className="w-fit text-[10px] py-0 px-1 font-currency">💎 -<span className="font-currency">₹</span>{formatPrice((displayPrice - vendorPrice) * quantity)} Partner Discount</Badge>
                            </>
                          ) : salePrice ? (
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
                            onChange={(e) => {
                              const newQty = parseInt(e.target.value) || 1;
                              updateQuantity(cartItemId, newQty);
                            }}
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
                      <div className="hidden md:flex flex-col items-end justify-center w-40 text-right mr-4">
                        {isVendor && vendorDiscount > 0 ? (
                          <>
                            <p className="font-semibold text-green-600">
                              <span className="font-currency">₹</span>{formatPrice(vendorPrice * quantity)}
                            </p>
                            <Badge variant="secondary" className="text-[10px] h-4 px-1 py-0 mt-1 font-currency">💎 -<span className="font-currency">₹</span>{formatPrice((displayPrice - vendorPrice) * quantity)} Partner Discount</Badge>
                          </>
                        ) : (
                          <p className="font-semibold"><span className="font-currency">₹</span>{formatPrice(vendorPrice * quantity)}</p>
                        )}
                      </div>
                      <div className="hidden md:flex items-center">
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
                  <DialogContent className="max-w-4xl w-full p-0">
                    <DialogHeader className="sr-only">
                      <DialogTitle>{product.name}</DialogTitle>
                      <DialogDescription>{product.description}</DialogDescription>
                    </DialogHeader>
                    <ProductDetails product={product} />
                  </DialogContent>
                </Dialog>
              )
            })}
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Retail Subtotal</span>
                  <span className={isVendor ? "line-through text-muted-foreground" : ""}><span className="font-currency">₹</span>{formatPrice(originalTotal)}</span>
                </div>
                {isVendor && totalSavings > 0 && (
                  <div className="flex justify-between text-green-600 font-medium">
                    <span>Your Savings</span>
                    <span>- <span className="font-currency">₹</span>{formatPrice(totalSavings)}</span>
                  </div>
                )}
                {isVendor && vendor?.defaultDiscount && (
                  <div className="flex justify-between text-muted-foreground text-sm">
                    <span>Partner Discount</span>
                    <span>{vendor.defaultDiscount}%</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>
                    {isLoadingShipping ? (
                      <span className="text-xs text-muted-foreground italic">Calculating...</span>
                    ) : (
                      shippingCost > 0 ? <><span className="font-currency">₹</span>{formatPrice(shippingCost)}</> : "Free"
                    )}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total {isVendor ? 'Payable' : ''}</span>
                  <span className={isVendor ? "text-primary" : ""}><span className="font-currency">₹</span>{formatPrice(grandTotal)}</span>
                </div>
                {isVendor && totalSavings > 0 && (
                  <p className="text-xs text-center text-green-600 font-medium mt-2 animate-pulse">
                    Your verified partner status saved you <span className="font-currency">₹</span>{formatPrice(totalSavings)}!
                  </p>
                )}
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

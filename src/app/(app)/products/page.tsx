
"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, ShoppingCart, Minus, Plus, Loader2, ArrowRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import ProductDetails from "@/components/product-details";
import type { Product, ProductVariant } from "@/lib/types";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useState, useMemo } from "react";
import { useCart } from "@/context/cart-context";
import { useToast } from "@/hooks/use-toast";
import React from "react";
import { WithId, useCollection, useFirestore, useMemoFirebase, useDoc } from "@/firebase";
import { collection, query, where, doc } from 'firebase/firestore';
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { staticProducts } from "@/data/static-products";
import { ToastAction } from "@/components/ui/toast";
import { formatPrice } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { useVendorPricing } from "@/hooks/useVendor";

type DealsData = {
  productIds: string[];
}

import { motion } from 'framer-motion';

const fadeInUp = {
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeInOut" } },
};

const staggerContainer = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

function ProductsGrid() {
  const searchParams = useSearchParams();
  const filter = searchParams.get('filter');
  const firestore = useFirestore();

  const productsCollection = useMemoFirebase(() => collection(firestore, 'products'), [firestore]);

  const { data: firestoreProducts, isLoading: productsLoading } = useCollection<Product>(productsCollection);

  const dealsDocRef = useMemoFirebase(() => doc(firestore, 'site-config', 'dealsOfTheDay'), [firestore]);
  const { data: dealsData, isLoading: dealsLoading } = useDoc<DealsData>(dealsDocRef);

  const products = (firestoreProducts && firestoreProducts.length > 0) ? firestoreProducts : staticProducts;

  const dealIdSet = useMemo(() => {
    if (!dealsData || !dealsData.productIds) return new Set();
    return new Set(dealsData.productIds);
  }, [dealsData]);

  const productsByCategory = useMemo(() => {
    return products.reduce((acc, product) => {
      const category = product.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(product as WithId<Product>);
      return acc;
    }, {} as Record<string, WithId<Product>[]>);
  }, [products]);

  if (productsLoading || dealsLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  const displayedProducts = filter
    ? products.filter(p => p.category === filter)
    : products;

  // Show all products in one animated grid - no category grouping
  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={staggerContainer}
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8"
    >
      {displayedProducts.map((product) => (
        <motion.div variants={fadeInUp} key={product.id}>
          <ProductCard product={product as WithId<Product>} isDeal={dealIdSet.has(product.id)} />
        </motion.div>
      ))}
    </motion.div>
  );
}

export default function ProductsPage() {
  return (
    <div className="bg-background">
      <div className="container mx-auto px-4 py-16 lg:py-24">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-headline font-bold hover:text-primary transition-colors cursor-default">
            Discover Our Collection
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg font-semibold text-muted-foreground">
            Discover a world of flavor and wellness. Each variant is crafted with care to bring you the best of nature's goodness.
          </p>
        </div>

        <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>}>
          <ProductsGrid />
        </Suspense>
      </div>
    </div>
  );
}


function ProductCard({ product, isDeal }: { product: WithId<Product>, isDeal?: boolean }) {
  const { cartItems, addToCart, updateQuantity } = useCart();
  const { toast } = useToast();
  const router = useRouter();
  const [localQuantity, setLocalQuantity] = useState(1);
  const { isVendor, getPrice, getDiscount } = useVendorPricing();

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(
    product.variants?.find(v => v.price === product.defaultPrice) || product.variants?.[0]
  );

  const getCartItemId = (productId: string, variantId?: string) => {
    return variantId ? `${productId}-${variantId}` : productId;
  };

  const cartItemId = getCartItemId(product.id, selectedVariant?.id);
  const inCart = cartItems.find(item => getCartItemId(item.product.id, item.variant?.id) === cartItemId);
  const cartQty = inCart?.quantity || 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const amountToAdd = localQuantity;

    addToCart(product, amountToAdd, selectedVariant);
    toast({
      title: "Added to cart",
      description: `${amountToAdd} x ${product.name} ${selectedVariant ? `(${selectedVariant.name})` : ''} has been added.`,
      duration: 5000,
      action: <ToastAction altText="View Cart" onClick={() => router.push('/cart')}>View Cart</ToastAction>,
    });
    setLocalQuantity(1);
  };

  const handleQuantityChange = (change: number) => {
    setLocalQuantity(Math.max(1, localQuantity + change));
  };

  const handleCartQuantityChange = (newQuantity: number) => {
    updateQuantity(cartItemId, newQuantity);
  };


  const handleVariantChange = (variantId: string) => {
    const variant = product.variants?.find(v => v.id === variantId);
    setSelectedVariant(variant);
    setLocalQuantity(1); // Reset quantity when variant changes
  }

  const price = selectedVariant?.price ?? product.defaultPrice;
  const salePrice = selectedVariant?.salePrice ?? product.salePrice;

  // Calculate vendor pricing
  const displayPrice = salePrice || price;
  const vendorPrice = isVendor ? getPrice(displayPrice, product.id, localQuantity) : displayPrice;
  const vendorDiscount = isVendor ? getDiscount(product.id, localQuantity) : 0;


  return (
    <Dialog>
      <Card className="overflow-hidden group flex flex-col h-full rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300">
        <CardContent className="p-0 flex-1 flex flex-col">
          <DialogTrigger asChild>
            <div className="block relative w-full aspect-square overflow-hidden cursor-pointer">
              {isDeal && <Badge className="absolute top-2 right-2 z-10 bg-destructive">Deal</Badge>}
              <Image
                src={product.image.url as string}
                alt={product.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                data-ai-hint={product.image.hint}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            </div>
          </DialogTrigger>
          <div className="p-6 flex flex-col flex-1">
            <DialogTrigger asChild>
              <h3 className="font-headline text-2xl font-bold flex-1 cursor-pointer text-left hover:text-primary transition-colors">
                {product.name}
              </h3>
            </DialogTrigger>
            <p className="mt-2 text-muted-foreground text-lg flex-1 text-left">{product.tagline}</p>

            {product.variants && product.variants.length > 0 ? (
              <div className="mt-4" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                <Label htmlFor={`variant-select-card-${product.id}`} className="sr-only">Size</Label>
                <Select onValueChange={handleVariantChange} defaultValue={selectedVariant?.id}>
                  <SelectTrigger id={`variant-select-card-${product.id}`} className="h-9">
                    <SelectValue placeholder="Select a size" />
                  </SelectTrigger>
                  <SelectContent>
                    {product.variants.map(v => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null
            }

            <div className="flex flex-wrap justify-between items-center mt-4 gap-2">
              <div className="flex flex-col gap-1">
                {isVendor ? (
                  <>
                    <div className="flex items-baseline gap-2">
                      <p className="text-xl font-semibold text-green-600"><span className="font-currency">₹</span>{formatPrice(vendorPrice)}</p>
                      {(salePrice || price > vendorPrice) && <p className="text-sm text-muted-foreground line-through"><span className="font-currency">₹</span>{formatPrice(price)}</p>}
                    </div>
                    <Badge variant="secondary" className="w-fit text-xs">💎 Your Price ({vendorDiscount}% off)</Badge>
                  </>
                ) : salePrice ? (
                  <>
                    <div className="flex items-baseline gap-2">
                      <p className="text-xl font-semibold text-destructive"><span className="font-currency">₹</span>{formatPrice(salePrice)}</p>
                      <p className="text-sm text-muted-foreground line-through"><span className="font-currency">₹</span>{formatPrice(price)}</p>
                    </div>
                  </>
                ) : (
                  <p className="text-xl font-semibold"><span className="font-currency">₹</span>{formatPrice(price)}</p>
                )}
              </div>

              {cartQty > 0 ? (
                <div className="flex items-center gap-2">
                  <div className="flex items-center border rounded-md">
                    <Button variant="ghost" size="icon" className="h-9 w-9" onClick={(e) => { e.stopPropagation(); handleCartQuantityChange(cartQty - 1); }} disabled={cartQty === 0}>
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      type="number"
                      min="1"
                      value={cartQty}
                      onChange={(e) => {
                        e.stopPropagation();
                        const val = parseInt(e.target.value) || 1;
                        handleCartQuantityChange(val);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="w-12 h-9 text-center border-0 focus-visible:ring-0 focus-visible:ring-offset-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <Button variant="ghost" size="icon" className="h-9 w-9" onClick={(e) => { e.stopPropagation(); handleCartQuantityChange(cartQty + 1); }}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button onClick={(e) => { e.stopPropagation(); router.push('/cart'); }} size="icon" aria-label="Go to cart" className="h-9 w-9">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center space-x-1">
                  <div className="flex items-center border rounded-md">
                    <Button variant="ghost" size="icon" className="h-9 w-9" onClick={(e) => { e.stopPropagation(); handleQuantityChange(-1) }} disabled={localQuantity === 1}>
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      type="number"
                      min="1"
                      value={localQuantity}
                      onChange={(e) => {
                        e.stopPropagation();
                        const val = parseInt(e.target.value) || 1;
                        setLocalQuantity(val);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="w-12 h-9 text-center border-0 focus-visible:ring-0 focus-visible:ring-offset-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <Button variant="ghost" size="icon" className="h-9 w-9" onClick={(e) => { e.stopPropagation(); handleQuantityChange(1) }}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button onClick={handleAddToCart} size="icon" aria-label="Add to cart">
                    <ShoppingCart className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      <DialogContent className="max-w-4xl p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>{product.name}</DialogTitle>
          <DialogDescription>{product.description}</DialogDescription>
        </DialogHeader>
        <ProductDetails product={product} />
      </DialogContent>
    </Dialog>
  );
}

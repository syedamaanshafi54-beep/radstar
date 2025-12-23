
"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, ShoppingCart, Minus, Plus, Loader2 } from "lucide-react";
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

type DealsData = {
  productIds: string[];
}

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

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
      {displayedProducts.map((product) => (
        <ProductCard key={product.id} product={product as WithId<Product>} isDeal={dealIdSet.has(product.id)} />
      ))}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <div className="bg-background">
      <div className="container mx-auto px-4 py-16 lg:py-24">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-headline font-bold">
            Our Collection
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-xl font-semibold text-muted-foreground">
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
    setLocalQuantity(1); // Reset local quantity after adding
  };
  
  const handleQuantityChange = (change: number) => {
    setLocalQuantity((prev) => Math.max(1, prev + change));
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
                <h3 className="font-headline text-2xl flex-1 cursor-pointer text-justify">
                  {product.name}
                </h3>
            </DialogTrigger>
            <p className="mt-2 text-muted-foreground text-lg flex-1 text-justify">{product.tagline}</p>
            
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
              <div className="flex items-baseline gap-2">
                {salePrice ? (
                  <>
                    <p className="text-xl font-semibold text-destructive"><span className="font-currency">₹</span>{formatPrice(salePrice)}</p>
                    <p className="text-sm text-muted-foreground line-through"><span className="font-currency">₹</span>{formatPrice(price)}</p>
                  </>
                ) : (
                  <p className="text-xl font-semibold"><span className="font-currency">₹</span>{formatPrice(price)}</p>
                )}
              </div>
              
              {cartQty > 0 ? (
                <div className="flex items-center space-x-1">
                  <div className="flex items-center border rounded-md">
                    <Button variant="ghost" size="icon" className="h-9 w-9" onClick={(e) => {e.stopPropagation(); handleCartQuantityChange(cartQty - 1);}} disabled={cartQty === 0}>
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-12 h-9 text-center flex items-center justify-center text-sm font-medium text-foreground">
                      {cartQty}
                    </span>
                    <Button variant="ghost" size="icon" className="h-9 w-9" onClick={(e) => {e.stopPropagation(); handleCartQuantityChange(cartQty + 1);}}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-1">
                  <div className="flex items-center border rounded-md">
                    <Button variant="ghost" size="icon" className="h-9 w-9" onClick={(e) => {e.stopPropagation(); handleQuantityChange(-1)}} disabled={localQuantity === 1}>
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-12 h-9 text-center flex items-center justify-center text-sm font-medium text-foreground">
                      {localQuantity}
                    </span>
                    <Button variant="ghost" size="icon" className="h-9 w-9" onClick={(e) => {e.stopPropagation(); handleQuantityChange(1)}}>
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
      <DialogContent className="max-w-4xl w-full p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>{product.name}</DialogTitle>
          <DialogDescription>{product.description}</DialogDescription>
        </DialogHeader>
        <ProductDetails product={product} />
      </DialogContent>
    </Dialog>
  );
}

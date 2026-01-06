'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Minus, Plus, ArrowRight, MessageSquare, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useCart } from '@/context/cart-context';
import { useToast } from '@/hooks/use-toast';
import { useVendorPricing } from '@/hooks/useVendor';
import { formatPrice } from '@/lib/utils';
import { WithId, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { Product, ProductVariant } from "@/lib/types";
import { Review } from '@/lib/types/reviews';
import ProductDetails from '@/components/product-details';
import ProductReviews from '@/components/product-reviews';
import { ToastAction } from '@/components/ui/toast';

function StarRating({ productId }: { productId: string }) {
    const firestore = useFirestore();
    const reviewsQuery = useMemoFirebase(
        () => query(collection(firestore, 'reviews'), where('productId', '==', productId)),
        [firestore, productId]
    );
    const { data: reviews } = useCollection<Review>(reviewsQuery, { listen: true });

    const average = useMemo(() => {
        if (!reviews || reviews.length === 0) return 0;
        const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
        return Math.round((sum / reviews.length) * 10) / 10;
    }, [reviews]);

    if (!reviews || reviews.length === 0) return null;

    return (
        <div className="absolute top-2 left-2 z-10 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1 shadow-sm border border-primary/20">
            <Star className="h-3 w-3 fill-primary text-primary" />
            <span className="text-xs font-bold text-primary-nav-foreground">{average}</span>
            <span className="text-[10px] text-muted-foreground">({reviews.length})</span>
        </div>
    );
}

interface ProductCardProps {
    product: WithId<Product>;
    isDeal?: boolean;
}

export function ProductCard({ product, isDeal }: ProductCardProps) {
    const { cartItems, addToCart, updateQuantity } = useCart();
    const { toast } = useToast();
    const router = useRouter();
    const [quantity, setQuantity] = useState(1);
    const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(
        product.variants?.find(v => v.price === product.defaultPrice) || product.variants?.[0]
    );
    const { isVendor, getPrice, getDiscount } = useVendorPricing();

    const getCartItemId = (productId: string, variantId?: string) => {
        return variantId ? `${productId}-${variantId}` : productId;
    };

    const cartItemId = getCartItemId(product.id, selectedVariant?.id);
    const inCart = cartItems.find(item => getCartItemId(item.product.id, item.variant?.id) === cartItemId);
    const cartQty = inCart?.quantity || 0;

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const amountToAdd = cartQty > 0 ? quantity : 1;

        addToCart(product, amountToAdd, selectedVariant);
        toast({
            title: "Added to cart",
            description: `${amountToAdd} x ${product.name} ${selectedVariant ? `(${selectedVariant.name})` : ''} has been added.`,
            duration: 5000,
            action: <ToastAction altText="View Cart" onClick={() => router.push('/cart')}>View Cart</ToastAction>,
        });
    };

    const handleQuantityChange = (change: number) => {
        setQuantity((prev) => Math.max(1, prev + change));
    };

    const handleCartQuantityChange = (newQuantity: number) => {
        updateQuantity(cartItemId, newQuantity);
    };

    const handleVariantChange = (variantId: string) => {
        const variant = product.variants?.find(v => v.id === variantId);
        setSelectedVariant(variant);
        setQuantity(1);
    }

    const price = selectedVariant?.price ?? product.defaultPrice;
    const salePrice = selectedVariant?.salePrice ?? product.salePrice;

    const displayPrice = salePrice || price;
    const vendorPrice = isVendor ? getPrice(displayPrice, product.id, quantity) : displayPrice;
    const vendorDiscount = isVendor ? getDiscount(product.id, quantity) : 0;

    return (
        <Dialog>
            <Card className="overflow-hidden group flex flex-col h-full rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300">
                <CardContent className="p-0 flex-1 flex flex-col">
                    <div className="block relative w-full aspect-square overflow-hidden group/img">
                        {isDeal && (salePrice || (product.variants && product.variants.some(v => v.salePrice))) &&
                            <Badge className="absolute top-2 right-2 z-10 bg-destructive font-bold text-base">Deal</Badge>
                        }
                        <StarRating productId={product.id} />

                        <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover/img:translate-y-0 transition-transform duration-300 z-10">
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="secondary" className="w-full shadow-lg border-primary/20 bg-white/95 hover:bg-primary hover:text-white transition-colors">
                                        <MessageSquare className="mr-2 h-4 w-4" />
                                        Reviews & Feedback
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-lg">
                                    <DialogHeader>
                                        <DialogTitle className="text-2xl font-headline">{product.name} Reviews</DialogTitle>
                                        <DialogDescription>
                                            What our customers are saying about this product.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="mt-4">
                                        <ProductReviews productId={product.id} />
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>

                        <DialogTrigger asChild>
                            {product.image && product.image.url && (
                                <Image
                                    src={product.image.url as string}
                                    alt={product.name}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
                                    data-ai-hint={product.image.hint}
                                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                />
                            )}
                        </DialogTrigger>
                    </div>
                    <div className="p-4 flex flex-col flex-1">
                        <DialogTrigger asChild>
                            <h3 className="font-headline text-2xl md:text-3xl font-bold flex-1 cursor-pointer hover:text-primary transition-colors text-left">
                                {product.name}
                            </h3>
                        </DialogTrigger>
                        <p className="mt-2 text-muted-foreground text-base flex-1 text-left line-clamp-2">{product.tagline}</p>

                        {product.variants && product.variants.length > 0 ? (
                            <div className="mt-4" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                                <Label htmlFor={`variant-select-${product.id}`} className="sr-only">Size</Label>
                                <Select onValueChange={handleVariantChange} defaultValue={selectedVariant?.id}>
                                    <SelectTrigger id={`variant-select-${product.id}`} className="h-9">
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
                        ) : null}

                        <div className="flex flex-wrap justify-between items-center mt-4 gap-2">
                            <div className="flex flex-col gap-1">
                                {isVendor ? (
                                    <>
                                        <div className="flex flex-col">
                                            {(salePrice || price > vendorPrice) && (
                                                <p className="text-[10px] uppercase font-bold text-muted-foreground mb-0.5">
                                                    MRP: <span className="font-currency">₹</span>{formatPrice(price)}
                                                </p>
                                            )}
                                            <p className="text-2xl font-bold text-green-600 leading-tight">
                                                <span className="font-currency">₹</span>{formatPrice(vendorPrice)}
                                            </p>
                                        </div>
                                        <Badge variant="secondary" className="w-fit text-[10px] py-0 px-1 mt-1">💎 Partner Price ({vendorDiscount}% off)</Badge>
                                    </>
                                ) : salePrice ? (
                                    <>
                                        <div className="flex items-baseline gap-2">
                                            <p className="text-2xl font-bold text-destructive">
                                                <span className="font-currency">₹</span>{formatPrice(salePrice)}
                                            </p>
                                            <p className="text-base text-muted-foreground line-through">
                                                <span className="font-currency">₹</span>{formatPrice(price)}
                                            </p>
                                        </div>
                                    </>
                                ) : (
                                    <p className="text-2xl font-bold"><span className="font-currency">₹</span>{formatPrice(price)}</p>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                {cartQty > 0 ? (
                                    <>
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
                                    </>
                                ) : (
                                    <>
                                        <div className="flex items-center border rounded-md">
                                            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={(e) => { e.stopPropagation(); handleQuantityChange(-1); }} disabled={quantity === 1}>
                                                <Minus className="h-4 w-4" />
                                            </Button>
                                            <Input
                                                type="number"
                                                min="1"
                                                value={quantity}
                                                onChange={(e) => {
                                                    e.stopPropagation();
                                                    const val = parseInt(e.target.value) || 1;
                                                    setQuantity(val);
                                                }}
                                                onClick={(e) => e.stopPropagation()}
                                                className="w-12 h-9 text-center border-0 focus-visible:ring-0 focus-visible:ring-offset-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                            />
                                            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={(e) => { e.stopPropagation(); handleQuantityChange(1); }}>
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <Button onClick={handleAddToCart} size="icon" aria-label="Add to cart" className="h-9 w-9">
                                            <ShoppingCart className="h-4 w-4" />
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
            <DialogContent className="max-w-4xl p-0">
                <DialogHeader className="sr-only">
                    <DialogTitle>{product.name}</DialogTitle>
                    <DialogDescription>Details for {product.name}</DialogDescription>
                </DialogHeader>
                <ProductDetails product={product} />
            </DialogContent>
        </Dialog>
    );
}

'use client';

import { useFirestore, useCollection, useMemoFirebase, WithId } from '@/firebase';
import { collection, query, where, limit } from 'firebase/firestore';
import { notFound, useSearchParams } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import ProductDetails from '@/components/product-details';
import ProductReviews from '@/components/product-reviews';
import { Loader2 } from 'lucide-react';
import type { Product } from '@/lib/types';
import { useCart } from '@/context/cart-context';

export default function ProductPage({ params }: { params: { slug: string } }) {
    const firestore = useFirestore();
    const searchParams = useSearchParams();
    const shouldReview = searchParams.get('review') === 'true';

    const productsRef = useMemoFirebase(() => collection(firestore, 'products'), [firestore]);
    const q = useMemoFirebase(() => query(productsRef, where('slug', '==', params.slug), limit(1)), [productsRef, params.slug]);
    const { data: products, isLoading } = useCollection<Product>(q, { listen: false });

    const product = products?.[0];

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    if (!product) {
        // Optional: You could show a "Product not found" UI here 
        return (
            <div className="container mx-auto px-4 py-16 text-center">
                <h1 className="text-2xl font-bold">Product not found</h1>
                <p className="text-muted-foreground mt-2">The product you are looking for does not exist or has been removed.</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 md:py-12">
            <div className="bg-card rounded-xl shadow-sm border p-0 md:p-6 mb-8 overflow-hidden">
                <ProductDetails product={product} />
            </div>

            <div className="max-w-4xl mx-auto space-y-8" id="reviews-section">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl md:text-3xl font-bold font-headline">Customer Reviews</h2>
                </div>
                <ProductReviews productId={product.id} />
            </div>
        </div>
    )
}

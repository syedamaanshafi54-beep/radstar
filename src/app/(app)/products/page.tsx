"use client";

import { Loader2 } from "lucide-react";
import type { Product } from "@/lib/types";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo } from "react";
import React from "react";
import { WithId, useCollection, useFirestore, useMemoFirebase, useDoc } from "@/firebase";
import { collection, doc } from 'firebase/firestore';

import { ProductCard } from "@/components/product-card";
import { motion } from 'framer-motion';

type DealsData = {
  productIds: string[];
}

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

  const products = firestoreProducts || [];

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

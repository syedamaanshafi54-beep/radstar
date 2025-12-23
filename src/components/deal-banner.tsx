
'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useDoc, useFirestore, useMemoFirebase, WithId } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { Product } from '@/lib/types';
import { Button } from './ui/button';
import { ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import ProductDetails from './product-details';
import { formatPrice } from '@/lib/utils';

type DealInfo = {
  productId: string;
  discount: number; // e.g., 25 for 25%
};

const Countdown = () => {
  const [timeLeft, setTimeLeft] = useState({
    hours: '00',
    minutes: '00',
    seconds: '00',
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      const diff = midnight.getTime() - now.getTime();

      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setTimeLeft({
        hours: String(hours).padStart(2, '0'),
        minutes: String(minutes).padStart(2, '0'),
        seconds: String(seconds).padStart(2, '0'),
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-1 md:gap-2">
      <div className="flex flex-col items-center">
        <span className="text-lg md:text-xl font-bold">{timeLeft.hours}</span>
        <span className="text-xs">HRS</span>
      </div>
      <span className="text-lg md:text-xl font-bold">:</span>
      <div className="flex flex-col items-center">
        <span className="text-lg md:text-xl font-bold">{timeLeft.minutes}</span>
        <span className="text-xs">MIN</span>
      </div>
      <span className="text-lg md:text-xl font-bold">:</span>
      <div className="flex flex-col items-center">
        <span className="text-lg md:text-xl font-bold">{timeLeft.seconds}</span>
        <span className="text-xs">SEC</span>
      </div>
    </div>
  );
};

export const DealBanner = () => {
  const firestore = useFirestore();
  const [dealProduct, setDealProduct] = useState<WithId<Product> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const dealInfoRef = useMemoFirebase(
    () => doc(firestore, 'site-config', 'dealsOfTheDay'),
    [firestore]
  );
  const { data: dealInfo, isLoading: isDealInfoLoading } = useDoc<DealInfo>(dealInfoRef);
  
  useEffect(() => {
    const fetchDealProduct = async () => {
      if (isDealInfoLoading) return;
      
      let productId: string | undefined = dealInfo?.productId;
      
      if (!productId) {
         setIsLoading(false);
         return;
      }
      
      try {
        const productRef = doc(firestore, 'products', productId);
        const productSnap = await getDoc(productRef);
        
        if (productSnap.exists()) {
          setDealProduct({ id: productSnap.id, ...productSnap.data() } as WithId<Product>);
        } else {
           setDealProduct(null);
        }
      } catch (error) {
        console.error("Error fetching deal product:", error);
        setDealProduct(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDealProduct();
  }, [dealInfo, isDealInfoLoading, firestore]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 mt-8">
        <div className="flex h-24 items-center justify-center rounded-lg bg-secondary/50">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!dealProduct) {
    return null; // No deal available, render nothing
  }

  const price = dealProduct.variants?.[0]?.price ?? dealProduct.defaultPrice;
  const salePrice = dealProduct.variants?.[0]?.salePrice ?? dealProduct.salePrice;

  if (!salePrice) return null; // Only show if there's an actual sale price.

  return (
    <Dialog>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative"
      >
        <div className="container mx-auto px-4 mt-8">
          <div className="relative grid grid-cols-12 items-center gap-4 rounded-lg bg-gradient-to-r from-primary/10 via-background to-secondary/20 p-2 md:p-0 shadow-inner overflow-hidden border">
            <div className="hidden md:block col-span-2 relative h-full">
                  <Image
                      src={dealProduct.image.url as string}
                      alt={dealProduct.name}
                      fill
                      className="object-contain p-2"
                      sizes="150px"
                  />
            </div>

            <div className="col-span-12 md:col-span-10 grid grid-cols-1 md:grid-cols-3 gap-4 items-center text-center md:text-left p-4">
              {/* Column 1: Label and Product Name */}
              <div className="md:col-span-1">
                <div className="flex items-center justify-center md:justify-start gap-2 text-primary font-bold">
                  <span className="text-2xl">🔥</span>
                  <span className="font-headline text-xl md:text-2xl">Deal of the Day</span>
                </div>
                <p className="font-bold text-lg md:text-xl text-foreground mt-1">{dealProduct.name}</p>
                <p className="text-sm font-medium text-muted-foreground">{dealProduct.tagline}</p>
              </div>
              
              {/* Column 2: Prices and Countdown */}
              <div className="md:col-span-1 flex flex-col items-center">
                  <div className="flex items-baseline gap-3">
                      <span className="text-3xl font-bold text-destructive"><span className="font-currency">₹</span>{formatPrice(salePrice)}</span>
                      <span className="text-xl text-muted-foreground line-through"><span className="font-currency">₹</span>{formatPrice(price)}</span>
                  </div>
                  <div className="text-primary mt-1">
                      <Countdown />
                  </div>
              </div>

              {/* Column 3: Button */}
              <div className="md:col-span-1 flex justify-center md:justify-end">
                <DialogTrigger asChild>
                  <Button size="lg" className="group w-full md:w-auto">
                    Shop Now <ArrowRight className="ml-2 transition-transform group-hover:translate-x-1" />
                  </Button>
                </DialogTrigger>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
      <DialogContent className="max-w-4xl w-full p-0 h-full max-h-full overflow-y-auto sm:h-auto sm:max-h-[90vh] sm:rounded-lg">
          <DialogHeader className="sr-only">
            <DialogTitle>{dealProduct.name}</DialogTitle>
            <DialogDescription>Details for {dealProduct.name}</DialogDescription>
          </DialogHeader>
          <ProductDetails product={dealProduct} />
        </DialogContent>
    </Dialog>
  );
};

    
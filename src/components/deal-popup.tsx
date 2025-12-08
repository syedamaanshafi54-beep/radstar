
'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useDoc, useCollection, useFirestore, useMemoFirebase, WithId } from '@/firebase';
import { doc, collection } from 'firebase/firestore';
import type { Product } from '@/lib/types';
import { Sparkles } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { formatPrice } from '@/lib/utils';

type DealsData = {
  productIds: string[];
};

export function DealPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const firestore = useFirestore();

  const dealsDocRef = useMemoFirebase(() => doc(firestore, 'site-config', 'dealsOfTheDay'), [firestore]);
  const { data: dealsData, isLoading: dealsLoading } = useDoc<DealsData>(dealsDocRef);
  
  const productsCollection = useMemoFirebase(() => collection(firestore, 'products'), [firestore]);
  const { data: productsData, isLoading: productsLoading } = useCollection<Product>(productsCollection);
  
  const dealProducts = useMemo(() => {
    const sourceProducts = productsData || [];
    if (!dealsData || !dealsData.productIds || dealsData.productIds.length === 0) {
      return sourceProducts.filter(p => p.salePrice || (p.variants && p.variants.some(v => v.salePrice)));
    }
    
    const dealIdSet = new Set(dealsData.productIds);
    return sourceProducts.filter((p) => dealIdSet.has(p.id) && (p.salePrice || (p.variants && p.variants.some(v => v.salePrice))));
  }, [dealsData, productsData]);


  useEffect(() => {
    // Show popup if there are deals and it hasn't been shown in this session.
    if (!dealsLoading && !productsLoading && dealProducts && dealProducts.length > 0) {
      const sessionKey = 'dealPopupShown';
      const hasShown = sessionStorage.getItem(sessionKey);

      if (!hasShown) {
          const timer = setTimeout(() => {
            setIsOpen(true);
            sessionStorage.setItem(sessionKey, 'true');
          }, 1500); // Small delay to not bombard the user immediately
          return () => clearTimeout(timer);
      }
    }
  }, [dealProducts, dealsLoading, productsLoading]);

  const handleDismiss = () => {
    setIsOpen(false);
  };

  if (dealsLoading || productsLoading || !dealProducts || dealProducts.length === 0) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md" onEscapeKeyDown={handleDismiss} onPointerDownOutside={handleDismiss}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl font-headline">
            <Sparkles className="h-6 w-6 text-primary" />
            Today's Special Deals!
          </DialogTitle>
          <DialogDescription>
            Don't miss out on these exclusive offers, available for a limited time.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {dealProducts.map((product) => (
            <Link key={product.id} href={`/products/${product.slug}`} className="flex items-center gap-4 p-2 rounded-lg hover:bg-secondary transition-colors" onClick={handleDismiss}>
              <div className="relative h-20 w-20 flex-shrink-0">
                <Image src={product.image.url as string} alt={product.name} fill className="object-contain rounded-md" sizes="80px" />
              </div>
              <div>
                <p className="font-semibold text-lg">{product.name}</p>
                <div className="flex items-center gap-2">
                   {product.salePrice ? (
                      <>
                        <p className="text-xl font-bold text-destructive"><span className="font-currency">₹</span>{formatPrice(product.salePrice)}</p>
                        <p className="text-base text-muted-foreground line-through"><span className="font-currency">₹</span>{formatPrice(product.defaultPrice)}</p>
                      </>
                    ) : (
                      <p className="text-xl font-bold text-primary"><span className="font-currency">₹</span>{formatPrice(product.defaultPrice)}</p>
                    )}
                </div>
              </div>
            </Link>
          ))}
        </div>
        <Button onClick={handleDismiss} className="mt-4 w-full">Continue Shopping</Button>
      </DialogContent>
    </Dialog>
  );
}

    
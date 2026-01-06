
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
import ProductDetails from './product-details';
import { useVendorPricing } from '@/hooks/useVendor';
import { Badge } from './ui/badge';

type DealsData = {
  productIds: string[];
};

export function DealPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeProduct, setActiveProduct] = useState<WithId<Product> | null>(null);
  const { isVendor, getPrice, getDiscount } = useVendorPricing();

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
    if (!dealsLoading && !productsLoading && dealProducts && dealProducts.length > 0) {
      const sessionKey = 'dealPopupShown';
      const hasShown = sessionStorage.getItem(sessionKey);

      if (!hasShown) {
        const timer = setTimeout(() => {
          setIsOpen(true);
          sessionStorage.setItem(sessionKey, 'true');
        }, 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [dealProducts, dealsLoading, productsLoading]);

  const handleDismiss = () => {
    setIsOpen(false);
  };

  const handleProductClick = (product: WithId<Product>) => {
    setActiveProduct(product);
    setIsOpen(false); // Close the deals popup
  };

  const handleDetailsClose = () => {
    setActiveProduct(null);
  };

  if (dealsLoading || productsLoading || !dealProducts || dealProducts.length === 0) {
    return null;
  }

  return (
    <>
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
              <button key={product.id} onClick={() => handleProductClick(product as WithId<Product>)} className="w-full text-left flex items-center gap-4 p-2 rounded-lg hover:bg-secondary transition-colors">
                <div className="relative h-20 w-20 flex-shrink-0">
                  <Image src={product.image.url as string} alt={product.name} fill className="object-contain rounded-md" sizes="80px" />
                </div>
                <div>
                  <p className="font-semibold text-lg">{product.name}</p>
                  <div className="flex flex-col">
                    {isVendor ? (
                      <>
                        <div className="flex flex-col">
                          <p className="text-[10px] uppercase font-bold text-muted-foreground mb-0.5 leading-none">
                            MRP: <span className="font-currency">₹</span>{formatPrice(product.defaultPrice)}
                          </p>
                          <p className="text-xl font-bold text-green-600">
                            <span className="font-currency">₹</span>{formatPrice(getPrice(product.salePrice || product.defaultPrice, product.id, 1))}
                          </p>
                        </div>
                        <Badge variant="secondary" className="w-fit text-[10px] h-4">💎 Partner Price ({getDiscount(product.id, 1)}% off)</Badge>
                      </>
                    ) : product.salePrice ? (
                      <div className="flex items-baseline gap-2">
                        <p className="text-xl font-bold text-destructive"><span className="font-currency">₹</span>{formatPrice(product.salePrice)}</p>
                        <p className="text-sm text-muted-foreground line-through"><span className="font-currency">₹</span>{formatPrice(product.defaultPrice)}</p>
                      </div>
                    ) : (
                      <p className="text-xl font-bold text-primary"><span className="font-currency">₹</span>{formatPrice(product.defaultPrice)}</p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
          <Button onClick={handleDismiss} className="mt-4 w-full">Continue Shopping</Button>
        </DialogContent>
      </Dialog>

      <Dialog open={!!activeProduct} onOpenChange={(isOpen) => !isOpen && handleDetailsClose()}>
        <DialogContent className="max-w-4xl p-0">
          {activeProduct && (
            <>
              <DialogHeader className="sr-only">
                <DialogTitle>{activeProduct.name}</DialogTitle>
                <DialogDescription>Details for {activeProduct.name}</DialogDescription>
              </DialogHeader>
              <ProductDetails product={activeProduct} />
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}




'use client';

import { useState, useEffect, useCallback, Fragment, Dispatch, SetStateAction, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X, Loader2, Info } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase, WithId } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { Product } from '@/lib/types';
import Image from 'next/image';
import Link from 'next/link';
import ProductDetails from './product-details';
import { InstagramIcon, WhatsAppIcon } from './icons/social-icons';

interface SearchOverlayProps {
    isOpen: boolean;
    setIsOpen: Dispatch<SetStateAction<boolean>>;
}

export function SearchOverlay({ isOpen, setIsOpen }: SearchOverlayProps) {
  const [query, setQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<WithId<Product>[]>([]);
  const [activeProduct, setActiveProduct] = useState<WithId<Product> | null>(null);

  const firestore = useFirestore();
  const productsCollection = useMemoFirebase(() => collection(firestore, 'products'), [firestore]);
  const { data: firestoreProducts, isLoading: productsLoading } = useCollection<Product>(productsCollection, { listen: false });
  
  const allProducts = useMemo(() => firestoreProducts || [], [firestoreProducts]);

  useEffect(() => {
    if (query.length > 1) {
      const lowerCaseQuery = query.toLowerCase();
      const results = allProducts.filter(product =>
        product.name.toLowerCase().includes(lowerCaseQuery) ||
        product.tagline.toLowerCase().includes(lowerCaseQuery) ||
        product.category.toLowerCase().includes(lowerCaseQuery)
      );
      setFilteredProducts(results as WithId<Product>[]);
    } else {
      setFilteredProducts([]);
    }
  }, [query, allProducts]);

  const handleProductClick = (product: WithId<Product>) => {
    setActiveProduct(product);
  };
  
  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        setIsOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setIsOpen]);

  return (
    <>
      <div className="absolute top-2 right-4 md:right-10 z-50 flex items-center gap-1 md:gap-2">
          <a
            href="https://www.instagram.com/aslitalbina.official"
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground/80 hover:text-foreground transition-opacity p-2"
            aria-label="Instagram"
          >
            <InstagramIcon className="h-5 md:h-6 w-5 md:w-6" />
          </a>
          <a
            href="https://wa.me/919032561974"
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground/80 hover:text-foreground transition-opacity p-2"
            aria-label="WhatsApp"
          >
            <WhatsAppIcon className="h-5 md:h-6 w-5 md:w-6" />
          </a>
          <div className="w-px h-5 md:h-6 bg-black mx-1"></div>
          <Button
            variant="ghost"
            size="icon"
            className="text-foreground/80 hover:text-foreground transition-opacity h-auto p-2"
            aria-label="Search"
            onClick={() => setIsOpen(true)}
           >
             <Search className="h-5 md:h-6 w-5 md:w-6" />
          </Button>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="w-full h-full max-w-full max-h-full sm:max-w-3xl sm:max-h-[80vh] bg-background/90 backdrop-blur-sm flex flex-col p-0 sm:rounded-lg">
          <DialogHeader className="p-6 pb-2 sr-only">
            <DialogTitle className="text-2xl font-bold font-headline text-center text-primary">Search</DialogTitle>
            <DialogDescription>Search for products in our store.</DialogDescription>
          </DialogHeader>

          <div className="px-4 sm:px-6 pt-4 sm:pt-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search for products..."
                className="w-full h-14 pl-12 pr-4 text-lg rounded-full border-2 focus-visible:ring-primary"
                autoFocus
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {productsLoading && query.length > 1 && (
              <div className="flex justify-center items-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
            
            {!productsLoading && query.length > 1 && filteredProducts.length === 0 && (
              <div className="text-center text-muted-foreground py-10">
                <p className="font-semibold text-lg">No results found for "{query}"</p>
                <p>Try searching for another product.</p>
              </div>
            )}
            
            {filteredProducts.length > 0 && (
              <div className="space-y-3">
                {filteredProducts.map(product => (
                  <button
                    key={product.id}
                    onClick={() => handleProductClick(product)}
                    className="w-full text-left p-3 flex items-center gap-4 rounded-lg hover:bg-secondary transition-colors"
                  >
                    <div className="relative h-16 w-16 rounded-md overflow-hidden flex-shrink-0 border">
                        <Image src={product.image.url as string} alt={product.name} fill className="object-contain" sizes="64px"/>
                    </div>
                    <div className="flex-1">
                        <p className="font-semibold text-lg">{product.name}</p>
                        <p className="text-sm text-muted-foreground">{product.tagline}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

             {!query && (
                <div className="text-center text-muted-foreground pt-10">
                    <p className="font-semibold text-lg">Find your favorite products</p>
                    <p>Start typing to see real-time results.</p>
                </div>
             )}
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Product Detail Dialog */}
       <Dialog open={!!activeProduct} onOpenChange={(isOpen) => !isOpen && setActiveProduct(null)}>
        <DialogContent className="max-w-4xl w-full p-0 sm:max-h-[90vh] overflow-y-auto sm:rounded-lg">
          {activeProduct && (
            <Fragment>
              <DialogHeader className="sr-only">
                  <DialogTitle>{activeProduct.name}</DialogTitle>
                  <DialogDescription>Details for {activeProduct.name}</DialogDescription>
              </DialogHeader>
              <ProductDetails product={activeProduct} />
            </Fragment>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
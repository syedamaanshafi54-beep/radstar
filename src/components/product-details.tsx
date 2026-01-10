"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle, Minus, Plus, ShoppingCart, ArrowRight } from "lucide-react";
import { useCart } from "@/context/cart-context";
import { useToast } from "@/hooks/use-toast";
import type { Product, ProductVariant } from "@/lib/types";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import { ToastAction } from "./ui/toast";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { useVendorPricing } from "@/hooks/useVendor";

type ProductDetailsProps = {
  product: Product;
};

export default function ProductDetails({ product }: ProductDetailsProps) {
  const { toast } = useToast();
  const { addToCart, getCartQuantity } = useCart();
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(
    product.variants?.find(v => v.price === product.defaultPrice) || product.variants?.[0]
  );
  const { isVendor, getPrice, getDiscount } = useVendorPricing();

  const handleAddToCart = () => {
    const amountToAdd = quantity;

    addToCart(product, amountToAdd, selectedVariant);

    toast({
      title: "Added to cart",
      description: `${amountToAdd} x ${product.name} ${selectedVariant ? `(${selectedVariant.name})` : ""} has been added.`,
      duration: 5000,
      action: (
        <ToastAction altText="View Cart" onClick={() => router.push("/cart")}>
          View Cart
        </ToastAction>
      ),
    });
    setQuantity(1);
  };

  const handleGoToCart = () => {
    router.push('/cart');
  };

  const handleQuantityChange = (change: number) => {
    setQuantity(prev => Math.max(1, prev + change));
  };

  const handleVariantChange = (variantId: string) => {
    const variant = product.variants?.find((v) => v.id === variantId);
    setSelectedVariant(variant);
  };

  const price = selectedVariant?.price ?? product.defaultPrice;
  const salePrice = selectedVariant?.salePrice ?? product.salePrice;

  const displayPrice = salePrice || price;
  const vendorPrice = isVendor ? getPrice(displayPrice, product.id, quantity) : displayPrice;
  const vendorDiscount = isVendor ? getDiscount(product.id, quantity) : 0;

  const cartItemId = selectedVariant ? `${product.id}-${selectedVariant.id}` : product.id;
  const cartQty = getCartQuantity(cartItemId);

  return (
    <div className="flex flex-col md:grid md:grid-cols-2 bg-background md:h-[min(800px,90vh)] max-h-screen overflow-hidden">
      {/* Left Column: Image & Primary Action - Fixed on Desktop */}
      <div className="flex flex-col space-y-4 p-4 md:p-8 md:pt-4 border-b md:border-b-0 md:border-r border-border/50 overflow-y-auto md:overflow-visible">
        <div className="relative aspect-square overflow-hidden rounded-xl bg-muted/30 shrink-0">
          <Image
            src={product.image.url}
            alt={product.name}
            fill
            className="object-cover hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, 50vw"
            data-ai-hint={product.image.hint}
            priority
          />
        </div>

        <div className="space-y-4 pt-2">
          <h1 className="font-headline text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight">{product.name}</h1>

          <div className="flex flex-col gap-1">
            {isVendor ? (
              <>
                <div className="flex flex-col">
                  {(salePrice || price > vendorPrice) && (
                    <p className="text-sm font-medium text-muted-foreground uppercase mb-0.5">
                      MRP: <span className="font-currency">₹</span>{formatPrice(price)}
                    </p>
                  )}
                  <p className="text-2xl md:text-3xl font-bold text-green-600">
                    <span className="font-currency">₹</span>{formatPrice(vendorPrice)}
                  </p>
                </div>
                <Badge variant="secondary" className="w-fit text-[10px] md:text-xs font-bold tracking-wider uppercase py-0.5 px-2 bg-green-50 text-green-700 border-green-100">
                  💎 Partner Price ({vendorDiscount}% OFF)
                </Badge>
              </>
            ) : salePrice ? (
              <div className="flex items-baseline gap-2">
                <p className="text-2xl md:text-3xl font-bold text-destructive">
                  <span className="font-currency">₹</span>{formatPrice(salePrice)}
                </p>
                <p className="text-base md:text-xl text-muted-foreground line-through opacity-70">
                  <span className="font-currency">₹</span>{formatPrice(price)}
                </p>
              </div>
            ) : (
              <p className="text-2xl md:text-3xl font-bold text-primary">
                <span className="font-currency">₹</span>{formatPrice(price)}
              </p>
            )}
          </div>

          {product.variants && product.variants.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="product-variant" className="text-sm font-semibold text-muted-foreground">
                Select Size
              </Label>
              <Select onValueChange={handleVariantChange} defaultValue={selectedVariant?.id}>
                <SelectTrigger id="product-variant" className="w-full h-11 text-base rounded-lg">
                  <SelectValue placeholder="Select a size" />
                </SelectTrigger>
                <SelectContent>
                  {product.variants.map((v) => (
                    <SelectItem key={v.id} value={v.id} className="text-base">
                      {v.name} - <span className="font-currency">₹</span>{formatPrice(v.salePrice || v.price)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <div className="flex items-center border rounded-lg bg-muted/20 overflow-hidden shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 md:h-11 md:w-11 rounded-none"
                onClick={() => handleQuantityChange(-1)}
                disabled={quantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-12 md:w-16 h-10 md:h-11 text-center border-0 bg-transparent focus-visible:ring-0 text-base md:text-lg font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none p-0"
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 md:h-11 md:w-11 rounded-none"
                onClick={() => handleQuantityChange(1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {cartQty > 0 ? (
              <Button className="flex-1 h-10 md:h-11 font-bold text-base shadow-md group" onClick={handleGoToCart}>
                <ArrowRight className="h-5 w-5 mr-2 group-hover:translate-x-1 transition-transform" />
                Go to Cart ({cartQty})
              </Button>
            ) : (
              <Button className="flex-1 h-10 md:h-11 font-bold text-base shadow-md" onClick={handleAddToCart}>
                <ShoppingCart className="h-5 w-5 mr-2" />
                Add to Cart
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Right Column: Detailed Info - Independently Scrollable */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent pr-1">
        <div className="space-y-8 p-6 md:p-8">
          <div>
            <h2 className="text-xl md:text-2xl font-bold font-headline mb-4">Description</h2>
            <div className="prose prose-slate prose-base leading-relaxed text-muted-foreground max-w-none">
              <p className="whitespace-pre-line">{product.description}</p>
            </div>
          </div>

          {product.benefits && product.benefits.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg md:text-xl font-bold font-headline">Key Highlights</h3>
              <ul className="grid grid-cols-1 gap-3">
                {product.benefits.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 text-primary-nav-foreground">
                    <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                    <span className="text-sm md:text-base font-medium">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {(product.ingredients || product.nutritionFacts) && (
            <Accordion type="single" collapsible className="w-full border-t border-border/50">
              {product.ingredients && product.ingredients.length > 0 && (
                <AccordionItem value="ingredients" className="border-b-border/50">
                  <AccordionTrigger className="text-lg font-bold hover:no-underline">Ingredients</AccordionTrigger>
                  <AccordionContent>
                    <div className="flex flex-wrap gap-2 pt-2">
                      {product.ingredients.map((item) => (
                        <Badge key={item} variant="outline" className="text-sm py-1 px-3 rounded-full font-medium">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}

              {product.nutritionFacts && (
                <AccordionItem value="nutrition" className="border-b-0">
                  <AccordionTrigger className="text-lg font-bold hover:no-underline">Nutritional Facts</AccordionTrigger>
                  <AccordionContent>
                    <div className="bg-muted/30 p-4 rounded-xl text-base text-muted-foreground font-medium leading-relaxed">
                      {product.nutritionFacts}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>
          )}
        </div>
      </div>
    </div>
  );
}

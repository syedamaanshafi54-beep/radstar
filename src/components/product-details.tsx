
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
// import { ScrollArea } from "./ui/scroll-area";
import { ToastAction } from "./ui/toast";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/utils";

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

  const handleAddToCart = () => {
    const amountToAdd = quantity;
    // Check variant stock first, then product stock
    const availableStock = selectedVariant?.stock ?? product.stock;

    // If stock is undefined, allow unlimited (no stock tracking for this product)
    if (availableStock !== undefined) {
      // Check if requested quantity exceeds available stock
      if (cartQty + amountToAdd > availableStock) {
        toast({
          variant: "destructive",
          title: "Insufficient Stock",
          description: `Only ${availableStock} units available. ${Math.max(0, availableStock - cartQty)} more can be added. Contact us for bulk orders.`,
          action: (
            <ToastAction
              altText="Contact on WhatsApp"
              onClick={() => window.open('https://wa.me/919032561974', '_blank')}
            >
              WhatsApp
            </ToastAction>
          ),
        });
        return;
      }
    }

    const success = addToCart(product, amountToAdd, selectedVariant);
    if (!success) {
      toast({
        variant: "destructive",
        title: "Cannot Add to Cart",
        description: "Stock limit reached. Please reduce quantity.",
      });
      return;
    }

    toast({
      title: "Added to cart",
      description: `${amountToAdd} x ${product.name} ${selectedVariant ? `(${selectedVariant.name})` : ""
        } has been added.`,
      duration: 5000,
      action: (
        <ToastAction altText="View Cart" onClick={() => router.push("/cart")}>
          View Cart
        </ToastAction>
      ),
    });
    // Reset quantity after adding
    setQuantity(1);
  };

  const handleGoToCart = () => {
    router.push('/cart');
  };

  const handleQuantityChange = (change: number) => {
    const newQty = Math.max(1, quantity + change);
    // Check variant stock first, then product stock
    const availableStock = selectedVariant?.stock ?? product.stock;

    // If stock is defined, validate against it
    if (availableStock !== undefined && newQty > availableStock) {
      toast({
        variant: "destructive",
        title: "Stock Limit Reached",
        description: `Only ${availableStock} units available. Contact us for bulk orders.`,
        action: (
          <ToastAction
            altText="Contact on WhatsApp"
            onClick={() => window.open('https://wa.me/919032561974', '_blank')}
          >
            WhatsApp
          </ToastAction>
        ),
      });
      return;
    }

    setQuantity(newQty);
  };

  const handleVariantChange = (variantId: string) => {
    const variant = product.variants?.find((v) => v.id === variantId);
    setSelectedVariant(variant);
  };

  const price = selectedVariant?.price ?? product.defaultPrice;
  const salePrice = selectedVariant?.salePrice ?? product.salePrice;

  // Check if product is in cart
  const cartItemId = selectedVariant ? `${product.id}-${selectedVariant.id}` : product.id;
  const cartQty = getCartQuantity(cartItemId);

  return (
    <div className="flex flex-col md:grid md:grid-cols-2 h-full md:h-auto min-h-0 bg-background">
      {/* Top Section (Mobile) / Left Column (Desktop) */}
      <div className="flex flex-col h-[50%] md:h-auto flex-shrink-0 overflow-hidden p-4 md:p-8 md:pt-0 relative border-b md:border-b-0 border-border/50">

        {/* Image Area - Flexible height on mobile to fit remaining space */}
        <div className="relative flex-1 min-h-0 w-full mb-2 md:mb-6 rounded-lg overflow-hidden md:aspect-square md:flex-none">
          <Image
            src={product.image.url}
            alt={product.name}
            fill
            className="object-contain md:object-cover hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, 50vw"
            data-ai-hint={product.image.hint}
            priority
          />
        </div>

        {/* Product Info - Fixed at bottom of top section on mobile */}
        <div className="space-y-3 mt-auto pt-0 px-0 md:px-0 bg-background shrink-0">
          <h1 className="font-headline text-2xl md:text-4xl font-bold tracking-tight">{product.name}</h1>

          <div className="flex items-baseline gap-2">
            {salePrice ? (
              <>
                <p className="text-2xl md:text-3xl font-bold text-destructive">
                  <span className="font-currency">₹</span>
                  {formatPrice(salePrice)}
                </p>
                <p className="text-lg md:text-xl text-muted-foreground line-through">
                  <span className="font-currency">₹</span>
                  {formatPrice(price)}
                </p>
              </>
            ) : (
              <p className="text-2xl md:text-3xl font-bold text-primary">
                <span className="font-currency">₹</span>
                {formatPrice(price)}
              </p>
            )}
          </div>

          {product.variants && product.variants.length > 0 && (
            <div>
              <Label htmlFor="product-variant" className="text-base font-semibold mb-2 block">
                Size:
              </Label>
              <Select
                onValueChange={handleVariantChange}
                defaultValue={selectedVariant?.id}
              >
                <SelectTrigger
                  id="product-variant"
                  className="w-full md:w-[200px] h-11 text-base"
                >
                  <SelectValue placeholder="Select a size" />
                </SelectTrigger>
                <SelectContent>
                  {product.variants.map((v) => (
                    <SelectItem key={v.id} value={v.id} className="text-base">
                      {v.name} - <span className="font-currency">₹</span>
                      {formatPrice(v.salePrice || v.price)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 pt-2">
            <div className="flex items-center border rounded-md w-full md:w-auto">
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 md:h-11 md:w-11"
                onClick={() => handleQuantityChange(-1)}
                disabled={quantity <= 1}
              >
                <Minus className="h-5 w-5" />
              </Button>

              <Input
                type="number"
                value={quantity}
                onChange={(e) =>
                  setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                }
                className="w-full md:w-20 h-10 md:h-11 text-center border-0 focus-visible:ring-0 text-lg font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />

              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 md:h-11 md:w-11"
                onClick={() => handleQuantityChange(1)}
              >
                <Plus className="h-5 w-5" />
              </Button>
            </div>

            {cartQty > 0 ? (
              <Button
                size="lg"
                className="flex-1 h-10 md:h-11 text-base w-full"
                onClick={handleGoToCart}
              >
                <ArrowRight className="mr-2 h-5 w-5" /> Go to Cart ({cartQty})
              </Button>
            ) : (
              <Button
                size="lg"
                className="flex-1 h-10 md:h-11 text-base w-full"
                onClick={handleAddToCart}
              >
                <ShoppingCart className="mr-2 h-5 w-5" /> Add to Cart
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section (Mobile) / Right Column (Desktop) */}
      <div className="h-[50%] md:h-auto overflow-y-auto md:overflow-visible overscroll-contain p-4 md:p-8 space-y-6 bg-muted/5 md:bg-transparent">
        <div>
          <h2 className="text-xl md:text-2xl font-bold font-headline mb-3">
            Overview
          </h2>
          <div className="prose prose-base md:prose-lg font-medium text-muted-foreground max-w-none">
            <p>{product.description}</p>
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="text-lg md:text-xl font-bold font-headline mb-3">
            Key Highlights
          </h3>
          <ul className="space-y-2 text-sm">
            {product.benefits.map((benefit) => (
              <li key={benefit} className="flex items-start font-medium">
                <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>

        <Separator />

        {(product.ingredients || product.nutritionFacts) && (
          <Accordion
            type="single"
            collapsible
            className="w-full"
            defaultValue="ingredients"
          >
            {product.ingredients && product.ingredients.length > 0 && (
              <AccordionItem value="ingredients">
                <AccordionTrigger className="text-lg">
                  Ingredients
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="list-disc list-inside text-muted-foreground font-medium text-base">
                    {product.ingredients.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            )}

            {product.nutritionFacts && (
              <AccordionItem value="nutrition">
                <AccordionTrigger className="text-lg">
                  Nutritional Facts
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground font-medium text-base">
                  {product.nutritionFacts}
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
        )}
      </div>
    </div>
  );
}

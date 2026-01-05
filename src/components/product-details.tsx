
"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle, Minus, Plus, ShoppingCart, ArrowRight, Loader2 } from "lucide-react";
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
import { ScrollArea } from "./ui/scroll-area";
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

  // Calculate vendor pricing
  const displayPrice = salePrice || price;
  const vendorPrice = isVendor ? getPrice(displayPrice, product.id, quantity) : displayPrice;
  const vendorDiscount = isVendor ? getDiscount(product.id, quantity) : 0;

  // Check if product is in cart
  const cartItemId = selectedVariant ? `${product.id}-${selectedVariant.id}` : product.id;
  const cartQty = getCartQuantity(cartItemId);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 h-full max-h-full gap-4 md:gap-0 pt-8">
      <div className="flex flex-col space-y-4 p-0 md:p-8 md:pt-0">
        <div className="relative aspect-square rounded-lg overflow-hidden flex-shrink-0">
          <Image
            src={product.image.url}
            alt={product.name}
            fill
            className="object-cover"
            sizes="100vw"
            data-ai-hint={product.image.hint}
          />
        </div>

        <div className="space-y-3 mt-auto pt-4 px-4 md:px-0">
          <h1 className="font-headline text-xl md:text-4xl font-bold tracking-tight">{product.name}</h1>

          <div className="flex flex-col gap-1">
            {isVendor ? (
              <>
                <div className="flex items-baseline gap-2">
                  <p className="text-xl md:text-3xl font-bold text-green-600">
                    <span className="font-currency">₹</span>
                    {formatPrice(vendorPrice)}
                  </p>
                  {(salePrice || price > vendorPrice) && (
                    <p className="text-base md:text-xl text-muted-foreground line-through opacity-70">
                      <span className="font-currency">₹</span>
                      {formatPrice(price)}
                    </p>
                  )}
                </div>
                <Badge variant="secondary" className="w-fit text-[10px] md:text-sm font-semibold tracking-wide py-0.5">💎 PARTNER PRICE ({vendorDiscount}% OFF)</Badge>
              </>
            ) : salePrice ? (
              <div className="flex items-baseline gap-2">
                <p className="text-xl md:text-3xl font-bold text-destructive">
                  <span className="font-currency">₹</span>
                  {formatPrice(salePrice)}
                </p>
                <p className="text-base md:text-xl text-muted-foreground line-through opacity-70">
                  <span className="font-currency">₹</span>
                  {formatPrice(price)}
                </p>
              </div>
            ) : (
              <p className="text-xl md:text-3xl font-bold text-primary">
                <span className="font-currency">₹</span>
                {formatPrice(price)}
              </p>
            )}
          </div>

          {product.variants && product.variants.length > 0 && (
            <div className="pt-1">
              <Label htmlFor="product-variant" className="text-sm font-semibold mb-1.5 block text-muted-foreground">
                Select Size:
              </Label>
              <Select
                onValueChange={handleVariantChange}
                defaultValue={selectedVariant?.id}
              >
                <SelectTrigger
                  id="product-variant"
                  className="w-full md:w-[200px] h-10 text-sm font-medium"
                >
                  <SelectValue placeholder="Select a size" />
                </SelectTrigger>
                <SelectContent>
                  {product.variants.map((v) => (
                    <SelectItem key={v.id} value={v.id} className="text-sm">
                      {v.name} - <span className="font-currency">₹</span>
                      {formatPrice(v.salePrice || v.price)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex flex-row items-center gap-3 pt-3">
            <div className="flex items-center border rounded-lg bg-muted/30 overflow-hidden shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 md:h-11 md:w-11 rounded-none hover:bg-muted"
                onClick={() => handleQuantityChange(-1)}
                disabled={quantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>

              <Input
                type="number"
                value={quantity}
                onChange={(e) =>
                  setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                }
                className="w-12 md:w-16 h-9 md:h-11 text-center border-0 bg-transparent focus-visible:ring-0 text-sm md:text-lg font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none p-0"
              />

              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 md:h-11 md:w-11 rounded-none hover:bg-muted"
                onClick={() => handleQuantityChange(1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {cartQty > 0 ? (
              <Button
                className="flex-1 h-9 md:h-11 font-bold text-sm md:text-base shadow-sm active:scale-[0.98] transition-all"
                onClick={handleGoToCart}
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                Go to Cart ({cartQty})
              </Button>
            ) : (
              <Button
                className="flex-1 h-9 md:h-11 font-bold text-sm md:text-base shadow-sm active:scale-[0.98] transition-all"
                onClick={handleAddToCart}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Add to Cart
              </Button>
            )}
          </div>
        </div>
      </div>

      <ScrollArea className="h-full md:h-auto">
        <div className="space-y-6 p-4 md:p-8">
          <div>
            <h2 className="text-xl md:text-2xl font-bold font-headline mb-3">Overview</h2>
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
      </ScrollArea>
    </div>
  );
}

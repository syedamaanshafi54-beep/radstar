'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import {
  ArrowRight, Eye, ShoppingCart, Minus, Plus, Sparkles, Loader2, Info,
  Star, MessageSquare, Star as StarIcon
} from 'lucide-react';
import Autoplay from "embla-carousel-autoplay";
import type { Product, ProductVariant } from "@/lib/types";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog';
import ProductDetails from '@/components/product-details';
import { motion } from 'framer-motion';
import { useCart } from '@/context/cart-context';
import { useToast } from '@/hooks/use-toast';
import { WithId, useCollection, useFirestore, useMemoFirebase, useDoc, useUser } from '@/firebase';
import { collection, doc, query, where } from 'firebase/firestore';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { DealPopup } from '@/components/deal-popup';
import { DealBanner } from '@/components/deal-banner';
import { useRouter, usePathname } from 'next/navigation';
import { ToastAction } from '@/components/ui/toast';
import { formatPrice } from '@/lib/utils';
import { staticProducts } from '@/data/static-products';
import { Review } from '@/lib/types/reviews';
import ProductReviews from '@/components/product-reviews';
import GlobalLoader from "@/components/GlobalLoader";
import { getAuth, signOut } from "firebase/auth";
import { Input } from '@/components/ui/input';

type HeroSlide = {
  id: string;
  imageUrl: string;
  imageHint: string;
  headline: string;
  tagline: string;
  cta: string;
  link: string;
  slug?: string;
};

const staticHeroSlides: HeroSlide[] = [
  {
    id: 'hero-talbina',
    imageUrl: '/images/aslitalbina/r2.jpg',
    imageHint: 'talbina product lifestyle',
    headline: 'Asli Talbina',
    tagline: 'The Original Taste of Wellness',
    cta: 'Discover Talbina',
    link: '/#Asli-Talbina',
    slug: 'talbina-regular'
  },
  {
    id: 'hero-honey',
    imageUrl: "/images/aslitalbina/asli honey/AH.jpg",
    imageHint: 'honey product lifestyle',
    headline: 'Wild Natural Honey',
    tagline: 'Pure, Raw, and Unprocessed',
    cta: 'Explore Honey',
    link: "/#King's-Asli-Honey",
    slug: "kings-asli-honey"
  },
];

type HeroSlidesData = {
  slides: HeroSlide[];
};


const hadithPlacards = [
  {
    id: 'hadith-talbina',
    text: "Narrated 'Aisha: (the wife of the Prophet) ... I heard Allah's Apostle saying, 'The Talbina soothes the heart of the patient and relieves him from some of his sadness.'",
    source: 'Sahih al-Bukhari 5417',
  },
  {
    id: 'hadith-honey',
    text: 'The Prophet (ﷺ) said: "Honey is a remedy for every illness and the Qur\'an is a remedy for all illness of the mind, therefore I recommend to you both remedies, the Qur\'an and honey."',
    source: 'Sahih al-Bukhari 5684',
  },
  {
    id: 'quran-pure-food',
    text: '"O mankind, eat from whatever is on earth [that is] lawful and good and do not follow the footsteps of Satan. Indeed, he is to you a clear enemy."',
    source: 'Quran, Al-Baqarah [2:168]',
  },
  {
    id: 'hadith-barley',
    text: "Aisha (RA) said: 'When a member of her family was ill, she would order that barley soup (Talbina) be made, and she would say: 'It will cleanse his heart and relieve him of some of his grief.'",
    source: 'Sunan Ibn Majah',
  },
  {
    id: 'quran-honey',
    text: '"There emerges from their bellies a drink, varying in colors, in which there is healing for people. Indeed in that is a sign for a people who give thought."',
    source: 'Quran, An-Nahl [16:69]',
  },
  {
    id: 'hadith-moderation',
    text: 'The Prophet (ﷺ) said: "No man fills a container worse than his own stomach. A few morsels are enough for the son of Adam to keep his back straight. But if it is unavoidable, then one-third for his food, one-third for his drink, and one-third for his breath."',
    source: 'Jami` at-Tirmidhi 2380'
  }
]

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

type DealsData = {
  productIds: string[];
}


export default function Home() {
  const plugin = React.useRef(
    Autoplay({ delay: 4000, stopOnInteraction: false })
  );

  const hadithPlugin = React.useRef(
    Autoplay({ delay: 5000, stopOnInteraction: false })
  );

  const [api, setApi] = React.useState<CarouselApi>()
  const [current, setCurrent] = React.useState(0)

  const firestore = useFirestore();
  const productsCollection = useMemoFirebase(() => collection(firestore, 'products'), [firestore]);
  const { data: firestoreProducts, isLoading: productsLoading } = useCollection<Product>(productsCollection, { listen: false });

  const dealsDocRef = useMemoFirebase(() => doc(firestore, 'site-config', 'dealsOfTheDay'), [firestore]);
  const { data: dealsData, isLoading: dealsLoading } = useDoc<DealsData>(dealsDocRef);

  const heroSlidesDocRef = useMemoFirebase(() => doc(firestore, 'site-config', 'heroSlides'), [firestore]);
  const { data: heroSlidesData, isLoading: heroSlidesLoading } = useDoc<HeroSlidesData>(heroSlidesDocRef);


  const products = (firestoreProducts && firestoreProducts.length > 0) ? firestoreProducts : staticProducts;

  const productsByCategory = products.reduce((acc, product) => {
    const category = product.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(product as WithId<Product>);
    return acc;
  }, {} as Record<string, WithId<Product>[]>);


  const dealProducts = React.useMemo(() => {
    if (dealsLoading || productsLoading || !products) return [];

    if (!dealsData || !dealsData.productIds || dealsData.productIds.length === 0) {
      return products.filter(p => p.salePrice || (p.variants && p.variants.some(v => v.salePrice)));
    }

    const dealIdSet = new Set(dealsData.productIds);
    return products.filter(p => dealIdSet.has(p.id) && (p.salePrice || (p.variants && p.variants.some(v => v.salePrice))));

  }, [products, dealsData, dealsLoading, productsLoading]);

  const heroSlides = React.useMemo(() => {
    if (heroSlidesLoading) return staticHeroSlides;
    if (!heroSlidesData || !heroSlidesData.slides || heroSlidesData.slides.length === 0) {
      return staticHeroSlides;
    }
    return heroSlidesData.slides;
  }, [heroSlidesData, heroSlidesLoading]);

  React.useEffect(() => {
    if (!api) {
      return
    }

    setCurrent(api.selectedScrollSnap())

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap())
    })
  }, [api])

  React.useEffect(() => {
    if (productsLoading) return;
    const hash = window.location.hash;
    if (!hash) return;

    setTimeout(() => {
      const e1 = document.querySelector(hash);
      if (e1) {
        e1.scrollIntoView({
          behavior: 'smooth'
        });
      }
    }, 300);
  }, [productsLoading]);


  return (
    <div className="flex flex-col bg-background">
      <DealPopup />
      <div>
        <Carousel
          setApi={setApi}
          plugins={[plugin.current]}
          className="w-full"
          opts={{
            loop: true,
          }}
        >
          <CarouselContent>
            {heroSlides.map((slide) => (
              <CarouselItem key={slide.id}>
                <div className="relative w-full h-[70vh] sm:h-[80vh] md:h-[90vh] text-white flex items-center justify-center">

                  <Image
                    src={slide.imageUrl}
                    alt={slide.headline}
                    fill
                    className="object-cover"
                    priority={slide.id === 'hero-talbina' || slide.slug === 'talbina-regular'}
                    data-ai-hint={slide.imageHint}
                    sizes="100vw"
                  />
                  <div className="absolute inset-0 bg-black/40" />
                  <div className="relative z-10 text-center flex flex-col items-center p-4">
                    <motion.div
                      key={slide.id} // Add a key to ensure re-animation on slide change
                      initial="initial"
                      whileInView="animate"
                      viewport={{ once: false }}
                      variants={staggerContainer}
                      className="flex flex-col items-center"
                    >
                      <motion.h1
                        className="text-sm xs:text-base sm:text-lg md:text-2xl font-bold tracking-widest uppercase"
                        variants={fadeInUp}
                      >
                        {slide.tagline}
                      </motion.h1>

                      <motion.h2
                        className="mt-2 md:mt-4 font-headline text-4xl xs:text-5xl sm:text-6xl md:text-8xl lg:text-9xl font-black leading-tight"
                        variants={fadeInUp}
                      >
                        {slide.headline}
                      </motion.h2>

                      <motion.div
                        className="w-16 xs:w-20 sm:w-24 h-1 sm:h-1.5 bg-primary my-3 sm:my-4 md:my-8"
                        variants={fadeInUp}
                      ></motion.div>

                      <motion.div variants={fadeInUp}>
                        <Button
                          asChild
                          size="sm"
                          className="text-sm xs:text-base md:text-xl font-extrabold px-4 py-2 md:px-6 md:py-4"
                        >
                          <Link href={slide.link} scroll={true}>{slide.cta}</Link>
                        </Button>
                      </motion.div>

                    </motion.div>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="absolute bottom-4 sm:bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
            {heroSlides.map((_, index) => (
              <button
                key={index}
                onClick={() => api?.scrollTo(index)}
                className={`w-2 h-2 md:w-3 md:h-3 rounded-full transition-colors ${index === current ? 'bg-primary' : 'bg-white/50 hover:bg-white/75'
                  }`}
              />
            ))}
          </div>
        </Carousel>
      </div>

      <div id="hero-section-end"></div>
      <DealBanner />

      {/* Main Content Sections */}
      <div id="main-content" className="bg-background relative z-20">
        <section id="products" className="py-8 md:py-16 pt-8">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, amount: 0.2 }}
            variants={staggerContainer}
            className="container mx-auto text-center mb-8 md:mb-10"
          >
            <motion.h2 variants={fadeInUp} className="font-headline text-4xl md:text-6xl font-bold">Discover Our Collection</motion.h2>
            <motion.p variants={fadeInUp} className="mt-4 text-lg md:text-xl font-bold text-muted-foreground max-w-2xl mx-auto">From the nourishing tradition of Talbina to the purity of Wild Honey.</motion.p>
          </motion.div>
          <div className="container mx-auto space-y-12 md:space-y-16">
            {productsLoading && (
              <div className="flex min-h-[40vh] items-center justify-center">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
              </div>
            )}
            {!productsLoading && Object.entries(productsByCategory).map(([category, categoryProducts]) => (
              <div key={category} id={category.replace(/\s+/g, '-')}>
                <motion.h3
                  variants={fadeInUp}
                  className="font-headline text-4xl md:text-5xl font-bold text-center mb-6 md:mb-8"
                  initial="initial"
                  whileInView="animate"
                  viewport={{ once: true, amount: 0.5 }}
                >
                  {category}
                </motion.h3>
                <motion.div
                  initial="initial"
                  whileInView="animate"
                  viewport={{ once: true, amount: 0.1 }}
                  variants={staggerContainer}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8"
                >
                  {categoryProducts.map((product) => (
                    <motion.div variants={fadeInUp} key={product.id}>
                      <ProductCard product={product} isDeal={!!dealProducts.find(p => p.id === product.id)} />
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section id="hadith-placards" className="bg-gradient-to-b from-secondary/30 to-background py-16 md:py-24 relative overflow-hidden">
        {/* Decorative Islamic Pattern Background */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 35px, currentColor 35px, currentColor 36px),
                             repeating-linear-gradient(-45deg, transparent, transparent 35px, currentColor 35px, currentColor 36px)`
          }}></div>
        </div>

        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, amount: 0.2 }}
          variants={staggerContainer}
          className="container mx-auto text-center mb-12 md:mb-16 relative z-10"
        >
          <motion.div variants={fadeInUp} className="inline-block">
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="h-px w-12 bg-gradient-to-r from-transparent to-primary"></div>
              <div className="text-primary text-2xl">☪</div>
              <div className="h-px w-12 bg-gradient-to-l from-transparent to-primary"></div>
            </div>
          </motion.div>
          <motion.h2 variants={fadeInUp} className="font-headline text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary via-foreground to-primary bg-clip-text text-transparent">
            Echoes of Wisdom
          </motion.h2>
          <motion.p variants={fadeInUp} className="mt-4 text-lg md:text-xl font-semibold text-muted-foreground max-w-2xl mx-auto">
            Timeless guidance on healing and nourishment from the Quran and Sunnah
          </motion.p>
        </motion.div>

        <div className="container mx-auto relative z-10">
          <Carousel
            plugins={[hadithPlugin.current]}
            className="w-full"
            opts={{
              loop: true,
            }}
          >
            <CarouselContent>
              {hadithPlacards.map((slide) => (
                <CarouselItem key={slide.id}>
                  <div className="p-2 md:p-4">
                    <Card className="w-full bg-background/95 backdrop-blur shadow-2xl border-2 border-primary/30 relative overflow-hidden">
                      {/* Corner Ornaments */}
                      <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 border-primary/40 rounded-tl-lg"></div>
                      <div className="absolute top-0 right-0 w-16 h-16 border-t-4 border-r-4 border-primary/40 rounded-tr-lg"></div>
                      <div className="absolute bottom-0 left-0 w-16 h-16 border-b-4 border-l-4 border-primary/40 rounded-bl-lg"></div>
                      <div className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 border-primary/40 rounded-br-lg"></div>

                      <CardContent className="p-8 md:p-12 lg:p-16 text-center flex flex-col items-center justify-center min-h-[400px]">
                        <div className="text-primary/20 text-6xl mb-4">"</div>
                        <blockquote className="font-headline text-lg md:text-2xl lg:text-3xl italic text-foreground leading-relaxed max-w-4xl">
                          {slide.text}
                        </blockquote>
                        <div className="text-primary/20 text-6xl mt-4 rotate-180">"</div>
                        <div className="mt-8 pt-6 border-t-2 border-primary/20 w-full max-w-md">
                          <p className="text-sm md:text-base lg:text-lg font-bold tracking-wide text-primary">
                            — {slide.source}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>
      </section>

      <section id="legacy" className="py-12 md:py-16 bg-background">
        <div className="container mx-auto">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, amount: 0.3 }}
            variants={staggerContainer}
            className="grid md:grid-cols-2 items-center gap-8 lg:gap-16">
            <motion.div variants={fadeInUp} className="order-2 md:order-1 relative aspect-square rounded-2xl overflow-hidden shadow-lg">
              <Image
                src={'/images/aslitalbina/lc.jpg'}
                alt="A legacy of healing and tradition"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
                data-ai-hint="ancient script healing"
              />
            </motion.div>
            <motion.div variants={fadeInUp} className="order-1 md:order-2 text-left">
              <h2 className="font-headline text-4xl md:text-6xl font-bold">A Legacy of Healing</h2>
              <p className="mt-4 text-lg md:text-xl font-bold text-muted-foreground">
                Our products are rooted in the timeless wisdom of the Sunnah, offering natural remedies and nourishment that have been trusted for centuries. We bring these traditions to your modern life.
              </p>
              <Button asChild variant="link" className="px-0 mt-4 text-lg md:text-xl font-bold">
                <Link href="/quality">Our Commitment to Purity <ArrowRight className="ml-2" /></Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section id="about" className="py-12 md:py-16 bg-secondary/30">
        <div className="container mx-auto">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, amount: 0.3 }}
            variants={staggerContainer}
            className="grid md:grid-cols-2 items-center gap-8 lg:gap-16">
            <motion.div variants={fadeInUp} className="order-1 md:order-2 text-left">
              <h2 className="font-headline text-4xl md:text-6xl font-bold">The Rad Star Story</h2>
              <p className="mt-4 text-lg md:text-xl font-bold text-muted-foreground">
                Founded on principles of integrity and trust, Rad Star Trading is dedicated to bringing you the highest quality natural products. Our journey is one of passion for wellness and commitment to our community.
              </p>
              <Button asChild variant="link" className="px-0 mt-4 text-lg md:text-xl font-bold">
                <Link href="/about">Discover Our Journey <ArrowRight className="ml-2" /></Link>
              </Button>
            </motion.div>
            <motion.div variants={fadeInUp} className="order-2 md:order-1 relative aspect-square rounded-2xl overflow-hidden shadow-lg">
              <Image
                src={'/images/aslitalbina/rss.png'}
                alt="Founder of Rad Star Trading"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
                data-ai-hint="founder portrait"
              />
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

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

function ProductCard({ product, isDeal }: { product: WithId<Product>, isDeal?: boolean }) {
  const { cartItems, addToCart, updateQuantity } = useCart();
  const { toast } = useToast();
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(
    product.variants?.find(v => v.price === product.defaultPrice) || product.variants?.[0]
  );

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
    setQuantity(1); // Reset quantity when variant changes
  }

  const price = selectedVariant?.price ?? product.defaultPrice;
  const salePrice = selectedVariant?.salePrice ?? product.salePrice;


  return (
    <Dialog>
      <Card className="overflow-hidden group flex flex-col h-full rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300">
        <CardContent className="p-0 flex-1 flex flex-col">
          <div className="block relative w-full aspect-square overflow-hidden group/img">
            {isDeal && (salePrice || (product.variants && product.variants.some(v => v.salePrice))) && <Badge className="absolute top-2 right-2 z-10 bg-destructive font-bold text-base">Deal</Badge>}
            <StarRating productId={product.id} />

            {/* Review Shortcut Overlay */}
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
            <p className="mt-2 text-muted-foreground text-base flex-1 text-left">{product.tagline}</p>

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
            ) : null
            }

            <div className="flex flex-wrap justify-between items-center mt-4 gap-2">
              <div className="flex items-baseline gap-2">
                {salePrice ? (
                  <>
                    <p className="text-2xl font-bold text-destructive"><span className="font-currency">₹</span>{formatPrice(salePrice)}</p>
                    <p className="text-base text-muted-foreground line-through"><span className="font-currency">₹</span>{formatPrice(price)}</p>
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
      <DialogContent className="max-w-4xl w-full p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>{product.name}</DialogTitle>
          <DialogDescription>Details for {product.name}</DialogDescription>
        </DialogHeader>
        <ProductDetails product={product} />
      </DialogContent>
    </Dialog>
  );
}

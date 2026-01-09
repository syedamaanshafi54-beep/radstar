
'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Menu,
  User,
  LogOut,
  Shield,
  Sprout,
  ChevronDown,
} from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { useMemo } from 'react';
import CartIcon from '@/components/cart-icon';
import { cn } from '@/lib/utils';
import { usePathname, useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useUser } from '@/firebase';
import { getAuth, signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { LoginForm } from '@/components/login-form';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';

const storyLinks = [
  { href: '/about', label: 'Our Story' },
  { href: '/quality', label: 'Quality' },
];

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const pathname = usePathname();
  const { user, claims, isUserLoading } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  const isMobile = useIsMobile();
  const [hasMounted, setHasMounted] = useState(false);

  const [productsOpen, setProductsOpen] = useState(false);
  const [storyOpen, setStoryOpen] = useState(false);
  const productsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const storyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const firestore = useFirestore();
  const categoriesCollection = useMemoFirebase(() => collection(firestore, 'categories'), [firestore]);
  const { data: firestoreCategories } = useCollection<any>(categoriesCollection, { listen: true });

  const productCategories = useMemo(() => {
    if (firestoreCategories && firestoreCategories.length > 0) {
      return firestoreCategories
        .filter((cat: any) => cat.isActive !== false)
        .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
        .map((cat: any) => ({
          href: `/#${(cat.slug || cat.name).replace(/\s+/g, '-')}`,
          label: cat.name
        }));
    }
    return [];
  }, [firestoreCategories]);


  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) setIsScrolled(true);
      else setIsScrolled(false);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (!isUserLoading && user && isLoginOpen) {
      setIsLoginOpen(false);
    }
  }, [user, isUserLoading, isLoginOpen]);

  const handleSignOut = async () => {
    const auth = getAuth();
    try {
      await signOut(auth);
      toast({
        title: 'Signed Out',
        description: 'You have been successfully signed out.',
      });
      router.push('/');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error signing out',
        description: error.message,
      });
    }
  };

  const isAdmin =
    user?.email === 'itsmeabdulk@gmail.com';

  const headerClasses = cn(
    'sticky z-50 transition-all duration-300',
    isScrolled ? 'top-3' : 'top-12'
  );




  const innerHeaderClasses = cn(
    'flex items-center justify-between bg-[hsl(var(--primary-alt))] px-4 sm:px-6 rounded-full transition-all duration-300',
    isScrolled
      ? 'h-14 shadow-xl'
      : 'h-16 shadow-lg'
  );


  const navLinkClasses = "relative text-2xl font-bold text-primary-nav-foreground focus:outline-none after:content-[''] after:absolute after:left-1/2 after:bottom-0 after:h-0.5 after:bg-primary-nav-foreground after:w-0 after:transition-all after:duration-300 hover:after:w-full hover:after:left-0 px-8 py-2 flex items-center gap-2";

  const handleMouseEnter = (menu: 'products' | 'story') => {
    if (menu === 'products') {
      if (productsTimeoutRef.current) clearTimeout(productsTimeoutRef.current);
      setProductsOpen(true);
    } else {
      if (storyTimeoutRef.current) clearTimeout(storyTimeoutRef.current);
      setStoryOpen(true);
    }
  };

  const handleMouseLeave = (menu: 'products' | 'story') => {
    const timeout = setTimeout(() => {
      if (menu === 'products') {
        setProductsOpen(false);
      } else {
        setStoryOpen(false);
      }
    }, 200); // 200ms delay

    if (menu === 'products') {
      productsTimeoutRef.current = timeout;
    } else {
      storyTimeoutRef.current = timeout;
    }
  };

  return (
    <div className={headerClasses}>
      <div className="container mx-auto px-0 md:px-4">
        <header className={innerHeaderClasses}>
          <div className="flex md:hidden w-full items-center justify-between gap-2">
            {hasMounted && isMobile ? (
              <>
                <Sheet
                  open={isMobileMenuOpen}
                  onOpenChange={setIsMobileMenuOpen}
                >
                  <SheetTrigger asChild>
                    <Button variant="ghost" className="w-10 h-10 p-0 text-primary-nav-foreground hover:bg-black/10">
                      <Menu className="h-6 w-6" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent
                    side="left"
                    className="w-full max-w-sm bg-background text-foreground p-6 rounded-r-2xl shadow-2xl border-l border-border"
                  >
                    <SheetHeader className="pb-0 mb-0 border-b">
                      <SheetTitle className="flex items-center gap-3 text-2xl font-headline font-bold">
                        <Sprout className="h-7 w-7 text-primary" />
                        <span>Menu</span>
                      </SheetTitle>
                    </SheetHeader>
                    <div className="flex flex-col h-full pt-4 pb-4 overflow-y-auto gap-3">
                      <Link
                        href="/"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex flex-col items-center gap-2 text-center"
                      >
                        <div className="relative h-16 w-16 rounded-full shadow-md p-2 bg-white">
                          <Image src="/logos/2.png" alt="Rad Star Trading Logo" fill className="object-contain" />
                        </div>
                        <span className="font-headline text-3xl font-bold tracking-wide">
                          Rad Star Trading
                        </span>
                      </Link>
                      <Accordion type="single" collapsible className="w-full mt-4">
                        <AccordionItem value="products">
                          <AccordionTrigger className="text-lg font-semibold px-4 py-3 bg-muted/30 rounded-xl">
                            Products
                          </AccordionTrigger>
                          <AccordionContent className="pl-4 pt-2 flex flex-col gap-2">
                            {productCategories.map((item) => (
                              <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="text-base bg-muted px-3 py-2 rounded-lg hover:bg-primary/10 transition"
                              >
                                {item.label}
                              </Link>
                            ))}
                          </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="our-story">
                          <AccordionTrigger className="text-lg font-semibold px-4 py-3 bg-muted/30 rounded-xl">
                            Our Story
                          </AccordionTrigger>
                          <AccordionContent className="pl-4 pt-2 flex flex-col gap-2">
                            {storyLinks.map((item) => (
                              <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="text-base bg-muted px-3 py-2 rounded-lg hover:bg-primary/10 transition"
                              >
                                {item.label}
                              </Link>
                            ))}
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                      <Link
                        href="/contact"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="text-lg font-semibold bg-muted/30 px-4 py-3 rounded-xl hover:bg-primary/10 transition"
                      >
                        Contact
                      </Link>
                      {isAdmin && (
                        <Link
                          href="/admin"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="text-lg font-semibold bg-muted/30 px-4 py-3 rounded-xl hover:bg-primary/10 transition"
                        >
                          Admin Dashboard
                        </Link>
                      )}
                    </div>
                  </SheetContent>
                </Sheet>
                <Link href="/" className="flex items-center gap-1 min-w-0">
                  <div className="relative h-10 w-10">
                    <Image src="/logos/2.png" alt="Rad Star Trading Logo" fill className="object-contain" />
                  </div>
                  <span className="font-headline text-lg font-bold text-primary-nav-foreground truncate">
                    Rad Star Trading
                  </span>
                </Link>
                <div className="flex items-center gap-1">
                  <Link href="/cart">
                    <Button variant="ghost" className="w-10 h-10 p-0 text-primary-nav-foreground hover:bg-black/10 rounded-full">
                      <CartIcon />
                    </Button>
                  </Link>
                  {!isUserLoading && (user ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="w-10 h-10 p-0 rounded-full text-primary-nav-foreground hover:bg-black/10">
                          <User className="h-6 w-6" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href="/account">My Account</Link>
                        </DropdownMenuItem>
                        {isAdmin && (
                          <DropdownMenuItem asChild>
                            <Link href="/admin">
                              <Shield className="mr-2 h-4 w-4" />
                              Admin Dashboard
                            </Link>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                          <LogOut className="mr-2 h-4 w-4" />
                          Sign Out
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <Dialog open={isLoginOpen} onOpenChange={setIsLoginOpen}>
                      <DialogTrigger asChild>
                        <Button variant="ghost" className="w-10 h-10 p-0 rounded-full text-primary-nav-foreground hover:bg-black/10">
                          <User className="h-6 w-6" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md p-4 sm:p-5 rounded-xl">
                        <DialogHeader className="p-0 mb-3 text-left">
                          <DialogTitle>Login</DialogTitle>
                          <DialogDescription>Log in to your account to continue.</DialogDescription>
                        </DialogHeader>
                        <LoginForm onSuccess={() => setIsLoginOpen(false)} />
                      </DialogContent>
                    </Dialog>
                  ))}
                </div>
              </>
            ) : null}
          </div>

          {hasMounted && !isMobile && (
            <div
              className={cn(
                'flex w-full items-center justify-between',
              )}
            >
              <div className="flex items-center gap-3">
                <Link
                  href="/"
                  className="flex items-center gap-2 md:gap-3"
                >
                  <div className="relative h-16 w-16">
                    <Image
                      src="/logos/2.png"
                      alt="Rad Star Trading Logo"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <span className="font-headline text-3xl font-bold text-primary-nav-foreground">
                    Rad Star Trading
                  </span>
                </Link>
              </div>

              <nav className="flex items-center justify-center gap-2">
                <div className="relative" onMouseEnter={() => handleMouseEnter('products')} onMouseLeave={() => handleMouseLeave('products')}>
                  <Link href="/products" className={navLinkClasses}>
                    Products
                    <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", productsOpen && "rotate-180")} />
                  </Link>
                  <div
                    className={cn(
                      "absolute top-full left-1/2 -translate-x-1/2 mt-2 w-56 origin-top rounded-2xl bg-[#51B353] text-white shadow-lg backdrop-blur-sm ring-1 ring-black ring-opacity-5 transition-all duration-200 ease-out",
                      productsOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
                    )}
                  >
                    <div className="p-2">
                      <Link href="/products" scroll={true} className="block text-xl font-bold cursor-pointer rounded-lg transition-all duration-200 hover:pl-5 px-3 py-2 hover:bg-primary-foreground/20">All Products</Link>
                      {productCategories.map((category) => (
                        <Link key={category.href} href={category.href} scroll={true} className="block text-xl font-bold cursor-pointer rounded-lg transition-all duration-200 hover:pl-5 px-3 py-2 hover:bg-primary-foreground/20">
                          {category.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="relative" onMouseEnter={() => handleMouseEnter('story')} onMouseLeave={() => handleMouseLeave('story')}>
                  <Link href="/about" className={navLinkClasses}>
                    Our Story
                    <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", storyOpen && "rotate-180")} />
                  </Link>
                  <div
                    className={cn(
                      "absolute top-full left-1/2 -translate-x-1/2 mt-2 w-56 origin-top rounded-2xl bg-[#51B353] text-white shadow-lg backdrop-blur-sm ring-1 ring-black ring-opacity-5 transition-all duration-200 ease-out",
                      storyOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
                    )}
                  >
                    <div className="p-2">
                      {storyLinks.map(({ href, label }) => (
                        <Link key={href} href={href} className="block text-xl font-bold cursor-pointer rounded-lg transition-all duration-200 hover:pl-5 px-3 py-2 hover:bg-primary-foreground/20">{label}</Link>
                      ))}
                    </div>
                  </div>
                </div>

                <Link href="/contact" className={navLinkClasses}>Contact</Link>
                <Link href="/faq" className={navLinkClasses}>FAQ</Link>
              </nav>
              <div className="flex items-center gap-2">
                <Link href="/cart">
                  <Button
                    variant="ghost"
                    className="w-12 h-12 p-0 rounded-full text-primary-nav-foreground hover:bg-black/10"
                  >
                    <CartIcon />
                  </Button>
                </Link>
                {!isUserLoading &&
                  (user ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="w-12 h-12 p-0 rounded-full text-primary-nav-foreground hover:bg-black/10"
                        >
                          <User className="h-6 w-6" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href="/account">My Account</Link>
                        </DropdownMenuItem>
                        {isAdmin && (
                          <DropdownMenuItem asChild>
                            <Link href="/admin">
                              <Shield className="mr-2 h-4 w-4" />
                              Admin Dashboard
                            </Link>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={handleSignOut}
                          className="text-destructive"
                        >
                          <LogOut className="mr-2 h-4 w-4" />
                          Sign Out
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <Dialog
                      open={isLoginOpen}
                      onOpenChange={setIsLoginOpen}
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          className="w-12 h-12 p-0 rounded-full text-primary-nav-foreground hover:bg-black/10"
                        >
                          <User className="h-6 w-6" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md p-4 sm:p-5 rounded-xl">
                        <DialogHeader className="p-0 mb-3 text-left">
                          <DialogTitle>Login</DialogTitle>
                          <DialogDescription>Log in to your account to continue.</DialogDescription>
                        </DialogHeader>
                        <LoginForm
                          onSuccess={() => setIsLoginOpen(false)}
                        />
                      </DialogContent>
                    </Dialog>
                  ))}
              </div>
            </div>
          )}
        </header>
      </div>
    </div>
  );
}

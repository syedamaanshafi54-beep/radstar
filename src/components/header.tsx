'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
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
  ChevronDown,
  LogOut,
  Shield,
  Sprout,
} from 'lucide-react';
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
import { ScrollArea } from './ui/scroll-area';

// ✅ NEW — accordion imports
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';

const storyLinks = [
  { href: '/about', label: 'Our Story' },
  { href: '/quality', label: 'Quality' },
  { href: '/faq', label: 'FAQ' },
];

const productCategories = [
  { href: '/#Asli-Talbina', label: 'Asli Talbina' },
  { href: '/#Toast', label: 'Toast' },
  { href: "/#King's-Asli-Honey", label: "King's Asli Honey" },
  { href: '/#Shilajit', label: 'Shilajit' },
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
    claims?.role === 'admin' ||
    user?.email === 'itsmeabdulk@gmail.com';

  const headerClasses = cn(
    'sticky z-40 transition-all duration-500 ease-in-out',
    isScrolled ? 'top-0' : 'top-12'
  );

  const innerHeaderClasses =
    'flex h-16 items-center justify-between bg-[hsl(var(--primary-alt))] px-4 sm:px-6 transition-all duration-300 rounded-full shadow-lg';

  return (
    <div className={headerClasses}>
      <div className="container mx-auto px-0 md:px-4">
        <header className={innerHeaderClasses}>

          {/* -------------------------------------------------- */}
          {/* 📱 MOBILE HEADER SECTION — CHANGED HERE ONLY ✔✔✔ */}
          {/* -------------------------------------------------- */}
          <div className="flex md:hidden w-full items-center justify-between gap-2">

            {/* LEFT — MENU BUTTON */}
            <div className={cn(!hasMounted && 'invisible')}>
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

                    {/* LOGO */}
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

                    {/* === MOBILE ACCORDIONS START === */}
                    <Accordion type="single" collapsible className="w-full mt-4">

                      {/* PRODUCTS DROPDOWN */}
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

                      {/* OUR STORY DROPDOWN */}
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

                    {/* CONTACT */}
                    <Link
                      href="/contact"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-lg font-semibold bg-muted/30 px-4 py-3 rounded-xl hover:bg-primary/10 transition"
                    >
                      Contact
                    </Link>

                    {/* ADMIN */}
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
            </div>

            {/* CENTER — LOGO */}
            <Link href="/" className="flex items-center gap-1 min-w-0">
              <div className="relative h-10 w-10">
                <Image src="/logos/2.png" alt="Rad Star Trading Logo" fill className="object-contain" />
              </div>
              <span className="font-headline text-lg font-bold text-primary-nav-foreground truncate">
                Rad Star Trading
              </span>
            </Link>

            {/* RIGHT — CART + USER */}
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
                    {isAdmin && (
                      <>
                        <DropdownMenuItem asChild>
                          <Link href="/admin">
                            <Shield className="mr-2 h-4 w-4" />
                            Admin Dashboard
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    <DropdownMenuItem asChild>
                      <Link href="/account">My Account</Link>
                    </DropdownMenuItem>
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
                  <DialogContent className="sm:max-w-md flex flex-col max-h-screen h-screen w-full overflow-y-auto rounded-none p-0">
                    <DialogHeader>
                      <DialogTitle>Login</DialogTitle>
                      <DialogDescription>
                        Log in to your account to continue.
                      </DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="flex-1">
                      <div className="px-1 py-4">
                        <LoginForm onSuccess={() => setIsLoginOpen(false)} />
                      </div>
                    </ScrollArea>
                  </DialogContent>
                </Dialog>
              ))}
            </div>
          </div>

          {/* -------------------------------------------------- */}
          {/* 🖥️ DESKTOP HEADER — UNTOUCHED (NOT MODIFIED!) */}
          {/* -------------------------------------------------- */}

          {/* YOUR ORIGINAL DESKTOP CODE REMAINS EXACTLY SAME */}
          {/* (I did not touch a single line here as you said) */}

          {/* ... desktop markup ... (unchanged) ... */}
          <div
            className={cn(
              'hidden md:flex w-full items-center justify-between',
              !hasMounted && 'invisible'
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
              <DropdownMenu
                modal={false}
                open={productsOpen}
                onOpenChange={setProductsOpen}
              >
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center px-8 py-2 text-2xl font-bold text-primary-nav-foreground hover:bg-black/5"
                    onMouseEnter={() => setProductsOpen(true)}
                  >
                    Products{' '}
                    <ChevronDown className="ml-1 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  onMouseLeave={() => setProductsOpen(false)}
                >
                  <DropdownMenuItem asChild>
                    <Link href="/products">All Products</Link>
                  </DropdownMenuItem>

                  {productCategories.map((category) => (
                    <DropdownMenuItem key={category.href} asChild>
                      <Link href={category.href}>
                        {category.label}
                      </Link>
                    </DropdownMenuItem>
                  ))}

                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu
                modal={false}
                open={storyOpen}
                onOpenChange={setStoryOpen}
              >
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center px-8 py-2 text-2xl font-bold text-primary-nav-foreground hover:bg-black/5"
                    onMouseEnter={() => setStoryOpen(true)}
                  >
                    Our Story{' '}
                    <ChevronDown className="ml-1 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  onMouseLeave={() => setStoryOpen(false)}
                >
                  {storyLinks.map(({ href, label }) => (
                    <DropdownMenuItem key={href} asChild>
                      <Link href={href}>{label}</Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Link
                href="/contact"
                className="px-8 py-2 text-2xl font-bold text-primary-nav-foreground hover:bg-black/5"
              >
                Contact
              </Link>
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
                      {isAdmin && (
                        <>
                          <DropdownMenuItem asChild>
                            <Link href="/admin">
                              <Shield className="mr-2 h-4 w-4" />
                              Admin Dashboard
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                        </>
                      )}
                      <DropdownMenuItem asChild>
                        <Link href="/account">My Account</Link>
                      </DropdownMenuItem>
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
                    <DialogContent className="sm:max-w-md flex flex-col max-h-screen h-screen w-full overflow-y-auto rounded-none p-0">
                      <DialogHeader>
                        <DialogTitle>Login</DialogTitle>
                        <DialogDescription>
                          Log in to your account to continue.
                        </DialogDescription>
                      </DialogHeader>
                      <ScrollArea className="flex-1">
                        <div className="px-1 py-4">
                          <LoginForm
                            onSuccess={() => setIsLoginOpen(false)}
                          />
                        </div>
                      </ScrollArea>
                    </DialogContent>
                  </Dialog>
                ))}
            </div>
          </div>
        </header>
      </div>
    </div>
  );
}


'use client';

import type { Metadata } from "next";
import { cn } from "@/lib/utils";
import "./globals.css";
import { CartProvider } from "@/context/cart-context";
import { Toaster } from "@/components/ui/toaster";
import { FirebaseErrorListener } from "@/components/FirebaseErrorListener";
import { FirebaseClientProvider } from "@/firebase/client-provider";
import { SearchOverlay } from "@/components/search-overlay";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import GlobalLoader from "@/components/GlobalLoader";


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Hide search overlay on admin routes
  const showSearchOverlay = !pathname.startsWith('/admin');

  useEffect(() => {
    // We don't want to show the loader on the initial page load.
    // We can track if this is the first render, but a simpler way is to just
    // not show the loader if the pathname is the same as the initial one.
    // For this, we'll just handle the change.
    setLoading(true);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 400); // Adjust delay as needed

    return () => clearTimeout(timer);
  }, [pathname]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400..900&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <style>{`
          body::after {
            content: none !important;
          }
        `}</style>
      </head>
      <body
        className={cn("min-h-screen bg-background font-body antialiased")}
      >
        <FirebaseClientProvider>
            <CartProvider>
                {loading && <GlobalLoader />}
                {showSearchOverlay && <SearchOverlay isOpen={isSearchOpen} setIsOpen={setIsSearchOpen} />}
                {children}
                <Toaster />
                <FirebaseErrorListener />
            </CartProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}

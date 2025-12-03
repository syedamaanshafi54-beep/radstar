import type { Metadata } from "next";
import { cn } from "@/lib/utils";
import "./globals.css";
import { CartProvider } from "@/context/cart-context";
import { Toaster } from "@/components/ui/toaster";
import { FirebaseErrorListener } from "@/components/FirebaseErrorListener";
import { FirebaseClientProvider } from "@/firebase/client-provider";
import { SearchOverlay } from "@/components/search-overlay";


export const metadata: Metadata = {
  title: "Asli Talbina - The Original Taste of Wellness",
  description:
    "Discover Asli Talbina, a nutritious and delicious superfood. Available in 8 unique variants. Shop now for a healthier you.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
      </head>
      <body
        className={cn("min-h-screen bg-background font-body antialiased")}
      >
        <FirebaseClientProvider>
            <CartProvider>
                <SearchOverlay />
                {children}
                <Toaster />
                <FirebaseErrorListener />
            </CartProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}

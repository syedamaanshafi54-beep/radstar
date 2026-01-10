
import Link from "next/link";
import { Sprout, MapPin } from "lucide-react";
import { InstagramIcon, WhatsAppIcon } from "./icons/social-icons";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-secondary/50 border-t">
      <div className="container py-12 px-4 text-center md:text-left">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1 flex flex-col items-center md:items-start">
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <span className="font-bold font-headline text-xl">Rad Star Trading</span>
            </Link>
            <p className="text-muted-foreground">The Original Taste of Wellness.</p>
            <div className="flex space-x-4 mt-4 justify-center md:justify-start">
              <a
                href="https://www.instagram.com/aslitalbina.official"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:opacity-80 transition-opacity"
                aria-label="Instagram"
              >
                <InstagramIcon className="h-6 w-6" />
              </a>
              <a
                href="https://wa.me/919032561974"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:opacity-80 transition-opacity"
                aria-label="WhatsApp"
              >
                <WhatsAppIcon className="h-6 w-6" />
              </a>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:col-span-3 gap-8 text-center md:text-left">
            <div>
              <h3 className="font-semibold mb-4">Shop</h3>
              <ul className="space-y-2">
                <li><Link href="/products" className="text-muted-foreground hover:text-primary transition-colors">All Products</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">About Us</h3>
              <ul className="space-y-2">
                <li><Link href="/about" className="text-muted-foreground hover:text-primary transition-colors">Our Story</Link></li>
                <li><Link href="/quality" className="text-muted-foreground hover:text-primary transition-colors">Quality Assurance</Link></li>
                <li><Link href="/contact" className="text-muted-foreground hover:text-primary transition-colors">Contact</Link></li>
                <li>
                  <a
                    href="https://maps.app.goo.gl/8WWStUXYjXdhC2ao9?g_st=ac"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 group"
                  >
                    <MapPin className="h-4 w-4 text-primary transition-transform group-hover:scale-110" />
                    Visit Us
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2">
                <li><Link href="/faq" className="text-muted-foreground hover:text-primary transition-colors">FAQ</Link></li>
                <li><a href="/policies.html" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">Store Policies</a></li>
                <li><Link href="/contact" className="text-muted-foreground hover:text-primary transition-colors">Get in Touch</Link></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t text-center text-muted-foreground text-sm">
          <p>&copy; {currentYear} Rad Star Trading. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
}

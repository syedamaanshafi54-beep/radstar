
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Phone, MapPin, Sprout } from "lucide-react";

export const metadata = {
  title: "Contact Us - Asli Talbina",
  description: "Get in touch with the Asli Talbina team for sales, partnerships, or any inquiries.",
};

export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-16 lg:py-24">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-headline font-bold">
          Get in Touch
        </h1>
        <p className="mt-4 max-w-2xl mx-auto text-lg md:text-xl font-medium text-muted-foreground">
          We'd love to hear from you. Whether you have a question about our products, partnerships, or anything else, our team is ready to answer all your questions.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Mail className="h-6 w-6 mr-3 text-primary" />
              Email Us
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-2">For partnerships and business inquiries:</p>
            <a href="mailto:radstartrading@gmail.com" className="font-semibold text-primary hover:underline break-all">
              radstartrading@gmail.com
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Phone className="h-6 w-6 mr-3 text-primary" />
              Call Us
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-2">For direct purchase or inquiries:</p>
            <a href="tel:+919032561974" className="font-semibold text-primary hover:underline">
              +91 90325 61974
            </a>
          </CardContent>
        </Card>
        
        <Card className="md:col-span-2 lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Sprout className="h-6 w-6 mr-3 text-primary" />
              Become a Partner
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground font-medium">
              Interested in our constituency-based sub-distributor models or reseller programs? Contact us to learn more.
            </p>
          </CardContent>
        </Card>
      </div>

       <div className="mt-16 text-center">
        <h2 className="text-3xl font-headline font-bold">Visit Us</h2>
        <p className="mt-2 text-lg font-medium text-muted-foreground">Find our products at over 150 locations.</p>
        <div className="mt-8 grid sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8 max-w-4xl mx-auto">
            <div className="flex items-center justify-center p-4 border rounded-lg">
                <MapPin className="h-5 w-5 mr-3 text-muted-foreground"/>
                <span className="font-medium">Supermarkets & Kirana Stores</span>
            </div>
            <div className="flex items-center justify-center p-4 border rounded-lg">
                <MapPin className="h-5 w-5 mr-3 text-muted-foreground"/>
                <span className="font-medium">Gyms & Fitness Centers</span>
            </div>
            <div className="flex items-center justify-center p-4 border rounded-lg">
                <MapPin className="h-5 w-5 mr-3 text-muted-foreground"/>
                <span className="font-medium">Clinics & Pharmacies</span>
            </div>
        </div>
      </div>

    </div>
  );
}

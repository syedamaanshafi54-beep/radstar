
'use client';

import Image from "next/image";
import { motion } from "framer-motion";
import { Beaker, Factory, Leaf, PackageCheck, Scale, Microscope, ShieldCheck, Star, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlaceHolderImages } from "@/lib/placeholder-images";

const qualityBannerImage = PlaceHolderImages.find(p => p.id === 'quality-banner');

const qualityPoints = [
  {
    icon: <Leaf className="h-8 w-8" />,
    title: "Farm-Direct Sourcing",
    description: "We procure the highest quality hulled barley directly from farms, ensuring freshness and traceability from field to package.",
  },
  {
    icon: <Star className="h-8 w-8" />,
    title: "Premium Ingredients",
    description: "We use only 100% original dehydrated fruit powders and the finest quality dried fruits, nuts, and spices, with no artificial additives.",
  },
  {
    icon: <ShieldCheck className="h-8 w-8" />,
    title: "Central Government Licensed",
    description: "Our operations are fully licensed by the Central Government Licensing Authority, adhering to all stipulated food safety and manufacturing norms.",
  },
  {
    icon: <Factory className="h-8 w-8" />,
    title: "Expert Supervision",
    description: "Every batch is prepared under the strict supervision of qualified nutrition experts to ensure it meets our exacting standards.",
  },
  {
    icon: <Microscope className="h-8 w-8" />,
    title: "Rigorous Lab Testing",
    description: "No product reaches you without passing rigorous laboratory testing for safety, purity, and nutritional value. Quality is not just a goal; it's our guarantee.",
  },
  {
    icon: <Beaker className="h-8 w-8" />,
    title: "Naturally Preserved",
    description: "Our recipe is free from artificial chemicals and preservatives. We maintain a long shelf life naturally, preserving the wholesome goodness of the ingredients.",
  },
  {
    icon: <Scale className="h-8 w-8" />,
    title: "Nutritionally Formulated",
    description: "Our Talbina is scientifically formulated to provide the required daily amount of vital nutrients, including essential omega-3 and omega-6 fatty acids.",
  },
  {
    icon: <PackageCheck className="h-8 w-8" />,
    title: "International Standard Packaging",
    description: "Our packaging meets international standards as per WHO guidelines, ensuring the product remains fresh, safe, and potent from our factory to your home.",
  },
];


const fadeInUp = {
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeInOut" } },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};


export default function QualityPage() {
  return (
    <motion.div initial="initial" animate="animate" variants={staggerContainer} className="bg-background text-foreground">
      <section className="relative h-[60vh] w-full text-white flex items-center justify-center overflow-hidden">
        {qualityBannerImage && (
          <motion.div
            className="absolute inset-0"
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <Image
              src={qualityBannerImage.imageUrl}
              alt={qualityBannerImage.description}
              fill
              className="object-cover"
              priority
              data-ai-hint={qualityBannerImage.imageHint}
            />
          </motion.div>
        )}
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative text-center p-4 z-10">
          <motion.h1
            className="font-headline text-4xl md:text-6xl font-bold"
            variants={fadeInUp}
          >
            Our Commitment to Quality
          </motion.h1>
          <motion.p 
            className="mt-4 max-w-2xl text-lg md:text-xl font-medium"
            variants={fadeInUp}
          >
            Why we are the 'Asli' Talbina—a promise of purity, authenticity, and trust.
          </motion.p>
        </div>
      </section>

      <div id="main-content" className="bg-background rounded-t-[4rem] -mt-16 relative z-20 pt-10 pb-8">
        <section className="py-8">
          <div className="container mx-auto px-4">
            <motion.div 
              className="prose lg:prose-xl mx-auto mb-12 text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
            >
              <h2 className="font-headline">What Makes Us 'Asli'?</h2>
              <p className="font-medium text-lg">
                In a market full of choices, 'Asli Talbina' stands apart. Our name signifies a promise of authenticity, purity, and uncompromising quality. It's a commitment woven into every step of our process, from the farms where our ingredients are grown to the moment you take your first nourishing spoonful. Here's what goes into every pack to earn that promise.
              </p>
            </motion.div>
            
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
              variants={staggerContainer}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true, amount: 0.1 }}
            >
              {qualityPoints.map((point, index) => (
                <motion.div key={index} variants={fadeInUp} className="h-full">
                  <Card className="text-center h-full hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                      <CardHeader className="items-center">
                          <div className="bg-primary/10 text-primary p-4 rounded-full mb-2">
                             {point.icon}
                          </div>
                          <CardTitle>{point.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                          <p className="text-muted-foreground font-medium">{point.description}</p>
                      </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
            
            <motion.div 
              className="prose lg:prose-xl mx-auto mt-16 text-center bg-secondary/50 p-8 rounded-lg"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
            >
              <Sparkles className="h-10 w-10 text-primary mx-auto"/>
              <h3 className="font-headline">Food, Healing, and Sunnah</h3>
              <p className="font-medium text-lg">
                Asli Talbina is more than just a product; it is a timeless recipe that embodies the principles of Sunnah—representing nourishment, healing, and spiritual wellness. Today, Asli Talbina is the benchmark brand in its category. No competitor can match our dedication to superior Packaging, Quality, or Fair Pricing. We don't just sell a food; we deliver a legacy of health.
              </p>
            </motion.div>
          </div>
        </section>
      </div>
    </motion.div>
  );
}

"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Award,
  Building,
  Check,
  Goal,
  Handshake,
  Heart,
  ShieldCheck,
  Sprout,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import React from "react";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { ChartTooltipContent } from "@/components/ui/chart";
import { VendorRegistrationForm } from "@/components/vendor/vendor-registration-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const fadeInUp = {
  initial: { opacity: 0, y: 40 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: "easeInOut" },
  },
};

const staggerContainer = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const aboutSlides = [
  PlaceHolderImages.find((p) => p.id === "about-1"),
  PlaceHolderImages.find((p) => p.id === "about-2"),
  PlaceHolderImages.find((p) => p.id === "about-3"),
  // PlaceHolderImages.find((p) => p.id === "about-4"),
].filter(Boolean);

const growthData = [
  {
    event: "Foundation",
    description: "Jan 2025: Company founded & Asli Talbina launched.",
    position: { top: "55%", left: "10%" },
  },
  {
    event: "Agreement",
    description: "Q1 2025: Signed exclusive agency agreement.",
    position: { top: "35%", left: "30%" },
  },
  {
    event: "Expansion",
    description:
      "Q2 2025: Distribution expanded across Hyderabad & Secunderabad.",
    position: { top: "55%", left: "50%" },
  },
  {
    event: "Innovation",
    description: "Q3 2025: Introduced new product variants.",
    position: { top: "35%", left: "70%" },
  },
  {
    event: "E-commerce Launch",
    description: "Q4 2025: E-commerce rollout.",
    position: { top: "55%", left: "90%" },
  },
];

export default function AboutPage() {
  const founderImage = {
    imageUrl: "/images/fd.jpeg",
    description: "Syed Abdul Qader, Imran - Founder & CEO"
  };
  const plugin = React.useRef(
    Autoplay({ delay: 5000, stopOnInteraction: false })
  );
  const [api, setApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);

  React.useEffect(() => {
    if (!api) return;

    setCurrent(api.selectedScrollSnap());

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  const coreValues = [
    { icon: <ShieldCheck className="h-8 w-8 text-primary" />, title: "Integrity" },
    { icon: <Award className="h-8 w-8 text-primary" />, title: "Quality-First" },
    {
      icon: <Heart className="h-8 w-8 text-primary" />,
      title: "Customer-Centricity",
    },
    {
      icon: <Handshake className="h-8 w-8 text-primary" />,
      title: "Accountability",
    },
    { icon: <Sprout className="h-8 w-8 text-primary" />, title: "Innovation" },
    { icon: <Check className="h-8 w-8 text-primary" />, title: "Sustainability" },
  ];

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={staggerContainer}
      className="bg-background text-foreground"
    >
      {/* Hero Section */}
      <Carousel
        setApi={setApi}
        plugins={[plugin.current]}
        className="w-full relative"
        opts={{
          loop: true,
        }}
      >
        <CarouselContent>
          {aboutSlides.map(
            (slide) =>
              slide && (
                <CarouselItem key={slide.id}>
                  <div className="relative w-full h-[65vh] sm:h-[75vh] md:h-[85vh] text-white flex items-center justify-center">
                    <Image
                      src={slide.imageUrl}
                      alt={slide.description}
                      fill
                      className="object-cover"
                      priority={slide.id === "about-1"}
                      data-ai-hint={slide.imageHint}
                      sizes="100vw"
                    />
                    <div className="absolute inset-0 bg-black/40" />
                    <div className="relative z-10 text-center flex flex-col items-center px-4">
                      <motion.div
                        key={slide.id}
                        initial="initial"
                        whileInView="animate"
                        viewport={{ once: false, amount: 0.5 }}
                        variants={staggerContainer}
                        className="flex flex-col items-center max-w-3xl"
                      >
                        <motion.h1
                          className="text-xs sm:text-sm md:text-xl font-light tracking-[0.25em] uppercase"
                          variants={fadeInUp}
                        >
                          {slide.id === "about-1"
                            ? "A Legacy of Trust"
                            : slide.id === "about-2"
                              ? "Rooted in Nature"
                              : slide.id === "about-3"
                                ? "Nourishing Communities"
                                : "The Future of Wellness"}
                        </motion.h1>
                        <motion.h2
                          className="mt-3 font-headline text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold leading-tight"
                          variants={fadeInUp}
                        >
                          {slide.id === "about-1"
                            ? "Quality & Purity"
                            : slide.id === "about-2"
                              ? "Crafted with Care"
                              : slide.id === "about-3"
                                ? "One Bowl at a Time"
                                : "Innovating Tradition"}
                        </motion.h2>
                        <motion.div
                          className="w-16 sm:w-20 h-1 bg-primary my-4 sm:my-6"
                          variants={fadeInUp}
                        />
                      </motion.div>
                    </div>
                  </div>
                </CarouselItem>
              )
          )}
        </CarouselContent>
        <div className="absolute bottom-4 sm:bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
          {aboutSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => api?.scrollTo(index)}
              className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full transition-colors ${index === current
                ? "bg-primary"
                : "bg-white/50 hover:bg-white/75"
                }`}
            />
          ))}
        </div>
      </Carousel>

      <div
        id="main-content"
        className="bg-background rounded-t-[1.5rem] md:rounded-t-[4rem] -mt-6 md:-mt-16 relative z-20 pt-8 md:pt-10 pb-8"
      >
        {/* Founder Message Section */}
        <motion.section
          className="bg-background py-10 md:py-16"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, amount: 0.3 }}
          variants={{ animate: { transition: { staggerChildren: 0.2 } } }}
        >
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8 lg:gap-16">
              <motion.div
                className="w-full md:w-1/3 flex flex-col items-center text-center"
                variants={fadeInUp}
              >
                <Avatar className="h-28 w-28 sm:h-32 sm:w-32 md:h-48 md:w-48 mx-auto border-8 border-background shadow-2xl">
                  {founderImage && (
                    <AvatarImage
                      src={founderImage.imageUrl}
                      alt="Syed Abdul Qader, Imran"
                    />
                  )}
                  <AvatarFallback>SQ</AvatarFallback>
                </Avatar>
                <div className="mt-3 md:mt-4">
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold font-headline text-primary">
                    Syed Abdul Qader, Imran
                  </h3>
                  <p className="text-sm sm:text-base text-muted-foreground font-medium">
                    Founder &amp; CEO
                  </p>
                </div>
              </motion.div>
              <motion.div
                className="w-full md:w-2/3 mt-4 md:mt-0"
                variants={fadeInUp}
              >
                <blockquote className="relative border-l-4 border-primary pl-4 sm:pl-5 md:pl-6 text-base sm:text-lg md:text-2xl font-medium text-foreground mb-2 sm:mb-4 text-left sm:text-justify leading-relaxed">
                  "With two decades of global experience, I established Rad Star
                  to offer something truly valuable: a brand built on trust. My
                  profession is based on three core principles:{" "}
                  <strong>Uncompromising Integrity</strong>, because Allah is
                  always watching; <strong>Adherence to Ethical Standards</strong>; and{" "}
                  <strong>Accountability to a Higher Power</strong>. We aren’t
                  just building a business—we’re building a legacy."
                </blockquote>
              </motion.div>
            </div>
          </div>
        </motion.section>

        {/* Intro Placard */}
        <section className="py-8 md:py-10">
          <div className="container mx-auto px-4">
            <motion.div
              className="text-center"
              initial="initial"
              whileInView="animate"
              viewport={{ once: true, amount: 0.5 }}
              variants={fadeInUp}
            >
              <h2 className="font-headline text-2xl sm:text-3xl md:text-5xl font-bold text-primary">
                Welcome to Rad Star Trading
              </h2>
              <p className="mt-3 sm:mt-4 text-base sm:text-lg md:text-2xl font-medium text-muted-foreground text-center max-w-4xl mx-auto leading-relaxed">
                Headquartered in Hyderabad, our flagship offerings, including{" "}
                <strong>
                  Asli Talbina and Talbina Toast,
                </strong>{" "}
                are gaining recognition for their uncompromising quality. We are
                the authorized sole distributor of Asli Talbina for the
                Hyderabad and Secunderabad region.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Our Journey Graph */}
        <section className="py-12 md:py-16 bg-secondary/30 overflow-hidden">
          <div className="container mx-auto px-4">
            <motion.div
              className="text-center mb-8 md:mb-20"
              initial="initial"
              whileInView="animate"
              viewport={{ once: true, amount: 0.5 }}
              variants={fadeInUp}
            >
              <h2 className="text-3xl sm:text-4xl md:text-6xl font-headline font-bold">
                A Story of Growth
              </h2>
              <p className="mt-3 sm:mt-4 text-base sm:text-lg md:text-xl font-medium text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                From a principled vision to a thriving community brand, here's
                our journey.
              </p>
            </motion.div>

            {/* Desktop graph (unchanged layout) */}
            <motion.div
              className="relative h-64 sm:h-72 md:h-96 w-full max-w-4xl sm:max-w-5xl mx-auto"
              initial="initial"
              whileInView="animate"
              viewport={{ once: true, amount: 0.5 }}
              variants={fadeInUp}
            >
              {/* The SVG Curve */}
              <div className="absolute inset-0 flex items-center justify-center scale-95 sm:scale-100">
                <svg
                  width="100%"
                  height="100%"
                  viewBox="0 0 1000 300"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M 50,250 Q 250,250 350,150 T 650,100 T 950,50"
                    stroke="hsl(var(--primary))"
                    fill="none"
                    strokeWidth="2"
                    strokeDasharray="5,5"
                  />
                </svg>
              </div>

              {/* Milestones */}
              {growthData.map((item, index) => (
                <div
                  key={item.event}
                  className="absolute"
                  style={{
                    left: item.position.left,
                    top: item.position.top,
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  <div className="relative flex flex-col items-center group">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 bg-primary rounded-full border-2 border-background shadow-md z-10 transition-transform group-hover:scale-125" />
                    <div
                      className={`text-center mt-3 w-32 xs:w-40 sm:w-48 transition-opacity duration-300 ${index % 2 === 0 ? "absolute top-5" : "absolute bottom-5"
                        }`}
                    >
                      <h3 className="font-headline text-sm xs:text-base sm:text-lg md:text-2xl font-bold text-foreground leading-tight">
                        {item.event}
                      </h3>
                      <p className="text-xs xs:text-sm sm:text-base text-muted-foreground leading-snug">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>

            {/* Mobile timeline */}

          </div>
        </section>

        {/* Core Values */}
        <section className="py-8 md:py-10 bg-secondary/30">
          <div className="container mx-auto px-4 text-center">
            <motion.h2
              className="text-2xl sm:text-3xl md:text-4xl font-headline mb-6 sm:mb-10"
              initial="initial"
              whileInView="animate"
              viewport={{ once: true, amount: 0.5 }}
              variants={fadeInUp}
            >
              The Principles We Stand By
            </motion.h2>
            <motion.div
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6 max-w-6xl mx-auto"
              initial="initial"
              whileInView="animate"
              viewport={{ once: true, amount: 0.2 }}
              variants={staggerContainer}
            >
              {coreValues.map((value) => (
                <motion.div
                  key={value.title}
                  className="flex flex-col items-center p-3 sm:p-4 rounded-lg transition-all duration-300"
                  variants={fadeInUp}
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="bg-primary/10 p-4 sm:p-5 rounded-full border shadow-sm mb-3 sm:mb-4">
                    {value.icon}
                  </div>
                  <h3 className="font-semibold text-sm sm:text-base text-center">
                    {value.title}
                  </h3>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Vision & Mission */}
        <section className="grid gap-6 md:grid-cols-2">
          <div
            className="relative flex items-center justify-center p-8 md:p-12"
            style={{ backgroundColor: "#fefce8" }}
          >
            <motion.div
              className="relative z-10 text-center max-w-md"
              initial="initial"
              whileInView="animate"
              viewport={{ once: true, amount: 0.5 }}
              variants={fadeInUp}
            >
              <Goal
                className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4"
                style={{ color: "#1B3518" }}
              />
              <h2
                className="font-headline text-2xl sm:text-3xl md:text-4xl font-bold"
                style={{ color: "#1B3518" }}
              >
                Our Vision
              </h2>
              <p
                className="mt-2 text-base sm:text-lg md:text-xl font-medium leading-relaxed"
                style={{ color: "#4A4A4A" }}
              >
                To be a market-leading name in the natural products industry,
                scaling our operations to spread the benefits of wholesome
                eating.
              </p>
            </motion.div>
          </div>
          <div
            className="relative flex items-center justify-center p-8 md:p-12 border-t md:border-t-0 md:border-l border-primary/10"
            style={{ backgroundColor: "#f0fdf4" }}
          >
            <motion.div
              className="relative z-10 text-center max-w-md"
              initial="initial"
              whileInView="animate"
              viewport={{ once: true, amount: 0.5 }}
              variants={fadeInUp}
            >
              <Building
                className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4"
                style={{ color: "#1B3518" }}
              />
              <h2
                className="font-headline text-2xl sm:text-3xl md:text-4xl font-bold"
                style={{ color: "#1B3518" }}
              >
                Our Mission
              </h2>
              <p
                className="mt-2 text-base sm:text-lg md:text-xl font-medium leading-relaxed"
                style={{ color: "#4A4A4A" }}
              >
                To deliver safe, effective, and accessible food products that
                promote healthy living through innovation and uncompromising
                quality.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Careers Section */}
        <section className="py-10 md:py-16 bg-secondary/30">
          <div className="container mx-auto px-4">
            <motion.div
              className="text-center mb-8 md:mb-10"
              initial="initial"
              whileInView="animate"
              viewport={{ once: true, amount: 0.5 }}
              variants={fadeInUp}
            >
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-headline">
                Partner With Us
              </h2>
              <p className="mt-3 sm:mt-4 text-base sm:text-lg font-medium text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Become a registered vendor and join our growing network of trust.
              </p>
            </motion.div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
              <Card className="transition-all duration-300 cursor-pointer bg-white border border-[#DDE4D0] hover:bg-[#F3F7EF] hover:shadow-lg">
                <CardHeader>
                  <CardTitle style={{ color: "#1B3518" }}>
                    Community Empowerment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-medium text-sm sm:text-base leading-relaxed" style={{ color: "#4A4A4A" }}>
                    Creating opportunities for capable women, individuals with
                    disabilities, retirees, and students to achieve financial
                    independence with dignity.
                  </p>
                </CardContent>
              </Card>
              <Card className="transition-all duration-300 cursor-pointer bg-white border border-[#DDE4D0] hover:bg-[#F3F7EF] hover:shadow-lg">
                <CardHeader>
                  <CardTitle style={{ color: "#1B3518" }}>
                    Hybrid Business Model
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-medium text-sm sm:text-base leading-relaxed" style={{ color: "#4A4A4A" }}>
                    With over 200+ POS counters, direct-to-customer services,
                    and Constituency-Based Sub-Distributorships to empower local
                    partners.
                  </p>
                </CardContent>
              </Card>
              <Dialog>
                <DialogTrigger asChild>
                  <Card className="transition-all duration-300 cursor-pointer bg-white border border-primary/20 hover:bg-primary/5 hover:shadow-lg border-dashed">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2" style={{ color: "#1B3518" }}>
                        <Handshake className="h-5 w-5" />
                        Become a Partner
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="font-medium text-sm sm:text-base leading-relaxed" style={{ color: "#4A4A4A" }}>
                        Join our mission and grow your business with us. Click here to submit your vendor registration application.
                      </p>
                      <div className="mt-4 text-primary font-bold flex items-center gap-1 group">
                        Register Now
                        <span className="transition-transform group-hover:translate-x-1">→</span>
                      </div>
                    </CardContent>
                  </Card>
                </DialogTrigger>
                <DialogContent className="max-w-4xl w-full p-0 overflow-hidden">
                  <div className="max-h-[85vh] overflow-y-auto p-6 pt-12">
                    <DialogHeader className="mb-6">
                      <DialogTitle className="text-2xl font-headline">Vendor Registration</DialogTitle>
                      <DialogDescription>
                        Please fill out the form below to register as a vendor. Our team will review your application.
                      </DialogDescription>
                    </DialogHeader>
                    <VendorRegistrationForm />
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </section>
      </div>
    </motion.div>
  );
}


"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useUser, useFirestore, addDocumentNonBlocking } from "@/firebase";
import { collection, serverTimestamp } from "firebase/firestore";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  fullName: z.string().min(1, "Full Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().length(10, "Phone number must be exactly 10 digits"),
  address: z.string().min(1, "Address is required"),
  businessName: z.string().optional(),
});

type PartnerFormValues = z.infer<typeof formSchema>;

export default function PartnerRegistrationForm() {
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PartnerFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: user?.displayName || "",
      email: user?.email || "",
      phone: "",
      address: "",
      businessName: "",
    },
  });

  const onSubmit = (values: PartnerFormValues) => {
    if (!firestore) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not connect to the database. Please try again later.",
      });
      return;
    }

    setIsSubmitting(true);

    const partnerData = {
      ...values,
      userId: user?.uid || null,
      createdAt: serverTimestamp(),
    };

    const partnersCollection = collection(firestore, "partners");
    addDocumentNonBlocking(partnersCollection, partnerData)
      .then(() => {
        toast({
          title: "Registration completed successfully!",
          description: "Thank you for your interest. We will be in touch shortly.",
        });
        setIsOpen(false);
        form.reset();
      })
      .catch((error) => {
        console.error("Partner registration error:", error);
        toast({
          variant: "destructive",
          title: "Registration Failed",
          description: "Could not submit your registration. Please try again.",
        });
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Card className="transition-all duration-300 cursor-pointer bg-white border border-[#DDE4D0] hover:bg-[#F3F7EF] hover:shadow-lg md:col-span-full lg:col-span-1">
          <CardHeader>
            <CardTitle style={{ color: "#1B3518" }}>Become a Partner</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 font-medium" style={{ color: "#4A4A4A" }}>
              We’re always looking for committed individuals. Click here to apply.
            </p>
            <span className="font-semibold text-primary hover:underline">
              Register Now
            </span>
          </CardContent>
        </Card>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-2xl p-8">
        <DialogHeader>
          <DialogTitle>Partner Registration</DialogTitle>
          <DialogDescription>
            Fill out the form below to express your interest in becoming a partner.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your full name" {...field} className="h-12 text-base rounded-xl" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="you@example.com"
                      type="email"
                      {...field}
                      className="h-12 text-base rounded-xl"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="9876543210"
                      {...field}
                      maxLength={10}
                      className="h-12 text-base rounded-xl"
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        field.onChange(value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter your full address" {...field} className="min-h-[100px] text-base rounded-xl resize-none" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="businessName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Name (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Your company name" {...field} className="h-12 text-base rounded-xl" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full h-12 text-base rounded-xl" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registering...
                </>
              ) : (
                "Register"
              )}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}


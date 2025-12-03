
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Bot, Loader2, Send } from "lucide-react";
import { nutritionalInformationChatbot } from "@/ai/flows/nutritional-information-chatbot";
import { ScrollArea } from "./ui/scroll-area";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { Product } from "@/lib/types";
import { collection } from "firebase/firestore";
import { cn } from "@/lib/utils";

type Message = {
  role: "user" | "bot";
  content: string;
};

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [variant, setVariant] = useState("");
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const firestore = useFirestore();
  const productsCollection = useMemoFirebase(() => collection(firestore, 'products'), [firestore]);
  const { data: productsData, isLoading: productsLoading } = useCollection<Product>(productsCollection);

  const products = productsData || [];
  
  useEffect(() => {
    const tooltipShown = sessionStorage.getItem('nutritionAssistantTooltipShown');
    if (!tooltipShown) {
      const timer = setTimeout(() => {
        setShowTooltip(true);
        sessionStorage.setItem('nutritionAssistantTooltipShown', 'true');
        
        const hideTimer = setTimeout(() => {
          setShowTooltip(false);
        }, 4000); // Hide after 4 seconds
        
        return () => clearTimeout(hideTimer);
      }, 500); // Show after a short delay
      return () => clearTimeout(timer);
    }
  }, []);

  if (products.length > 0 && !variant) {
    setVariant(products[0].name);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !variant) return;

    const userMessage: Message = { role: "user", content: question };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setQuestion("");

    try {
      const response = await nutritionalInformationChatbot({ variant, question });
      const botMessage: Message = { role: "bot", content: response.answer };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      const errorMessage: Message = {
        role: "bot",
        content: "Sorry, I encountered an error. Please try again.",
      };
      setMessages((prev) => [...prev, errorMessage]);
      console.error("Chatbot error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        <div className={cn(
          "absolute bottom-full right-0 mb-2 w-max rounded-md bg-foreground px-3 py-1.5 text-sm font-semibold text-background shadow-lg transition-opacity duration-300",
          showTooltip ? "opacity-100" : "opacity-0"
        )}>
          Nutrition Assistant
        </div>
        <Button
          className="h-16 w-16 rounded-full shadow-lg"
          onClick={() => setIsOpen(true)}
          aria-label="Open Nutritional Assistant"
        >
          <Bot className="h-8 w-8" />
        </Button>
      </div>

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent className="flex flex-col">
          <SheetHeader>
            <SheetTitle>Nutritional Assistant</SheetTitle>
            <SheetDescription>
              Ask me anything about the nutritional benefits and ingredients of our products.
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 flex flex-col my-4">
            <ScrollArea className="flex-1 pr-4 -mr-4">
                <div className="space-y-4">
                {messages.map((message, index) => (
                    <div
                    key={index}
                    className={`flex items-start gap-3 ${
                        message.role === "user" ? "justify-end" : ""
                    }`}
                    >
                    {message.role === "bot" && (
                        <div className="p-2 bg-primary rounded-full text-primary-foreground">
                        <Bot size={16} />
                        </div>
                    )}
                    <div
                        className={`rounded-lg p-3 max-w-[80%] text-sm ${
                        message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary"
                        }`}
                    >
                        {message.content}
                    </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary rounded-full text-primary-foreground">
                        <Bot size={16} />
                    </div>
                    <div className="bg-secondary rounded-lg p-3 flex items-center">
                        <Loader2 className="h-5 w-5 animate-spin" />
                    </div>
                    </div>
                )}
                </div>
            </ScrollArea>
          </div>
          <SheetFooter>
            <form onSubmit={handleSubmit} className="w-full space-y-4">
              <div className="space-y-2">
                <Label htmlFor="variant-select">Product Variant</Label>
                <Select value={variant} onValueChange={setVariant} disabled={productsLoading}>
                  <SelectTrigger id="variant-select">
                    <SelectValue placeholder="Select a variant" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.name}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                 <Label htmlFor="question-input">Your Question</Label>
                <div className="flex gap-2">
                    <Textarea
                        id="question-input"
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        placeholder="e.g., What are the benefits of..."
                        className="flex-1"
                        rows={1}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmit(e);
                            }
                        }}
                    />
                     <Button type="submit" disabled={isLoading || !question.trim()} size="icon">
                        <Send className="h-4 w-4" />
                     </Button>
                </div>
              </div>
            </form>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}

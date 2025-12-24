"use client";

import { useState, useMemo } from 'react';
import { Star, MessageSquarePlus, Loader2, Send } from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, query, where, orderBy, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Review } from '@/lib/types/reviews';
import { cn } from '@/lib/utils';

export default function ProductReviews({ productId }: { productId: string }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const reviewsQuery = useMemoFirebase(
    () => query(collection(firestore, 'reviews'), where('productId', '==', productId), orderBy('createdAt', 'desc')),
    [firestore, productId]
  );

  const { data: reviews, isLoading } = useCollection<Review>(reviewsQuery, { listen: true });

  const averageRating = useMemo(() => {
    if (!reviews || reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return Math.round((sum / reviews.length) * 10) / 10;
  }, [reviews]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({
        variant: "destructive",
        title: "Login Required",
        description: "Please login to submit a review.",
      });
      return;
    }

    if (comment.length < 5) {
      toast({
        variant: "destructive",
        title: "Comment too short",
        description: "Please share a bit more about your experience.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(firestore, 'reviews'), {
        productId,
        userId: user.uid,
        userName: user.displayName || user.email?.split('@')[0] || "Anonymous",
        rating,
        comment,
        createdAt: serverTimestamp(),
      } as Review);

      toast({
        title: "Review Submitted",
        description: "Thank you for your feedback!",
      });
      setComment("");
      setRating(5);
      setIsOpen(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to submit review: " + error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className={cn(
                  "h-5 w-5",
                  s <= Math.round(averageRating) ? "fill-primary text-primary" : "text-muted-foreground"
                )}
              />
            ))}
          </div>
          <span className="text-lg font-bold">
            {averageRating > 0 ? averageRating : "No ratings yet"}
          </span>
          <span className="text-sm text-muted-foreground">({reviews?.length || 0} reviews)</span>
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <MessageSquarePlus className="mr-2 h-4 w-4" /> Write Review
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Share Your Experience</DialogTitle>
              <DialogDescription>
                How do you like this product? Your feedback helps thousands!
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Rating</Label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setRating(s)}
                      className="transition-transform active:scale-95"
                    >
                      <Star
                        className={cn(
                          "h-8 w-8 cursor-pointer",
                          s <= rating ? "fill-primary text-primary" : "text-muted-foreground"
                        )}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="comment">Your Comment</Label>
                <Textarea
                  id="comment"
                  placeholder="Share what you loved (or didn't) about this..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Submit Review
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        {isLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : reviews?.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No reviews yet. Be the first to review!</p>
        ) : (
          reviews?.map((review) => (
            <div key={review.id} className="border-b pb-4 last:border-0">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm">{review.userName}</span>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={cn(
                        "h-3 w-3",
                        s <= review.rating ? "fill-primary text-primary" : "text-muted-foreground"
                      )}
                    />
                  ))}
                </div>
              </div>
              <p className="text-sm text-foreground/80 leading-relaxed italic">"{review.comment}"</p>
              <p className="text-[10px] text-muted-foreground mt-2">
                {review.createdAt && typeof review.createdAt !== 'string' ? new Date(review.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}


'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Wand2 } from 'lucide-react';
import type { Product } from '@/lib/types';
import { WithId } from '@/firebase';

export function AiReviewAnalysis({ allProducts }: { allProducts: WithId<Product>[] }) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="h-5 w-5 text-primary" />
          AI Review Analysis
        </CardTitle>
        <CardDescription>
          The review analysis feature has been disabled.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-center">
        <div className="text-center text-muted-foreground font-medium">
          <p>Product reviews have been removed from the application.</p>
        </div>
      </CardContent>
    </Card>
  );
}

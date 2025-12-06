
'use client';

import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { User, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { UserProfile } from '@/lib/types';
import { WithId, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';

export default function AdminCustomersPage() {
    const firestore = useFirestore();
    const customersQuery = useMemoFirebase(
        () => query(collection(firestore, 'users'), orderBy('createdAt', 'desc')),
        [firestore]
    );
    const { data: customers, isLoading, error } = useCollection<UserProfile>(customersQuery);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Customers</h2>
      <Card>
        <CardHeader>
          <CardTitle>All Customers</CardTitle>
          <CardDescription>A list of all registered users in your store.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Sign-up Date</TableHead>
                <TableHead>Provider</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
             {isLoading ? (
                <TableRow>
                    <TableCell colSpan={4} className="h-48 text-center">
                      <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
                    </TableCell>
                </TableRow>
             ) : error ? (
                <TableRow>
                    <TableCell colSpan={4} className="text-center text-destructive p-8">
                        <p className="font-semibold">Error loading customers:</p>
                        <p>{error.message}</p>
                    </TableCell>
                </TableRow>
             ) : customers && customers.length > 0 ? (
                customers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium flex items-center gap-2">
                       <Avatar className="h-8 w-8">
                         {user.photoURL && <AvatarImage src={user.photoURL} alt={user.displayName} />}
                         <AvatarFallback>
                           {user.displayName ? user.displayName.charAt(0).toUpperCase() : <User />}
                         </AvatarFallback>
                       </Avatar>
                       {user.displayName || 'No Name'}
                    </TableCell>
                    <TableCell>{user.email || 'No Email'}</TableCell>
                    <TableCell>
                      {user.createdAt
                        ? new Date(typeof user.createdAt === 'string' ? user.createdAt : user.createdAt.toDate()).toLocaleDateString()
                        : 'N/A'}
                    </TableCell>
                    <TableCell>{user.providerId || 'N/A'}</TableCell>
                  </TableRow>
                ))
              ) : (
                 <TableRow>
                    <TableCell colSpan={4} className="h-48 text-center">
                      <h3 className="font-bold text-lg">No Customers Found</h3>
                      <p className="text-muted-foreground mt-1">
                        Once customer data is available, it will be displayed here.
                      </p>
                    </TableCell>
                  </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}


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
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function AdminCustomersPage() {
  
  // The functionality to fetch users is temporarily disabled to address a persistent permission error.
  // This will be re-enabled once the underlying security rule issue is resolved.
  const users: any[] = [];
  const isLoading = false;
  const error = true;


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
                    <TableCell colSpan={4} className="h-24 text-center">
                      <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                    </TableCell>
                  </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-48 text-center text-amber-600 bg-amber-50">
                    <div className="flex flex-col items-center gap-2">
                      <AlertTriangle className="h-10 w-10"/>
                      <h3 className="font-bold text-lg">Customer List Temporarily Unavailable</h3>
                      <p className="text-sm max-w-md">
                        We are currently resolving a permission issue with fetching the customer data. This feature will be restored shortly. Thank you for your patience.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : users && users.length > 0 ? (
                users.map((user: any) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium flex items-center gap-2">
                       <Avatar className="h-8 w-8">
                         {user.photoURL && <AvatarImage src={user.photoURL} alt={user.displayName} />}
                         <AvatarFallback>{user.displayName?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}</AvatarFallback>
                       </Avatar>
                       {user.displayName}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.createdAt ? new Date(user.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}</TableCell>
                    <TableCell>{user.providerId}</TableCell>
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

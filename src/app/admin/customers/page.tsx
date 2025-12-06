'use server';

import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { UserProfile } from '@/lib/types';
import { getAdminApp, getAdminAuth } from '@/firebase/admin';
import { listUsers } from 'firebase/auth/admin';

async function getCustomers(): Promise<UserProfile[]> {
    const auth = getAdminAuth();
    const result = await listUsers(auth);
    const users = result.users.map(userRecord => {
        return {
            uid: userRecord.uid,
            displayName: userRecord.displayName || 'No Name',
            email: userRecord.email || 'No Email',
            photoURL: userRecord.photoURL,
            providerId: userRecord.providerData?.[0]?.providerId || 'password',
            createdAt: userRecord.metadata.creationTime ? new Date(userRecord.metadata.creationTime).toISOString() : new Date().toISOString(),
            lastLogin: userRecord.metadata.lastSignInTime ? new Date(userRecord.metadata.lastSignInTime).toISOString() : new Date().toISOString(),
            role: 'user', // Default role
        } as UserProfile;
    });

    // We need to return a format that matches the old UserProfile for consistency
    // Note: Timestamps are now ISO strings. We'll format them in the component.
    return users;
}


export default async function AdminCustomersPage() {
    const customers = await getCustomers();

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
             {customers && customers.length > 0 ? (
                customers.map((user) => (
                  <TableRow key={user.uid}>
                    <TableCell className="font-medium flex items-center gap-2">
                       <Avatar className="h-8 w-8">
                         {user.photoURL && <AvatarImage src={user.photoURL} alt={user.displayName} />}
                         <AvatarFallback>
                           {user.displayName ? user.displayName.charAt(0).toUpperCase() : <User />}
                         </AvatarFallback>
                       </Avatar>
                       {user.displayName}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</TableCell>
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

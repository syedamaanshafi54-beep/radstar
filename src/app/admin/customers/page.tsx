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
import { getApps, getApp, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { WithId } from '@/firebase';

// Helper function to safely initialize and get the admin app
function getAdminApp() {
  if (getApps().length) {
    return getApp();
  }
  // This environment variable is automatically set by App Hosting.
  return initializeApp({ projectId: process.env.GCLOUD_PROJECT });
}

async function getCustomers() {
  const firestore = getFirestore(getAdminApp());
  const usersSnapshot = await firestore.collection('users').get();
  
  if (usersSnapshot.empty) {
    return [];
  }

  const customers: WithId<UserProfile>[] = usersSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      uid: data.uid,
      displayName: data.displayName || 'No Name',
      email: data.email || 'No Email',
      photoURL: data.photoURL,
      providerId: data.providerId,
      // Convert Firestore Timestamp to a serializable format (ISO string)
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : null,
      lastLogin: data.lastLogin?.toDate ? data.lastLogin.toDate().toISOString() : null,
      role: data.role,
    } as WithId<UserProfile>;
  });

  return customers;
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

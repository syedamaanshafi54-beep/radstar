
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertTriangle, User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getAdminApp, getAdminAuth } from '@/firebase/admin';
import { UserRecord } from 'firebase-admin/auth';
import type { UserProfile } from '@/lib/types';

async function getCustomers(): Promise<UserProfile[]> {
    try {
        const auth = getAdminAuth();
        const firestore = getAdminApp().firestore();

        const userRecords: UserRecord[] = (await auth.listUsers()).users;
        
        if (userRecords.length === 0) {
            return [];
        }

        const userDocs = await firestore.collection('users').get();
        const usersMap = new Map<string, UserProfile>();
        userDocs.forEach(doc => {
            usersMap.set(doc.id, doc.data() as UserProfile);
        });

        const customers = userRecords.map(record => {
            const firestoreData = usersMap.get(record.uid);
            return {
                uid: record.uid,
                displayName: record.displayName || firestoreData?.displayName || 'N/A',
                email: record.email || firestoreData?.email || 'N/A',
                photoURL: record.photoURL || firestoreData?.photoURL,
                providerId: record.providerData[0]?.providerId || 'password',
                createdAt: firestoreData?.createdAt || { seconds: new Date(record.metadata.creationTime).getTime() / 1000 },
                // Add other fields from UserProfile as needed
            } as UserProfile;
        });

        // Sort by creation date descending
        customers.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

        return customers;
    } catch (error) {
        console.error("Error fetching customers with Admin SDK:", error);
        // We can throw the error to be caught by an error boundary
        throw new Error('Failed to fetch customer data. This might be a server environment issue.');
    }
}


export default async function AdminCustomersPage() {
  
  let customers: UserProfile[] = [];
  let error: Error | null = null;
  
  try {
      customers = await getCustomers();
  } catch (e: any) {
      error = e;
  }

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
              {error ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-48 text-center text-destructive bg-destructive/10">
                    <div className="flex flex-col items-center gap-2">
                      <AlertTriangle className="h-10 w-10"/>
                      <h3 className="font-bold text-lg">Error Fetching Customers</h3>
                      <p className="text-sm max-w-md">
                        {error.message}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : customers.length > 0 ? (
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


'use client';

import { useUser } from '@/firebase/provider';
import { useRouter } from 'next/navigation';
import { useEffect, ComponentType } from 'react';
import { Loader2 } from 'lucide-react';

// --- TEMPORARY ADMIN OVERRIDE ---
// This is a temporary list of emails that should be treated as admins.
// In a production environment, you should use Firebase Custom Claims.
const TEMP_ADMIN_EMAILS = ['itsmeabdulk@gmail.com'];
// --- END TEMPORARY ADMIN OVERRIDE ---

export function withAdminAuth<P extends object>(Component: ComponentType<P>) {
  return function WithAdminAuth(props: P) {
    const { user, claims, isUserLoading } = useUser();
    const router = useRouter();

    const isAuthorized = claims?.role === 'admin' || (user?.email && TEMP_ADMIN_EMAILS.includes(user.email));

    useEffect(() => {
      if (!isUserLoading) {
        if (!user || !isAuthorized) {
          router.replace('/');
        }
      }
    }, [user, isAuthorized, isUserLoading, router]);

    if (isUserLoading || !user || !isAuthorized) {
      return (
        <div className="flex h-screen items-center justify-center">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>
      );
    }

    return <Component {...props} />;
  };
}

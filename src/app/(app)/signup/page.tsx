
'use client';

import { SignupForm } from '@/components/signup-form';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
    const router = useRouter();
    return (
        <div className="container mx-auto flex min-h-[80vh] items-center justify-center px-4 py-12">
            <SignupForm onSuccess={() => router.push('/')} />
        </div>
    )
}

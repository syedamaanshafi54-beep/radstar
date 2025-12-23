
'use client';

import { LoginForm } from '@/components/login-form';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const router = useRouter();
    return (
        <div className="container mx-auto flex min-h-[80vh] items-center justify-center px-4 py-12">
            <LoginForm onSuccess={() => router.push('/')} />
        </div>
    )
}


'use server';

import { getFirebaseAdmin } from '@/firebase/firebase-admin';
import { sendPasswordResetEmail } from '@/lib/email';

export async function sendCustomPasswordResetEmailAction(email: string) {
    try {
        const admin = getFirebaseAdmin();
        // Generate the password reset link using Firebase Admin SDK
        const link = await admin.auth().generatePasswordResetLink(email);

        // Construct custom link pointing to our app's reset-password page
        const urlParams = new URLSearchParams(new URL(link).search);
        const oobCode = urlParams.get('oobCode');
        const customLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://radstar.in'}/reset-password?oobCode=${oobCode}`;

        // Send the custom HTML email
        const result = await sendPasswordResetEmail(email, customLink);

        if (!result.success) {
            throw new Error(result.error || 'Failed to send email');
        }

        return { success: true };
    } catch (error: any) {
        console.error('Error sending password reset email:', error);
        // Return a safe error message
        let message = error.message || 'Failed to send password reset email.';
        if (error.code === 'auth/user-not-found') {
            message = 'No user found with this email address.';
        }
        return { success: false, error: message }; // Returning actual error for debugging
    }
}

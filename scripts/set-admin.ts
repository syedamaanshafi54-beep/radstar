import * as admin from 'firebase-admin';

/**
 * Script to set custom user claims in Firebase.
 * Usage: npx tsx --env-file=.env scripts/set-admin.ts <UID>
 */

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!projectId || !clientEmail || !privateKey) {
    console.error('Error: Firebase Admin credentials not found in environment variables.');
    console.log('Ensure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY are set.');
    process.exit(1);
}

if (admin.apps.length === 0) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey,
        }),
    });
}

const identifier = process.argv[2];

if (!identifier) {
    console.error('Usage: npx tsx --env-file=.env scripts/set-admin.ts <UID or Email>');
    process.exit(1);
}

async function setAdminClaim(id: string) {
    try {
        let targetUid = id;

        // If it looks like an email, try resolving it to a UID
        if (id.includes('@')) {
            console.log(`Searching for user with email: ${id}...`);
            const userRecord = await admin.auth().getUserByEmail(id);
            targetUid = userRecord.uid;
            console.log(`Resolved to UID: ${targetUid}`);
        }

        // Set custom user claims (matching withAdminAuth logic)
        await admin.auth().setCustomUserClaims(targetUid, { role: 'admin' });

        console.log(`Successfully assigned admin claims to user: ${targetUid}`);

        // Fetch user to verify changes
        const user = await admin.auth().getUser(targetUid);
        console.log('Updated Custom Claims:', user.customClaims);

        console.log('\nNote: The user must sign out and sign back in (or refresh their ID token) for the changes to take effect on the client.');
    } catch (error) {
        console.error('Error setting custom claims:', error);
        process.exit(1);
    }
}

setAdminClaim(identifier);

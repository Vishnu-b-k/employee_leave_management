import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getAuth, Auth } from "firebase-admin/auth";

let adminApp: App;

const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "assessment-leave-app";
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY;
const emulatorHost = process.env.FIREBASE_AUTH_EMULATOR_HOST;
const useEmulator = process.env.USE_FIREBASE_EMULATOR === "true";

if (useEmulator && emulatorHost) {
  // Ensure the environment variable is set for the Admin SDK internals
  process.env.FIREBASE_AUTH_EMULATOR_HOST = emulatorHost;
} else {
  delete process.env.FIREBASE_AUTH_EMULATOR_HOST;
}

if (getApps().length === 0) {
  if (rawPrivateKey && clientEmail) {
    const privateKey = rawPrivateKey.replace(/\\n/g, "\n");
    adminApp = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      projectId,
    });
  } else {
    // Emulator or default credential mode
    adminApp = initializeApp({
      projectId,
    });
  }
} else {
  adminApp = getApps()[0];
}

export const adminAuth: Auth = getAuth(adminApp);
export { adminApp };

/**
 * Creates a server-side session cookie from a verified Firebase ID token.
 * Default validity: 5 days.
 */
export async function createSessionCookie(
  idToken: string,
  expiresInMs: number = 60 * 60 * 24 * 5 * 1000
): Promise<string> {
  return await adminAuth.createSessionCookie(idToken, { expiresIn: expiresInMs });
}

/**
 * Verifies a session cookie and returns the decoded claims.
 */
export async function verifySessionCookie(
  sessionCookie: string,
  checkRevoked: boolean = true
) {
  return await adminAuth.verifySessionCookie(sessionCookie, checkRevoked);
}

/**
 * Verifies an ID token directly (fallback or token-exchange mode).
 */
export async function verifyIdToken(
  idToken: string,
  checkRevoked: boolean = true
) {
  return await adminAuth.verifyIdToken(idToken, checkRevoked);
}

/**
 * Revokes all refresh tokens for a user (called on logout/security breach).
 */
export async function revokeUserTokens(uid: string): Promise<void> {
  await adminAuth.revokeRefreshTokens(uid);
}

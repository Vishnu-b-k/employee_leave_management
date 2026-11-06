import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, connectAuthEmulator, Auth } from "firebase/auth";
import { getAnalytics, isSupported, Analytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase App on Client (Singleton)
const app: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

const auth: Auth = getAuth(app);

// Connect to Firebase Auth Emulator only if explicitly enabled
if (typeof window !== "undefined") {
  const emulatorHost = process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST;
  const useEmulator = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true";

  if (useEmulator && emulatorHost) {
    try {
      const emulatorUrl = emulatorHost.startsWith("http")
        ? emulatorHost
        : `http://${emulatorHost}`;
      connectAuthEmulator(auth, emulatorUrl, { disableWarnings: true });
    } catch {
      // connectAuthEmulator throws if called more than once
    }
  }
}

// Initialize Analytics conditionally (only in browser and when supported)
let analytics: Analytics | null = null;
if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID) {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

export { app, auth, analytics };
export default auth;

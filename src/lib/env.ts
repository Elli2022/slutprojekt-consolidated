interface FirebaseWebConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId: string;
}

const rawFirebaseConfig: FirebaseWebConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? "",
};

export function getFirebaseConfig(): FirebaseWebConfig | null {
  const requiredValues = [
    rawFirebaseConfig.apiKey,
    rawFirebaseConfig.authDomain,
    rawFirebaseConfig.projectId,
    rawFirebaseConfig.appId,
  ];

  return requiredValues.every(Boolean) ? rawFirebaseConfig : null;
}

export const firebaseConfig = getFirebaseConfig();
export const isFirebaseConfigured = firebaseConfig !== null;

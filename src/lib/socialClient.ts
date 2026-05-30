import { isFirebaseConfigured } from "./env";
import type { AppMode, SocialClient } from "../types/social";

export const socialMode: AppMode = isFirebaseConfigured ? "firebase" : "demo";

export async function loadSocialClient(): Promise<SocialClient> {
  if (isFirebaseConfigured) {
    const { createFirebaseClient } = await import("./firebaseStore");
    return createFirebaseClient();
  }

  const { createDemoClient } = await import("./demoStore");
  return createDemoClient();
}

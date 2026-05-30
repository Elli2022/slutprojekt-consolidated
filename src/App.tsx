import { useEffect, useEffectEvent, useState } from "react";

import { AuthScreen } from "./components/AuthScreen";
import { Dashboard } from "./components/Dashboard";
import { toErrorMessage } from "./lib/errors";
import { loadSocialClient } from "./lib/socialClient";
import type {
  CreatePostInput,
  FeedPost,
  SignInInput,
  SignUpInput,
  SocialClient,
  UpdateProfileInput,
  UserProfile,
} from "./types/social";

function LoadingView() {
  return (
    <div className="page-shell">
      <div className="loading-panel surface-card">
        <p className="eyebrow">Preparing workspace</p>
        <h1>Booting the modernized app</h1>
        <p className="hero-copy compact">
          Checking your session, connecting the data layer, and warming up the UI.
        </p>
      </div>
    </div>
  );
}

export default function App() {
  const [client, setClient] = useState<SocialClient | null>(null);
  const [session, setSession] = useState<UserProfile | null | undefined>(
    undefined
  );
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [isAuthBusy, setIsAuthBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleError = useEffectEvent((streamError: unknown) => {
    setError(toErrorMessage(streamError));
  });

  const handleAuthState = useEffectEvent((nextSession: UserProfile | null) => {
    setSession(nextSession);
    setError(null);

    if (!nextSession) {
      setProfiles([]);
      setPosts([]);
    }
  });

  useEffect(() => {
    let isCancelled = false;

    void loadSocialClient()
      .then((loadedClient) => {
        if (!isCancelled) {
          setClient(loadedClient);
        }
      })
      .catch((loadError: unknown) => {
        if (!isCancelled) {
          handleError(loadError);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!client) {
      return;
    }

    return client.auth.subscribe({
      next: handleAuthState,
      error: handleError,
    });
  }, [client]);

  useEffect(() => {
    if (!client || !session) {
      return;
    }

    const unsubscribeProfiles = client.profiles.subscribe({
      next: setProfiles,
      error: handleError,
    });
    const unsubscribePosts = client.posts.subscribe({
      next: setPosts,
      error: handleError,
    });

    return () => {
      unsubscribeProfiles();
      unsubscribePosts();
    };
  }, [client, session]);

  function requireClient(): SocialClient {
    if (!client) {
      throw new Error("The app is still loading. Please try again.");
    }

    return client;
  }

  async function runAction<T>(action: () => Promise<T>): Promise<T> {
    setError(null);

    try {
      return await action();
    } catch (actionError) {
      const message = toErrorMessage(actionError);
      setError(message);
      throw new Error(message, { cause: actionError });
    }
  }

  async function handleSignIn(input: SignInInput) {
    const activeClient = requireClient();
    setIsAuthBusy(true);

    try {
      await runAction(() => activeClient.auth.signIn(input));
    } finally {
      setIsAuthBusy(false);
    }
  }

  async function handleSignUp(input: SignUpInput) {
    const activeClient = requireClient();
    setIsAuthBusy(true);

    try {
      await runAction(() => activeClient.auth.signUp(input));
    } finally {
      setIsAuthBusy(false);
    }
  }

  async function handleSaveProfile(input: UpdateProfileInput) {
    const activeClient = requireClient();
    const updatedProfile = await runAction(() => activeClient.profiles.update(input));
    setSession(updatedProfile);
    return updatedProfile;
  }

  if (!client || session === undefined) {
    return <LoadingView />;
  }

  if (!session) {
    return (
      <AuthScreen
        busy={isAuthBusy}
        error={error}
        mode={client.mode}
        onSignIn={handleSignIn}
        onSignUp={handleSignUp}
      />
    );
  }

  return (
    <Dashboard
      error={error}
      mode={client.mode}
      onCreatePost={(input: CreatePostInput) =>
        runAction(() => requireClient().posts.create(input))
      }
      onDeleteAccount={() => runAction(() => requireClient().auth.deleteAccount())}
      onSaveProfile={handleSaveProfile}
      onSignOut={() => runAction(() => requireClient().auth.signOut())}
      posts={posts}
      profiles={profiles}
      session={session}
    />
  );
}

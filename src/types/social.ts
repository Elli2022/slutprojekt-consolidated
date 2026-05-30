export type AppMode = "demo" | "firebase";

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string;
  bio: string;
  createdAt: string;
  createdAtMs: number;
  updatedAt: string;
  updatedAtMs: number;
}

export interface FeedPost {
  id: string;
  authorId: string;
  authorDisplayName: string;
  authorAvatarUrl: string;
  message: string;
  createdAt: string;
  createdAtMs: number;
}

export interface SignInInput {
  email: string;
  password: string;
}

export interface SignUpInput extends SignInInput {
  displayName: string;
  avatarUrl: string;
  bio: string;
}

export interface UpdateProfileInput {
  displayName: string;
  avatarUrl: string;
  bio: string;
}

export interface CreatePostInput {
  message: string;
}

export type Unsubscribe = () => void;

export interface SubscriptionOptions<TValue> {
  next: (value: TValue) => void;
  error?: (error: unknown) => void;
}

export interface SocialClient {
  mode: AppMode;
  auth: {
    subscribe: (
      options: SubscriptionOptions<UserProfile | null>
    ) => Unsubscribe;
    signIn: (input: SignInInput) => Promise<UserProfile>;
    signUp: (input: SignUpInput) => Promise<UserProfile>;
    signOut: () => Promise<void>;
    deleteAccount: () => Promise<void>;
  };
  posts: {
    subscribe: (options: SubscriptionOptions<FeedPost[]>) => Unsubscribe;
    create: (input: CreatePostInput) => Promise<void>;
  };
  profiles: {
    subscribe: (options: SubscriptionOptions<UserProfile[]>) => Unsubscribe;
    update: (input: UpdateProfileInput) => Promise<UserProfile>;
  };
}

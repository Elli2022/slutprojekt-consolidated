import { defaultAvatarUrl, toAvatarUrl } from "./avatars";
import type {
  CreatePostInput,
  FeedPost,
  SignInInput,
  SignUpInput,
  SocialClient,
  Unsubscribe,
  UpdateProfileInput,
  UserProfile,
} from "../types/social";

interface DemoUserRecord extends UserProfile {
  password: string;
}

interface DemoDatabase {
  users: Record<string, DemoUserRecord>;
  posts: FeedPost[];
  sessionUserId: string | null;
}

const STORAGE_KEY = "signal-social-demo-db";
const STORAGE_EVENT = "signal-social-demo-change";
const eventTarget = new EventTarget();

function createTimestamp(offsetMs = 0) {
  const date = new Date(Date.now() + offsetMs);
  return {
    createdAt: date.toISOString(),
    createdAtMs: date.getTime(),
  };
}

function createSeedUser(
  id: string,
  displayName: string,
  email: string,
  bio: string,
  password: string
): DemoUserRecord {
  const stamp = createTimestamp();

  return {
    id,
    email,
    displayName,
    avatarUrl: toAvatarUrl(displayName),
    bio,
    password,
    createdAt: stamp.createdAt,
    createdAtMs: stamp.createdAtMs,
    updatedAt: stamp.createdAt,
    updatedAtMs: stamp.createdAtMs,
  };
}

function buildSeedDatabase(): DemoDatabase {
  const ada = createSeedUser(
    "demo-ada",
    "Ada Rivera",
    "ada@signal.social",
    "Designing calm, clear product spaces.",
    "welcome123"
  );
  const noah = createSeedUser(
    "demo-noah",
    "Noah Berg",
    "noah@signal.social",
    "Shipping frontend systems with a strong eye for detail.",
    "welcome123"
  );

  const firstPostStamp = createTimestamp(-3_600_000);
  const secondPostStamp = createTimestamp(-1_800_000);

  return {
    sessionUserId: null,
    users: {
      [ada.id]: ada,
      [noah.id]: noah,
    },
    posts: [
      {
        id: "demo-post-1",
        authorId: noah.id,
        authorDisplayName: noah.displayName,
        authorAvatarUrl: noah.avatarUrl,
        message:
          "Shared a new UI pass for the community feed. Looking much cleaner on mobile now.",
        createdAt: firstPostStamp.createdAt,
        createdAtMs: firstPostStamp.createdAtMs,
      },
      {
        id: "demo-post-2",
        authorId: ada.id,
        authorDisplayName: ada.displayName,
        authorAvatarUrl: ada.avatarUrl,
        message:
          "Set up the product roadmap for the next release and opened a few polish tasks.",
        createdAt: secondPostStamp.createdAt,
        createdAtMs: secondPostStamp.createdAtMs,
      },
    ],
  };
}

function getStorage(): Storage {
  return window.localStorage;
}

function loadDatabase(): DemoDatabase {
  const existingData = getStorage().getItem(STORAGE_KEY);
  if (!existingData) {
    const seeded = buildSeedDatabase();
    persistDatabase(seeded);
    return seeded;
  }

  try {
    return JSON.parse(existingData) as DemoDatabase;
  } catch {
    const seeded = buildSeedDatabase();
    persistDatabase(seeded);
    return seeded;
  }
}

function persistDatabase(database: DemoDatabase): void {
  getStorage().setItem(STORAGE_KEY, JSON.stringify(database));
  eventTarget.dispatchEvent(new Event(STORAGE_EVENT));
}

function stripPassword(user: DemoUserRecord): UserProfile {
  const { password: _password, ...profile } = user;
  return profile;
}

function sortProfiles(users: DemoUserRecord[]): UserProfile[] {
  return users
    .map(stripPassword)
    .sort((left, right) => left.displayName.localeCompare(right.displayName));
}

function sortPosts(posts: FeedPost[]): FeedPost[] {
  return [...posts].sort((left, right) => right.createdAtMs - left.createdAtMs);
}

function subscribeDatabase(listener: (database: DemoDatabase) => void): Unsubscribe {
  const handleChange = () => {
    listener(loadDatabase());
  };

  handleChange();
  eventTarget.addEventListener(STORAGE_EVENT, handleChange);
  window.addEventListener("storage", handleChange);

  return () => {
    eventTarget.removeEventListener(STORAGE_EVENT, handleChange);
    window.removeEventListener("storage", handleChange);
  };
}

function requireCurrentUser(database: DemoDatabase): DemoUserRecord {
  const currentUserId = database.sessionUserId;

  if (!currentUserId || !database.users[currentUserId]) {
    throw new Error("DEMO_AUTH_REQUIRED");
  }

  return database.users[currentUserId];
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function createUserId() {
  return `demo-${crypto.randomUUID()}`;
}

export function createDemoClient(): SocialClient {
  return {
    mode: "demo",
    auth: {
      subscribe({ next }) {
        return subscribeDatabase((database) => {
          const currentUser = database.sessionUserId
            ? database.users[database.sessionUserId] ?? null
            : null;

          next(currentUser ? stripPassword(currentUser) : null);
        });
      },
      async signIn(input: SignInInput) {
        const database = loadDatabase();
        const email = normalizeEmail(input.email);
        const user = Object.values(database.users).find(
          (candidate) =>
            candidate.email === email && candidate.password === input.password
        );

        if (!user) {
          throw new Error("DEMO_INVALID_CREDENTIALS");
        }

        database.sessionUserId = user.id;
        persistDatabase(database);
        return stripPassword(user);
      },
      async signUp(input: SignUpInput) {
        const database = loadDatabase();
        const email = normalizeEmail(input.email);
        const emailExists = Object.values(database.users).some(
          (candidate) => candidate.email === email
        );

        if (emailExists) {
          throw new Error("DEMO_DUPLICATE_EMAIL");
        }

        const stamp = createTimestamp();
        const user: DemoUserRecord = {
          id: createUserId(),
          email,
          displayName: input.displayName.trim(),
          avatarUrl: input.avatarUrl.trim() || defaultAvatarUrl,
          bio: input.bio.trim(),
          password: input.password,
          createdAt: stamp.createdAt,
          createdAtMs: stamp.createdAtMs,
          updatedAt: stamp.createdAt,
          updatedAtMs: stamp.createdAtMs,
        };

        database.users[user.id] = user;
        database.sessionUserId = user.id;
        persistDatabase(database);
        return stripPassword(user);
      },
      async signOut() {
        const database = loadDatabase();
        database.sessionUserId = null;
        persistDatabase(database);
      },
      async deleteAccount() {
        const database = loadDatabase();
        const currentUser = requireCurrentUser(database);

        delete database.users[currentUser.id];
        database.posts = database.posts.filter(
          (post) => post.authorId !== currentUser.id
        );
        database.sessionUserId = null;
        persistDatabase(database);
      },
    },
    posts: {
      subscribe({ next }) {
        return subscribeDatabase((database) => {
          next(sortPosts(database.posts));
        });
      },
      async create(input: CreatePostInput) {
        const database = loadDatabase();
        const currentUser = requireCurrentUser(database);
        const stamp = createTimestamp();

        database.posts.unshift({
          id: `post-${crypto.randomUUID()}`,
          authorId: currentUser.id,
          authorDisplayName: currentUser.displayName,
          authorAvatarUrl: currentUser.avatarUrl,
          message: input.message.trim(),
          createdAt: stamp.createdAt,
          createdAtMs: stamp.createdAtMs,
        });

        persistDatabase(database);
      },
    },
    profiles: {
      subscribe({ next }) {
        return subscribeDatabase((database) => {
          next(sortProfiles(Object.values(database.users)));
        });
      },
      async update(input: UpdateProfileInput) {
        const database = loadDatabase();
        const currentUser = requireCurrentUser(database);
        const stamp = createTimestamp();
        const nextProfile: DemoUserRecord = {
          ...currentUser,
          displayName: input.displayName.trim(),
          avatarUrl: input.avatarUrl.trim(),
          bio: input.bio.trim(),
          updatedAt: stamp.createdAt,
          updatedAtMs: stamp.createdAtMs,
        };

        database.users[currentUser.id] = nextProfile;
        database.posts = database.posts.map((post) =>
          post.authorId === currentUser.id
            ? {
                ...post,
                authorDisplayName: nextProfile.displayName,
                authorAvatarUrl: nextProfile.avatarUrl,
              }
            : post
        );

        persistDatabase(database);
        return stripPassword(nextProfile);
      },
    },
  };
}

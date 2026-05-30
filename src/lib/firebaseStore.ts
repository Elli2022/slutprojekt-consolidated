import {
  createUserWithEmailAndPassword,
  deleteUser as deleteAuthUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as signOutUser,
  updateProfile as updateAuthProfile,
  type User,
} from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  where,
  writeBatch,
  type QueryDocumentSnapshot,
} from "firebase/firestore";

import { auth, db } from "./firebase";
import { toAvatarUrl } from "./avatars";
import type {
  CreatePostInput,
  FeedPost,
  SignInInput,
  SignUpInput,
  SocialClient,
  UpdateProfileInput,
  UserProfile,
} from "../types/social";

type FirestoreProfile = Omit<UserProfile, "id">;
type FirestorePost = Omit<FeedPost, "id">;

function createTimestamp() {
  return {
    createdAt: new Date().toISOString(),
    createdAtMs: Date.now(),
  };
}

function ensureFirebase() {
  if (!auth || !db) {
    throw new Error("Firebase is not configured.");
  }

  return { auth, db };
}

function normalizeProfileData(
  user: User,
  profile: Partial<FirestoreProfile>
): UserProfile {
  const stamp = createTimestamp();

  return {
    id: user.uid,
    email: user.email ?? profile.email ?? "",
    displayName:
      profile.displayName?.trim() || user.displayName || "Anonymous member",
    avatarUrl: profile.avatarUrl?.trim() || user.photoURL || toAvatarUrl(user.uid),
    bio: profile.bio?.trim() || "",
    createdAt: profile.createdAt ?? stamp.createdAt,
    createdAtMs: profile.createdAtMs ?? stamp.createdAtMs,
    updatedAt: profile.updatedAt ?? profile.createdAt ?? stamp.createdAt,
    updatedAtMs:
      profile.updatedAtMs ?? profile.createdAtMs ?? stamp.createdAtMs,
  };
}

function toFirestoreProfile(profile: UserProfile): FirestoreProfile {
  const { id: _id, ...rest } = profile;
  return rest;
}

function mapProfileSnapshot(
  snapshot: QueryDocumentSnapshot
): UserProfile {
  const data = snapshot.data() as FirestoreProfile;

  return {
    id: snapshot.id,
    email: data.email ?? "",
    displayName: data.displayName ?? "Anonymous member",
    avatarUrl: data.avatarUrl ?? toAvatarUrl(snapshot.id),
    bio: data.bio ?? "",
    createdAt: data.createdAt ?? new Date(0).toISOString(),
    createdAtMs: data.createdAtMs ?? 0,
    updatedAt: data.updatedAt ?? data.createdAt ?? new Date(0).toISOString(),
    updatedAtMs: data.updatedAtMs ?? data.createdAtMs ?? 0,
  };
}

function mapPostSnapshot(snapshot: QueryDocumentSnapshot): FeedPost {
  const data = snapshot.data() as FirestorePost;

  return {
    id: snapshot.id,
    authorId: data.authorId,
    authorDisplayName: data.authorDisplayName,
    authorAvatarUrl: data.authorAvatarUrl,
    message: data.message,
    createdAt: data.createdAt,
    createdAtMs: data.createdAtMs,
  };
}

async function ensureProfileForUser(
  user: User,
  seedProfile: Partial<FirestoreProfile> = {}
): Promise<UserProfile> {
  const { db: database } = ensureFirebase();
  const profileRef = doc(database, "profiles", user.uid);
  const snapshot = await getDoc(profileRef);

  const mergedProfile = normalizeProfileData(user, {
    ...(snapshot.data() as Partial<FirestoreProfile> | undefined),
    ...seedProfile,
  });

  await setDoc(profileRef, toFirestoreProfile(mergedProfile), { merge: true });
  return mergedProfile;
}

async function syncAuthDisplayFields(profile: UserProfile): Promise<void> {
  const { auth: firebaseAuth } = ensureFirebase();

  if (!firebaseAuth.currentUser) {
    return;
  }

  await updateAuthProfile(firebaseAuth.currentUser, {
    displayName: profile.displayName,
    photoURL: profile.avatarUrl,
  });
}

export function createFirebaseClient(): SocialClient {
  return {
    mode: "firebase",
    auth: {
      subscribe({ next, error }) {
        const { auth: firebaseAuth } = ensureFirebase();

        return onAuthStateChanged(
          firebaseAuth,
          (user) => {
            void (async () => {
              if (!user) {
                next(null);
                return;
              }

              try {
                next(await ensureProfileForUser(user));
              } catch (authError) {
                error?.(authError);
              }
            })();
          },
          error
        );
      },
      async signIn(input: SignInInput) {
        const { auth: firebaseAuth } = ensureFirebase();
        const credential = await signInWithEmailAndPassword(
          firebaseAuth,
          input.email.trim(),
          input.password
        );

        return ensureProfileForUser(credential.user);
      },
      async signUp(input: SignUpInput) {
        const { auth: firebaseAuth } = ensureFirebase();
        const credential = await createUserWithEmailAndPassword(
          firebaseAuth,
          input.email.trim(),
          input.password
        );

        await updateAuthProfile(credential.user, {
          displayName: input.displayName.trim(),
          photoURL: input.avatarUrl.trim(),
        });

        return ensureProfileForUser(credential.user, {
          displayName: input.displayName.trim(),
          email: input.email.trim(),
          avatarUrl: input.avatarUrl.trim(),
          bio: input.bio.trim(),
        });
      },
      async signOut() {
        const { auth: firebaseAuth } = ensureFirebase();
        await signOutUser(firebaseAuth);
      },
      async deleteAccount() {
        const { auth: firebaseAuth, db: database } = ensureFirebase();
        const currentUser = firebaseAuth.currentUser;

        if (!currentUser) {
          throw new Error("auth/requires-recent-login");
        }

        const postsQuery = query(
          collection(database, "posts"),
          where("authorId", "==", currentUser.uid)
        );
        const postsSnapshot = await getDocs(postsQuery);
        const batch = writeBatch(database);

        postsSnapshot.forEach((post) => {
          batch.delete(post.ref);
        });

        batch.delete(doc(database, "profiles", currentUser.uid));
        await batch.commit();
        await deleteAuthUser(currentUser);
      },
    },
    posts: {
      subscribe({ next, error }) {
        const { db: database } = ensureFirebase();
        const postsQuery = query(
          collection(database, "posts"),
          orderBy("createdAtMs", "desc")
        );

        return onSnapshot(
          postsQuery,
          (snapshot) => {
            next(snapshot.docs.map(mapPostSnapshot));
          },
          error
        );
      },
      async create(input: CreatePostInput) {
        const { auth: firebaseAuth, db: database } = ensureFirebase();
        const currentUser = firebaseAuth.currentUser;

        if (!currentUser) {
          throw new Error("auth/requires-recent-login");
        }

        const profile = await ensureProfileForUser(currentUser);
        const postRef = doc(collection(database, "posts"));
        const stamp = createTimestamp();
        const post: FirestorePost = {
          authorId: profile.id,
          authorDisplayName: profile.displayName,
          authorAvatarUrl: profile.avatarUrl,
          message: input.message.trim(),
          createdAt: stamp.createdAt,
          createdAtMs: stamp.createdAtMs,
        };

        await setDoc(postRef, post);
      },
    },
    profiles: {
      subscribe({ next, error }) {
        const { db: database } = ensureFirebase();
        const profilesQuery = query(
          collection(database, "profiles"),
          orderBy("displayName", "asc")
        );

        return onSnapshot(
          profilesQuery,
          (snapshot) => {
            next(snapshot.docs.map(mapProfileSnapshot));
          },
          error
        );
      },
      async update(input: UpdateProfileInput) {
        const { auth: firebaseAuth, db: database } = ensureFirebase();
        const currentUser = firebaseAuth.currentUser;

        if (!currentUser) {
          throw new Error("auth/requires-recent-login");
        }

        const existingProfile = await ensureProfileForUser(currentUser);
        const stamp = createTimestamp();
        const nextProfile: UserProfile = {
          ...existingProfile,
          displayName: input.displayName.trim(),
          avatarUrl: input.avatarUrl.trim(),
          bio: input.bio.trim(),
          updatedAt: stamp.createdAt,
          updatedAtMs: stamp.createdAtMs,
        };

        await setDoc(
          doc(database, "profiles", currentUser.uid),
          toFirestoreProfile(nextProfile),
          { merge: true }
        );
        await syncAuthDisplayFields(nextProfile);

        const postsQuery = query(
          collection(database, "posts"),
          where("authorId", "==", currentUser.uid)
        );
        const postsSnapshot = await getDocs(postsQuery);

        if (!postsSnapshot.empty) {
          const batch = writeBatch(database);
          postsSnapshot.forEach((post) => {
            batch.update(post.ref, {
              authorDisplayName: nextProfile.displayName,
              authorAvatarUrl: nextProfile.avatarUrl,
            });
          });
          await batch.commit();
        }

        return nextProfile;
      },
    },
  };
}

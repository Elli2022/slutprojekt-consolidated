import { useDeferredValue, useEffect, useState, type FormEvent } from "react";

import { formatAbsoluteTime, formatRelativeTime, getInitials } from "../lib/format";
import { toErrorMessage } from "../lib/errors";
import { validatePost, validateProfileUpdate } from "../lib/validators";
import type {
  AppMode,
  CreatePostInput,
  FeedPost,
  UpdateProfileInput,
  UserProfile,
} from "../types/social";

interface DashboardProps {
  mode: AppMode;
  session: UserProfile;
  profiles: UserProfile[];
  posts: FeedPost[];
  error: string | null;
  onCreatePost: (input: CreatePostInput) => Promise<void>;
  onDeleteAccount: () => Promise<void>;
  onSaveProfile: (input: UpdateProfileInput) => Promise<UserProfile>;
  onSignOut: () => Promise<void>;
}

export function Dashboard({
  mode,
  session,
  profiles,
  posts,
  error,
  onCreatePost,
  onDeleteAccount,
  onSaveProfile,
  onSignOut,
}: DashboardProps) {
  const [messageDraft, setMessageDraft] = useState("");
  const [memberQuery, setMemberQuery] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isClosingSession, setIsClosingSession] = useState(false);
  const [profileDraft, setProfileDraft] = useState<UpdateProfileInput>({
    displayName: session.displayName,
    avatarUrl: session.avatarUrl,
    bio: session.bio,
  });

  const deferredMemberQuery = useDeferredValue(memberQuery.trim().toLowerCase());
  const visibleError = localError ?? error;
  const myPostsCount = posts.filter((post) => post.authorId === session.id).length;
  const filteredMembers = profiles.filter((profile) => {
    if (!deferredMemberQuery) {
      return true;
    }

    const haystack = `${profile.displayName} ${profile.email}`.toLowerCase();
    return haystack.includes(deferredMemberQuery);
  });

  useEffect(() => {
    setProfileDraft({
      displayName: session.displayName,
      avatarUrl: session.avatarUrl,
      bio: session.bio,
    });
  }, [session.avatarUrl, session.bio, session.displayName, session.id]);

  async function handleCreatePost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLocalError(null);

    const payload: CreatePostInput = {
      message: messageDraft,
    };
    const validation = validatePost(payload);

    if (validation) {
      setLocalError(validation);
      return;
    }

    setIsPosting(true);

    try {
      await onCreatePost(payload);
      setMessageDraft("");
    } catch (actionError) {
      setLocalError(toErrorMessage(actionError));
    } finally {
      setIsPosting(false);
    }
  }

  async function handleSaveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLocalError(null);

    const validation = validateProfileUpdate(profileDraft);
    if (validation) {
      setLocalError(validation);
      return;
    }

    setIsSavingProfile(true);

    try {
      await onSaveProfile(profileDraft);
    } catch (actionError) {
      setLocalError(toErrorMessage(actionError));
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function handleDeleteAccount() {
    const shouldDelete = window.confirm(
      "Delete your account and all of your posts? This cannot be undone."
    );

    if (!shouldDelete) {
      return;
    }

    setLocalError(null);
    setIsClosingSession(true);

    try {
      await onDeleteAccount();
    } catch (actionError) {
      setLocalError(toErrorMessage(actionError));
    } finally {
      setIsClosingSession(false);
    }
  }

  async function handleSignOut() {
    setLocalError(null);
    setIsClosingSession(true);

    try {
      await onSignOut();
    } catch (actionError) {
      setLocalError(toErrorMessage(actionError));
    } finally {
      setIsClosingSession(false);
    }
  }

  return (
    <div className="page-shell">
      <div className="dashboard-shell">
        <header className="surface-card dashboard-header">
          <div>
            <p className="eyebrow">Member workspace</p>
            <h1>Welcome back, {session.displayName}</h1>
            <p className="hero-copy compact">
              Publish updates, keep your profile fresh, and manage the community
              from one place.
            </p>
          </div>

          <div className="header-meta">
            <span className={`status-pill ${mode}`}>
              {mode === "firebase" ? "Firebase live" : "Demo mode"}
            </span>
            <button
              className="secondary-button"
              disabled={isClosingSession}
              onClick={() => {
                void handleSignOut();
              }}
              type="button"
            >
              {isClosingSession ? "Working..." : "Sign out"}
            </button>
          </div>
        </header>

        {visibleError ? <p className="form-error inline">{visibleError}</p> : null}

        <main className="dashboard-grid">
          <aside className="sidebar-stack">
            <section className="surface-card profile-card">
              <div className="profile-identity">
                <img
                  alt={`${session.displayName} avatar`}
                  className="avatar avatar-large"
                  src={session.avatarUrl}
                />
                <div>
                  <h2>{session.displayName}</h2>
                  <p className="muted-copy">{session.email}</p>
                </div>
              </div>

              <p className="profile-bio">{session.bio || "No bio added yet."}</p>

              <div className="stats-grid">
                <article className="stat-tile">
                  <strong>{profiles.length}</strong>
                  <span>Members</span>
                </article>
                <article className="stat-tile">
                  <strong>{posts.length}</strong>
                  <span>Posts</span>
                </article>
                <article className="stat-tile">
                  <strong>{myPostsCount}</strong>
                  <span>Your updates</span>
                </article>
              </div>
            </section>

            <section className="surface-card">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Profile settings</p>
                  <h2>Tune your presence</h2>
                </div>
              </div>

              <form className="stack-form" onSubmit={handleSaveProfile}>
                <label className="field">
                  <span>Display name</span>
                  <input
                    onChange={(event) =>
                      setProfileDraft((currentDraft) => ({
                        ...currentDraft,
                        displayName: event.target.value,
                      }))
                    }
                    value={profileDraft.displayName}
                  />
                </label>

                <label className="field">
                  <span>Avatar URL</span>
                  <input
                    onChange={(event) =>
                      setProfileDraft((currentDraft) => ({
                        ...currentDraft,
                        avatarUrl: event.target.value,
                      }))
                    }
                    value={profileDraft.avatarUrl}
                  />
                </label>

                <label className="field">
                  <span>Bio</span>
                  <textarea
                    onChange={(event) =>
                      setProfileDraft((currentDraft) => ({
                        ...currentDraft,
                        bio: event.target.value,
                      }))
                    }
                    rows={4}
                    value={profileDraft.bio}
                  />
                </label>

                <button
                  className="primary-button"
                  disabled={isSavingProfile}
                  type="submit"
                >
                  {isSavingProfile ? "Saving..." : "Save profile"}
                </button>
              </form>
            </section>

            <section className="surface-card danger-card">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Account safety</p>
                  <h2>Danger zone</h2>
                </div>
              </div>

              <p className="muted-copy">
                Account deletion removes your member profile and every post
                published from it.
              </p>
              <button
                className="danger-button"
                disabled={isClosingSession}
                onClick={() => {
                  void handleDeleteAccount();
                }}
                type="button"
              >
                {isClosingSession ? "Working..." : "Delete account"}
              </button>
            </section>
          </aside>

          <section className="content-stack">
            <section className="surface-card">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Composer</p>
                  <h2>Share what is moving</h2>
                </div>
                <span className="muted-copy">{messageDraft.trim().length}/280</span>
              </div>

              <form className="stack-form" onSubmit={handleCreatePost}>
                <label className="field">
                  <span>New post</span>
                  <textarea
                    onChange={(event) => setMessageDraft(event.target.value)}
                    placeholder="What are you shipping, learning, or polishing today?"
                    rows={4}
                    value={messageDraft}
                  />
                </label>
                <button className="primary-button" disabled={isPosting} type="submit">
                  {isPosting ? "Posting..." : "Publish update"}
                </button>
              </form>
            </section>

            <section className="surface-card">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Live feed</p>
                  <h2>Community updates</h2>
                </div>
              </div>

              <div className="feed-list">
                {posts.length === 0 ? (
                  <article className="empty-state">
                    <h3>No posts yet</h3>
                    <p>Be the first to publish an update and give the space some energy.</p>
                  </article>
                ) : (
                  posts.map((post) => (
                    <article className="feed-card" key={post.id}>
                      <div className="feed-header">
                        <div className="feed-author">
                          <img
                            alt={`${post.authorDisplayName} avatar`}
                            className="avatar"
                            src={post.authorAvatarUrl}
                          />
                          <div>
                            <div className="feed-name-row">
                              <strong>{post.authorDisplayName}</strong>
                              {post.authorId === session.id ? (
                                <span className="member-badge">You</span>
                              ) : null}
                            </div>
                            <p className="muted-copy">
                              {formatRelativeTime(post.createdAt)} ·{" "}
                              {formatAbsoluteTime(post.createdAt)}
                            </p>
                          </div>
                        </div>
                        <span className="initial-badge">
                          {getInitials(post.authorDisplayName)}
                        </span>
                      </div>
                      <p className="feed-message">{post.message}</p>
                    </article>
                  ))
                )}
              </div>
            </section>

            <section className="surface-card">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Community directory</p>
                  <h2>Members</h2>
                </div>
              </div>

              <label className="field field-inline">
                <span>Search members</span>
                <input
                  onChange={(event) => setMemberQuery(event.target.value)}
                  placeholder="Search by name or email"
                  value={memberQuery}
                />
              </label>

              <div className="member-list">
                {filteredMembers.map((profile) => (
                  <article className="member-card" key={profile.id}>
                    <img
                      alt={`${profile.displayName} avatar`}
                      className="avatar"
                      src={profile.avatarUrl}
                    />
                    <div className="member-copy">
                      <div className="feed-name-row">
                        <strong>{profile.displayName}</strong>
                        {profile.id === session.id ? (
                          <span className="member-badge">You</span>
                        ) : null}
                      </div>
                      <p className="muted-copy">{profile.email}</p>
                      <p className="profile-bio small">
                        {profile.bio || "No bio added yet."}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </section>
        </main>
      </div>
    </div>
  );
}

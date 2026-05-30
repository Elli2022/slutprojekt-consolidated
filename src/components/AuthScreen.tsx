import { startTransition, useState, type FormEvent } from "react";

import { avatarOptions } from "../lib/avatars";
import { toErrorMessage } from "../lib/errors";
import { validateSignIn, validateSignUp } from "../lib/validators";
import type { AppMode, SignInInput, SignUpInput } from "../types/social";

type AuthView = "signin" | "signup";

interface AuthScreenProps {
  mode: AppMode;
  busy: boolean;
  error: string | null;
  onSignIn: (input: SignInInput) => Promise<void>;
  onSignUp: (input: SignUpInput) => Promise<void>;
}

interface FormState {
  displayName: string;
  email: string;
  password: string;
  avatarUrl: string;
  bio: string;
}

const initialFormState: FormState = {
  displayName: "",
  email: "",
  password: "",
  avatarUrl: avatarOptions[0].url,
  bio: "",
};

export function AuthScreen({
  mode,
  busy,
  error,
  onSignIn,
  onSignUp,
}: AuthScreenProps) {
  const [view, setView] = useState<AuthView>("signup");
  const [localError, setLocalError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(initialFormState);

  const visibleError = localError ?? error;

  function updateField<Field extends keyof FormState>(
    field: Field,
    value: FormState[Field]
  ) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  }

  function switchView(nextView: AuthView) {
    setLocalError(null);
    startTransition(() => {
      setView(nextView);
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLocalError(null);

    if (view === "signin") {
      const payload: SignInInput = {
        email: form.email.trim().toLowerCase(),
        password: form.password,
      };
      const validation = validateSignIn(payload);

      if (validation) {
        setLocalError(validation);
        return;
      }

      try {
        await onSignIn(payload);
        setForm((currentForm) => ({
          ...currentForm,
          password: "",
        }));
      } catch (submitError) {
        setLocalError(toErrorMessage(submitError));
      }

      return;
    }

    const payload: SignUpInput = {
      displayName: form.displayName.trim(),
      email: form.email.trim().toLowerCase(),
      password: form.password,
      avatarUrl: form.avatarUrl.trim(),
      bio: form.bio.trim(),
    };
    const validation = validateSignUp(payload);

    if (validation) {
      setLocalError(validation);
      return;
    }

    try {
      await onSignUp(payload);
      setForm((currentForm) => ({
        ...currentForm,
        password: "",
      }));
    } catch (submitError) {
      setLocalError(toErrorMessage(submitError));
    }
  }

  return (
    <div className="page-shell">
      <main className="auth-layout">
        <section className="surface-card hero-card">
          <p className="eyebrow">Modernized community stack</p>
          <h1>Signal Social</h1>
          <p className="hero-copy">
            A rebuilt social hub with a modern frontend, safer account flow,
            and a clean path from demo mode to production Firebase.
          </p>

          <div className="feature-grid">
            <article className="feature-tile">
              <h2>Realtime feed</h2>
              <p>Posts and member profiles sync live when Firebase is connected.</p>
            </article>
            <article className="feature-tile">
              <h2>Safer auth</h2>
              <p>Email and password now belong to Firebase Authentication.</p>
            </article>
            <article className="feature-tile">
              <h2>Demo fallback</h2>
              <p>Local demo mode keeps the app useful even before config is ready.</p>
            </article>
          </div>
        </section>

        <section className="surface-card auth-card">
          <div className="auth-card-header">
            <div>
              <p className="eyebrow">Member access</p>
              <h2>{view === "signup" ? "Create your profile" : "Welcome back"}</h2>
            </div>
            <span className={`status-pill ${mode}`}>
              {mode === "firebase" ? "Firebase live" : "Demo mode"}
            </span>
          </div>

          {mode === "demo" ? (
            <div className="notice-banner">
              Add `VITE_FIREBASE_*` values to leave demo mode. Until then, the app
              stores sample members and posts in your browser only.
            </div>
          ) : null}

          <div className="toggle-row" role="tablist" aria-label="Authentication mode">
            <button
              className={view === "signup" ? "toggle-button active" : "toggle-button"}
              onClick={() => switchView("signup")}
              type="button"
            >
              Create account
            </button>
            <button
              className={view === "signin" ? "toggle-button active" : "toggle-button"}
              onClick={() => switchView("signin")}
              type="button"
            >
              Sign in
            </button>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {view === "signup" ? (
              <>
                <label className="field">
                  <span>Display name</span>
                  <input
                    autoComplete="nickname"
                    onChange={(event) => updateField("displayName", event.target.value)}
                    placeholder="Ada Rivera"
                    value={form.displayName}
                  />
                </label>

                <label className="field">
                  <span>Pick an avatar</span>
                  <select
                    onChange={(event) => updateField("avatarUrl", event.target.value)}
                    value={form.avatarUrl}
                  >
                    {avatarOptions.map((avatar) => (
                      <option key={avatar.label} value={avatar.url}>
                        {avatar.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="field">
                  <span>Or paste a custom avatar URL</span>
                  <input
                    onChange={(event) => updateField("avatarUrl", event.target.value)}
                    placeholder="https://example.com/avatar.png"
                    value={form.avatarUrl}
                  />
                </label>

                <div className="avatar-preview-card">
                  <img
                    alt="Selected avatar preview"
                    className="avatar avatar-large"
                    src={form.avatarUrl}
                  />
                  <div>
                    <p className="avatar-preview-label">Profile preview</p>
                    <p className="avatar-preview-copy">
                      Your avatar and bio appear beside every post you publish.
                    </p>
                  </div>
                </div>

                <label className="field">
                  <span>Short bio</span>
                  <textarea
                    onChange={(event) => updateField("bio", event.target.value)}
                    placeholder="Building calm digital spaces."
                    rows={3}
                    value={form.bio}
                  />
                </label>
              </>
            ) : null}

            <label className="field">
              <span>Email</span>
              <input
                autoComplete="email"
                onChange={(event) => updateField("email", event.target.value)}
                placeholder="you@example.com"
                type="email"
                value={form.email}
              />
            </label>

            <label className="field">
              <span>Password</span>
              <input
                autoComplete={
                  view === "signup" ? "new-password" : "current-password"
                }
                onChange={(event) => updateField("password", event.target.value)}
                placeholder="At least 8 characters"
                type="password"
                value={form.password}
              />
            </label>

            {visibleError ? <p className="form-error">{visibleError}</p> : null}

            <button className="primary-button" disabled={busy} type="submit">
              {busy
                ? "Working..."
                : view === "signup"
                  ? "Create account"
                  : "Sign in"}
            </button>

            {mode === "demo" ? (
              <p className="helper-copy">
                Demo login is prefilled by the seeded sample accounts after first run.
                Use `ada@signal.social` or `noah@signal.social` with
                password `welcome123`.
              </p>
            ) : null}
          </form>
        </section>
      </main>
    </div>
  );
}

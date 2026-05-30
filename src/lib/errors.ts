const mappedErrors = new Map<string, string>([
  ["auth/email-already-in-use", "An account with that email already exists."],
  ["auth/invalid-credential", "The email or password is incorrect."],
  ["auth/invalid-email", "Enter a valid email address."],
  ["auth/requires-recent-login", "Sign in again before deleting the account."],
  ["auth/too-many-requests", "Too many attempts. Please wait and try again."],
  ["auth/user-disabled", "This account has been disabled."],
  ["auth/weak-password", "Use a stronger password with at least 8 characters."],
  ["DEMO_AUTH_REQUIRED", "Sign in before changing community data."],
  ["DEMO_DUPLICATE_EMAIL", "An account with that email already exists."],
  ["DEMO_INVALID_CREDENTIALS", "The email or password is incorrect."],
]);

export function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    for (const [fragment, message] of mappedErrors) {
      if (error.message.includes(fragment)) {
        return message;
      }
    }

    return error.message || "Something went wrong.";
  }

  if (typeof error === "string") {
    return error;
  }

  return "Something went wrong.";
}

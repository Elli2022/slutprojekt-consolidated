import type {
  CreatePostInput,
  SignInInput,
  SignUpInput,
  UpdateProfileInput,
} from "../types/social";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const urlPattern = /^https?:\/\/.+/i;

function validatePassword(password: string): string | null {
  if (!password.trim()) {
    return "Add a password to continue.";
  }

  if (password.trim().length < 8) {
    return "Use at least 8 characters for the password.";
  }

  return null;
}

export function validateSignIn(input: SignInInput): string | null {
  if (!input.email.trim()) {
    return "Add an email address to continue.";
  }

  if (!emailPattern.test(input.email.trim())) {
    return "Enter a valid email address.";
  }

  return validatePassword(input.password);
}

export function validateSignUp(input: SignUpInput): string | null {
  if (input.displayName.trim().length < 2) {
    return "Choose a display name with at least 2 characters.";
  }

  if (input.displayName.trim().length > 32) {
    return "Display names should stay under 32 characters.";
  }

  if (input.bio.trim().length > 180) {
    return "Keep the bio under 180 characters.";
  }

  if (!input.avatarUrl.trim()) {
    return "Choose an avatar or paste an avatar URL.";
  }

  if (!urlPattern.test(input.avatarUrl.trim())) {
    return "Avatar URLs should start with http:// or https://.";
  }

  return validateSignIn(input);
}

export function validateProfileUpdate(
  input: UpdateProfileInput
): string | null {
  if (input.displayName.trim().length < 2) {
    return "Display name must be at least 2 characters.";
  }

  if (input.displayName.trim().length > 32) {
    return "Display name must stay under 32 characters.";
  }

  if (!urlPattern.test(input.avatarUrl.trim())) {
    return "Avatar URLs should start with http:// or https://.";
  }

  if (input.bio.trim().length > 180) {
    return "Keep the bio under 180 characters.";
  }

  return null;
}

export function validatePost(input: CreatePostInput): string | null {
  if (!input.message.trim()) {
    return "Write something before posting.";
  }

  if (input.message.trim().length > 280) {
    return "Posts should stay under 280 characters.";
  }

  return null;
}

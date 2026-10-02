import type { UserProfile } from '@/types/user';

const MOCK_LATENCY_MS = 800;

/**
 * Placeholder until the auth backend exists: accepts any credentials that
 * pass client-side validation.
 */
export async function loginWithEmail(
  email: string,
  _password: string,
): Promise<UserProfile> {
  await new Promise<void>(resolve => setTimeout(resolve, MOCK_LATENCY_MS));
  return {
    id: email,
    email,
    displayName: email.split('@')[0],
  };
}

export async function signUpWithEmail(
  fullName: string,
  email: string,
  _password: string,
): Promise<UserProfile> {
  await new Promise<void>(resolve => setTimeout(resolve, MOCK_LATENCY_MS));
  return {
    id: email,
    email,
    displayName: fullName,
  };
}

export async function requestPasswordReset(_email: string): Promise<void> {
  await new Promise<void>(resolve => setTimeout(resolve, MOCK_LATENCY_MS));
}

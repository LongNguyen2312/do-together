import type { ActivityCategory } from '@/types/activity';
import type { CustomActivity } from '@/types/broadcast';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  /** A few words about themselves, shown on their profile. */
  bio?: string;
  /** A small JPEG as a `data:` uri (see compressPhotoToDataUri). */
  avatarUri?: string;
  /** What they like doing, picked on the edit screen. */
  interests?: ActivityCategory[];
  /** Interests of their own, beyond the app's kinds: a name and an icon or photo. */
  customInterests?: CustomActivity[];
  /** Where they're from and where they live now: province ids (see places). */
  hometown?: string;
  currentCity?: string;
  /** Epoch ms they signed up; unknown for accounts from before. */
  joinedAt?: number;
}

/** What the user can change about themselves (any of it at once). */
export type ProfileChanges = Partial<
  Pick<
    UserProfile,
    | 'displayName'
    | 'bio'
    | 'avatarUri'
    | 'interests'
    | 'customInterests'
    | 'hometown'
    | 'currentCity'
  >
>;

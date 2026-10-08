/** A photo shared to the user's friends for a day. */
export interface Story {
  id: string;
  userId: string;
  /** A bundled asset, or a picked file. */
  photo: number | { uri: string };
  postedAt: number;
}

/** One person's live stories, oldest first. */
export interface StoryGroup {
  userId: string;
  stories: Story[];
  /** Has at least one story the user hasn't opened yet. */
  unseen: boolean;
}

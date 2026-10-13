/**
 * Deleting a chat clears the user's copy and takes it off their list, until
 * someone sends a new message.
 */
import reducer, {
  addMessage,
  deleteChat,
  threadIn,
  type ChatState,
} from '@/store/slices/chatSlice';
import type { ChatMessage } from '@/types/chat';

const ACTIVITY = 'quang-an-doubles';
const initial = reducer(undefined, { type: '@@init' }) as ChatState;

const message: ChatMessage = {
  id: 'new',
  senderId: 'someone',
  sentAt: Date.now(),
  text: 'Anyone up for tomorrow?',
};

describe('deleteChat', () => {
  it('empties the thread and marks the chat deleted', () => {
    expect(threadIn(initial, ACTIVITY).length).toBeGreaterThan(0);
    const state = reducer(initial, deleteChat(ACTIVITY));
    expect(threadIn(state, ACTIVITY)).toEqual([]);
    expect(state.deletedIds).toEqual([ACTIVITY]);
  });

  it('brings the chat back with its next message, and only that', () => {
    const deleted = reducer(initial, deleteChat(ACTIVITY));
    const state = reducer(
      deleted,
      addMessage({ activityId: ACTIVITY, message }),
    );
    expect(state.deletedIds).toEqual([]);
    expect(threadIn(state, ACTIVITY)).toEqual([message]);
  });
});

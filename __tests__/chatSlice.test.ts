/**
 * Deleting a chat clears its messages and history on the user's side only:
 * they stay in the group and see what's sent after. Leaving is separate.
 */
import reducer, {
  addMessage,
  deleteChat,
  leaveChat,
  rejoinChat,
  threadIn,
  type ChatState,
} from '@/store/slices/chatSlice';
import type { ChatMessage } from '@/types/chat';

const ACTIVITY = 'quang-an-doubles';
const initial = reducer(undefined, { type: '@@init' }) as ChatState;

const message: ChatMessage = {
  id: 'new',
  senderId: 'someone',
  sentAt: Date.now() + 1000,
  text: 'Anyone up for tomorrow?',
};

describe('deleteChat', () => {
  it('empties the thread and remembers when, without leaving', () => {
    expect(threadIn(initial, ACTIVITY).length).toBeGreaterThan(0);
    const state = reducer(initial, deleteChat(ACTIVITY));
    expect(threadIn(state, ACTIVITY)).toEqual([]);
    expect(state.clearedAt[ACTIVITY]).toBeGreaterThan(0);
    expect(state.leftIds).toEqual([]);
  });

  it('keeps the old messages gone after a restart (only the clear is kept)', () => {
    const cleared = reducer(initial, deleteChat(ACTIVITY));
    const restarted = { ...initial, clearedAt: cleared.clearedAt };
    expect(threadIn(restarted, ACTIVITY)).toEqual([]);
    // The same clear gives the same list, so selectors don't churn.
    expect(threadIn(restarted, ACTIVITY)).toBe(threadIn(restarted, ACTIVITY));
  });

  it('shows what comes next', () => {
    const cleared = reducer(initial, deleteChat(ACTIVITY));
    const state = reducer(
      cleared,
      addMessage({ activityId: ACTIVITY, message }),
    );
    expect(threadIn(state, ACTIVITY)).toEqual([message]);
  });
});

describe('leaveChat', () => {
  it('leaves until rejoined', () => {
    const left = reducer(initial, leaveChat(ACTIVITY));
    expect(left.leftIds).toEqual([ACTIVITY]);
    expect(reducer(left, rejoinChat(ACTIVITY)).leftIds).toEqual([]);
  });
});

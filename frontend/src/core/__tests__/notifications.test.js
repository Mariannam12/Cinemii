import { describe, it, expect, beforeEach } from 'vitest';
import { getReadSet, markRead, countUnread } from '../notifications';

beforeEach(() => { localStorage.clear(); });

describe('notification read state', () => {
  const list = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];

  it('starts with everything unread', () => {
    expect(countUnread(list)).toBe(3);
    expect(getReadSet().size).toBe(0);
  });

  it('marks items read and counts the rest', () => {
    markRead(['a', 'b']);
    expect(getReadSet().has('a')).toBe(true);
    expect(countUnread(list)).toBe(1); // only 'c' remains unread
  });

  it('persists read ids across reads', () => {
    markRead(['a']);
    markRead(['c']);
    const set = getReadSet();
    expect(set.has('a')).toBe(true);
    expect(set.has('c')).toBe(true);
    expect(countUnread(list)).toBe(1); // only 'b'
  });
});

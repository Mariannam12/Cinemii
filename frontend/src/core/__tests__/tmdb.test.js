import { describe, it, expect } from 'vitest';
import { imgUrl, backdropUrl } from '../tmdb';

describe('tmdb image helpers', () => {
  it('builds a poster URL with the default size', () => {
    expect(imgUrl('/abc.jpg')).toBe('https://image.tmdb.org/t/p/w500/abc.jpg');
  });

  it('respects a custom size', () => {
    expect(imgUrl('/abc.jpg', 'w342')).toBe('https://image.tmdb.org/t/p/w342/abc.jpg');
  });

  it('returns null for a missing path', () => {
    expect(imgUrl(null)).toBeNull();
    expect(imgUrl(undefined)).toBeNull();
  });

  it('backdropUrl uses the original size', () => {
    expect(backdropUrl('/bg.jpg')).toBe('https://image.tmdb.org/t/p/original/bg.jpg');
  });
});

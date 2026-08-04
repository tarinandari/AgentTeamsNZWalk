import { difficultyBadgeTone } from './difficulty-badge';

describe('difficultyBadgeTone', () => {
  it('maps the real DB difficulty values to sensible tones', () => {
    expect(difficultyBadgeTone('Easy')).toBe('easy');
    expect(difficultyBadgeTone('Medium')).toBe('medium');
    expect(difficultyBadgeTone('Hard')).toBe('hard');
    expect(difficultyBadgeTone('Extreme')).toBe('hard');
    expect(difficultyBadgeTone('PwCrudDiff709192')).toBe('neutral');
  });

  it('is case-insensitive', () => {
    expect(difficultyBadgeTone('EASY')).toBe('easy');
    expect(difficultyBadgeTone('hard')).toBe('hard');
  });

  it('falls back to neutral for null/undefined/empty', () => {
    expect(difficultyBadgeTone(null)).toBe('neutral');
    expect(difficultyBadgeTone(undefined)).toBe('neutral');
    expect(difficultyBadgeTone('')).toBe('neutral');
  });
});

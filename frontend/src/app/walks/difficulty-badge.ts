export type DifficultyBadgeTone = 'easy' | 'medium' | 'hard' | 'neutral';

/**
 * Maps a difficulty name to a semantic badge tone by substring match (case-insensitive).
 * Falls back to 'neutral' for anything unrecognized (e.g. leftover seed/test data)
 * so unknown values render sensibly instead of crashing or being left unstyled.
 */
export function difficultyBadgeTone(name: string | null | undefined): DifficultyBadgeTone {
  const normalized = (name ?? '').trim().toLowerCase();
  if (normalized.includes('easy')) {
    return 'easy';
  }
  if (normalized.includes('medium') || normalized.includes('moderate')) {
    return 'medium';
  }
  if (normalized.includes('hard') || normalized.includes('extreme')) {
    return 'hard';
  }
  return 'neutral';
}

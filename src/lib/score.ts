export function finalScore(m: {
  ai_score: number | null;
  coach_score: number | null;
}): number {
  return m.coach_score ?? m.ai_score ?? 0;
}

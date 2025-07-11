import type { Graph } from 'graphlib';

/**
 * Checks if a user can attempt a concept based on mastery of prerequisites.
 */
export function canUserAttempt(
  conceptId: string,
  userProgressMap: Record<string, { masteryScore: number }>,
  graph: any,
  masteryThreshold = 70
): boolean {
  const prereqEdges = graph.inEdges(conceptId) || [];

  return prereqEdges.every((edge: any) => {
    const prereqId = edge.v;
    const score = userProgressMap[prereqId]?.masteryScore ?? 0;
    return score >= masteryThreshold;
  });
}

import UserConceptProgress from '../models/userConceptProgress';

/**
 * Builds a map: { conceptId: { masteryScore } } for the given user.
 */
export async function getUserProgressMap(userId: string) {
  const progressDocs = await UserConceptProgress.find({ userId });

  const map: Record<string, { masteryScore: number }> = {};
  for (const doc of progressDocs) {
    map[doc.conceptId.toString()] = {
      masteryScore: doc.score
    };
  }

  return map;
}

// Calculate the learning cost of this concept based on mastery:
// - If mastery is less than 0.7, user hasn't fully understood it,
//   so assign a cost equal to (1 - mastery) to prioritize lower scores.
// - If mastery is 0.7 or above, no cost is added (already mastered).
// - This cost helps rank paths — lower total cost = better recommendation.

import { Request, Response } from "express";
import UserConceptProgress from "../models/userConceptProgress";
import Concept from "../models/conceptModel";
import { buildConceptGraph, getAllPaths } from "../utils/graphUtils";

export const getRecommendation = async (req: Request, res: Response) => {
  try {
    // Get authenticated user from middleware
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Cast to any to access Mongoose document properties
    const user = req.user as any;
    const authenticatedUserId = user._id?.toString();
    if (!authenticatedUserId) {
      return res.status(401).json({ error: "Invalid user ID" });
    }

    const { goalConceptId } = req.params;
    const currentConceptId = req.query.currentConceptId as string;

    console.log("Recommendation request:", { 
      authenticatedUserId, 
      goalConceptId, 
      currentConceptId 
    });

    if (!goalConceptId || !currentConceptId) {
      return res.status(400).json({ error: "Missing goalConceptId or currentConceptId" });
    }

    // Fetch all concepts (titles + prerequisites)
    const concepts = await Concept.find({}, { _id: 1, title: 1, prerequisites: 1 });
    console.log("Total concepts found:", concepts.length);

    // Check if goal concept exists
    const goalConcept = concepts.find((c: any) => c._id?.toString() === goalConceptId);
    if (!goalConcept) {
      return res.status(404).json({ message: "Goal concept not found in database." });
    }

    // Build graph input for graphlib
    const conceptNodes = concepts.map((c: any) => ({
      _id: c._id.toString(),
      prerequisites: Array.isArray(c.prerequisites) ? c.prerequisites.map((p: any) => p.toString()) : [],
    }));

    const graph = buildConceptGraph(conceptNodes);

    // If currentConceptId is "root", find concepts with no prerequisites as starting points
    let allPathsRaw: string[][] = [];
    if (currentConceptId === "root") {
      // Find all concepts with no prerequisites as potential starting points
      const rootConcepts = concepts.filter((c: any) => !c.prerequisites || c.prerequisites.length === 0);
      console.log("Root concepts:", rootConcepts.map((c: any) => c.title));
      
      // Try to find paths from each root concept to the goal
      for (const rootConcept of rootConcepts) {
        const paths = getAllPaths(graph, rootConcept._id?.toString() || "", goalConceptId.toString());
        if (paths.length > 0) {
          allPathsRaw = paths;
          console.log(`Found ${paths.length} paths from ${rootConcept.title} to ${goalConcept.title}`);
          break;
        }
      }
      
      if (allPathsRaw.length === 0) {
        return res.status(404).json({ message: "No paths found to target concept from any starting point." });
      }
    } else {
      // Get all paths from current to goal concept
      allPathsRaw = getAllPaths(graph, currentConceptId.toString(), goalConceptId.toString());
      if (allPathsRaw.length === 0) {
        return res.status(404).json({ message: "No paths found to target concept." });
      }
    }

    // Fetch ALL user's progress docs using authenticated user ID
    const userProgressDocs = await UserConceptProgress.find({ userId: authenticatedUserId });
    const masteryMap: Record<string, number> = {};

    // Build mastery map: conceptId -> normalized masteryScore (0-1)
    userProgressDocs.forEach((doc: any) => {
      // masteryScore is 0-100, normalize to 0-1
      masteryMap[doc.conceptId] = (typeof doc.masteryScore === 'number') ? Math.max(0, Math.min(1, doc.masteryScore / 100)) : 0;
    });

    // Build lookup map of concept metadata
    const conceptMap: Record<string, { title: string; prerequisites: string[] }> = {};
    concepts.forEach((c: any) => {
      conceptMap[c._id.toString()] = {
        title: c.title,
        prerequisites: (c.prerequisites || []).map((p: any) => p.toString())
      };
    });

    // Prepare all possible paths with lock and mastery details
    const allPaths = allPathsRaw.map(path => {
      let totalCost = 0;

      const detailedPath = path.map(conceptId => {
        const prereqs = conceptMap[conceptId]?.prerequisites || [];

        const prerequisiteMasteries = prereqs.map(prereqId => ({
          prerequisiteId: prereqId,
          score: masteryMap[prereqId] ?? 0
        }));

        const locked = prerequisiteMasteries.some(p => p.score < 0.7);

        const mastery = masteryMap[conceptId] ?? 0;
        const cost = (mastery < 0.7) ? 1 - mastery : 0;
        totalCost += cost;

        return {
          conceptId,
          title: conceptMap[conceptId]?.title || "Unknown",
          locked,
          prerequisiteMasteries
        };
      });

      return { path, detailedPath, totalCost };
    });

    // Choose best path (lowest cost)
    const bestPath = [...allPaths].sort((a, b) => a.totalCost - b.totalCost)[0];

    console.log("Best path found:", bestPath?.detailedPath?.map((p: any) => p.title));

    return res.status(200).json({
      bestPath,
      allPaths
    });

  } catch (error: any) {
    console.error("Error generating recommendation:", error);
    return res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
};


// // ✅ Enhancements Made:
// // Includes complexity and estLearningTimeHours (converted to minutes).

// // Uses a weighted cost formula:
// // totalCost = α * (1 - masteryScore) + β * complexity + γ * estimatedTime

// // Returns best path based on total cost.

// // You can tune α, β, γ as per learning goal.

// import { Request, Response } from "express";
// import UserConceptProgress from "../models/userConceptProgress";
// import Concept from "../models/conceptModel";
// import { buildConceptGraph, getAllPaths } from "../utils/graphUtils";

// export const getRecommendation = async (req: Request, res: Response) => {
//   try {
//     const { userId, goalConceptId } = req.params;
//     const currentConceptId = req.query.currentConceptId as string;

//     if (!userId || !goalConceptId || !currentConceptId) {
//       return res.status(400).json({ error: "Missing userId, goalConceptId, or currentConceptId" });
//     }

//     // Fetch all concepts with required fields
//     const concepts = await Concept.find({}, {
//       _id: 1,
//       title: 1,
//       prerequisites: 1,
//       complexity: 1,
//       estLearningTimeHours: 1
//     });

//     // Build graph
//     const conceptNodes = concepts.map(c => ({
//       _id: c.id.toString(),
//       prerequisites: Array.isArray(c.prerequisites) ? c.prerequisites.map(p => p.toString()) : [],
//     }));

//     const graph = buildConceptGraph(conceptNodes);

//     const allPathsRaw = getAllPaths(graph, currentConceptId.toString(), goalConceptId.toString());
//     if (allPathsRaw.length === 0) {
//       return res.status(404).json({ message: "No paths found to target concept." });
//     }

//     // User mastery
//     const userProgressDoc = await UserConceptProgress.findOne({ userId });
//     const masteryMap: Record<string, number> = {};
//     if (userProgressDoc) {
//       userProgressDoc.concepts.forEach(entry => {
//         masteryMap[entry.conceptId.toString()] = entry.score;
//       });
//     }

//     // Create concept lookup
//     const conceptMap: Record<string, {
//       title: string;
//       prerequisites: string[];
//       complexity: number;
//       estTimeMin: number;
//     }> = {};

//     concepts.forEach(c => {
//       conceptMap[c.id.toString()] = {
//         title: c.title,
//         prerequisites: (c.prerequisites || []).map(p => p.toString()),
//         complexity: c.complexity ?? 3, // default complexity
//         estTimeMin: (c.estLearningTimeHours ?? 0.5) * 60 // default 30 mins
//       };
//     });

//     // 🧠 Weights for scoring
//     const α = 0.5; // mastery importance
//     const β = 0.3; // complexity importance
//     const γ = 0.2; // time importance

//     const allPaths = allPathsRaw.map(path => {
//       let totalCost = 0;

//       const detailedPath = path.map(conceptId => {
//         const data = conceptMap[conceptId] || { title: "Unknown", prerequisites: [], complexity: 3, estTimeMin: 30 };

//         const prereqs = data.prerequisites;
//         const prerequisiteMasteries = prereqs.map(prereqId => ({
//           prerequisiteId: prereqId,
//           score: masteryMap[prereqId] ?? 0
//         }));

//         const locked = prerequisiteMasteries.some(p => p.score < 0.7);

//         const mastery = masteryMap[conceptId] ?? 0;
//         const masteryPenalty = (mastery < 0.7) ? (1 - mastery) : 0;

//         const cost = α * masteryPenalty + β * data.complexity + γ * data.estTimeMin;
//         totalCost += cost;

//         return {
//           conceptId,
//           title: data.title,
//           locked,
//           mastery,
//           complexity: data.complexity,
//           estimatedTimeMin: data.estTimeMin,
//           prerequisiteMasteries
//         };
//       });

//       return { path, detailedPath, totalCost };
//     });

//     const bestPath = [...allPaths].sort((a, b) => a.totalCost - b.totalCost)[0];

//     return res.status(200).json({
//       bestPath,
//       allPaths
//     });

//   } catch (error: any) {
//     console.error("Error generating recommendation:", error);
//     return res.status(500).json({ error: "Internal Server Error", details: error.message });
//   }
// };

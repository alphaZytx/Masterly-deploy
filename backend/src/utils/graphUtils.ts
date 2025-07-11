import { Graph, alg } from "graphlib";

interface ConceptNode {
  _id: string;
  prerequisites: string[];
}

/**
 * Builds a directed concept graph from concept documents.
 * Each edge represents a prerequisite relationship (A ➝ B means A is a prerequisite of B).
 */
export function buildConceptGraph(concepts: ConceptNode[]): any {
  const graph = new Graph({ directed: true });

  for (const concept of concepts) {
    const conceptId = concept._id.toString();
    graph.setNode(conceptId);

    for (const prereq of concept.prerequisites) {
      const prereqId = prereq.toString();
      graph.setNode(prereqId); // Ensure prerequisite is a node
      graph.setEdge(prereqId, conceptId); // Edge from prereq ➝ concept
    }
  }

  return graph;
}


/**
 * Finds the full path from start to end including all prerequisite concepts,
 * regardless of mastery.
 */
export function getFullLearningPath(
  graph: any,
  startId: string,
  endId: string
): string[] {
  // Ensure both nodes exist
  if (!graph.hasNode(startId) || !graph.hasNode(endId)) return [];

  // Run Dijkstra’s algorithm on full graph (no filtering)
  const result = alg.dijkstra(graph, startId);

  if (!result[endId] || result[endId].distance === Infinity) return [];

  // Reconstruct path from Dijkstra result
  const path: string[] = [];
  let current = endId;

  while (current !== startId && result[current]?.predecessor) {
    path.unshift(current);
    current = result[current].predecessor!;
  }

  path.unshift(startId); // Add the starting concept
  return path;
}

// All paths from start to end, including all prerequisites 

export function getAllPaths(graph: any, start: string, end: string): string[][] {
  const allPaths: string[][] = [];

  const dfs = (node: string, path: string[]) => {
    path.push(node);
    if (node === end) {
      allPaths.push([...path]);
    } else {
      const neighbors = graph.successors(node) || [];
      for (const neighbor of neighbors) {
        if (!path.includes(neighbor)) {
          dfs(neighbor, path);
        }
      }
    }
    path.pop();
  };

  dfs(start, []);
  return allPaths;
}

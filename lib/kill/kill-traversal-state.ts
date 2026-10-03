export const killTraversalState = {
  version: 0,

  individualCount: 0,
  individualKillIndices: new Int32Array(200_000),
  individualOpacities: new Float32Array(200_000).fill(1),

  clusterCount: 0,
  clusterX: new Float64Array(10_000),
  clusterY: new Float64Array(10_000),
  clusterZ: new Float64Array(10_000),
  clusterKillCount: new Int32Array(10_000),

  clusterKillTotal: 0,
  maxClusterKillCount: 0,
  nodesVisited: 0,
  nodesCulled: 0,
  maxDepthReached: 0,
  traversalTimeMs: 0,
};

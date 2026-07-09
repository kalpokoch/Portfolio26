/** About — loose neural-network node/edge formation, echoes model architecture work. */
export function networkFormation(count: number): Float32Array {
  const positions = new Float32Array(count * 3);
  const layers = 5;
  const nodesPerLayer = 6;
  const layerX = (l: number) => (l / (layers - 1) - 0.5) * 7;

  const nodePositions: number[][] = [];
  for (let l = 0; l < layers; l++) {
    const nodes: number[] = [];
    for (let n = 0; n < nodesPerLayer; n++) {
      nodes.push((n / (nodesPerLayer - 1) - 0.5) * 4.5);
    }
    nodePositions.push(nodes);
  }

  for (let i = 0; i < count; i++) {
    const isEdge = Math.random() < 0.6;
    if (isEdge) {
      const l = Math.floor(Math.random() * (layers - 1));
      const nA = nodePositions[l][Math.floor(Math.random() * nodesPerLayer)];
      const nB = nodePositions[l + 1][Math.floor(Math.random() * nodesPerLayer)];
      const t = Math.random();
      positions[i * 3] = layerX(l) + (layerX(l + 1) - layerX(l)) * t;
      positions[i * 3 + 1] = nA + (nB - nA) * t + (Math.random() - 0.5) * 0.1;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
    } else {
      const l = Math.floor(Math.random() * layers);
      const n = Math.floor(Math.random() * nodesPerLayer);
      const jitter = 0.12;
      positions[i * 3] = layerX(l) + (Math.random() - 0.5) * jitter;
      positions[i * 3 + 1] = nodePositions[l][n] + (Math.random() - 0.5) * jitter;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 0.4;
    }
  }
  return positions;
}

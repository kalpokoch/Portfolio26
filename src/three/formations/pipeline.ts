/** Experience — structured timeline/flow-line, nodes light up per role entry. */
export const PIPELINE_STEPS = 4;
export const PIPELINE_WIDTH = 7;

export function pipelineFormation(count: number): Float32Array {
  const positions = new Float32Array(count * 3);
  const width = PIPELINE_WIDTH;
  const nodeSpacing = width / (PIPELINE_STEPS - 1);

  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    const x = (t - 0.5) * width;
    const y = Math.sin(t * Math.PI * 2) * 0.25;

    const nearestNodeIndex = Math.round((x + width / 2) / nodeSpacing);
    const nodeX = -width / 2 + nearestNodeIndex * nodeSpacing;
    const distToNode = Math.abs(x - nodeX);
    const pull = Math.max(0, 1 - distToNode / (nodeSpacing * 0.35));
    const jitterY = (Math.random() - 0.5) * (0.5 - pull * 0.35);

    positions[i * 3] = x + (Math.random() - 0.5) * 0.05;
    positions[i * 3 + 1] = y + jitterY;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 0.4;
  }
  return positions;
}

export function pipelineNodeX(stepIndex: number): number {
  const nodeSpacing = PIPELINE_WIDTH / (PIPELINE_STEPS - 1);
  return -PIPELINE_WIDTH / 2 + stepIndex * nodeSpacing;
}

/** Projects — data grid / matrix formation, echoes structured healthcare data & CT grids. */
export function gridFormation(count: number): Float32Array {
  const positions = new Float32Array(count * 3);
  const cols = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / cols);
  const spacingX = 7 / cols;
  const spacingY = 5 / rows;

  for (let i = 0; i < count; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    positions[i * 3] = (col - cols / 2) * spacingX;
    positions[i * 3 + 1] = (row - rows / 2) * spacingY;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
  }
  return positions;
}

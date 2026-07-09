/** Hero — noisy audio waveform, echoes the cough-audio classifier work. */
export function waveformFormation(count: number): Float32Array {
  const positions = new Float32Array(count * 3);
  const width = 8;
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    const x = (t - 0.5) * width;
    const envelope = Math.sin(t * Math.PI);
    const noise = (Math.random() - 0.5) * 0.15;
    const y =
      Math.sin(x * 3.6 + Math.sin(x * 2.3) * 1.5) * 1.1 * envelope + noise;
    const z = (Math.random() - 0.5) * 0.6;
    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
  }
  return positions;
}

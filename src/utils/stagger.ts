export function createStagger(ms = 40) {
  let step = 0;
  return () => `animation-delay: ${step++ * ms}ms`;
}

export function capabilityProfile({ deviceMemory = 4, touch = false, reducedMotion = false } = {}) {
  const tier = deviceMemory <= 2 ? 'low' : deviceMemory >= 8 ? 'high' : 'medium';
  return Object.freeze({
    tier,
    touch,
    reducedMotion,
    particleBudget: reducedMotion ? 12 : tier === 'low' ? 40 : tier === 'high' ? 180 : 90,
    lightBudget: tier === 'low' ? 6 : tier === 'high' ? 20 : 12,
  });
}

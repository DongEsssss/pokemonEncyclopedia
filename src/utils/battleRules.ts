export function moveHits(accuracy: number | null, roll = Math.random()): boolean {
  return accuracy === null || roll * 100 < accuracy;
}

export function nextTeamMemberIndex(activeIndex: number, teamSize: number): number | null {
  const nextIndex = activeIndex + 1;
  return nextIndex < teamSize ? nextIndex : null;
}

export function residualHp(currentHp: number, maxHp: number, damageFraction: number): number {
  const damage = Math.max(1, Math.floor(maxHp * damageFraction));
  return Math.max(0, currentHp - damage);
}

export function calculateDamage(
  power: number,
  attackerAtk: number,
  defenderDef: number,
  multiplier: number,
  isStab = false,
  attackerStatus: string | null = null,
  isPhysical = true,
): number {
  if (multiplier === 0) return 0;

  const stabBonus = isStab ? 1.5 : 1;
  const burnPenalty = attackerStatus === 'BRN' && isPhysical ? 0.5 : 1;
  const damage = ((power * attackerAtk / defenderDef) / 2) * multiplier * stabBonus * burnPenalty;
  return Math.max(1, Math.floor(damage));
}

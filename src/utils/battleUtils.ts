import { typeChart } from "../constants/pokemonData";

/**
 * 공격 타입과 방어 포켓몬의 타입들을 바탕으로 데미지 배율을 계산합니다.
 * @param attackType 공격 기술의 타입
 * @param defenderTypes 방어측 포켓몬의 타입 배열
 * @returns 계산된 데미지 배율
 */
export const getMultiplier = (attackType: string, defenderTypes: string[]) => {
  let multiplier = 1;
  defenderTypes.forEach(dType => {
    if (typeChart[attackType] && typeChart[attackType][dType] !== undefined) {
      multiplier *= typeChart[attackType][dType];
    }
  });
  return multiplier;
};


/**
 * 데미지를 계산합니다.
 * @param power 기술 위력
 * @param attackerAtk 공격자 공격력
 * @param defenderDef 방어자 방어력
 * @param multiplier 타입 배율
 * @param isStab 자속 보정 여부 (Same Type Attack Bonus)
 * @returns 최종 데미지
 */
export const calculateDamage = (
  power: number,
  attackerAtk: number,
  defenderDef: number,
  multiplier: number,
  isStab: boolean = false,
  attackerStatus: string | null = null,
  isPhysical: boolean = true
) => {
  const stabBonus = isStab ? 1.5 : 1;
  let damage = ((power * attackerAtk / defenderDef) / 2) * multiplier * stabBonus;
  
  // 화상(BRN) 상태이고 물리 공격일 경우 데미지 절반 감소
  if (attackerStatus === 'BRN' && isPhysical) {
    damage *= 0.5;
  }
  
  return Math.max(1, Math.floor(damage));
};

/**
 * 포켓몬의 특정 스탯 값을 가져옵니다.
 */
export const getStatValue = (pokemon: any, statName: string) =>
  pokemon?.stats?.find((s: any) => s.stat.name === statName)?.base_stat || 0;

/**
 * 랭크(Stage) 변화가 적용된 스탯 값을 계산합니다.
 * @param baseStat 기본 스탯 값
 * @param stage 스탯 변화 랭크 (-6 ~ +6)
 * @returns 랭크가 적용된 스탯 값
 */
export const getModifiedStat = (baseStat: number, stage: number) => {
  if (stage === 0) return baseStat;
  
  // 회피율이나 명중률은 계산식이 다르지만, 일반적인 스탯(공격, 방어, 특공, 특방, 스피드)은 이 방식을 사용합니다.
  const multiplier = stage > 0 
    ? (2 + stage) / 2 
    : 2 / (2 - stage); // 음수일 경우 stage 자체가 음수이므로 (2 - (-stage)) => (2 - stage) -> wait, if stage is -1, it's 2 / (2 - (-1)) = 2 / 3. So it should be (2 + Math.abs(stage)).
    
  return Math.max(1, Math.floor(baseStat * (stage > 0 ? (2 + stage) / 2 : 2 / (2 + Math.abs(stage)))));
};

/**
 * HP 퍼센트를 계산합니다.
 */
export const getHpPercentage = (currentHp: number, maxHp: number) =>
  Math.max(0, Math.min(100, (currentHp / maxHp) * 100));

/**
 * HP 퍼센트에 따른 색상 클래스를 반환합니다.
 */
export const getHpColor = (percentage: number) => {
  if (percentage > 50) return 'bg-green-400 shadow-[0_0_10px_#4ade80]';
  if (percentage > 20) return 'bg-yellow-400 shadow-[0_0_10px_#facc15]';
  return 'bg-red-500 shadow-[0_0_10px_#ef4444]';
};


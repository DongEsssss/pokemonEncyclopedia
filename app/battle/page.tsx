"use client";

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useBattle } from '@/src/context/BattleContext';
import { useTranslation } from 'react-i18next';
import { getRandomMoves, getPokemonSpecies, getFixedMovesDetailsByNames } from '@/src/services/pokeapi';
import { typeThemes } from '@/src/constants/pokemonData';
import { getMultiplier, calculateDamage, getStatValue, getHpPercentage, getHpColor, getModifiedStat } from '@/src/utils/battleUtils';
import { MoveDetails, PokemonSpecies } from '@/src/types/pokemon';
import { Turn, MajorStatus, VolatileStatus, StatStages } from '@/src/types/battle';


export default function BattlePage() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { 
    playerPokemon, opponentPokemon, setPlayerPokemon, setOpponentPokemon, 
    playerMoves: contextPlayerMoves, opponentMoves: contextOpponentMoves, 
    playerTeam, opponentTeam, playerTeamMoves, opponentTeamMoves,
    isTournament, tournamentMatches, setTournamentMatches,
    resetBattle 
  } = useBattle();
  const [activePlayerIdx, setActivePlayerIdx] = useState(0);
  const [activeOpponentIdx, setActiveOpponentIdx] = useState(0);

  const [logs, setLogs] = useState<{ text: string, type: 'p1' | 'p2' | 'sys' }[]>([]);
  const [battleOver, setBattleOver] = useState(false);
  const [playerHp, setPlayerHp] = useState<number>(0);
  const [oppHp, setOppHp] = useState<number>(0);

  const [playerMoves, setPlayerMoves] = useState<MoveDetails[]>([]);
  const [opponentMoves, setOpponentMoves] = useState<MoveDetails[]>([]);
  const [playerSpecies, setPlayerSpecies] = useState<PokemonSpecies | null>(null);
  const [opponentSpecies, setOpponentSpecies] = useState<PokemonSpecies | null>(null);
  const [loading, setLoading] = useState(true);

  const [currentTurn, setCurrentTurn] = useState<Turn>('player1');
  const [isProcessing, setIsProcessing] = useState(false);
  const [damageEffect, setDamageEffect] = useState<'p1' | 'p2' | null>(null);
  const [hitDamage, setHitDamage] = useState<{ value: number; type: 'p1' | 'p2' } | null>(null);
  const [attackAnim, setAttackAnim] = useState<'p1' | 'p2' | null>(null);
  const [motionType, setMotionType] = useState<'physical' | 'special'>('physical');
  const [flashColor, setFlashColor] = useState<string | null>(null);
  const [hitFlash, setHitFlash] = useState<'p1' | 'p2' | null>(null);
  const [lastMultiplier, setLastMultiplier] = useState<number>(1);

  const [playerStatus, setPlayerStatus] = useState<MajorStatus>(null);
  const [oppStatus, setOppStatus] = useState<MajorStatus>(null);
  const [playerVolatile, setPlayerVolatile] = useState<VolatileStatus>({ confusionTurns: 0, flinch: false, infatuation: false, curse: false, sleepTurns: 0, toxTurns: 0 });
  const [oppVolatile, setOppVolatile] = useState<VolatileStatus>({ confusionTurns: 0, flinch: false, infatuation: false, curse: false, sleepTurns: 0, toxTurns: 0 });

  const defaultStages: StatStages = { attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0 };
  const [playerStatStages, setPlayerStatStages] = useState<StatStages>(defaultStages);
  const [oppStatStages, setOppStatStages] = useState<StatStages>(defaultStages);

  const [fainting, setFainting] = useState<'p1' | 'p2' | null>(null);
  const [evolutionAnim, setEvolutionAnim] = useState<'p1' | 'p2' | null>(null);
  const [winner, setWinner] = useState<{ player: string; pokemon: string } | null>(null);
  const [dittoEasterEgg, setDittoEasterEgg] = useState(false);

  const hasInitialized = useRef(false);


  const logBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logBoxRef.current) {
      logBoxRef.current.scrollTop = logBoxRef.current.scrollHeight;
    }
  }, [logs]);

  useEffect(() => {
    if (hasInitialized.current) return;
    if (!playerPokemon || !opponentPokemon) {
      router.push('/');
      return;
    }

    hasInitialized.current = true;

    const initBattle = async () => {
      let currentPHp = playerPokemon.stats.find(s => s.stat.name === 'hp')?.base_stat || 50;
      let currentOHp = opponentPokemon.stats.find(s => s.stat.name === 'hp')?.base_stat || 50;
      currentPHp *= 3;
      currentOHp *= 3;
      setPlayerHp(currentPHp);
      setOppHp(currentOHp);

      try {
        const [pSpecies, oSpecies] = await Promise.all([
          getPokemonSpecies(playerPokemon.name),
          getPokemonSpecies(opponentPokemon.name)
        ]);
        setPlayerSpecies(pSpecies);
        setOpponentSpecies(oSpecies);

        if (playerPokemon.name === 'ditto' && opponentPokemon.name === 'ditto') {
          setDittoEasterEgg(true);
          setLoading(false);
          return;
        }

        const pMoves = contextPlayerMoves?.length ? contextPlayerMoves : await getRandomMoves(playerPokemon.moves, 4);
        const oMoves = contextOpponentMoves?.length ? contextOpponentMoves : await getRandomMoves(opponentPokemon.moves, 4);
        setPlayerMoves(pMoves);
        setOpponentMoves(oMoves);

        setLogs([
          { text: t('Battle Start!'), type: 'sys' },
          { text: t('Go, {{name}}!', { name: getLocalizedName(pSpecies, playerPokemon.name) }), type: 'p1' },
          { text: t('Go, {{name}}!', { name: getLocalizedName(oSpecies, opponentPokemon.name) }), type: 'p2' }
        ]);
      } catch (err) { console.error(err); }
      setLoading(false);
    };
    initBattle();
  }, [playerPokemon, opponentPokemon, router, t]);

  const getLocalizedName = (species: PokemonSpecies | null, defaultName: string) => {
    if (!species) return defaultName;
    const lang = i18n.language.startsWith('ko') ? 'ko' : i18n.language.startsWith('ja') ? 'ja' : 'en';
    const nameObj = species.names.find(n => n.language.name === lang) ||
      species.names.find(n => n.language.name === 'ko') ||
      species.names.find(n => n.language.name === 'en');
    return nameObj ? nameObj.name : defaultName;
  };

  const getLocalizedMoveName = (move: MoveDetails) => {
    const lang = i18n.language.startsWith('ko') ? 'ko' : i18n.language.startsWith('ja') ? 'ja' : 'en';
    const nameObj = move.names.find(n => n.language.name === lang) ||
      move.names.find(n => n.language.name === 'ko') ||
      move.names.find(n => n.language.name === 'en');
    return nameObj ? nameObj.name : move.name;
  };

  const executeTurn = async (move: MoveDetails) => {
    if (isProcessing || battleOver) return;
    setIsProcessing(true);
    const wait = (ms: number) => new Promise(res => setTimeout(res, ms));
    const isPlayer1 = currentTurn === 'player1';
    const attacker = isPlayer1 ? playerPokemon! : opponentPokemon!;
    const defender = isPlayer1 ? opponentPokemon! : playerPokemon!;
    const attackerSpecies = isPlayer1 ? playerSpecies : opponentSpecies;
    const defenderSpecies = isPlayer1 ? opponentSpecies : playerSpecies;
    const attackerStatStages = isPlayer1 ? playerStatStages : oppStatStages;
    const defenderStatStages = isPlayer1 ? oppStatStages : playerStatStages;
    const setAttackerStatStages = isPlayer1 ? setPlayerStatStages : setOppStatStages;

    // Determine move category (Status vs Attack)
    const isStatusMove = move.power === null || move.power === 0 || move.damage_class?.name === 'status';
    const physicalTypes = ['normal', 'fighting', 'poison', 'ground', 'rock', 'bug', 'ghost', 'steel', 'flying'];
    const isPhysical = move.damage_class?.name === 'physical' || physicalTypes.includes(move.type.name);

    const baseAttackerAtk = getStatValue(attacker, isPhysical ? 'attack' : 'special-attack') || 10;
    const baseDefenderDef = getStatValue(defender, isPhysical ? 'defense' : 'special-defense') || 10;

    const attackerAtk = getModifiedStat(baseAttackerAtk, isPhysical ? attackerStatStages.attack : attackerStatStages.specialAttack);
    const defenderDef = getModifiedStat(baseDefenderDef, isPhysical ? defenderStatStages.defense : defenderStatStages.specialDefense);
    const moveName = getLocalizedMoveName(move);
    const attackerName = getLocalizedName(attackerSpecies, attacker.name);
    const defenderName = getLocalizedName(defenderSpecies, defender.name);

    const attackerStatus = isPlayer1 ? playerStatus : oppStatus;
    const defenderStatus = isPlayer1 ? oppStatus : playerStatus;
    const attackerVolatile = isPlayer1 ? playerVolatile : oppVolatile;
    const defenderVolatile = isPlayer1 ? oppVolatile : playerVolatile;
    const setAttackerVolatile = isPlayer1 ? setPlayerVolatile : setOppVolatile;
    const setDefenderVolatile = isPlayer1 ? setOppVolatile : setPlayerVolatile;
    const setAttackerStatus = isPlayer1 ? setPlayerStatus : setOppStatus;
    const setDefenderStatus = isPlayer1 ? setOppStatus : setPlayerStatus;

    const maxAttackerHp = (getStatValue(attacker, 'hp') || 50) * 3;
    const maxDefenderHp = (getStatValue(defender, 'hp') || 50) * 3;

    const endTurn = () => {
      setCurrentTurn(isPlayer1 ? 'player2' : 'player1');
      setIsProcessing(false);
    };

    const handleFaint = async (faintedPlayer: 'p1' | 'p2', faintedPokemon: any, species: any, winnerLabel: string) => {
      setFainting(faintedPlayer);
      await wait(1500);
      const winName = getLocalizedName(faintedPlayer === 'p1' ? opponentSpecies : playerSpecies, faintedPlayer === 'p1' ? opponentPokemon!.name : playerPokemon!.name);
      setWinner({ player: winnerLabel, pokemon: winName });
      setLogs(prev => [...prev, { text: t('{{name}} fainted! {{winner}} wins!', { name: getLocalizedName(species, faintedPokemon.name), winner: winnerLabel }), type: isPlayer1 ? 'p1' : 'p2' }]);
      setBattleOver(true);
      setIsProcessing(false);
      setDamageEffect(null);
    };

    // ==========================================
    // PHASE 1: PRE-ATTACK CHECKS
    // ==========================================

    // 1. Flinch (풀죽음)
    if (attackerVolatile.flinch) {
      setAttackerVolatile(prev => ({ ...prev, flinch: false }));
      setLogs(prev => [...prev, { text: t('{{name}} flinched and couldn\'t move!', { name: attackerName }), type: isPlayer1 ? 'p1' : 'p2' }]);
      await wait(1500);
      return endTurn();
    }

    // 2. Freeze (얼음)
    if (attackerStatus === 'FRZ') {
      if (Math.random() <= 0.2) {
        setAttackerStatus(null);
        setLogs(prev => [...prev, { text: t('{{name}} thawed out!', { name: attackerName }), type: isPlayer1 ? 'p1' : 'p2' }]);
        await wait(1000);
      } else {
        setLogs(prev => [...prev, { text: t('{{name}} is frozen solid!', { name: attackerName }), type: isPlayer1 ? 'p1' : 'p2' }]);
        await wait(1500);
        return endTurn();
      }
    }

    // 3. Sleep (수면)
    if (attackerStatus === 'SLP') {
      if (attackerVolatile.sleepTurns <= 0) {
        setAttackerStatus(null);
        setLogs(prev => [...prev, { text: t('{{name}} woke up!', { name: attackerName }), type: isPlayer1 ? 'p1' : 'p2' }]);
        await wait(1000);
      } else {
        setAttackerVolatile(prev => ({ ...prev, sleepTurns: prev.sleepTurns - 1 }));
        setLogs(prev => [...prev, { text: t('{{name}} is fast asleep.', { name: attackerName }), type: isPlayer1 ? 'p1' : 'p2' }]);
        await wait(1500);
        return endTurn();
      }
    }

    // 4. Paralysis (마비)
    if (attackerStatus === 'PAR') {
      if (Math.random() <= 0.25) {
        setLogs(prev => [...prev, { text: t('{{name}} is paralyzed! It can\'t move!', { name: attackerName }), type: isPlayer1 ? 'p1' : 'p2' }]);
        await wait(1500);
        return endTurn();
      }
    }

    // 5. Confusion (혼란)
    let skipMove = false;
    if (attackerVolatile.confusionTurns > 0) {
      setAttackerVolatile(prev => ({ ...prev, confusionTurns: prev.confusionTurns - 1 }));
      setLogs(prev => [...prev, { text: t('{{name}} is confused!', { name: attackerName }), type: isPlayer1 ? 'p1' : 'p2' }]);
      await wait(1000);

      if (attackerVolatile.confusionTurns - 1 <= 0) {
        setLogs(prev => [...prev, { text: t('{{name}} snapped out of confusion!', { name: attackerName }), type: isPlayer1 ? 'p1' : 'p2' }]);
        await wait(1000);
      } else {
        if (Math.random() <= 0.33) {
          setLogs(prev => [...prev, { text: t('It hurt itself in its confusion!', { name: attackerName }), type: isPlayer1 ? 'p1' : 'p2' }]);
          setAttackAnim(isPlayer1 ? 'p1' : 'p2');
          await wait(200);
          setHitFlash(isPlayer1 ? 'p1' : 'p2');
          setDamageEffect(isPlayer1 ? 'p1' : 'p2');

          const selfDamage = calculateDamage(40, attackerAtk, getStatValue(attacker, 'defense') || 10, 1, false, attackerStatus, true);
          setHitDamage({ value: selfDamage, type: isPlayer1 ? 'p1' : 'p2' });

          if (isPlayer1) {
            const newHp = Math.max(0, playerHp - selfDamage);
            setPlayerHp(newHp);
            if (newHp <= 0) return handleFaint('p1', attacker, attackerSpecies, 'PLAYER 2');
          } else {
            const newHp = Math.max(0, oppHp - selfDamage);
            setOppHp(newHp);
            if (newHp <= 0) return handleFaint('p2', attacker, attackerSpecies, 'PLAYER 1');
          }
          await wait(800);
          setHitFlash(null);
          setDamageEffect(null);
          skipMove = true;
        }
      }
    }
    if (skipMove) return endTurn();

    // 6. Infatuation (헤롱헤롱)
    if (attackerVolatile.infatuation) {
      if (Math.random() <= 0.5) {
        setLogs(prev => [...prev, { text: t('{{name}} is immobilized by love!', { name: attackerName }), type: isPlayer1 ? 'p1' : 'p2' }]);
        await wait(1500);
        return endTurn();
      }
    }

    // ==========================================
    // PHASE 2: MOVE EXECUTION
    // ==========================================

    // Easter Eggs
    if (attacker.name === 'magikarp' && move.name === 'splash') {
      setAttackAnim(isPlayer1 ? 'p1' : 'p2');
      await wait(200);
      setLogs(prev => [...prev, { text: t('{{name}} used {{move}}!', { name: attackerName, move: moveName }), type: isPlayer1 ? 'p1' : 'p2' }]);
      await wait(600);
      setAttackAnim(null);

      const isEvolving = Math.random() <= 0.10;
      if (isEvolving) {
        setLogs(prev => [...prev, { text: t('What? {{name}} is evolving!', { name: attackerName }), type: isPlayer1 ? 'p1' : 'p2' }]);
        await wait(500);
        setEvolutionAnim(isPlayer1 ? 'p1' : 'p2');
        await wait(500);
        setFlashColor('rainbow');
        await wait(2000);
        try {
          const gyaradosRes = await fetch('https://pokeapi.co/api/v2/pokemon/gyarados');
          const newGyarados = await gyaradosRes.json();
          const gyaradosSpeciesRes = await fetch('https://pokeapi.co/api/v2/pokemon-species/gyarados');
          const newGyaradosSpecies = await gyaradosSpeciesRes.json();
          const isShiny = Math.random() <= 0.05;
          if (isShiny) {
            newGyarados.sprites.front_default = newGyarados.sprites.front_shiny;
            newGyaradosSpecies.names.forEach((n: any) => {
              if (n.language.name === 'ko') n.name = '붉은 갸라도스';
              else if (n.language.name === 'en') n.name = 'Red Gyarados';
              else if (n.language.name === 'ja' || n.language.name === 'ja-Hrkt') n.name = 'あかいギャラドス';
            });
          }
          const evolvedName = getLocalizedName(newGyaradosSpecies, 'gyarados');
          const newMoves = await getFixedMovesDetailsByNames(['dragon-dance', 'waterfall', 'ice-fang', 'earthquake']);
          if (isPlayer1) {
            setPlayerPokemon(newGyarados); setPlayerSpecies(newGyaradosSpecies); setPlayerMoves(newMoves);
            setPlayerHp((newGyarados.stats.find((s: any) => s.stat.name === 'hp')?.base_stat || 95) * 3);
          } else {
            setOpponentPokemon(newGyarados); setOpponentSpecies(newGyaradosSpecies); setOpponentMoves(newMoves);
            setOppHp((newGyarados.stats.find((s: any) => s.stat.name === 'hp')?.base_stat || 95) * 3);
          }
          setEvolutionAnim(null);
          setFlashColor(null);
          setLogs(prev => [...prev, { text: t('Congratulations! {{name}} evolved into {{evolvedName}}!', { name: attackerName, evolvedName }), type: isPlayer1 ? 'p1' : 'p2' }]);
          await wait(1500);
        } catch (error) { setFlashColor(null); }
      } else {
        setLogs(prev => [...prev, { text: t("But nothing happened..."), type: isPlayer1 ? 'p1' : 'p2' }]);
        await wait(1000);
      }
      return endTurn();
    }
    if (move.name === 'transform') {
      setAttackAnim(isPlayer1 ? 'p1' : 'p2');
      await wait(400);
      setLogs(prev => [...prev, { text: t('{{name}} used {{move}}!', { name: attackerName, move: moveName }), type: isPlayer1 ? 'p1' : 'p2' }]);
      await wait(600);
      setAttackAnim(null);

      setEvolutionAnim(isPlayer1 ? 'p1' : 'p2');
      await wait(500);
      setFlashColor('rainbow');
      await wait(2000);

      const newPokemon = {
        ...defender,
        stats: defender.stats.map(s => s.stat.name === 'hp' ? attacker.stats.find(as => as.stat.name === 'hp') : s)
      };

      const activeDefenderMoves = currentTurn === 'player1' ? opponentMoves : playerMoves;

      if (isPlayer1) {
        setPlayerPokemon(newPokemon as any);
        setPlayerSpecies(defenderSpecies);
        setPlayerMoves(activeDefenderMoves);
      } else {
        setOpponentPokemon(newPokemon as any);
        setOpponentSpecies(defenderSpecies);
        setOpponentMoves(activeDefenderMoves);
      }

      setEvolutionAnim(null);
      setFlashColor(null);
      setLogs(prev => [...prev, { text: t('{{name}} transformed into {{target}}!', { name: attackerName, target: defenderName }), type: isPlayer1 ? 'p1' : 'p2' }]);
      await wait(1500);
      return endTurn();
    }

    if (move.name === 'dragon-dance') {
      setAttackAnim(isPlayer1 ? 'p1' : 'p2');
      setFlashColor(typeThemes[move.type.name]?.neon || '#fff');
      await wait(400);
      setLogs(prev => [...prev, { text: t('{{name}} used {{move}}!', { name: attackerName, move: moveName }), type: isPlayer1 ? 'p1' : 'p2' }]);
      await wait(600);
      setFlashColor(null); setAttackAnim(null);

      setAttackerStatStages(prev => ({
        ...prev,
        attack: Math.min(6, prev.attack + 1),
        speed: Math.min(6, prev.speed + 1)
      }));

      setLogs(prev => [...prev, { text: t("{{name}}'s Attack and Speed rose!", { name: attackerName }), type: isPlayer1 ? 'p1' : 'p2' }]);
      await wait(1000);
      return endTurn();
    }

    setMotionType(isPhysical ? 'physical' : 'special');

    // Attack Animation
    setAttackAnim(isPlayer1 ? 'p1' : 'p2');
    setFlashColor(typeThemes[move.type.name]?.neon || '#fff');
    await wait(200);

    setLogs(prev => [...prev, { text: t('{{name}} used {{move}}!', { name: attackerName, move: moveName }), type: isPlayer1 ? 'p1' : 'p2' }]);
    await wait(400);

    // Damage application
    if (!isStatusMove) {
      const power = move.power || 50;
      const isStab = attacker.types.some(t => t.type.name === move.type.name);
      const multiplier = getMultiplier(move.type.name, defender.types.map(t => t.type.name));
      setLastMultiplier(multiplier);

      let damagePerHit = calculateDamage(power, attackerAtk, defenderDef, multiplier, isStab, attackerStatus, isPhysical);

      if (multiplier > 0) {
        if (defenderStatus === 'FRZ' && move.type.name === 'fire') {
          setDefenderStatus(null);
          setLogs(prev => [...prev, { text: t('{{name}} thawed out!', { name: defenderName }), type: isPlayer1 ? 'p1' : 'p2' }]);
        }

        let numHits = 1;
        if (move.meta && move.meta.min_hits && move.meta.max_hits) {
          numHits = Math.floor(Math.random() * (move.meta.max_hits - move.meta.min_hits + 1)) + move.meta.min_hits;
        }

        if (move.name === 'fury-attack') {
          numHits = Math.floor(Math.random() * 4) + 1;
          const base100Damage = calculateDamage(60, attackerAtk, defenderDef, multiplier, isStab, attackerStatus, isPhysical);
          if (numHits === 1) damagePerHit = Math.max(1, Math.round(base100Damage * 0.40));
          else if (numHits === 2) damagePerHit = Math.max(1, Math.round(base100Damage * 0.35));
          else if (numHits === 3) damagePerHit = Math.max(1, Math.round(base100Damage * 0.30));
          else if (numHits === 4) damagePerHit = Math.max(1, Math.round(base100Damage * 0.25));
        }

        if (multiplier > 1) setLogs(prev => [...prev, { text: t("It's super effective!"), type: isPlayer1 ? 'p1' : 'p2' }]);
        else if (multiplier < 1) setLogs(prev => [...prev, { text: t("It's not very effective..."), type: isPlayer1 ? 'p1' : 'p2' }]);
        if (multiplier !== 1) await wait(600);

        let currentDefenderHp = isPlayer1 ? oppHp : playerHp;
        let totalDamage = 0;

        for (let i = 0; i < numHits; i++) {
          setAttackAnim(isPlayer1 ? 'p1' : 'p2');
          await wait(150);

          setHitFlash(isPlayer1 ? 'p2' : 'p1');
          setDamageEffect(isPlayer1 ? 'p2' : 'p1');
          setHitDamage({ value: damagePerHit, type: isPlayer1 ? 'p2' : 'p1' });

          currentDefenderHp = Math.max(0, currentDefenderHp - damagePerHit);
          totalDamage += damagePerHit;

          if (isPlayer1) setOppHp(currentDefenderHp);
          else setPlayerHp(currentDefenderHp);

          await wait(150);
          setHitFlash(null);
          setAttackAnim(null);

          await wait(100);
          setDamageEffect(null);
          setTimeout(() => setHitDamage(null), 400);

          if (currentDefenderHp <= 0) break;
          if (i < numHits - 1) await wait(250);
        }

        let finalDamage = Math.round(totalDamage);
        setLogs(prev => [...prev, { text: t('Dealt {{damage}} damage!', { damage: finalDamage }), type: isPlayer1 ? 'p1' : 'p2' }]);
        if (numHits > 1) {
          await wait(600);
          setLogs(prev => [...prev, { text: t('Hit {{count}} times!', { count: numHits }), type: isPlayer1 ? 'p1' : 'p2' }]);
        }

        await wait(600);

        if (currentDefenderHp <= 0) {
          return handleFaint(isPlayer1 ? 'p2' : 'p1', defender, defenderSpecies, isPlayer1 ? 'PLAYER 1' : 'PLAYER 2');
        }

        // Attack Secondary Effects (Probabilities)
        const applyEffect = async (status: MajorStatus, msg: string, applyCheck: boolean) => {
          if (!defenderStatus && applyCheck) {
            setDefenderStatus(status);
            if (status === 'TOX') setDefenderVolatile(prev => ({ ...prev, toxTurns: 1 }));
            setLogs(prev => [...prev, { text: t(msg, { name: defenderName }), type: isPlayer1 ? 'p1' : 'p2' }]);
            await wait(1000);
          }
        };

        if (['thunderbolt', 'thunder', 'discharge'].includes(move.name) && Math.random() <= 0.1) {
          await applyEffect('PAR', '{{name}} is paralyzed! It may be unable to move!', !defender.types.some(t => t.type.name === 'electric'));
        }
        if (['flamethrower', 'fire-blast', 'heat-wave'].includes(move.name) && Math.random() <= 0.1) {
          await applyEffect('BRN', '{{name}} was burned!', !defender.types.some(t => t.type.name === 'fire'));
        }
        if (move.name === 'scald' && Math.random() <= 0.3) {
          await applyEffect('BRN', '{{name}} was burned!', !defender.types.some(t => t.type.name === 'fire'));
        }
        if (['sludge-bomb', 'sludge-wave', 'poison-jab'].includes(move.name) && Math.random() <= 0.3) {
          await applyEffect('PSN', '{{name}} was poisoned!', !defender.types.some(t => ['poison', 'steel'].includes(t.type.name)));
        }
        if (['ice-beam', 'blizzard', 'ice-fang', 'ice-punch'].includes(move.name) && Math.random() <= 0.1) {
          await applyEffect('FRZ', '{{name}} was frozen solid!', !defender.types.some(t => t.type.name === 'ice'));
        }
        if (['rock-slide', 'waterfall', 'iron-head', 'air-slash', 'dark-pulse'].includes(move.name) && Math.random() <= 0.3) {
          setDefenderVolatile(prev => ({ ...prev, flinch: true }));
        }
        if (move.name === 'fake-out') {
          setDefenderVolatile(prev => ({ ...prev, flinch: true }));
        }
      } else {
        setLogs(prev => [...prev, { text: t("It had no effect!"), type: isPlayer1 ? 'p1' : 'p2' }]);
        await wait(1000);
      }
    } else {
      // Status Move Execution
      await wait(800);
      const applyStatus = async (status: MajorStatus, msg: string, applyCheck: boolean) => {
        if (!defenderStatus && applyCheck) {
          setDefenderStatus(status);
          if (status === 'SLP') setDefenderVolatile(prev => ({ ...prev, sleepTurns: Math.floor(Math.random() * 3) + 1 }));
          if (status === 'TOX') setDefenderVolatile(prev => ({ ...prev, toxTurns: 1 }));
          setLogs(prev => [...prev, { text: t(msg, { name: defenderName }), type: isPlayer1 ? 'p1' : 'p2' }]);
        } else if (!applyCheck) {
          setLogs(prev => [...prev, { text: t('It doesn\'t affect {{name}}...', { name: defenderName }), type: isPlayer1 ? 'p1' : 'p2' }]);
        } else {
          setLogs(prev => [...prev, { text: t('{{name}} is already affected by a status condition!', { name: defenderName }), type: isPlayer1 ? 'p1' : 'p2' }]);
        }
        await wait(1500);
      };

      if (['thunder-wave', 'glare', 'stun-spore'].includes(move.name)) {
        await applyStatus('PAR', '{{name}} is paralyzed! It may be unable to move!', move.name === 'thunder-wave' ? !defender.types.some(t => t.type.name === 'electric') : true);
      } else if (['will-o-wisp'].includes(move.name)) {
        await applyStatus('BRN', '{{name}} was burned!', !defender.types.some(t => t.type.name === 'fire'));
      } else if (['toxic'].includes(move.name)) {
        await applyStatus('TOX', '{{name}} was badly poisoned!', !defender.types.some(t => ['poison', 'steel'].includes(t.type.name)));
      } else if (['poison-powder'].includes(move.name)) {
        await applyStatus('PSN', '{{name}} was poisoned!', !defender.types.some(t => ['poison', 'steel'].includes(t.type.name)));
      } else if (['spore', 'hypnosis', 'yawn', 'dark-void', 'sing'].includes(move.name)) {
        await applyStatus('SLP', '{{name}} fell asleep!', true);
      } else if (['confuse-ray', 'swagger', 'sweet-kiss'].includes(move.name)) {
        if (defenderVolatile.confusionTurns === 0) {
          setDefenderVolatile(prev => ({ ...prev, confusionTurns: Math.floor(Math.random() * 4) + 1 }));
          setLogs(prev => [...prev, { text: t('{{name}} became confused!', { name: defenderName }), type: isPlayer1 ? 'p1' : 'p2' }]);
        } else {
          setLogs(prev => [...prev, { text: t('{{name}} is already confused!', { name: defenderName }), type: isPlayer1 ? 'p1' : 'p2' }]);
        }
        await wait(1500);
      } else if (['captivate', 'attract'].includes(move.name)) {
        if (!defenderVolatile.infatuation) {
          setDefenderVolatile(prev => ({ ...prev, infatuation: true }));
          setLogs(prev => [...prev, { text: t('{{name}} fell in love!', { name: defenderName }), type: isPlayer1 ? 'p1' : 'p2' }]);
        } else {
          setLogs(prev => [...prev, { text: t('{{name}} is already in love!', { name: defenderName }), type: isPlayer1 ? 'p1' : 'p2' }]);
        }
        await wait(1500);
      } else if (['curse'].includes(move.name) && attacker.types.some(t => t.type.name === 'ghost')) {
        // Ghost type curse: Lose half HP, target is cursed
        const selfDmg = Math.floor(maxAttackerHp / 2);
        if (isPlayer1) { setPlayerHp(Math.max(0, playerHp - selfDmg)); } else { setOppHp(Math.max(0, oppHp - selfDmg)); }
        setDefenderVolatile(prev => ({ ...prev, curse: true }));
        setLogs(prev => [...prev, { text: t('{{name}} cut its own HP and laid a curse on {{target}}!', { name: attackerName, target: defenderName }), type: isPlayer1 ? 'p1' : 'p2' }]);
        await wait(1500);
        if ((isPlayer1 ? playerHp - selfDmg : oppHp - selfDmg) <= 0) {
          return handleFaint(isPlayer1 ? 'p1' : 'p2', attacker, attackerSpecies, isPlayer1 ? 'PLAYER 2' : 'PLAYER 1');
        }
      } else {
        setLogs(prev => [...prev, { text: t("But it failed!"), type: isPlayer1 ? 'p1' : 'p2' }]);
        await wait(1000);
      }
    }

    setFlashColor(null);
    setAttackAnim(null);
    await wait(600);

    // ==========================================
    // PHASE 3: POST-ATTACK DOTS
    // ==========================================
    const applyDot = async (playerKey: 'p1' | 'p2', dmgFn: (maxHp: number) => number, msg: string) => {
      const isP1 = playerKey === 'p1';
      const pMon = isP1 ? playerPokemon : opponentPokemon;
      const pSpec = isP1 ? playerSpecies : opponentSpecies;
      const maxHp = (getStatValue(pMon, 'hp') || 50) * 3;
      const dmg = dmgFn(maxHp);

      if (isP1) {
        const nextHp = Math.max(0, playerHp - dmg);
        setPlayerHp(nextHp);
        setLogs(prev => [...prev, { text: t(msg, { name: getLocalizedName(pSpec, pMon!.name) }), type: isPlayer1 ? 'p1' : 'p2' }]);
        await wait(1000);
        if (nextHp <= 0) { await handleFaint('p1', pMon, pSpec, 'PLAYER 2'); return true; }
      } else {
        const nextHp = Math.max(0, oppHp - dmg);
        setOppHp(nextHp);
        setLogs(prev => [...prev, { text: t(msg, { name: getLocalizedName(pSpec, pMon!.name) }), type: isPlayer1 ? 'p1' : 'p2' }]);
        await wait(1000);
        if (nextHp <= 0) { await handleFaint('p2', pMon, pSpec, 'PLAYER 1'); return true; }
      }
      return false;
    };

    if (attackerStatus === 'BRN') {
      if (await applyDot(isPlayer1 ? 'p1' : 'p2', max => Math.floor(max / 16), '{{name}} is hurt by its burn!')) return;
    } else if (attackerStatus === 'PSN') {
      if (await applyDot(isPlayer1 ? 'p1' : 'p2', max => Math.floor(max / 8), '{{name}} is hurt by poison!')) return;
    } else if (attackerStatus === 'TOX') {
      const mult = attackerVolatile.toxTurns;
      if (await applyDot(isPlayer1 ? 'p1' : 'p2', max => Math.floor((max * mult) / 16), '{{name}} is hurt by bad poison!')) return;
      setAttackerVolatile(prev => ({ ...prev, toxTurns: prev.toxTurns + 1 }));
    }

    if (attackerVolatile.curse) {
      if (await applyDot(isPlayer1 ? 'p1' : 'p2', max => Math.floor(max / 4), '{{name}} is afflicted by the curse!')) return;
    }

    endTurn();
  };

  if (!playerPokemon || !opponentPokemon) return null;
const maxPlayerHp = (getStatValue(playerPokemon, 'hp') || 50) * 3;
  const maxOppHp = (getStatValue(opponentPokemon, 'hp') || 50) * 3;

  const getHpPercentage = (hp: number, maxHp: number) => Math.max(0, Math.min(100, (hp / maxHp) * 100));

  const getHpColor = (percentage: number) => {
    if (percentage > 50) return 'bg-green-500';
    if (percentage > 20) return 'bg-yellow-400';
    return 'bg-red-500';
  };

  const TeamIcons = ({ team, activeIdx, isPlayer }: { team: any[], activeIdx: number, isPlayer: boolean }) => (
    <div className={`flex gap-1 absolute top-2 ${isPlayer ? 'left-2' : 'right-2'} z-50`}>
      {team?.map((p, i) => (
        <div key={i} className={`w-8 h-8 rounded-full border-2 ${i === activeIdx ? 'border-yellow-400 bg-white/20' : 'border-white/20 bg-black/40'} flex items-center justify-center overflow-hidden`}>
          <img src={p.sprites.front_default} className={`w-10 h-10 max-w-none ${i < activeIdx ? 'grayscale opacity-50' : ''}`} style={{ imageRendering: 'pixelated' }} />
        </div>
      ))}
    </div>
  );

  const activeMoves = currentTurn === 'player1' ? playerMoves : opponentMoves;
  const activePlayerName = currentTurn === 'player1' ? 'PLAYER 1' : 'PLAYER 2';

  return (
    <div className="h-screen bg-[#050505] text-white font-sans overflow-hidden flex flex-col selection:bg-blue-500">
      {dittoEasterEgg && (
        <div className="absolute inset-0 z-[200] bg-pink-200 flex flex-col items-center justify-center overflow-hidden">
          {/* Bouncing Dittos */}
          <div className="absolute inset-0 opacity-80 pointer-events-none">
            {[...Array(150)].map((_, i) => (
              <img
                key={i}
                src={playerPokemon?.sprites.front_default}
                className="absolute animate-bounce"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  width: `${30 + Math.random() * 150}px`,
                  animationDuration: `${0.5 + Math.random() * 2}s`,
                  animationDelay: `${Math.random() * 2}s`,
                  opacity: 0.4 + Math.random() * 0.6
                }}
              />
            ))}
          </div>

          <div className="relative z-10 flex flex-col items-center gap-6 p-8 bg-white/50 backdrop-blur-md rounded-3xl border-4 border-pink-400 shadow-2xl animate-in zoom-in duration-700">
            <h1 className="text-4xl sm:text-6xl font-black text-pink-600 tracking-tighter drop-shadow-md">
              메타메타 몽몽
            </h1>
            <p className="text-xl sm:text-2xl font-bold text-pink-500">
              메타몽끼리는 변신할 수 없어서 싸울 수 없어요!
            </p>
            <button
              onClick={() => { resetBattle(); router.back(); }}
              className="mt-4 px-8 py-3 bg-pink-500 text-white font-bold rounded-xl shadow-[0_5px_0_#be185d] hover:translate-y-1 hover:shadow-[0_0_0_#be185d] transition-all"
            >
              돌아가기
            </button>
          </div>

          <div className="absolute bottom-4 right-4 opacity-0 pointer-events-none">
            <iframe
              width="560"
              height="315"
              src="https://www.youtube.com/embed/-gKiKpZ_Rio?autoplay=1&loop=1"
              allow="autoplay"
            ></iframe>
          </div>
        </div>
      )}

      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-[0.03]">
        <div style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} className="absolute inset-0"></div>
      </div>

      <header className="z-50 bg-[#1a1a1a]/80 backdrop-blur-xl border-b-[4px] sm:border-b-[6px] border-black px-4 sm:px-8 py-3 sm:py-4 flex justify-between items-center shrink-0 shadow-2xl">
        <div className="flex items-center gap-3 sm:gap-6">
          <div onClick={() => router.back()} className="cursor-pointer group flex items-center gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-600 border-2 sm:border-4 border-black rounded-lg sm:rounded-xl shadow-[3px_3px_0_0_#000] group-hover:translate-x-1 transition-all flex items-center justify-center">
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </div>
            <div className="flex flex-col">
              <span className="text-[7px] sm:text-[9px] font-black text-blue-400 uppercase tracking-[0.3em] mb-0.5 sm:mb-1 leading-none">Simulation Active</span>
              <h1 className="text-sm sm:text-xl font-mono text-white uppercase font-black tracking-tighter leading-none">{t('Battle Arena')}</h1>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="hidden xs:flex flex-col items-end mr-2 sm:mr-4">
            <span className="text-[7px] sm:text-[8px] font-black text-white/30 uppercase tracking-widest mb-0.5">Latency</span>
            <span className="text-[8px] sm:text-[10px] font-mono text-green-500 font-bold">12ms</span>
          </div>
          <div className="w-[1px] sm:w-[2px] h-6 sm:h-8 bg-white/10"></div>
          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-blue-500/20 border-2 border-blue-500 flex items-center justify-center animate-pulse">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-400 rounded-full"></div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col p-2 sm:p-4 lg:p-6 gap-3 sm:gap-6 relative overflow-hidden">

        <div className="flex-1 relative bg-black/40 border-[4px] sm:border-[6px] border-black rounded-[1.5rem] sm:rounded-[3rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)]">
          <div className="absolute inset-0 bg-[#0a0a1a] overflow-hidden">
            {playerTeam && playerTeam.length > 1 && <TeamIcons team={playerTeam} activeIdx={activePlayerIdx} isPlayer={true} />}
            {opponentTeam && opponentTeam.length > 1 && <TeamIcons team={opponentTeam} activeIdx={activeOpponentIdx} isPlayer={false} />}
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, #1e3a8a 0%, transparent 80%)' }}></div>
            <div className="absolute bottom-0 w-full h-[40%] bg-gradient-to-t from-[#0f172a] to-transparent"></div>
            <div className="absolute inset-0 w-full h-full animate-scan pointer-events-none opacity-5 bg-gradient-to-b from-blue-400 via-transparent to-transparent"></div>
            <div className="absolute bottom-0 w-full h-1/2 opacity-10" style={{ backgroundImage: 'linear-gradient(transparent, rgba(255,255,255,0.1) 90%), linear-gradient(90deg, transparent, rgba(255,255,255,0.1) 90%)', backgroundSize: '100px 40px', transform: 'perspective(500px) rotateX(60deg)' }}></div>
          </div>

          {flashColor && (
            <div className={`absolute inset-0 z-50 pointer-events-none animate-in fade-in out-fade-out duration-300 ${flashColor === 'rainbow' ? 'animate-rainbow-bg' : ''}`} style={flashColor !== 'rainbow' ? { backgroundColor: `${flashColor}22` } : {}}>
              <div className="absolute inset-0" style={{ boxShadow: flashColor === 'rainbow' ? 'inset 0 0 150px rgba(255,255,255,0.8)' : `inset 0 0 100px ${flashColor}55` }}></div>
            </div>
          )}

          <div className={`absolute top-[5%] right-[5%] sm:top-[8%] sm:right-[8%] flex flex-col items-end gap-2 sm:gap-3 z-10 animate-in slide-in-from-right duration-700 ${damageEffect === 'p2' && lastMultiplier > 1 ? 'animate-screen-shake' : ''}`}>
            <div className="bg-[#1a1a1a]/70 backdrop-blur-xl border border-white/10 p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-2xl min-w-[200px] sm:min-w-[300px] relative overflow-hidden z-20">
              <div className="absolute top-0 left-0 w-full h-1 bg-red-500/30"></div>
              <div className="flex justify-between items-end mb-1 sm:mb-2 border-b border-white/5 pb-1">
                <div className="flex items-center gap-1.5 overflow-hidden">
                  <span className="font-mono font-black text-xs sm:text-lg uppercase text-white tracking-tighter truncate max-w-[120px]">{getLocalizedName(opponentSpecies, opponentPokemon.name)}</span>
                  {oppStatus && (
                    <span className={`text-white text-[6px] sm:text-[8px] font-black px-1 rounded border animate-pulse ${oppStatus === 'BRN' ? 'bg-red-600 border-red-400' :
                        oppStatus === 'PAR' ? 'bg-yellow-500 border-yellow-300' :
                          oppStatus === 'SLP' ? 'bg-gray-500 border-gray-300' :
                            oppStatus === 'FRZ' ? 'bg-cyan-500 border-cyan-300' :
                              (oppStatus === 'PSN' || oppStatus === 'TOX') ? 'bg-purple-600 border-purple-400' : ''
                      }`}>{oppStatus}</span>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="flex gap-1">
                    {opponentPokemon.types.map(t => (
                      <span key={t.type.name} className="px-1.5 py-0.5 text-[6px] sm:text-[8px] font-black text-white rounded border border-white/10 uppercase" style={{ backgroundColor: `${typeThemes[t.type.name]?.main || '#555'}88` }}>
                        {t.type.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="w-full bg-black/50 h-2 sm:h-3 rounded-full overflow-hidden flex items-center p-[1px] sm:p-[2px] border border-white/10">
                <div className={`h-full rounded-full transition-all duration-1000 ease-out ${getHpColor(getHpPercentage(oppHp, maxOppHp))}`} style={{ width: `${getHpPercentage(oppHp, maxOppHp)}%` }}></div>
              </div>
              <div className="flex justify-end mt-1 font-mono text-[7px] sm:text-[9px] font-black text-white/60">
                <span className="tracking-widest">{Math.max(0, oppHp)} / {maxOppHp}</span>
              </div>
            </div>
            <div className={`relative z-10 transition-all duration-300
                ${damageEffect === 'p2' ? 'animate-shake' : ''} 
                ${attackAnim === 'p2' && motionType === 'physical' ? 'animate-lunge-p2' : ''}
                ${attackAnim === 'p2' && motionType === 'special' ? 'animate-vibrate scale-105' : ''}`}>

              {/* 데미지 숫자 팝업 (위치 및 크기 조정) */}
              {hitDamage?.type === 'p2' && (
                <div className="absolute -top-12 left-3/4 -translate-x-1/2 z-50 pointer-events-none animate-damage-popup">
                  <span className="text-xl sm:text-3xl font-mono font-black text-red-500 [text-shadow:_0_2px_8px_rgba(0,0,0,0.8),_0_0_15px_#ef4444]">-{hitDamage.value}</span>
                </div>
              )}

              {/* 액티브 배틀 패드 (원형) */}
              <div className={`absolute -bottom-4 left-1/2 -translate-x-1/2 w-32 sm:w-60 h-8 sm:h-16 transition-all duration-700 ${currentTurn === 'player2' ? 'opacity-100 scale-110' : 'opacity-20 scale-90'}`}>
                <div className="absolute inset-0 bg-blue-500/20 rounded-[50%] blur-xl animate-pulse"></div>
                <div className="absolute inset-[10%] border-2 sm:border-4 border-blue-500/40 rounded-[50%] shadow-[0_0_20px_rgba(59,130,246,0.6)]"></div>
                <div className="absolute inset-0 border border-white/20 rounded-[50%]"></div>
              </div>

              <img
                src={opponentPokemon.sprites.front_default}
                className={`w-24 h-24 sm:w-48 sm:h-48 relative z-10 transition-all duration-500 
                    ${currentTurn === 'player2' ? 'scale-110' : 'scale-100 opacity-60 grayscale-[30%]'} 
                    ${hitFlash === 'p2' ? 'brightness-[10] contrast-[2] transition-none' : ''}
                    ${fainting === 'p2' ? 'animate-faint pointer-events-none' : ''}
                    ${evolutionAnim === 'p2' ? 'animate-evolution-squish-p2 pointer-events-none transition-none' : ''}`}
                style={{ imageRendering: 'pixelated' }}
              />

              {/* 액티브 인디케이터 */}
              {currentTurn === 'player2' && !isProcessing && (
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce z-20">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rotate-45 shadow-[0_0_10px_#3b82f6]"></div>
                </div>
              )}
            </div>
          </div>

          <div className={`absolute bottom-[5%] left-[5%] sm:bottom-[8%] sm:left-[8%] flex flex-col items-start gap-2 sm:gap-3 z-10 animate-in slide-in-from-left duration-700 ${damageEffect === 'p1' && lastMultiplier > 1 ? 'animate-screen-shake' : ''}`}>
            <div className={`relative z-10 transition-all duration-300
                ${damageEffect === 'p1' ? 'animate-shake' : ''} 
                ${attackAnim === 'p1' && motionType === 'physical' ? 'animate-lunge-p1' : ''}
                ${attackAnim === 'p1' && motionType === 'special' ? 'animate-vibrate scale-105' : ''}`}>

              {/* 데미지 숫자 팝업 (위치 및 크기 조정) */}
              {hitDamage?.type === 'p1' && (
                <div className="absolute -top-12 left-1/4 -translate-x-1/2 z-50 pointer-events-none animate-damage-popup">
                  <span className="text-xl sm:text-3xl font-mono font-black text-red-500 [text-shadow:_0_2px_8px_rgba(0,0,0,0.8),_0_0_15px_#ef4444]">-{hitDamage.value}</span>
                </div>
              )}

              {/* 액티브 배틀 패드 (원형) */}
              <div className={`absolute -bottom-4 left-1/2 -translate-x-1/2 w-32 sm:w-64 h-10 sm:h-20 transition-all duration-700 ${currentTurn === 'player1' ? 'opacity-100 scale-110' : 'opacity-20 scale-90'}`}>
                <div className="absolute inset-0 bg-blue-400/20 rounded-[50%] blur-xl animate-pulse"></div>
                <div className="absolute inset-[10%] border-2 sm:border-4 border-blue-400/40 rounded-[50%] shadow-[0_0_20px_rgba(96,165,250,0.6)]"></div>
                <div className="absolute inset-0 border border-white/20 rounded-[50%]"></div>
              </div>

              <img
                src={playerPokemon.sprites.front_default}
                className={`w-28 h-28 sm:w-52 sm:h-52 relative z-10 transition-all duration-500 scale-x-[-1] 
                    ${currentTurn === 'player1' ? 'scale-x-[-1.1] scale-y-[1.1]' : 'scale-x-[-1] opacity-60 grayscale-[30%]'} 
                    ${hitFlash === 'p1' ? 'brightness-[10] contrast-[2] transition-none' : ''}
                    ${fainting === 'p1' ? 'animate-faint pointer-events-none' : ''}
                    ${evolutionAnim === 'p1' ? 'animate-evolution-squish-p1 pointer-events-none transition-none' : ''}`}
                style={{ imageRendering: 'pixelated' }}
              />

              {/* 액티브 인디케이터 */}
              {currentTurn === 'player1' && !isProcessing && (
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce z-20">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-400 rotate-45 shadow-[0_0_12px_#60a5fa]"></div>
                </div>
              )}
            </div>
            <div className="bg-[#1a1a1a]/70 backdrop-blur-xl border border-white/10 p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-2xl min-w-[200px] sm:min-w-[300px] relative overflow-hidden z-20">
              <div className="absolute top-0 left-0 w-full h-1 bg-blue-400/30"></div>
              <div className="flex justify-between items-end mb-1 sm:mb-2 border-b border-white/5 pb-1">
                <div className="flex items-center gap-1.5 overflow-hidden">
                  <span className="font-mono font-black text-xs sm:text-lg uppercase text-white tracking-tighter truncate max-w-[120px]">{getLocalizedName(playerSpecies, playerPokemon.name)}</span>
                  {playerStatus && (
                    <span className={`text-white text-[7px] sm:text-[10px] font-black px-1.5 rounded border animate-pulse ${playerStatus === 'BRN' ? 'bg-red-600 border-red-400' :
                        playerStatus === 'PAR' ? 'bg-yellow-500 border-yellow-300' :
                          playerStatus === 'SLP' ? 'bg-gray-500 border-gray-300' :
                            playerStatus === 'FRZ' ? 'bg-cyan-500 border-cyan-300' :
                              (playerStatus === 'PSN' || playerStatus === 'TOX') ? 'bg-purple-600 border-purple-400' : ''
                      }`}>{playerStatus}</span>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="flex gap-1">
                    {playerPokemon.types.map(t => (
                      <span key={t.type.name} className="px-1.5 py-0.5 text-[6px] sm:text-[8px] font-black text-white rounded border border-white/10 uppercase" style={{ backgroundColor: `${typeThemes[t.type.name]?.main || '#555'}88` }}>
                        {t.type.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="w-full bg-black/50 h-3 sm:h-4 rounded-full overflow-hidden flex items-center p-[1px] sm:p-[2px] border border-white/10">
                <div className={`h-full rounded-full transition-all duration-1000 ease-out ${getHpColor(getHpPercentage(playerHp, maxPlayerHp))}`} style={{ width: `${getHpPercentage(playerHp, maxPlayerHp)}%` }}></div>
              </div>
              <div className="flex justify-end mt-1 sm:mt-2 font-mono text-[8px] sm:text-[10px] font-black text-white/60">
                <span className="tracking-[0.1em] sm:tracking-[0.2em]">{Math.max(0, playerHp)} / {maxPlayerHp}</span>
              </div>
            </div>
          </div>

          {!battleOver && !loading && (
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center justify-center z-50 pointer-events-none px-4">
              <div className={`px-4 sm:px-12 py-1.5 sm:py-3 bg-black/60 border-y-2 sm:border-y-4 border-blue-500/30 backdrop-blur-xl transition-all duration-500 transform ${isProcessing ? 'opacity-0 scale-90' : 'opacity-100 scale-100'}`}>
                <p className="font-mono text-white text-[10px] sm:text-2xl font-black tracking-[0.1em] sm:tracking-[0.3em] uppercase animate-pulse text-center">{activePlayerName} TURN</p>
              </div>
            </div>
          )}

          {battleOver && winner && (
            <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-700">
              <div className="flex flex-col items-center animate-in zoom-in-95 duration-700">

                {/* 배경 후광 효과 */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-yellow-500/10 blur-[120px] rounded-full pointer-events-none"></div>

                <div className="relative flex flex-col items-center text-center">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="h-[2px] w-12 bg-gradient-to-r from-transparent to-yellow-500"></div>
                    <span className="text-yellow-500 font-mono font-black text-xs sm:text-sm uppercase tracking-[0.6em] animate-pulse">Battle Analysis Finalized</span>
                    <div className="h-[2px] w-12 bg-gradient-to-l from-transparent to-yellow-500"></div>
                  </div>

                  <h2 className="text-5xl sm:text-7xl font-mono font-black text-white uppercase tracking-tighter leading-tight mb-6 drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]">
                    {winner.player} <span className="text-yellow-500">VICTORY</span>
                  </h2>

                  <div className="relative px-10 py-4 bg-white/5 border-y border-white/10 backdrop-blur-md overflow-hidden group min-w-[280px]">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    <p className="text-xl sm:text-2xl font-mono font-black text-white/80 uppercase tracking-[0.3em] leading-none">
                      {winner.pokemon}
                    </p>
                  </div>

                  <div className="mt-8 flex flex-col items-center gap-4">
                    <div className="flex gap-2">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="w-2 h-2 bg-yellow-500 rotate-45 animate-bounce" style={{ animationDelay: `${i * 0.1}s` }}></div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 하단 제어 센터 (모바일/데스크탑 반응형 슬라이딩) */}
        <div className="h-44 sm:h-56 shrink-0 relative w-full overflow-hidden">

          {/* 커맨드 콘솔 */}
          <div
            className={`absolute top-0 h-full transition-all duration-700 ease-in-out z-20 border-[4px] sm:border-[6px] border-black rounded-[1.5rem] sm:rounded-[2rem] p-3 sm:p-4 flex flex-col shadow-2xl ${currentTurn === 'player1'
              ? 'left-0 w-[calc(65%-0.5rem)] sm:w-[calc(65%-0.75rem)] bg-blue-900/20 shadow-[0_0_40px_rgba(59,130,246,0.2)]'
              : 'left-[calc(35%+0.5rem)] sm:left-[calc(35%+0.75rem)] w-[calc(65%-0.5rem)] sm:w-[calc(65%-0.75rem)] bg-red-900/20 shadow-[0_0_40px_rgba(239,68,68,0.2)]'
              }`}
          >
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 sm:px-4 sm:py-1 bg-black border-2 border-white/10 rounded-full z-30 flex items-center gap-2">
              <div className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full animate-pulse ${currentTurn === 'player1' ? 'bg-blue-400 shadow-[0_0_8px_#60a5fa]' : 'bg-red-500 shadow-[0_0_8px_#ef4444]'}`}></div>
              <span className={`text-[7px] sm:text-[8px] font-mono font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] ${currentTurn === 'player1' ? 'text-blue-400' : 'text-red-500'}`}>
                {currentTurn === 'player1' ? 'PLAYER_01' : 'PLAYER_02'}
              </span>
            </div>

            {loading ? (
              <div className="flex-1 flex items-center justify-center flex-col gap-2">
                <div className="w-6 h-6 sm:w-10 sm:h-10 border-2 sm:border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-[8px] sm:text-[10px] font-mono text-white/40 uppercase tracking-widest">Loading...</span>
              </div>
            ) : battleOver ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3">
                <div className="text-sm sm:text-2xl font-mono font-black text-black uppercase bg-yellow-400 px-4 sm:px-8 py-1.5 sm:py-2 rounded-lg sm:rounded-xl border-2 sm:border-4 border-black shadow-[4px_4px_0_0_#000]">{t('Battle Ended')}</div>
                <button onClick={() => { resetBattle(); router.back(); }} className="px-6 sm:px-10 py-2 sm:py-3 bg-blue-600 text-white border-2 sm:border-4 border-black rounded-lg sm:rounded-xl font-mono font-black uppercase text-[10px] sm:text-sm shadow-[4px_4px_0_0_#000] hover:bg-blue-500 active:translate-y-0.5 active:shadow-none transition-all outline-none">
                  {t('Restart')}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:gap-3 h-full overflow-hidden">
                {activeMoves.map((move, idx) => (
                  <button
                    key={`${move.name}-${idx}`}
                    disabled={isProcessing}
                    onClick={() => executeTurn(move)}
                    className={`group relative h-full p-3 sm:p-5 border-l-[8px] sm:border-l-[12px] border-black rounded-r-2xl sm:rounded-r-[3rem] transition-all duration-500 flex flex-col justify-center overflow-hidden disabled:opacity-20 hover:translate-x-3 active:translate-x-1 outline-none`}
                    style={{
                      backgroundColor: `${typeThemes[move.type.name]?.main || '#555'}ee`,
                      boxShadow: `0 10px 30px -10px rgba(0,0,0,0.5), inset -10px 0 20px rgba(0,0,0,0.2)`,
                      borderLeftColor: typeThemes[move.type.name]?.neon || '#fff'
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                    <div className="relative z-10 flex items-center justify-between w-full px-1">
                      <div className="flex flex-col gap-1 text-left">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: typeThemes[move.type.name]?.neon }}></div>
                          <span className="font-mono text-[7px] sm:text-[9px] font-black text-black/40 uppercase tracking-[0.3em]">{move.type.name}</span>
                        </div>
                        <p className="font-mono font-black text-sm sm:text-2xl text-white uppercase tracking-tighter [text-shadow:_0_2px_4px_rgb(0_0_0_/_80%)] group-hover:scale-110 transition-transform origin-left">{getLocalizedMoveName(move)}</p>
                      </div>

                      <div className="flex gap-2 sm:gap-5 items-center">
                        <div className="flex flex-col items-end">
                          <span className="text-[6px] sm:text-[8px] text-white/30 uppercase font-black tracking-widest">Power</span>
                          <span className="text-[10px] sm:text-lg font-mono font-black text-white">{move.power || '--'}</span>
                        </div>
                        <div className="w-[1px] h-6 sm:h-10 bg-white/10"></div>
                        <div className="flex flex-col items-end">
                          <span className="text-[6px] sm:text-[8px] text-white/30 uppercase font-black tracking-widest">Accuracy</span>
                          <span className="text-[10px] sm:text-lg font-mono font-black text-white">{move.accuracy || '--'}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>

                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 배틀 데이터 로그 (반응형 사이징) */}
          <div
            ref={logBoxRef}
            className={`absolute top-0 h-full transition-all duration-700 ease-in-out z-10 bg-[#0a0a0a] border-[4px] sm:border-[6px] border-black rounded-[1.5rem] sm:rounded-[2rem] p-3 sm:p-4 overflow-y-auto shadow-inner custom-scrollbar ${currentTurn === 'player1'
              ? 'right-0 w-[calc(35%-0.5rem)] sm:w-[calc(35%-0.75rem)]'
              : 'right-[calc(65%+0.5rem)] sm:right-[calc(65%+0.75rem)] w-[calc(35%-0.5rem)] sm:w-[calc(35%-0.75rem)]'
              }`}
          >
            <div className="absolute top-1.5 right-3 text-[6px] sm:text-[8px] font-black text-white/10 uppercase tracking-widest">Live</div>
            {logs.map((logObj, i) => (
              <div key={i} className={`flex gap-1.5 sm:gap-3 mb-1.5 sm:mb-2.5 items-start animate-in fade-in slide-in-from-bottom-1 sm:slide-in-from-bottom-2 duration-300 ${logObj.type === 'p1' ? 'text-blue-400' : logObj.type === 'p2' ? 'text-red-400' : 'text-gray-400'}`}>
                <span className={`font-mono text-[10px] sm:text-sm opacity-50 ${logObj.type === 'p1' ? 'text-blue-400' : logObj.type === 'p2' ? 'text-red-400' : 'text-gray-400'}`}>»</span>
                <p className={`font-mono text-[8px] sm:text-[13px] uppercase tracking-tighter leading-tight font-black drop-shadow-[0_0_5px_rgba(255,255,255,0.1)] ${logObj.type === 'p1' ? 'text-blue-400' : logObj.type === 'p2' ? 'text-red-400' : 'text-gray-400'}`}>{logObj.text}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* 시스템 푸터 (반응형 최적화) */}
      <footer className="shrink-0 bg-[#1a1a1a] border-t-[4px] sm:border-t-[8px] border-black px-4 sm:px-12 py-2 sm:py-3 flex justify-between items-center shadow-2xl">
        <div className="flex gap-4 sm:gap-8">
          <div className="flex flex-col">
            <span className="text-[6px] sm:text-[7px] font-black text-white/30 uppercase tracking-widest">Sim.Core</span>
            <span className="text-[8px] sm:text-[10px] font-mono text-white font-black uppercase text-blue-400">PKE-v1.2</span>
          </div>
          <div className="hidden xs:flex flex-col">
            <span className="text-[6px] sm:text-[7px] font-black text-white/30 uppercase tracking-widest">Entropy</span>
            <span className="text-[8px] sm:text-[10px] font-mono text-white font-black uppercase">0.0215</span>
          </div>
        </div>
        <div className="flex items-center gap-3 sm:gap-4">
          <span className="hidden sm:block text-[10px] font-mono text-white/20 font-black uppercase tracking-widest">System Authorized</span>
          <div className="flex gap-1">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-blue-500/40"></div>
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-blue-500/40"></div>
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-blue-500 shadow-[0_0_10px_#3b82f6]"></div>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(400%); }
        }
        .animate-scan { animation: scan 6s linear infinite; }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px) rotate(-0.5deg); }
          75% { transform: translateX(4px) rotate(0.5deg); }
        }
        @keyframes vibrate {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-12px); }
          40% { transform: translateX(12px); }
          60% { transform: translateX(-12px); }
          80% { transform: translateX(12px); }
        }
         @keyframes damage-popup {
           0% { transform: translate(-50%, 0) scale(0.5); opacity: 0; }
           20% { transform: translate(-50%, -30px) scale(1.1); opacity: 1; }
           70% { transform: translate(-50%, -50px) scale(1); opacity: 1; }
           100% { transform: translate(-50%, -70px) scale(0.8); opacity: 0; }
         }
         @keyframes screen-shake {
           0%, 100% { transform: translate(0, 0); }
           10%, 30%, 50%, 70%, 90% { transform: translate(-10px, -10px); }
           20%, 40%, 60%, 80% { transform: translate(10px, 10px); }
         }
         @keyframes lunge-p1 {
           0% { transform: translateX(0) scale(1); }
           20% { transform: translateX(-30px) scale(0.95); }
           45% { transform: translateX(100px) scale(1.1); }
           100% { transform: translateX(0) scale(1); }
         }
         @keyframes lunge-p2 {
           0% { transform: translateX(0) scale(1); }
           20% { transform: translateX(30px) scale(0.95); }
           45% { transform: translateX(-100px) scale(1.1); }
           100% { transform: translateX(0) scale(1); }
         }
         @keyframes recoil {
           0% { transform: translateX(0); }
           20% { transform: translateX(20px); }
           100% { transform: translateX(0); }
         }
         .animate-lunge-p1 { animation: lunge-p1 0.5s cubic-bezier(0.4, 0, 0.2, 1); }
         .animate-lunge-p2 { animation: lunge-p2 0.5s cubic-bezier(0.4, 0, 0.2, 1); }
         .animate-recoil { animation: recoil 0.3s ease-out; }
         .animate-damage-popup { animation: damage-popup 1s ease-out forwards; }
         .animate-screen-shake { animation: screen-shake 0.4s ease-in-out; }
         .animate-vibrate { animation: vibrate 0.3s linear; }
        .animate-shake { animation: shake 0.3s ease-in-out; }
        @keyframes faint {
          0% { transform: translateY(0) scale(1) skew(0); filter: brightness(1) contrast(1); opacity: 1; }
          15% { transform: translateY(10px) skew(10deg); filter: brightness(2) contrast(2); opacity: 0.8; }
          30% { transform: translateY(20px) skew(-10deg); filter: brightness(0.5) contrast(3); opacity: 0.9; }
          45% { transform: translateY(40px) scaleY(0.6); filter: brightness(4) contrast(0.5); opacity: 0.6; }
          60% { transform: translateY(70px) scaleY(0.3) scaleX(1.5); filter: brightness(10); opacity: 0.4; }
          100% { transform: translateY(150px) scale(0); filter: brightness(20); opacity: 0; }
        }
        .animate-faint { animation: faint 1.2s cubic-bezier(0.4, 0, 1, 1) forwards; }
        @keyframes rainbow-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-rainbow-bg {
          background: linear-gradient(124deg, #ff240055, #e81d1d55, #e8b71d55, #e3e81d55, #1de84055, #1ddde855, #2b1de855, #dd00f355, #dd00f355);
          background-size: 400% 400%;
          animation: rainbow-shift 2s ease infinite;
        }
        @keyframes evolution-squish-p1 {
          0% { transform: scale(-1, 1); filter: brightness(1) contrast(1); }
          10% { transform: scale(-1.2, 0.8); filter: brightness(10) contrast(0) drop-shadow(0 0 20px white); }
          30% { transform: scale(-0.8, 1.2); filter: brightness(10) contrast(0) drop-shadow(0 0 20px white); }
          50% { transform: scale(-1.1, 0.9); filter: brightness(10) contrast(0) drop-shadow(0 0 20px white); }
          70% { transform: scale(-0.9, 1.1); filter: brightness(10) contrast(0) drop-shadow(0 0 20px white); }
          90% { transform: scale(-1.05, 0.95); filter: brightness(10) contrast(0) drop-shadow(0 0 20px white); }
          100% { transform: scale(-1, 1); filter: brightness(10) contrast(0) drop-shadow(0 0 40px white); }
        }
        @keyframes evolution-squish-p2 {
          0% { transform: scale(1, 1); filter: brightness(1) contrast(1); }
          10% { transform: scale(1.2, 0.8); filter: brightness(10) contrast(0) drop-shadow(0 0 20px white); }
          30% { transform: scale(0.8, 1.2); filter: brightness(10) contrast(0) drop-shadow(0 0 20px white); }
          50% { transform: scale(1.1, 0.9); filter: brightness(10) contrast(0) drop-shadow(0 0 20px white); }
          70% { transform: scale(0.9, 1.1); filter: brightness(10) contrast(0) drop-shadow(0 0 20px white); }
          90% { transform: scale(1.05, 0.95); filter: brightness(10) contrast(0) drop-shadow(0 0 20px white); }
          100% { transform: scale(1, 1); filter: brightness(10) contrast(0) drop-shadow(0 0 40px white); }
        }
        .animate-evolution-squish-p1 { animation: evolution-squish-p1 2.5s ease-in-out forwards; }
        .animate-evolution-squish-p2 { animation: evolution-squish-p2 2.5s ease-in-out forwards; }
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0, 0, 0, 0.2); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
}

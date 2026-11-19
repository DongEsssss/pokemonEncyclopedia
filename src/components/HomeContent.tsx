"use client";

import { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import LanguageSwitcher from './LanguageSwitcher';
import styles from './HomeContent.module.css';
import PokedexSearch from './PokedexSearch';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { REGION_DATA } from '../constants/regionData';
import NeuralLinkSpeedTest from './NeuralLinkSpeedTest';
import { useBattle } from '../context/BattleContext';
import { getFixedMovesDetailsByNames, getPokemon } from '../services/pokeapi';

async function loadQuickBattleMember(name: string, moveNames: string[], signal: AbortSignal) {
  const [pokemon, moves] = await Promise.all([
    getPokemon(name, signal),
    getFixedMovesDetailsByNames(moveNames, signal),
  ]);
  if (moves.length !== moveNames.length) throw new Error('Could not load the quick battle moves');
  return { pokemon, moves };
}

export default function HomeContent() {
  const { t } = useTranslation();
  const router = useRouter();
  const battle = useBattle();
  const regions = Object.values(REGION_DATA);
  const [selectedRegion, setSelectedRegion] = useState(regions[0]);
  const [showSpeedTest, setShowSpeedTest] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [quickBattleLoading, setQuickBattleLoading] = useState(false);
  const [quickBattleFailed, setQuickBattleFailed] = useState(false);
  const quickBattleRequest = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => quickBattleRequest.current?.abort();
  }, []);

  async function startQuickBattle() {
    if (quickBattleRequest.current) return;
    const request = new AbortController();
    quickBattleRequest.current = request;
    setQuickBattleFailed(false);
    setQuickBattleLoading(true);

    try {
      const [player, opponent] = await Promise.all([
        loadQuickBattleMember('pikachu', ['thunderbolt', 'quick-attack', 'iron-tail', 'thunder'], request.signal),
        loadQuickBattleMember('eevee', ['swift', 'bite', 'tackle', 'quick-attack'], request.signal),
      ]);
      request.signal.throwIfAborted();
      battle.setBattleMode('1v1');
      battle.setIsVsAI(true);
      battle.setIsTournament(false);
      battle.setTournamentMatches([]);
      battle.setCurrentMatchId(null);
      battle.setPlayerTeam([player.pokemon]);
      battle.setOpponentTeam([opponent.pokemon]);
      battle.setPlayerTeamMoves([player.moves]);
      battle.setOpponentTeamMoves([opponent.moves]);
      battle.setPlayerPokemon(player.pokemon);
      battle.setOpponentPokemon(opponent.pokemon);
      battle.setPlayerMoves(player.moves);
      battle.setOpponentMoves(opponent.moves);
      router.push('/battle');
    } catch {
      if (!request.signal.aborted) {
        request.abort();
        setQuickBattleFailed(true);
        setQuickBattleLoading(false);
        quickBattleRequest.current = null;
      }
    }
  }

  return (
    <main className={styles.home}>
      <div className={styles.shell}>
        <header className={styles.deviceHeader}>
          <span className={styles.power} aria-hidden="true"><i /><i /><i /></span>
          <h1>{t('Pokédex')}</h1>
          <LanguageSwitcher />
        </header>
        <div className={styles.client}>
          <aside className={styles.sidebar}>
            <h2 id="regions-heading">{t('Explore regions')}</h2>
            <nav className={styles.regions} aria-labelledby="regions-heading">
              {regions.map((region) => (
                <button
                  type="button"
                  key={region.id}
                  aria-pressed={selectedRegion.id === region.id}
                  onClick={() => setSelectedRegion(region)}
                >
                  {t(region.nameKey)}
                </button>
              ))}
            </nav>
            <div className={styles.tools}>
              <button type="button" onClick={() => setShowSearch(true)}>
                {t('Encyclopedia Search')} <span aria-hidden="true">↗</span>
              </button>
              <button type="button" onClick={() => setShowSpeedTest(true)}>
                {t('Neural Sync Node')} <span aria-hidden="true">↗</span>
              </button>
            </div>
          </aside>

          <section className={styles.feature} aria-labelledby="region-title">
            <div className={styles.stage}>
              <div className={styles.map}>
                <Image src={selectedRegion.bgUrl} alt={t('{{region}} map', { region: t(selectedRegion.nameKey) })} fill sizes="(max-width: 760px) 100vw, 780px" />
              </div>
              <div className={styles.stageContent}>
                <div className={styles.starters} aria-hidden="true">
                  {selectedRegion.starters.map((id) => (
                    <Image
                      key={id}
                      src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`}
                      width={56}
                      height={56}
                      alt=""
                      unoptimized
                    />
                  ))}
                </div>
                <div className={styles.copy} aria-live="polite">
                  <h2 id="region-title">{t(selectedRegion.nameKey)}</h2>
                  <p>{t(selectedRegion.descKey)}</p>
                </div>
              </div>
            </div>
          </section>
        </div>
        <div className={styles.launchbar}>
          <div className={styles.launchActions}>
            <button
              type="button"
              className={styles.play}
              onClick={() => router.push(`/region/${selectedRegion.id}`)}
              disabled={quickBattleLoading}
            >
              <span aria-hidden="true">▶</span> {t('Open regional Pokédex')}
            </button>
            <button type="button" className={styles.quick} onClick={startQuickBattle} disabled={quickBattleLoading}>
              {quickBattleLoading ? t('Preparing battle…') : quickBattleFailed ? t('Retry quick battle') : t('Quick Battle')}
            </button>
          </div>
          {quickBattleFailed && <p className={styles.error} role="alert">{t('Could not prepare the battle.')}</p>}
        </div>
        <footer className={styles.footer}>© 2026 DongEsssss(Lime)</footer>
      </div>
      <NeuralLinkSpeedTest isOpen={showSpeedTest} onClose={() => setShowSpeedTest(false)} />
      <PokedexSearch isOpen={showSearch} onClose={() => setShowSearch(false)} />
    </main>
  );
}

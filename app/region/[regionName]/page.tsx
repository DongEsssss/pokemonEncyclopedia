'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { REGION_DATA } from '@/src/constants/regionData';
import { typeThemes } from '@/src/constants/pokemon';
import { matchChosung } from '@/src/utils/searchUtils';
import PokedexSidePanel from '@/src/components/PokedexSidePanel';
import MoveEditModal from '@/src/components/MoveEditModal';
import PokemonRelease from '@/src/components/PokemonRelease';
import LanguageSwitcher from '@/src/components/LanguageSwitcher';
import { getPokedexEntries, getPokemon, getPokemonSpecies, getRandomMoves } from '@/src/services/pokeapi';

import { useBattle } from '@/src/context/BattleContext';

import type { PokedexEntry, Pokemon } from '@/src/types/pokemon';

const POKEDEX_IDS: Record<string, number> = {
  kanto: 2, johto: 3, hoenn: 4, sinnoh: 5, unova: 8, kalos: 12, alola: 16, galar: 27, paldea: 31,
};

function TeamSlot({ pokemon, label, onClick }: {
  pokemon: Pokemon | null;
  label: string;
  onClick: () => void;
}) {
  return (
    <button type="button" className="lab-team-slot" disabled={!pokemon} aria-label={label} title={pokemon ? label : undefined} onClick={onClick}>
      {pokemon ? (
        <PokemonRelease key={pokemon.id} src={pokemon.sprites.front_default} size={48} />
      ) : (
        <span className="lab-team-empty" aria-hidden="true" />
      )}
    </button>
  );
}

export default function RegionPage() {
  const { t, i18n } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const regionName = (params.regionName as string).toLowerCase();

  const { 
    setPlayerPokemon: setContextPlayerPokemon, 
    setOpponentPokemon: setContextOpponentPokemon, 
    setPlayerMoves: setContextPlayerMoves, 
    setOpponentMoves: setContextOpponentMoves,
    battleMode, setBattleMode,
    isTournament, setIsTournament,
    tournamentSize, setTournamentSize,
    isVsAI, setIsVsAI,
    setPlayerTeam, setOpponentTeam,
    setPlayerTeamMoves, setOpponentTeamMoves, setTournamentMatches, setCurrentMatchId
  } = useBattle();

  const [pokedex, setPokedex] = useState<{ region: string; entries: PokedexEntry[] } | null>(null);
  const [failedRegion, setFailedRegion] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const entries = pokedex?.region === regionName ? pokedex.entries : null;
  const language = i18n.language.split('-')[0];
  const namesKey = regionName + "/" + language;
  const [translations, setTranslations] = useState<{ key: string; names: Record<string, string> } | null>(null);
  const localizedNames = translations?.key === namesKey ? translations.names : {};
  const [launching, setLaunching] = useState(false);
  const [launchFailed, setLaunchFailed] = useState(false);
  const [pokemonSearchTerm, setPokemonSearchTerm] = useState('');

  // Player 1 States
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [playerPokemon, setPlayerPokemon] = useState<any>(null);
  const [playerSpecies, setPlayerSpecies] = useState<any>(null);
  const [playerMoves, setPlayerMoves] = useState<any[]>([]);
  const [showP1Info, setShowP1Info] = useState(false);
  const [playerPokedexTab, setPlayerPokedexTab] = useState<'info' | 'moves'>('info');

  const [selectedPlayer2, setSelectedPlayer2] = useState<any>(null);
  const [playerPokemon2, setPlayerPokemon2] = useState<any>(null);
  const [playerSpecies2, setPlayerSpecies2] = useState<any>(null);
  const [playerMoves2, setPlayerMoves2] = useState<any[]>([]);
  const [showP1Info2, setShowP1Info2] = useState(false);
  const [playerPokedexTab2, setPlayerPokedexTab2] = useState<'info' | 'moves'>('info');

  // Player 2 States
  const [selectedOpponent, setSelectedOpponent] = useState<any>(null);
  const [opponentPokemon, setOpponentPokemon] = useState<any>(null);
  const [opponentSpecies, setOpponentSpecies] = useState<any>(null);
  const [opponentMoves, setOpponentMoves] = useState<any[]>([]);
  const [showP2Info, setShowP2Info] = useState(false);
  const [opponentPokedexTab, setOpponentPokedexTab] = useState<'info' | 'moves'>('info');

  const [selectedOpponent2, setSelectedOpponent2] = useState<any>(null);
  const [opponentPokemon2, setOpponentPokemon2] = useState<any>(null);
  const [opponentSpecies2, setOpponentSpecies2] = useState<any>(null);
  const [opponentMoves2, setOpponentMoves2] = useState<any[]>([]);
  const [showP2Info2, setShowP2Info2] = useState(false);
  const [opponentPokedexTab2, setOpponentPokedexTab2] = useState<'info' | 'moves'>('info');

  // Move Modal States
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<'player1' | 'player1_2' | 'player2' | 'player2_2' | null>(null);
  const [availableMovesDetails, setAvailableMovesDetails] = useState<any[]>([]);
  const [isLoadingAvailableMoves, setIsLoadingAvailableMoves] = useState(false);
  const [tempSelectedMoves, setTempSelectedMoves] = useState<any[]>([]);
  const [moveSearchTerm, setMoveSearchTerm] = useState('');
  const [hoveredMove, setHoveredMove] = useState<any>(null);

  const mainScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const request = new AbortController();
    getPokedexEntries(POKEDEX_IDS[regionName] ?? 27, request.signal)
      .then((entries) => {
        if (!request.signal.aborted) {
          setPokedex({ region: regionName, entries });
          setFailedRegion(null);
        }
      })
      .catch(() => {
        if (!request.signal.aborted) setFailedRegion(regionName);
      });
    return () => request.abort();
  }, [regionName, loadAttempt]);

  useEffect(() => {
    if (!entries?.length) return;
    const request = new AbortController();
    async function translateNames(list: PokedexEntry[]) {
      const batchSize = 20;
      for (let offset = 0; offset < list.length; offset += batchSize) {
        const names = await Promise.all(list.slice(offset, offset + batchSize).map(async ({ pokemon_species }) => {
          const species = await getPokemonSpecies(pokemon_species.name, request.signal).catch(() => null);
          const name = species?.names.find((entry) => entry.language.name === language)?.name;
          return [pokemon_species.name, name ?? pokemon_species.name] as const;
        }));
        if (request.signal.aborted) return;
        setTranslations((previous) => ({
          key: namesKey,
          names: { ...(previous?.key === namesKey ? previous.names : {}), ...Object.fromEntries(names) },
        }));
      }
    }
    void translateNames(entries);
    return () => request.abort();
  }, [entries, language, namesKey]);

  const getLocalizedName = (species: any, defaultName: string) => {
    if (!species) return defaultName;
    const nameObj = species.names.find((n: any) => n.language.name === (i18n.language === 'ko' ? 'ko' : 'en'));
    return nameObj ? nameObj.name : defaultName;
  };

  const getLocalizedPokemonDescription = (species: any) => {
    if (!species) return '';
    const entries = species.flavor_text_entries.filter((e: any) => e.language.name === (i18n.language === 'ko' ? 'ko' : 'en'));
    return entries.length > 0 ? entries[0].flavor_text.replace(/\f/g, ' ') : '';
  };

  const getLocalizedMoveName = (move: any) => {
    if (!move) return '';
    const nameObj = move.names.find((n: any) => n.language.name === (i18n.language === 'ko' ? 'ko' : 'en'));
    return nameObj ? nameObj.name : move.name;
  };

  const getLocalizedMoveDescription = (move: any) => {
    if (!move) return '';
    const entries = move.flavor_text_entries.filter((e: any) => e.language.name === (i18n.language === 'ko' ? 'ko' : 'en'));
    return entries.length > 0 ? entries[0].flavor_text.replace(/\f/g, ' ') : '';
  };

  const togglePanel = (panel: 'p1' | 'p1_2' | 'p2' | 'p2_2') => {
    if (panel === 'p1') {
      setShowP1Info(prev => !prev);
      setShowP1Info2(false);
    } else if (panel === 'p1_2') {
      setShowP1Info(false);
      setShowP1Info2(prev => !prev);
    } else if (panel === 'p2') {
      setShowP2Info(prev => !prev);
      setShowP2Info2(false);
    } else if (panel === 'p2_2') {
      setShowP2Info(false);
      setShowP2Info2(prev => !prev);
    }
  };

  const openPanel = (panel: 'p1' | 'p1_2' | 'p2' | 'p2_2') => {
    if (panel === 'p1') {
      setShowP1Info(true);
      setShowP1Info2(false);
    } else if (panel === 'p1_2') {
      setShowP1Info(false);
      setShowP1Info2(true);
    } else if (panel === 'p2') {
      setShowP2Info(true);
      setShowP2Info2(false);
    } else if (panel === 'p2_2') {
      setShowP2Info(false);
      setShowP2Info2(true);
    }
  };

  const handleSelect = async (entry: any) => {
    const id = entry.pokemon_species.url.split('/').filter(Boolean).pop();
    const pokemonResponse = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
    const pokemonData = await pokemonResponse.json();
    const speciesResponse = await fetch(entry.pokemon_species.url);
    const speciesData = await speciesResponse.json();

    const fetchMoves = async (pokemon: any) => {
      if (pokemon.name === 'magikarp') {
        const r = await fetch('https://pokeapi.co/api/v2/move/splash');
        return [await r.json()];
      } else {
        const movesPromises = pokemon.moves.slice(0, 4).map(async (m: any) => {
          const r = await fetch(m.move.url);
          return r.json();
        });
        return await Promise.all(movesPromises);
      }
    };

    const movesData = await fetchMoves(pokemonData);

    if (!selectedPlayer) {
      setSelectedPlayer(pokemonData);
      setPlayerPokemon(pokemonData);
      setPlayerSpecies(speciesData);
      setPlayerMoves(movesData);
      openPanel('p1');
    } else if (battleMode === '2v2' && !selectedPlayer2) {
      setSelectedPlayer2(pokemonData);
      setPlayerPokemon2(pokemonData);
      setPlayerSpecies2(speciesData);
      setPlayerMoves2(movesData);
      openPanel('p1_2');
    } else if (!selectedOpponent && !isTournament) {
      setSelectedOpponent(pokemonData);
      setOpponentPokemon(pokemonData);
      setOpponentSpecies(speciesData);
      setOpponentMoves(movesData);
      openPanel('p2');
    } else if (battleMode === '2v2' && !selectedOpponent2 && !isTournament) {
      setSelectedOpponent2(pokemonData);
      setOpponentPokemon2(pokemonData);
      setOpponentSpecies2(speciesData);
      setOpponentMoves2(movesData);
      openPanel('p2_2');
    }
  };

  const openMoveEditModal = async (player: 'player1' | 'player1_2' | 'player2' | 'player2_2') => {
    setEditingPlayer(player);
    const pokemon = player === 'player1' ? playerPokemon : player === 'player1_2' ? playerPokemon2 : player === 'player2' ? opponentPokemon : opponentPokemon2;
    const currentMoves = player === 'player1' ? playerMoves : player === 'player1_2' ? playerMoves2 : player === 'player2' ? opponentMoves : opponentMoves2;
    setTempSelectedMoves([...currentMoves]);
    setIsMoveModalOpen(true);
    setIsLoadingAvailableMoves(true);

    try {
      const details = await Promise.all(pokemon.moves.map(async (m: any) => {
        const res = await fetch(m.move.url);
        return res.json();
      }));
      setAvailableMovesDetails(details);
    } catch (error) {
      console.error('Error loading moves:', error);
    } finally {
      setIsLoadingAvailableMoves(false);
    }
  };

  const toggleTempMove = (move: any) => {
    const isAlreadySelected = tempSelectedMoves.find(m => m.name === move.name);
    if (isAlreadySelected) {
      setTempSelectedMoves(tempSelectedMoves.filter(m => m.name !== move.name));
    } else if (tempSelectedMoves.length < 4) {
      setTempSelectedMoves([...tempSelectedMoves, move]);
    }
  };

  const confirmMoveSelection = () => {
    if (editingPlayer === 'player1') {
      setPlayerMoves(tempSelectedMoves);
    } else if (editingPlayer === 'player1_2') {
      setPlayerMoves2(tempSelectedMoves);
    } else if (editingPlayer === 'player2') {
      setOpponentMoves(tempSelectedMoves);
    } else if (editingPlayer === 'player2_2') {
      setOpponentMoves2(tempSelectedMoves);
    }
    setIsMoveModalOpen(false);
  };

  const regionTitle = REGION_DATA[regionName]?.nameKey;
  return (
    <div className="lab-dex lab-width">
      <header className="lab-page-heading">
        <div className="lab-dex-title">
          <Link href="/" aria-label={t('Back')} className="lab-dex-back">←</Link>
          <h1 className="lab-route-title">{t("{{region}} Pokédex", { region: regionTitle ? t(regionTitle) : regionName })}</h1>
        </div>
        <LanguageSwitcher />
        <div className="lab-dex-search">
          <input type="search" aria-label={t("Search Pokémon")} placeholder={t("Search Pokémon")} value={pokemonSearchTerm} onChange={(event) => setPokemonSearchTerm(event.target.value)} />
          <button onClick={() => { setSelectedPlayer(null); setSelectedPlayer2(null); setSelectedOpponent(null); setSelectedOpponent2(null); setPlayerPokemon(null); setPlayerPokemon2(null); setOpponentPokemon(null); setOpponentPokemon2(null); setPokemonSearchTerm(''); }} className="lab-button lab-button-outline">{t("Reset team")}</button>
        </div>
      </header>

      <main className="lab-dex-main">
        {/* P1 상세 */}
        {selectedPlayer && showP1Info && (
          <div className="lab-dex-detail">
            <div className="absolute inset-0 lg:hidden" onClick={() => setShowP1Info(false)}></div>
            <div className="w-full lg:w-auto h-full transform transition-transform duration-500 ease-out animate-in slide-in-from-bottom lg:slide-in-from-left">
              <PokedexSidePanel
                pokemon={selectedPlayer}
                species={playerSpecies}
                moves={playerMoves}
                tab={playerPokedexTab}
                onTabChange={setPlayerPokedexTab}
                onEdit={() => openMoveEditModal('player1')}
                onClose={() => { setShowP1Info(false); setSelectedPlayer(null); setPlayerPokemon(null); }}
                t={t}
                getLocalizedName={getLocalizedName}
                getLocalizedPokemonDescription={getLocalizedPokemonDescription}
                getLocalizedMoveName={getLocalizedMoveName}
              />
            </div>
          </div>
        )}

        {/* P1-2 상세 */}
        {selectedPlayer2 && showP1Info2 && (
          <div className="lab-dex-detail">
            <div className="absolute inset-0 lg:hidden" onClick={() => setShowP1Info2(false)}></div>
            <div className="w-full lg:w-auto h-full transform transition-transform duration-500 ease-out animate-in slide-in-from-bottom lg:slide-in-from-left">
              <PokedexSidePanel
                pokemon={selectedPlayer2}
                species={playerSpecies2}
                moves={playerMoves2}
                tab={playerPokedexTab2}
                onTabChange={setPlayerPokedexTab2}
                onEdit={() => openMoveEditModal('player1_2')}
                onClose={() => { setShowP1Info2(false); setSelectedPlayer2(null); setPlayerPokemon2(null); }}
                t={t}
                getLocalizedName={getLocalizedName}
                getLocalizedPokemonDescription={getLocalizedPokemonDescription}
                getLocalizedMoveName={getLocalizedMoveName}
              />
            </div>
          </div>
        )}

        {/* 중앙 그리드 */}
        <div ref={mainScrollRef} className="lab-dex-scroll">
          {failedRegion === regionName ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center" role="alert">
              <p>{t('Could not load the Pokédex.')}</p>
              <button type="button" className="lab-button lab-button-primary" onClick={() => {
                setFailedRegion(null);
                setLoadAttempt((attempt) => attempt + 1);
              }}>{t('Retry')}</button>
            </div>
          ) : !entries ? (
            <p className="flex h-full items-center justify-center text-sm font-bold" role="status">{t('Loading Pokédex…')}</p>
          ) : (
            <div className="lab-dex-grid">
              {entries.filter(entry => {
                const name = localizedNames[entry.pokemon_species.name] || entry.pokemon_species.name;
                return matchChosung(name, pokemonSearchTerm);
              }).map((entry, idx) => {
                const id = entry.pokemon_species.url.split('/').filter(Boolean).pop();
                const isP1 = [selectedPlayer, selectedPlayer2].some((pokemon) => pokemon?.name === entry.pokemon_species.name);
                const isP2 = [selectedOpponent, selectedOpponent2].some((pokemon) => pokemon?.name === entry.pokemon_species.name);
                const displayName = localizedNames[entry.pokemon_species.name] || entry.pokemon_species.name;

                return (
                  <button
                    key={entry.pokemon_species.name}
                    type="button"
                    onClick={() => handleSelect(entry)}
                    className="lab-dex-card"
                    data-player={isP1}
                    data-opponent={isP2}
                  >
                    <span>#{String(id).padStart(3, "0")}</span>
                    <img src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`} alt="" width={68} height={68} loading={idx < 20 ? "eager" : "lazy"} />
                    <strong>{displayName}</strong>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* P2 상세 */}
        {selectedOpponent && showP2Info && (
          <div className="lab-dex-detail">
            <div className="absolute inset-0 lg:hidden" onClick={() => setShowP2Info(false)}></div>
            <div className="w-full lg:w-auto h-full transform transition-transform duration-500 ease-out animate-in slide-in-from-bottom lg:slide-in-from-right">
              <PokedexSidePanel
                pokemon={selectedOpponent}
                species={opponentSpecies}
                moves={opponentMoves}
                tab={opponentPokedexTab}
                onTabChange={setOpponentPokedexTab}
                onEdit={() => openMoveEditModal('player2')}
                onClose={() => { setShowP2Info(false); setSelectedOpponent(null); setOpponentPokemon(null); }}
                isOpponent
                t={t}
                getLocalizedName={getLocalizedName}
                getLocalizedPokemonDescription={getLocalizedPokemonDescription}
                getLocalizedMoveName={getLocalizedMoveName}
              />
            </div>
          </div>
        )}

        {/* P2-2 상세 */}
        {selectedOpponent2 && showP2Info2 && (
          <div className="lab-dex-detail">
            <div className="absolute inset-0 lg:hidden" onClick={() => setShowP2Info2(false)}></div>
            <div className="w-full lg:w-auto h-full transform transition-transform duration-500 ease-out animate-in slide-in-from-bottom lg:slide-in-from-right">
              <PokedexSidePanel
                pokemon={selectedOpponent2}
                species={opponentSpecies2}
                moves={opponentMoves2}
                tab={opponentPokedexTab2}
                onTabChange={setOpponentPokedexTab2}
                onEdit={() => openMoveEditModal('player2_2')}
                onClose={() => { setShowP2Info2(false); setSelectedOpponent2(null); setOpponentPokemon2(null); }}
                isOpponent
                t={t}
                getLocalizedName={getLocalizedName}
                getLocalizedPokemonDescription={getLocalizedPokemonDescription}
                getLocalizedMoveName={getLocalizedMoveName}
              />
            </div>
          </div>
        )}
      </main>

      <footer className="lab-team-dock">
        <div className="lab-team-modes flex flex-wrap gap-2 items-center">
          <div className="flex bg-black/50 p-1 rounded-xl border border-white/20 gap-2">
            <div className="flex">
              <button onClick={() => setBattleMode('1v1')} className={`px-2 sm:px-3 py-1 rounded-l-lg text-[10px] sm:text-xs font-mono font-black uppercase transition-all border-r border-white/10 ${battleMode === '1v1' ? 'bg-blue-500 text-white' : 'text-white/40 hover:text-white'}`}>1v1</button>
              <button onClick={() => setBattleMode('2v2')} className={`px-2 sm:px-3 py-1 rounded-r-lg text-[10px] sm:text-xs font-mono font-black uppercase transition-all ${battleMode === '2v2' ? 'bg-blue-500 text-white' : 'text-white/40 hover:text-white'}`}>2v2</button>
            </div>
            <div className="w-[1px] bg-white/20"></div>
            <div className="flex">
              <button onClick={() => setIsVsAI(false)} className={`px-2 sm:px-3 py-1 rounded-l-lg text-[10px] sm:text-xs font-mono font-black uppercase transition-all border-r border-white/10 ${!isVsAI ? 'bg-purple-500 text-white' : 'text-white/40 hover:text-white'}`}>PvP</button>
              <button onClick={() => setIsVsAI(true)} className={`px-2 sm:px-3 py-1 rounded-r-lg text-[10px] sm:text-xs font-mono font-black uppercase transition-all ${isVsAI ? 'bg-purple-500 text-white' : 'text-white/40 hover:text-white'}`}>PvE (AI)</button>
            </div>
          </div>
          
          <div className="flex bg-black/50 p-1 rounded-xl border border-white/20 gap-2 items-center">
            <button onClick={() => setIsTournament(!isTournament)} className={`px-3 py-1 rounded-lg text-[10px] sm:text-xs font-mono font-black uppercase transition-all border ${isTournament ? 'bg-yellow-500 text-black border-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.5)]' : 'border-transparent text-white/40 hover:text-white'}`}>
              Tourney: {isTournament ? 'ON' : 'OFF'}
            </button>
            {isTournament && (
              <select 
                value={tournamentSize} 
                onChange={(e) => setTournamentSize(Number(e.target.value) as 4|8|16|32)}
                className="bg-black/50 text-yellow-400 font-mono text-xs font-black border border-yellow-500/50 rounded p-1 outline-none appearance-none cursor-pointer hover:bg-yellow-500/10 transition-colors"
              >
                <option value={4}>4 Players</option>
                <option value={8}>8 Players</option>
                <option value={16}>16 Players</option>
                <option value={32}>32 Players</option>
              </select>
            )}
          </div>
        </div>

        <div className="lab-team-actions">
          <div className="lab-team-slots">
            <div className="lab-team-side">
              <span>{t('Player 1')}</span>
              <div className="lab-team-lineup">
                <TeamSlot pokemon={selectedPlayer} label={selectedPlayer ? getLocalizedName(playerSpecies, selectedPlayer.name) : t('Player 1')} onClick={() => togglePanel('p1')} />
                {battleMode === '2v2' && (
                  <TeamSlot pokemon={selectedPlayer2} label={selectedPlayer2 ? getLocalizedName(playerSpecies2, selectedPlayer2.name) : t('Player 1')} onClick={() => togglePanel('p1_2')} />
                )}
              </div>
            </div>

            <span className="lab-team-versus" aria-hidden="true">VS</span>

            <div className="lab-team-side lab-team-rival">
              <span>{!isTournament && !isVsAI ? t('Player 2') : 'CPU'}</span>
              <div className="lab-team-lineup">
                {!isTournament && !isVsAI ? (
                  <>
                    <TeamSlot pokemon={selectedOpponent} label={selectedOpponent ? getLocalizedName(opponentSpecies, selectedOpponent.name) : t('Player 2')} onClick={() => togglePanel('p2')} />
                    {battleMode === '2v2' && (
                      <TeamSlot pokemon={selectedOpponent2} label={selectedOpponent2 ? getLocalizedName(opponentSpecies2, selectedOpponent2.name) : t('Player 2')} onClick={() => togglePanel('p2_2')} />
                    )}
                  </>
                ) : (
                  <span className="lab-team-slot lab-team-cpu">AI</span>
                )}
              </div>
            </div>
          </div>

          <button onClick={async () => {
            const team1 = []; const moves1 = [];
            if (selectedPlayer) { team1.push(playerPokemon); moves1.push(playerMoves); }
            if (selectedPlayer2) { team1.push(playerPokemon2); moves1.push(playerMoves2); }
            
            const team2 = []; const moves2 = [];
            
            if (isTournament) {
              setPlayerTeam(team1);
              setPlayerTeamMoves(moves1);
              setTournamentMatches([]);
              setCurrentMatchId(null);
              router.push('/tournament');
              return;
            }

            if (isVsAI) {
              if (launching) return;
              setLaunching(true);
              setLaunchFailed(false);
              try {
                const teamSize = battleMode === '2v2' ? 2 : 1;
                const opponents = await Promise.all(Array.from({ length: teamSize }, async () => {
                  const pokemon = await getPokemon(Math.floor(Math.random() * 898) + 1);
                  return { pokemon, moves: await getRandomMoves(pokemon.moves, 4) };
                }));
                team2.push(...opponents.map(({ pokemon }) => pokemon));
                moves2.push(...opponents.map(({ moves }) => moves));
              } catch {
                setLaunchFailed(true);
                return;
              } finally {
                setLaunching(false);
              }
            } else {
              if (selectedOpponent) { team2.push(opponentPokemon); moves2.push(opponentMoves); }
              if (selectedOpponent2) { team2.push(opponentPokemon2); moves2.push(opponentMoves2); }
            }

            setPlayerTeam(team1);
            setPlayerTeamMoves(moves1);
            setOpponentTeam(team2);
            setOpponentTeamMoves(moves2);
            
            // Maintain 1v1 compatibility
            setContextPlayerPokemon(team1[0]);
            setContextPlayerMoves(moves1[0]);
            setContextOpponentPokemon(team2[0]);
            setContextOpponentMoves(moves2[0]);
            
            router.push('/battle');
            
          }} disabled={launching || !selectedPlayer || (battleMode === '2v2' && !selectedPlayer2) || (!isTournament && !isVsAI && !selectedOpponent) || (!isTournament && !isVsAI && battleMode === '2v2' && !selectedOpponent2)} className="lab-button lab-team-launch">
            <span aria-hidden="true">▶</span>
            <span>
              {launching ? t('Preparing battle…') : launchFailed ? t('Retry') : isTournament ? t('Enter tournament') : t('Start Battle!')}
            </span>
          </button>
        </div>
        {launchFailed && <p role="alert" className="text-sm text-red-300">{t('Could not prepare the battle.')}</p>}
      </footer>

      {isMoveModalOpen && editingPlayer && (
        <MoveEditModal
          editingPlayer={editingPlayer}
          moveSearchTerm={moveSearchTerm}
          setMoveSearchTerm={setMoveSearchTerm}
          tempSelectedMoves={tempSelectedMoves}
          toggleTempMove={toggleTempMove}
          isLoadingAvailableMoves={isLoadingAvailableMoves}
          availableMovesDetails={availableMovesDetails}
          hoveredMove={hoveredMove}
          setHoveredMove={setHoveredMove}
          setIsMoveModalOpen={setIsMoveModalOpen}
          confirmMoveSelection={confirmMoveSelection}
          getLocalizedMoveName={getLocalizedMoveName}
          getLocalizedMoveDescription={getLocalizedMoveDescription}
          t={t}
        />
      )}

      <style jsx global>{`
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        .animate-float { animation: float 3s ease-in-out infinite; }
        @keyframes ken-burns { 0% { transform: scale(1); } 100% { transform: scale(1.1) translate(1%, 1%); } }
        .animate-ken-burns { animation: ken-burns 20s linear infinite alternate; }
        @keyframes stripe-scroll { 0% { background-position: 0 0; } 100% { background-position: 20px 0; } }
        .animate-stripe-scroll { animation: stripe-scroll 1s linear infinite; }
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.1); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
}

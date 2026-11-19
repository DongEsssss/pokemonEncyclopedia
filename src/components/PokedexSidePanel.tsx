import React from 'react';
import { typeThemes } from '../constants/pokemon';
import PokemonRelease from './PokemonRelease';

interface PokedexSidePanelProps {
  pokemon: any;
  species: any;
  moves: any[];
  tab: 'info' | 'moves';
  onTabChange: (tab: 'info' | 'moves') => void;
  onEdit: () => void;
  onClose: () => void;
  isOpponent?: boolean;
  t: (key: string) => string;
  getLocalizedName: (species: any, defaultName: string) => string;
  getLocalizedPokemonDescription: (species: any) => string;
  getLocalizedMoveName: (move: any) => string;
}

const PokedexSidePanel = ({
  pokemon,
  species,
  moves,
  tab,
  onTabChange,
  onEdit,
  onClose,
  isOpponent,
  t,
  getLocalizedName,
  getLocalizedPokemonDescription,
  getLocalizedMoveName
}: PokedexSidePanelProps) => (
  <div className="lab-dex-panel">
    <header className="lab-dex-panel-header">
      <h2>{t(isOpponent ? 'Player 2' : 'Player 1')}</h2>
      <button type="button" onClick={onClose} className="lab-dex-close" aria-label={t('Close')}>&times;</button>
    </header>
    <div className="px-4 pt-4 shrink-0 relative">
      <div className="flex bg-black/60 p-1.5 rounded-2xl gap-1 border-2 border-black shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]">
        <button onClick={() => onTabChange('info')} className={`flex-1 py-2.5 font-mono text-[11px] uppercase font-black rounded-xl transition-all duration-500 ${tab === 'info' ? 'bg-[#28aafd] text-white shadow-[0_0_15px_rgba(40,170,253,0.5)]' : 'text-white/30 hover:text-white/60'}`}>{t('정보')}</button>
        <button onClick={() => onTabChange('moves')} className={`flex-1 py-2.5 font-mono text-[11px] uppercase font-black rounded-xl transition-all duration-500 ${tab === 'moves' ? 'bg-[#28aafd] text-white shadow-[0_0_15px_rgba(40,170,253,0.5)]' : 'text-white/30 hover:text-white/60'}`}>{t('스킬셋')}</button>
      </div>
    </div>

    <div className="flex-1 flex flex-col min-h-0 relative z-10">
      <div className="flex-1 p-4 sm:p-5 overflow-y-auto custom-scrollbar bg-transparent min-h-0">
        {/* 공통 상단 영역: 중앙에서 커지며 나타나는 애니메이션 */}
        <div className="mb-4">
          <div className="relative bg-black/60 border-[4px] border-black rounded-[2rem] p-6 flex flex-col items-center justify-center overflow-hidden shadow-[inset_0_0_40px_rgba(0,0,0,0.8)]">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none"></div>
            <div className="absolute top-3 left-4 text-[9px] font-mono text-blue-400/30 font-black tracking-widest uppercase">ID.UNIT_{String(pokemon.id).padStart(4, '0')}</div>
            
            <div className="relative group/sprite">
              <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full scale-150 opacity-0 group-hover/sprite:opacity-100 transition-opacity duration-700"></div>
              <PokemonRelease key={pokemon.id} src={pokemon.sprites.front_default} size={128} />
            </div>

            <h2 className="text-xl font-mono text-white uppercase font-black tracking-tighter text-center mt-2">{getLocalizedName(species, pokemon.name)}</h2>
            <div className="flex gap-2 mt-2">
              {pokemon.types.map((t_type: any) => (
                <span key={t_type.type.name} className="px-3 py-1 rounded-lg text-[9px] font-black text-white uppercase border-2 border-black shadow-lg" style={{ backgroundColor: typeThemes[t_type.type.name]?.color }}>{t_type.type.name}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-[900ms] fill-mode-both">
          {tab === 'info' ? (
            <div className="space-y-4 pb-6">
              <div className="bg-white/5 border-2 border-black p-4 rounded-[1.2rem] shadow-inner relative overflow-hidden">
                <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest block mb-2 opacity-60">Description</span>
                <p className="font-mono text-[11px] sm:text-[13px] text-white/80 leading-snug">{getLocalizedPokemonDescription(species)}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 border-2 border-black p-3 rounded-[1.2rem]">
                  <span className="text-[8px] font-black text-white/20 uppercase tracking-widest block mb-2">Dimensions</span>
                  <div className="space-y-1 text-[10px] font-mono">
                    <div className="flex justify-between"><span className="text-white/40">HT:</span><span className="font-black text-blue-400">{pokemon.height / 10}m</span></div>
                    <div className="flex justify-between"><span className="text-white/40">WT:</span><span className="font-black text-blue-400">{pokemon.weight / 10}kg</span></div>
                  </div>
                </div>
                <div className="bg-white/5 border-2 border-black p-3 rounded-[1.2rem]">
                  <span className="text-[8px] font-black text-white/20 uppercase tracking-widest block mb-2">Base Stats</span>
                  <div className="grid grid-cols-3 gap-x-2 gap-y-1">
                    {pokemon.stats.slice(0, 6).map((s: any) => (
                      <div key={s.stat.name} className="flex flex-col items-center">
                        <span className="text-[6px] text-white/30 font-black uppercase">{t(s.stat.name).substring(0, 3)}</span>
                        <span className="text-[9px] text-white font-black">{s.base_stat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 pb-10">
              <div className="flex justify-between items-center px-2">
                <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Moveset</span>
                <button onClick={onEdit} className="px-3 py-1 bg-yellow-400 text-black rounded-lg font-mono text-[9px] font-black uppercase hover:bg-yellow-300 transition-all">Edit</button>
              </div>
              <div className="space-y-2">
                {moves.map((m: any, idx: number) => (
                  <div 
                    key={m.id} 
                    style={{ animationDelay: `${idx * 100 + 1000}ms` }}
                    className="animate-in fade-in slide-in-from-right-4 fill-mode-both relative bg-black/40 border-2 border-black p-3 rounded-[1.2rem] flex flex-col gap-1 hover:bg-black/60 transition-all cursor-default shadow-lg group/move"
                  >
                    <div className="flex justify-between items-center relative z-10">
                      <span className="text-[12px] font-black text-white uppercase">{getLocalizedMoveName(m)}</span>
                      <span className="text-[7px] px-1.5 py-0.5 rounded-md text-white font-black" style={{ backgroundColor: typeThemes[m.type.name]?.color }}>{m.type.name}</span>
                    </div>
                    <div className="flex gap-3 text-[9px] font-mono text-white/30 relative z-10">
                      <span>PWR <span className="text-white/80 font-black">{m.power || '--'}</span></span>
                      <span>ACC <span className="text-white/80 font-black">{m.accuracy || '--'}</span></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    <style jsx>{`
      @keyframes float-slow {
        0%, 100% { transform: translateY(0) rotate(0deg); }
        50% { transform: translateY(-15px) rotate(2deg); }
      }
      .animate-float-slow { animation: float-slow 4s ease-in-out infinite; }
      .custom-scrollbar::-webkit-scrollbar { width: 6px; }
      .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
      .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; border: 1px solid rgba(255,255,255,0.05); }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.1); }
    `}</style>
  </div>
);

export default PokedexSidePanel;

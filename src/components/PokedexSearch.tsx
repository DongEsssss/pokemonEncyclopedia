"use client";

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface PokedexSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PokedexSearch({ isOpen, onClose }: PokedexSearchProps) {
  const { t, i18n } = useTranslation();
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // 1. 먼저 포켓몬 검색 시도
      const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${query.toLowerCase().replace(/\s+/g, '-')}`);
      if (response.ok) {
        const data = await response.json();
        
        // 종 데이터(한글 이름 등을 위해) 추가 페치
        const speciesRes = await fetch(data.species.url);
        const speciesData = await speciesRes.json();
        
        setResult({ type: 'pokemon', data, species: speciesData });
      } else {
        // 2. 포켓몬이 없으면 기술 검색 시도
        const moveRes = await fetch(`https://pokeapi.co/api/v2/move/${query.toLowerCase().replace(/\s+/g, '-')}`);
        if (moveRes.ok) {
          const moveData = await moveRes.json();
          setResult({ type: 'move', data: moveData });
        } else {
          setError(t('No results found.'));
        }
      }
    } catch (err) {
      setError(t('Search failed.'));
    } finally {
      setLoading(false);
    }
  };

  const getLocalizedName = (names: any[]) => {
    const lang = i18n.language.startsWith('ko') ? 'ko' : i18n.language.startsWith('ja') ? 'ja' : 'en';
    return names.find(n => n.language.name === lang)?.name || names.find(n => n.language.name === 'en')?.name || query;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="lab-dialog-backdrop absolute inset-0" onClick={onClose}></div>
      
      <div className="lab-dialog lab-search-dialog relative w-full max-w-2xl flex flex-col" role="dialog" aria-label={t('Encyclopedia Search')}>
        
        {/* 헤더 */}
        <div className="lab-dialog-header flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.4)]">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </div>
            <div>
              <h2 className="text-xl font-mono font-black text-white uppercase tracking-tighter">{t('Encyclopedia Search')}</h2>
            </div>
          </div>
          <button onClick={onClose} aria-label={t('Close')} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 text-white/40 hover:text-white transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        {/* 검색창 */}
        <div className="lab-search-form shrink-0">
          <form onSubmit={handleSearch} className="relative">
            <input 
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('Search by name (Pokemon or Move)...')}
              className="w-full bg-black/40 border-2 border-white/10 rounded-2xl px-6 py-4 font-sans text-lg text-white placeholder:text-white/30 focus:border-blue-500/50 outline-none transition-all"
            />
            <button 
              type="submit"
              disabled={loading}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-xl font-mono font-bold text-sm transition-all disabled:opacity-50"
            >
              {loading ? t('SEARCHING...') : t('SEARCH')}
            </button>
          </form>
        </div>

        {/* 결과 영역 */}
        <div className="lab-search-results flex-1 overflow-y-auto custom-scrollbar bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.05),transparent_70%)]">
          {!result && !loading && !error && (
            <div className="h-full flex flex-col items-center justify-center opacity-20 py-20">
              <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
              <p className="mt-4 font-mono text-sm uppercase tracking-widest">{t('Enter query to begin data retrieval')}</p>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center py-10">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
              </div>
              <p className="font-mono text-red-500 uppercase tracking-widest text-sm">{error}</p>
            </div>
          )}

          {result?.type === 'pokemon' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col sm:flex-row gap-8 items-start">
                <div className="relative shrink-0">
                  <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full"></div>
                  <img 
                    src={result.data.sprites.other['official-artwork'].front_default} 
                    className="w-48 h-48 relative z-10"
                    alt={result.data.name}
                  />
                </div>
                <div className="flex-1 w-full">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-mono text-blue-500 font-black">#{result.data.id.toString().padStart(3, '0')}</span>
                    <h3 className="text-3xl font-sans font-black text-white uppercase">{getLocalizedName(result.species.names)}</h3>
                  </div>
                  <div className="flex gap-2 mb-6">
                    {result.data.types.map((t: any) => (
                      <span key={t.type.name} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-mono text-white/60 uppercase tracking-widest">
                        {t.type.name}
                      </span>
                    ))}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-8">
                    {result.data.stats.map((s: any) => (
                      <div key={s.stat.name} className="bg-white/5 p-4 rounded-2xl border border-white/5">
                        <p className="text-[8px] font-mono text-white/30 uppercase tracking-widest mb-1">{s.stat.name}</p>
                        <div className="flex items-baseline gap-2">
                          <span className="text-xl font-mono font-bold text-white">{s.base_stat}</span>
                          <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500" style={{ width: `${(s.base_stat / 255) * 100}%` }}></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-8 border-t border-white/5 pt-8">
                <h4 className="text-xs font-mono font-black text-blue-400 uppercase tracking-[0.4em] mb-4">{t('Move Capability')}</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {result.data.moves.slice(0, 12).map((m: any) => (
                    <div key={m.move.name} className="bg-black/40 border border-white/5 px-4 py-2 rounded-lg font-mono text-[10px] text-white/60 uppercase truncate">
                      {m.move.name.replace('-', ' ')}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {result?.type === 'move' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-blue-600/10 border-2 border-blue-600/20 p-8 rounded-[2rem] relative overflow-hidden mb-8">
                <div className="absolute top-0 right-0 p-4 font-mono text-[7px] text-blue-500/20 uppercase tracking-[0.4em]">Move_Module.Ref_{result.data.id}</div>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg>
                  </div>
                  <div>
                    <h3 className="text-3xl font-sans font-black text-white uppercase tracking-tighter">{getLocalizedName(result.data.names)}</h3>
                    <span className="text-[10px] font-sans text-blue-400/60 uppercase tracking-[0.3em]">{result.data.type.name} Type</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-black/40 p-4 rounded-2xl border border-white/5 text-center">
                    <p className="text-[8px] font-mono text-white/30 uppercase tracking-widest mb-1">Power</p>
                    <span className="text-xl font-mono font-bold text-white">{result.data.power || '--'}</span>
                  </div>
                  <div className="bg-black/40 p-4 rounded-2xl border border-white/5 text-center">
                    <p className="text-[8px] font-mono text-white/30 uppercase tracking-widest mb-1">Accuracy</p>
                    <span className="text-xl font-mono font-bold text-white">{result.data.accuracy || '--'}%</span>
                  </div>
                  <div className="bg-black/40 p-4 rounded-2xl border border-white/5 text-center">
                    <p className="text-[8px] font-mono text-white/30 uppercase tracking-widest mb-1">PP</p>
                    <span className="text-xl font-mono font-bold text-white">{result.data.pp || '--'}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
                <h4 className="text-[10px] font-mono font-black text-blue-400 uppercase tracking-[0.4em] mb-4">{t('Effect Description')}</h4>
                <p className="text-sm font-mono text-white/60 leading-relaxed uppercase tracking-tight">
                  {result.data.effect_entries.find((e: any) => e.language.name === 'en')?.short_effect || t('No description available.')}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="p-6 bg-black/60 border-t border-white/5 flex justify-between items-center shrink-0">
          <div className="flex gap-4">
            <span className="text-[8px] font-mono text-white/20 uppercase tracking-widest">Auth_Lvl: Admin</span>
            <span className="text-[8px] font-mono text-white/20 uppercase tracking-widest">Status: Ready</span>
          </div>
          <span className="text-[8px] font-mono text-white/20 uppercase tracking-[0.4em]">ENCYCLOPEDIA_ACCESS_PROTOCOL</span>
        </div>
      </div>
    </div>
  );
}

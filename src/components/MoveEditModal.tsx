import { typeThemes } from '../constants/pokemon';
import { matchChosung } from '../utils/searchUtils';

interface MoveEditModalProps {
  editingPlayer: 'player1' | 'player2' | 'player1_2' | 'player2_2';
  moveSearchTerm: string;
  setMoveSearchTerm: (term: string) => void;
  tempSelectedMoves: any[];
  toggleTempMove: (move: any) => void;
  isLoadingAvailableMoves: boolean;
  availableMovesDetails: any[];
  hoveredMove: any;
  setHoveredMove: (move: any) => void;
  setIsMoveModalOpen: (isOpen: boolean) => void;
  confirmMoveSelection: () => void;
  getLocalizedMoveName: (move: any) => string;
  getLocalizedMoveDescription: (move: any) => string;
  t: (key: string) => string;
}

const MoveEditModal = ({
  editingPlayer,
  moveSearchTerm,
  setMoveSearchTerm,
  tempSelectedMoves,
  toggleTempMove,
  isLoadingAvailableMoves,
  availableMovesDetails,
  hoveredMove,
  setHoveredMove,
  setIsMoveModalOpen,
  confirmMoveSelection,
  getLocalizedMoveName,
  getLocalizedMoveDescription,
  t
}: MoveEditModalProps) => (
  <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4">
    <div className="bg-[#111]/90 border-2 border-white/10 rounded-[3rem] w-full max-w-6xl flex flex-col max-h-[92vh] shadow-[0_0_120px_rgba(0,0,0,0.9)] relative overflow-hidden animate-in zoom-in-95 duration-400">
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-red-500 opacity-50"></div>

      <div className="p-8 sm:p-10 flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.5em] mb-1 opacity-70">Technique.Protocol</span>
            <h2 className="text-3xl sm:text-5xl font-mono uppercase font-black text-white tracking-tighter leading-none italic">{t('Define Protocol')}</h2>
          </div>
          <div className="flex flex-col flex-1 items-end sm:items-center">
            <div className="relative group/search max-w-[240px] sm:max-w-[300px] w-full mb-4">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-white/20 group-focus-within/search:text-blue-400 transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              </div>
              <input
                type="text"
                value={moveSearchTerm}
                onChange={(e) => setMoveSearchTerm(e.target.value)}
                placeholder={t('Search by technique...')}
                className="w-full bg-black/60 border border-white/10 rounded-2xl pl-11 pr-4 py-3 font-sans text-sm text-white placeholder:text-white/20 focus:border-blue-500/50 outline-none transition-all backdrop-blur-md"
              />
            </div>
            <div className="flex gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className={`w-4 h-4 sm:w-6 sm:h-6 rounded-lg border-2 transition-all ${i < tempSelectedMoves.length ? 'bg-blue-500 border-white/20 shadow-[0_0_15px_#3b82f6]' : 'bg-white/5 border-white/5'}`}></div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden px-8 sm:px-10 pb-8 sm:pb-10 gap-8">
        <div className="flex-[1.5] flex flex-col gap-6 overflow-hidden">
          <div className="bg-black/60 border border-white/10 rounded-3xl p-4 flex gap-3 items-center shrink-0 overflow-x-auto custom-scrollbar shadow-2xl backdrop-blur-md">
            <span className="text-[11px] font-mono font-black text-blue-500 uppercase tracking-tighter px-4 border-r border-white/10 shrink-0">Current Loadout</span>
            {[...Array(4)].map((_, i) => {
              const move = tempSelectedMoves[i];
              return (
                <div key={i} className={`flex-1 min-w-[140px] h-12 rounded-2xl border transition-all flex items-center px-4 gap-3 ${move ? 'bg-blue-600/20 border-blue-500/50 shadow-lg' : 'bg-white/5 border-dashed border-white/10 opacity-30'}`}>
                  {move ? (
                    <>
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse"></div>
                      <span className="text-[11px] font-mono font-black text-white uppercase truncate">{getLocalizedMoveName(move)}</span>
                      <button onClick={() => toggleTempMove(move)} className="ml-auto text-white/40 hover:text-white transition-colors">×</button>
                    </>
                  ) : (
                    <span className="text-[9px] font-mono font-black text-white/20 uppercase tracking-widest">Awaiting Data</span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-3 gap-3 p-6 bg-black/40 border border-white/10 rounded-[2rem] custom-scrollbar shadow-inner backdrop-blur-md">
            {isLoadingAvailableMoves ? (
              <div className="col-span-full h-full flex flex-col items-center justify-center gap-5 py-24">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="font-mono text-white/30 text-sm uppercase tracking-widest">Analyzing Gene Pool...</span>
              </div>
            ) : (
              availableMovesDetails.filter(m => {
                const name = getLocalizedMoveName(m);
                return matchChosung(name, moveSearchTerm);
              }).map((m: any) => {
                const isSelected = tempSelectedMoves.find(sm => sm.name === m.name);
                const typeTheme = typeThemes[m.type.name] || { color: '#555', shadow: 'rgba(0,0,0,0.5)' };
                return (
                  <button
                    key={m.name}
                    onClick={() => toggleTempMove(m)}
                    onMouseEnter={() => setHoveredMove(m)}
                    className={`group relative p-5 border transition-all rounded-[1.5rem] flex flex-col justify-center overflow-hidden ${isSelected ? 'scale-95 ring-2 ring-blue-400 border-transparent shadow-[0_0_30px_rgba(59,130,246,0.4)]' : 'hover:scale-[1.03] hover:border-white/20 border-white/5 bg-white/5 grayscale-[0.8] opacity-60 hover:grayscale-0 hover:opacity-100'}`}
                    style={{
                      backgroundColor: isSelected ? `${typeTheme.color}33` : 'rgba(255,255,255,0.03)',
                      height: '110px'
                    }}
                  >
                    {isSelected && <div className="absolute inset-0 bg-white/5 animate-pulse"></div>}
                    <div className="absolute top-3 right-4 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: typeTheme.color, boxShadow: `0 0 15px ${typeTheme.shadow}` }}></div>
                    </div>
                    <div className="relative z-10 w-full">
                      <p className={`font-mono font-black text-sm sm:text-xl uppercase truncate leading-tight drop-shadow-lg ${isSelected ? 'text-white' : 'text-white/70 group-hover:text-white'}`}>{getLocalizedMoveName(m)}</p>
                      <div className={`mt-2 text-[10px] font-black uppercase tracking-[0.3em] ${isSelected ? 'text-white/90' : 'text-white/30'}`}>{m.type.name}</div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="w-full lg:w-[420px] h-[450px] lg:h-auto flex-shrink-0 bg-[#1a1a1a]/60 border border-white/10 rounded-[2.5rem] p-8 flex flex-col gap-6 overflow-hidden relative group/panel backdrop-blur-3xl shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-red-500/5 pointer-events-none"></div>
          {hoveredMove || tempSelectedMoves[tempSelectedMoves.length - 1] ? (
            <>
              {(() => {
                const move = hoveredMove || tempSelectedMoves[tempSelectedMoves.length - 1];
                const typeTheme = typeThemes[move.type.name] || { color: '#555', shadow: 'rgba(0,0,0,0.5)' };
                return (
                  <div className="animate-in fade-in slide-in-from-right-8 duration-500 flex flex-col h-full">
                    <div className="flex justify-between items-start mb-6">
                      <span className="px-4 py-1.5 rounded-xl text-[10px] font-black text-white uppercase border border-white/10 shadow-xl" style={{ backgroundColor: `${typeTheme.color}aa` }}>{move.type.name}</span>
                      <span className="font-mono text-[10px] text-white/20 font-black tracking-tighter">DATA.CORE_{move.id}</span>
                    </div>

                    <h3 className="text-3xl sm:text-5xl font-mono font-black text-white uppercase mb-5 tracking-tighter leading-none italic py-1 drop-shadow-2xl shrink-0">{getLocalizedMoveName(move)}</h3>

                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-3 mb-6">
                      <p className="text-sm sm:text-lg text-white/80 leading-relaxed font-medium border-l-4 border-white/10 pl-6 italic">{getLocalizedMoveDescription(move)}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 shrink-0">
                      <div className="bg-black/60 p-5 rounded-2xl border border-white/5 shadow-inner">
                        <span className="block text-[10px] font-black text-white/20 uppercase mb-2 tracking-widest">Force</span>
                        <span className="text-2xl sm:text-3xl font-mono font-black text-blue-400 drop-shadow-lg">{move.power || '--'}</span>
                      </div>
                      <div className="bg-black/60 p-5 rounded-2xl border border-white/5 shadow-inner">
                        <span className="block text-[10px] font-black text-white/20 uppercase mb-2 tracking-widest">Precision</span>
                        <span className="text-2xl sm:text-3xl font-mono font-black text-blue-400 drop-shadow-lg">{move.accuracy || '--'}%</span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 opacity-20">
              <svg className="w-16 h-16 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <p className="font-mono text-sm uppercase font-black tracking-[0.3em]">{t('Select technique to analyze')}</p>
            </div>
          )}

          <div className="mt-auto pt-6 border-t border-white/10 flex flex-col gap-4 shrink-0">
            <div className="flex justify-between items-center px-2">
              <span className="text-[11px] font-mono text-white/30 font-black uppercase tracking-widest">{tempSelectedMoves.length} / 4 {t('Active')}</span>
              <div className="flex gap-1.5">
                {[...Array(tempSelectedMoves.length)].map((_, i) => <div key={i} className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse shadow-[0_0_8px_#3b82f6]"></div>)}
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setIsMoveModalOpen(false)} className="flex-1 py-4 bg-white/5 border border-white/10 text-white/40 font-mono font-black uppercase rounded-2xl hover:bg-white/10 transition-all text-xs tracking-widest">{t('Abort')}</button>
              <button
                onClick={confirmMoveSelection}
                disabled={tempSelectedMoves.length < 1 || tempSelectedMoves.length > 4}
                className="flex-[2] py-4 bg-blue-500 text-white font-mono font-black uppercase rounded-2xl shadow-[0_10px_25px_rgba(59,130,246,0.4)] hover:shadow-[0_15px_30px_rgba(59,130,246,0.5)] hover:-translate-y-1 active:translate-y-1 active:shadow-none disabled:opacity-10 transition-all text-xs tracking-widest"
              >
                {t('Execute Protocol')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <style jsx>{`
      .custom-scrollbar::-webkit-scrollbar { width: 8px; }
      .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.1); }
      .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
    `}</style>
  </div>
);

export default MoveEditModal;

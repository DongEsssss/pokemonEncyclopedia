"use client";

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface NeuralLinkSpeedTestProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NeuralLinkSpeedTest({ isOpen, onClose }: NeuralLinkSpeedTestProps) {
  const { t } = useTranslation();
  const [status, setStatus] = useState<'idle' | 'testing' | 'complete'>('idle');
  const [ping, setPing] = useState<number | null>(null);
  const [downloadSpeed, setDownloadSpeed] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);

  if (!isOpen) return null;

  const runTest = async () => {
    setStatus('testing');
    setProgress(0);
    setPing(null);
    setDownloadSpeed(null);
    
    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    
    try {
      // 1. 응답 속도 측정 (Ping)
      const pingStart = performance.now();
      await fetch('https://pokeapi.co/api/v2/pokemon/1', { method: 'HEAD', cache: 'no-store' });
      const pingEnd = performance.now();
      const measuredPing = Math.round(pingEnd - pingStart);
      setPing(measuredPing);
      setProgress(30);
      await sleep(800); // 핑 분석을 위한 의도적 지연

      // 2. 다운로드 속도 측정
      // 공식 아트워크 이미지를 활용하여 샘플 데이터 다운로드
      const testFiles = [
        'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/250.png',
        'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/249.png',
        'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/384.png'
      ];

      let totalSize = 0;
      const downloadStart = performance.now();

      for (let i = 0; i < testFiles.length; i++) {
        const response = await fetch(testFiles[i], { cache: 'no-store' });
        const blob = await response.blob();
        totalSize += blob.size;
        setProgress(30 + ((i + 1) / testFiles.length) * 60);
        await sleep(500); // 패킷 간 의도적 지연
      }
      
      const downloadEnd = performance.now();
      setProgress(95);
      await sleep(600); // 연결 최종 확인 지연
      
      const durationSeconds = (downloadEnd - downloadStart) / 1000;
      const speedMbps = (totalSize * 8) / (1024 * 1024) / durationSeconds;

      setDownloadSpeed(parseFloat(speedMbps.toFixed(2)));
      setStatus('complete');
    } catch (error) {
      console.error('속도 측정 실패:', error);
      setStatus('complete');
      if (ping === null) setPing(0);
      if (downloadSpeed === null) setDownloadSpeed(0);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* 배경 오버레이 */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-xl animate-in fade-in duration-500"
        onClick={onClose}
      ></div>

      {/* 모달 콘텐츠 */}
      <div className="relative w-full max-w-xl bg-[#050a14] border-[6px] border-blue-500/20 rounded-[3rem] shadow-[0_0_80px_rgba(59,130,246,0.25)] overflow-hidden animate-in zoom-in-95 duration-300">

        {/* 홀로그램 효과 오버레이 */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_-20%,rgba(59,130,246,0.15),transparent_70%)]"></div>
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-pulse"></div>
        </div>

        {/* 헤더 장식 */}
        <div className="absolute top-0 right-0 p-6 z-20">
          <button
            onClick={onClose}
            className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 border-2 border-white/10 text-white/40 hover:bg-white/10 hover:text-white hover:border-blue-500/50 transition-all active:scale-90"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <div className="relative z-10 p-10 sm:p-14 flex flex-col items-center">

          {/* 메인 표시 영역 */}
          <div className="mb-12 flex flex-col items-center">
            <div className="relative mb-8">
              {/* 회전하는 링 장식 */}
              <div className={`absolute -inset-6 border-4 border-dashed border-blue-500/20 rounded-full ${status === 'testing' ? 'animate-[spin_10s_linear_infinite]' : ''}`}></div>
              <div className={`absolute -inset-10 border border-blue-500/10 rounded-full ${status === 'testing' ? 'animate-[spin_20s_linear_infinite_reverse]' : ''}`}></div>

              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-600 to-blue-800 border-4 border-white/20 flex items-center justify-center shadow-[0_0_40px_rgba(37,99,235,0.5)] relative overflow-hidden group">
                <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%)] bg-[length:250%_250%] animate-[shimmer_2s_infinite]"></div>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={status === 'testing' ? 'animate-bounce' : ''}>
                  <path d="m12 14 4-4"></path><path d="m12 14-4-4"></path><path d="M12 21V13"></path><path d="M22 13a10 10 0 1 0-20 0"></path>
                </svg>
              </div>
            </div>

            <h2 className="text-2xl sm:text-3xl font-mono font-bold text-white uppercase tracking-tighter text-center">
              {t('Neural Sync Node')}
            </h2>
            <div className="flex items-center gap-3 mt-3">
              <div className={`w-2 h-2 rounded-full ${status === 'complete' ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-blue-500 animate-pulse shadow-[0_0_8px_#3b82f6]'}`}></div>
              <p className="text-blue-400/60 font-mono text-[16px] uppercase tracking-[0.4em]">{t('Active Link: Localhost.Mainframe')}</p>
            </div>
          </div>

          {status === 'idle' && (
            <div className="flex flex-col items-center gap-6 w-full">
              <button
                onClick={runTest}
                className="group relative w-full py-6 bg-blue-600 hover:bg-blue-500 text-white font-mono font-bold text-xl uppercase tracking-[0.2em] rounded-3xl transition-all shadow-[0_20px_40px_rgba(37,99,235,0.3)] hover:-translate-y-1 active:translate-y-0 active:shadow-none overflow-hidden"
              >
                <span className="relative z-10">{t('Start Synchronization')}</span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              </button>
              <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest">{t('Est. Time: 4.5 Seconds')}</p>
            </div>
          )}

          {status === 'testing' && (
            <div className="w-full flex flex-col items-center animate-in fade-in duration-500">
              {/* 진행 바 */}
              <div className="w-full h-3 bg-white/5 rounded-full border border-white/10 overflow-hidden mb-10 relative">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-blue-400 shadow-[0_0_20px_#3b82f6] transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                ></div>
                {/* 바 위의 글리치 효과 */}
                <div className="absolute top-0 bottom-0 w-8 bg-white/30 blur-md animate-[move_1s_infinite]" style={{ left: `${progress}%` }}></div>
              </div>

              <div className="grid grid-cols-2 gap-10 w-full">
                <div className="flex flex-col items-center">
                  <span className="text-[10px] font-mono text-white/30 uppercase tracking-[0.3em] mb-2">{t('Ping_Lat')}</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-mono font-bold text-blue-400">{ping !== null ? ping : '--'}</span>
                    <span className="text-[10px] font-mono text-blue-400/50">ms</span>
                  </div>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-[10px] font-mono text-white/30 uppercase tracking-[0.3em] mb-2">{t('Flow_Rate')}</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-mono font-bold text-blue-400">{downloadSpeed !== null ? downloadSpeed : '--'}</span>
                    <span className="text-[10px] font-mono text-blue-400/50">mbps</span>
                  </div>
                </div>
              </div>
              <p className="mt-12 text-[10px] font-mono text-blue-400/40 animate-pulse uppercase tracking-[0.3em]">{t('Analyzing Signal Integrity...')}</p>
            </div>
          )}

          {status === 'complete' && (
            <div className="w-full animate-in fade-in slide-in-from-bottom-6 duration-700">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
                <div className="bg-white/5 border-2 border-white/10 p-8 rounded-[2.5rem] flex flex-col items-center justify-center relative overflow-hidden group hover:border-blue-500/40 transition-colors">
                  <div className="absolute top-0 right-0 p-4 font-mono text-[7px] text-white/5 uppercase">0xAF_7</div>
                  <span className="text-[10px] font-mono text-white/40 uppercase tracking-[0.3em] mb-3">{t('Response Delay')}</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-mono font-bold text-white group-hover:text-blue-400 transition-colors">{ping}</span>
                    <span className="text-xs font-mono text-blue-500/60 uppercase">ms</span>
                  </div>
                </div>
                <div className="bg-white/5 border-2 border-white/10 p-8 rounded-[2.5rem] flex flex-col items-center justify-center relative overflow-hidden group hover:border-blue-500/40 transition-colors">
                  <div className="absolute top-0 right-0 p-4 font-mono text-[7px] text-white/5 uppercase">0xDS_2</div>
                  <span className="text-[10px] font-mono text-white/40 uppercase tracking-[0.3em] mb-3">{t('Sync Velocity')}</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-mono font-bold text-white group-hover:text-blue-400 transition-colors">{downloadSpeed}</span>
                    <span className="text-xs font-mono text-blue-500/60 uppercase">mbps</span>
                  </div>
                </div>
              </div>

              <div className="bg-green-500/5 border-2 border-green-500/20 p-5 rounded-3xl flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] font-mono text-green-400 uppercase font-bold tracking-widest leading-none mb-1">{t('Link Optimized')}</span>
                    <span className="text-[8px] font-mono text-green-500/40 uppercase tracking-widest">{t('Protocol Integrity: 99.8%')}</span>
                  </div>
                </div>
                <div className="hidden sm:block text-right">
                  <span className="text-[8px] font-mono text-white/20 uppercase tracking-widest">Ref_ID</span>
                  <p className="text-[9px] font-mono text-white/40 uppercase">NL-SYNC-OK</p>
                </div>
              </div>

              <button
                onClick={runTest}
                className="w-full py-5 border-2 border-white/10 hover:border-white/30 text-white/40 hover:text-white font-mono text-[10px] uppercase tracking-[0.4em] rounded-2xl transition-all"
              >
                {t('Re-initialize Calibration')}
              </button>
            </div>
          )}
        </div>
        
        {/* 푸터 정보 */}
        <div className="bg-black/80 backdrop-blur-md border-t-2 border-white/5 px-10 py-5 flex justify-between items-center relative overflow-hidden">
          <div className="absolute inset-0 bg-blue-500/5 pointer-events-none"></div>
          <div className="flex gap-4">
            <span className="text-[8px] font-mono text-white/20 uppercase tracking-[0.4em]">{t('System Status: Stable')}</span>
            <span className="text-[8px] font-mono text-white/20 uppercase tracking-[0.4em]">V_4.2.0</span>
          </div>
          <div className="flex gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500/30"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500/30"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_10px_#3b82f6]"></div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: -150% -150%; }
          100% { background-position: 150% 150%; }
        }
        @keyframes move {
          0% { transform: translateX(-200%); }
          100% { transform: translateX(500%); }
        }
      `}</style>
    </div>
  );
}

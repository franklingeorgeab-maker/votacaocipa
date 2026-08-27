import React, { useState, useEffect, useCallback } from 'react';
import { useElection } from '../../context/ElectionContext';
import { TSEUrna } from './TSEUrna';
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  UserCheck,
  RotateCcw,
  ShieldCheck,
  Maximize2,
  Minimize2,
  Building2,
  Vote,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const VotingScreen: React.FC = () => {
  const { voters, findVoterByBadge, company, summary } = useElection();

  const [badgeInput, setBadgeInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [foundVoter, setFoundVoter] = useState<any | null>(null);
  const [step, setStep] = useState<'badge_input' | 'badge_confirm' | 'booth'>('badge_input');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const [authenticatedVoter, setAuthenticatedVoter] = useState<{
    badgeNumber: string;
    voterName: string;
  } | null>(null);

  // Sincronizar detecção de tela cheia do navegador
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isDocFs = Boolean(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      setIsFullscreen(isDocFs);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  // Alternar Tela Cheia com suporte a API nativa e fallback seguro
  const toggleFullscreen = useCallback(async () => {
    try {
      if (!isFullscreen) {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen().catch(() => {});
        } else if ((document.documentElement as any).webkitRequestFullscreen) {
          await (document.documentElement as any).webkitRequestFullscreen();
        }
        setIsFullscreen(true);
      } else {
        if (document.exitFullscreen && document.fullscreenElement) {
          await document.exitFullscreen().catch(() => {});
        } else if ((document as any).webkitExitFullscreen && (document as any).webkitFullscreenElement) {
          await (document as any).webkitExitFullscreen();
        }
        setIsFullscreen(false);
      }
    } catch {
      setIsFullscreen((prev) => !prev);
    }
  }, [isFullscreen]);

  // Tecla ESC para sair do modo tela cheia quando estiver em fallback overlay
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        if (document.fullscreenElement && document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Manipular busca do crachá
  const handleBadgeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const clean = badgeInput.trim();

    if (!clean) {
      setError('Por favor, digite o número do seu crachá.');
      return;
    }

    const voter = findVoterByBadge(clean);
    if (!voter) {
      setError('Crachá não localizado no cadastro.');
      return;
    }

    if (voter.hasVoted) {
      setError(
        `Este crachá (${voter.badgeNumber} - ${voter.name}) já votou neste pleito.`
      );
      return;
    }

    setFoundVoter(voter);
    setStep('badge_confirm');
  };

  // Confirmar sem precisar digitar novamente
  const handleConfirmIdentity = () => {
    if (foundVoter) {
      setAuthenticatedVoter({
        badgeNumber: foundVoter.badgeNumber,
        voterName: foundVoter.name,
      });
      setStep('booth');
    }
  };

  const handleExitOrFinish = () => {
    setAuthenticatedVoter(null);
    setFoundVoter(null);
    setBadgeInput('');
    setError(null);
    setStep('badge_input');
  };

  // Crachás de exemplo para teste rápido
  const unvotedSample = voters.filter((v) => !v.hasVoted).slice(0, 5);

  return (
    <div
      className={
        isFullscreen
          ? 'fixed inset-0 z-50 bg-slate-950 text-slate-100 flex flex-col justify-between p-3 sm:p-6 overflow-y-auto'
          : 'min-h-[calc(100vh-5rem)] flex flex-col justify-center items-center py-4 px-2 sm:px-4 relative'
      }
    >
      {/* Barra de Topo do Modo Tela Cheia / Kiosk */}
      {isFullscreen ? (
        <header className="w-full max-w-6xl mx-auto flex items-center justify-between py-2 px-4 mb-2 bg-slate-900/90 border border-slate-800 rounded-xl shadow-lg">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow">
              <Vote className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-black tracking-wide text-white uppercase">
                  Cabine de Votação Oficial • CIPA
                </span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Ao Vivo
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {company.tradingName || company.companyName} • Gestão {company.cipaTerm}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="hidden sm:flex items-center space-x-2 text-xs text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Voto 100% Sigiloso (NR-5)</span>
            </div>
            <button
              id="btn-sair-tela-cheia"
              type="button"
              onClick={toggleFullscreen}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-200 text-xs font-bold rounded-lg border border-slate-700 transition-colors cursor-pointer shadow-sm"
              title="Sair do Modo Tela Cheia (ESC)"
            >
              <Minimize2 className="w-3.5 h-3.5 text-blue-400" />
              <span>Sair da Tela Cheia</span>
            </button>
          </div>
        </header>
      ) : (
        /* Botão para Expandir em Tela Cheia no modo padrão */
        <div className="w-full max-w-md mx-auto mb-3 flex items-center justify-between px-2">
          <div className="flex items-center space-x-1.5 text-xs text-slate-500 dark:text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Cabine Eleitoral NR-5</span>
          </div>

          <button
            id="btn-ativar-tela-cheia"
            type="button"
            onClick={toggleFullscreen}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-800 rounded-xl transition-all cursor-pointer shadow-xs"
            title="Expandir para tela cheia para usar como terminal ou quiosque de votação"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Modo Tela Cheia</span>
          </button>
        </div>
      )}

      {/* ÁREA CENTRAL INTERATIVA */}
      <div className="w-full flex-1 flex flex-col justify-center items-center">
        <AnimatePresence mode="wait">
          {/* ETAPA 1: DIGITE SEU CRACHÁ */}
          {step === 'badge_input' && (
            <motion.div
              key="badge_input"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 text-center space-y-6"
            >
              <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/80 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm">
                <CreditCard className="w-8 h-8" />
              </div>

              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Digite seu Crachá
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Informe sua matrícula ou crachá funcional para votar
                </p>
              </div>

              <form onSubmit={handleBadgeSubmit} className="space-y-4">
                <div className="relative">
                  <input
                    id="input-cracha-direto"
                    type="text"
                    value={badgeInput}
                    onChange={(e) => {
                      setBadgeInput(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="Número do Crachá..."
                    className="w-full px-4 py-3.5 text-center text-xl font-bold font-mono tracking-wider rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:border-blue-600 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all"
                    autoFocus
                  />
                </div>

                {error && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center justify-center space-x-2 text-xs text-rose-700 dark:text-rose-300 font-medium">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  id="btn-avancar-cracha"
                  type="submit"
                  className="w-full py-3.5 px-6 text-base font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-lg shadow-blue-600/20 transition-all cursor-pointer flex items-center justify-center space-x-2"
                >
                  <span>Avançar</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </form>

              {/* Crachás de teste rápido */}
              {unvotedSample.length > 0 && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-[11px] text-slate-400 mb-2">Crachás rápidos para teste:</p>
                  <div className="flex flex-wrap justify-center gap-1.5">
                    {unvotedSample.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => {
                          setBadgeInput(v.badgeNumber);
                          setError(null);
                        }}
                        className="px-2.5 py-1 text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors cursor-pointer text-slate-700 dark:text-slate-300"
                      >
                        {v.badgeNumber} ({v.name.split(' ')[0]})
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ETAPA 2: CONFIRME SEU NÚMERO (SEM PRECISAR DIGITAR) */}
          {step === 'badge_confirm' && foundVoter && (
            <motion.div
              key="badge_confirm"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 text-center space-y-6"
            >
              <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm">
                <UserCheck className="w-8 h-8" />
              </div>

              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Confirme seus Dados
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Verifique se o número e os dados correspondem a você
                </p>
              </div>

              {/* Cartão com dados do eleitor */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 text-left space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Número do Crachá:</span>
                  <span className="font-mono text-base font-black text-blue-600 dark:text-blue-400">
                    {foundVoter.badgeNumber}
                  </span>
                </div>
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Nome:</div>
                  <div className="text-base font-bold text-slate-900 dark:text-white">
                    {foundVoter.name}
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                  <span>Setor: <strong>{foundVoter.department}</strong></span>
                  <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 font-bold rounded text-[10px]">
                    Apto
                  </span>
                </div>
              </div>

              <div className="space-y-2.5 pt-2">
                <button
                  id="btn-confirmar-e-entrar"
                  type="button"
                  onClick={handleConfirmIdentity}
                  className="w-full py-3.5 px-6 text-base font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-lg shadow-emerald-600/20 transition-all cursor-pointer flex items-center justify-center space-x-2"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Confirmar e Votar</span>
                </button>

                <button
                  id="btn-corrigir-cracha"
                  type="button"
                  onClick={() => {
                    setStep('badge_input');
                    setFoundVoter(null);
                  }}
                  className="w-full py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer flex items-center justify-center space-x-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Não sou eu / Digitar outro crachá</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* ETAPA 3: CABINE DE VOTAÇÃO (COBRINDO A TELA) */}
          {step === 'booth' && authenticatedVoter && (
            <motion.div
              key="booth"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="w-full max-w-5xl"
            >
              <TSEUrna
                badgeNumber={authenticatedVoter.badgeNumber}
                voterName={authenticatedVoter.voterName}
                onVoteCompleted={() => {}}
                onExit={handleExitOrFinish}
                isFullscreen={isFullscreen}
                onToggleFullscreen={toggleFullscreen}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Rodapé institucional discreto no modo Tela Cheia */}
      {isFullscreen && (
        <footer className="w-full text-center py-2 text-[11px] text-slate-500">
          Votação Eletrônica Auditável • Sigilo incondicional garantido por criptografia e NR-5 / MTE
        </footer>
      )}
    </div>
  );
};



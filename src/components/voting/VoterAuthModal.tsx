import React, { useState } from 'react';
import { useElection } from '../../context/ElectionContext';
import { ShieldCheck, UserCheck, AlertCircle, Lock, Info, CheckCircle2, QrCode } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface VoterAuthModalProps {
  isOpen: boolean;
  onAuthenticated: (badgeNumber: string, voterName: string) => void;
  onCancel?: () => void;
}

export const VoterAuthModal: React.FC<VoterAuthModalProps> = ({
  isOpen,
  onAuthenticated,
  onCancel,
}) => {
  const { voters, findVoterByBadge } = useElection();
  const [badgeInput, setBadgeInput] = useState('');
  const [badgeConfirmInput, setBadgeConfirmInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [foundVoter, setFoundVoter] = useState<any | null>(null);
  const [step, setStep] = useState<'input' | 'confirm'>('input');

  if (!isOpen) return null;

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const clean = badgeInput.trim();

    if (!clean) {
      setError('Por favor, informe o número do seu crachá ou matrícula.');
      return;
    }

    const voter = findVoterByBadge(clean);
    if (!voter) {
      setError('Crachá não localizado no cadastro de colaboradores aptos a votar.');
      return;
    }

    if (voter.hasVoted) {
      setError(
        `Este crachá (${voter.badgeNumber} - ${voter.name}) já registrou o voto neste pleito em ${
          voter.votedAt ? new Date(voter.votedAt).toLocaleTimeString('pt-BR') : 'horário anterior'
        }. Conforme a NR-5 e LGPD, não é permitido voto duplo.`
      );
      return;
    }

    setFoundVoter(voter);
    setStep('confirm');
  };

  const handleConfirmAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (badgeConfirmInput.trim() !== badgeInput.trim()) {
      setError('A confirmação do crachá não confere com o número digitado inicialmente.');
      return;
    }

    if (foundVoter) {
      onAuthenticated(foundVoter.badgeNumber, foundVoter.name);
      setBadgeInput('');
      setBadgeConfirmInput('');
      setFoundVoter(null);
      setStep('input');
    }
  };

  const handleQuickSelect = (badge: string) => {
    setBadgeInput(badge);
    setError(null);
  };

  // 4 primeiros eleitores não votantes para teste rápido
  const unvotedSample = voters.filter((v) => !v.hasVoted).slice(0, 4);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
      >
        {/* Cabeçalho */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-blue-300" />
            </div>
            <div>
              <h3 className="text-lg font-bold tracking-tight">Identificação do Eleitor</h3>
              <p className="text-xs text-blue-200">Eleição CIPA - NR-5 do Ministério do Trabalho</p>
            </div>
          </div>
          <div className="flex items-center space-x-1 px-2.5 py-1 bg-emerald-500/20 border border-emerald-400/30 rounded-full text-emerald-300 text-xs font-semibold">
            <Lock className="w-3.5 h-3.5" />
            <span>LGPD Segura</span>
          </div>
        </div>

        <div className="p-6">
          {/* Aviso de Sigilo e LGPD */}
          <div className="mb-5 p-3.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 rounded-xl flex items-start space-x-3 text-xs text-blue-900 dark:text-blue-200">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-semibold mb-0.5">Garantia Legal de Sigilo e Anonimato (NR-5 / LGPD):</strong>
              O seu crachá é utilizado única e exclusivamente para registrar sua presença no pleito e evitar duplicidade. Sua escolha de voto é 100% criptografada e anônima, sem qualquer vínculo com sua identidade.
            </div>
          </div>

          <AnimatePresence mode="wait">
            {step === 'input' ? (
              <motion.form
                key="step1"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onSubmit={handleLookup}
                className="space-y-4"
              >
                <div>
                  <label htmlFor="badge-input" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Número do Crachá / Matrícula Funcional:
                  </label>
                  <div className="relative">
                    <input
                      id="badge-input"
                      type="text"
                      value={badgeInput}
                      onChange={(e) => setBadgeInput(e.target.value)}
                      placeholder="Ex: 1001, 1002, 1005..."
                      className="w-full px-4 py-3 text-base rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none font-mono"
                      autoFocus
                    />
                    <UserCheck className="absolute right-3.5 top-3.5 w-5 h-5 text-slate-400" />
                  </div>
                </div>

                {/* Crachás de Teste Rápido para o avaliador */}
                {unvotedSample.length > 0 && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 font-medium">
                      Sugestões de crachás aptos para teste imediato:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {unvotedSample.map((v) => (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => handleQuickSelect(v.badgeNumber)}
                          className="px-2.5 py-1 text-xs bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:border-blue-500 text-slate-800 dark:text-slate-200 rounded-lg transition-colors font-mono cursor-pointer flex items-center space-x-1"
                        >
                          <span className="font-bold text-blue-600 dark:text-blue-400">{v.badgeNumber}</span>
                          <span className="text-slate-400">({v.name.split(' ')[0]})</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {error && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center space-x-2 text-xs text-rose-700 dark:text-rose-300 font-medium">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="pt-2 flex items-center justify-end space-x-3">
                  {onCancel && (
                    <button
                      type="button"
                      onClick={onCancel}
                      className="px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                      Cancelar
                    </button>
                  )}
                  <button
                    id="btn-verificar-cracha"
                    type="submit"
                    className="px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-md transition-all cursor-pointer flex items-center space-x-2"
                  >
                    <span>Verificar e Continuar</span>
                    <ShieldCheck className="w-4 h-4" />
                  </button>
                </div>
              </motion.form>
            ) : (
              <motion.form
                key="step2"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                onSubmit={handleConfirmAuth}
                className="space-y-4"
              >
                {/* Cartão de Confirmação do Colaborador */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Colaborador Localizado</span>
                    <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded">
                      Apto a Votar
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="text-base font-bold text-slate-900 dark:text-white">
                      {foundVoter?.name}
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-300 flex items-center space-x-2">
                      <span>Setor: <strong className="text-slate-800 dark:text-slate-100">{foundVoter?.department}</strong></span>
                      <span>•</span>
                      <span>Crachá: <strong className="text-blue-600 dark:text-blue-400 font-mono">{foundVoter?.badgeNumber}</strong></span>
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="badge-confirm" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Confirme o número do crachá para prosseguir:
                  </label>
                  <p className="text-xs text-slate-500 mb-2">
                    Medida de segurança conforme LGPD para garantir que você digitou o seu próprio número.
                  </p>
                  <input
                    id="badge-confirm"
                    type="text"
                    value={badgeConfirmInput}
                    onChange={(e) => setBadgeConfirmInput(e.target.value)}
                    placeholder="Digite novamente o seu crachá..."
                    className="w-full px-4 py-3 text-base rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-600 focus:border-transparent outline-none font-mono"
                    autoFocus
                  />
                </div>

                {error && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center space-x-2 text-xs text-rose-700 dark:text-rose-300 font-medium">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="pt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setStep('input');
                      setError(null);
                    }}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  >
                    ← Voltar / Alterar
                  </button>
                  <button
                    id="btn-liberar-urna"
                    type="submit"
                    className="px-6 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-lg shadow-emerald-600/20 transition-all cursor-pointer flex items-center space-x-2"
                  >
                    <span>Liberar Urna Eletrônica</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Candidate } from '../../types';
import { useElection } from '../../context/ElectionContext';
import { tseAudio } from '../../utils/tseAudio';
import { Volume2, VolumeX, Download, Check, ShieldCheck, Printer, RefreshCw, User, Maximize2, Minimize2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'motion/react';

interface TSEUrnaProps {
  badgeNumber: string;
  voterName: string;
  onVoteCompleted: (receiptCode: string) => void;
  onExit: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export const TSEUrna: React.FC<TSEUrnaProps> = ({
  badgeNumber,
  voterName,
  onVoteCompleted,
  onExit,
  isFullscreen,
  onToggleFullscreen,
}) => {
  const { candidates, activeUrnaId, urnas, registerVote, company } = useElection();

  const [digits, setDigits] = useState<string[]>([]);
  const [isBranco, setIsBranco] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isEnded, setIsEnded] = useState<boolean>(false);
  const [receiptCode, setReceiptCode] = useState<string | null>(null);
  const [muted, setMuted] = useState<boolean>(tseAudio.getMuted());
  const [autoNextSeconds, setAutoNextSeconds] = useState<number>(3);

  // Contagem regressiva de 3 segundos para próximo eleitor ao exibir tela de FIM
  useEffect(() => {
    if (!isEnded) return;

    setAutoNextSeconds(3);
    const interval = setInterval(() => {
      setAutoNextSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onExit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isEnded, onExit]);

  const activeUrna = useMemo(() => {
    return urnas.find((u) => u.id === activeUrnaId) || urnas[0];
  }, [urnas, activeUrnaId]);

  const candidateNumber = digits.join('');

  // Identificar se os dígitos correspondem a algum candidato
  const selectedCandidate = useMemo(() => {
    if (isBranco || digits.length < 2) return null;
    return candidates.find((c) => c.number === candidateNumber && c.status === 'ativo') || null;
  }, [candidates, digits, candidateNumber, isBranco]);

  const isInvalidNumber = digits.length === 2 && !selectedCandidate && !isBranco;

  // Lidar com digitação de número
  const handleDigit = useCallback(
    (digit: string) => {
      if (isRecording || isEnded) return;
      if (isBranco) return; // Se está em branco, precisa corrigir primeiro

      if (digits.length < 2) {
        tseAudio.playDigitBeep();
        setDigits((prev) => [...prev, digit]);
      }
    },
    [digits, isBranco, isRecording, isEnded]
  );

  // Lidar com tecla CORRIGE
  const handleCorrige = useCallback(() => {
    if (isRecording || isEnded) return;
    tseAudio.playCorrectionBeep();
    setDigits([]);
    setIsBranco(false);
  }, [isRecording, isEnded]);

  // Lidar com tecla BRANCO
  const handleBranco = useCallback(() => {
    if (isRecording || isEnded) return;
    if (digits.length === 0) {
      tseAudio.playDigitBeep();
      setIsBranco(true);
    }
  }, [digits, isRecording, isEnded]);

  // Lidar com tecla CONFIRMA
  const handleConfirma = useCallback(async () => {
    if (isRecording || isEnded) return;

    let votePayload = '';

    if (isBranco) {
      votePayload = 'BRANCO';
    } else if (digits.length === 2) {
      if (selectedCandidate) {
        votePayload = selectedCandidate.number;
      } else {
        votePayload = 'NULO';
      }
    } else {
      // Menos de 2 dígitos digitados
      return;
    }

    setIsRecording(true);

    try {
      const res = await registerVote(badgeNumber, votePayload, activeUrna?.id || 'urna_01');
      if (res.success && res.receiptCode) {
        setReceiptCode(res.receiptCode);
        setIsRecording(false);
        setIsEnded(true);

        // Disparar confetes celebrando exercício da cidadania na CIPA
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.6 },
        });

        onVoteCompleted(res.receiptCode);
      } else {
        alert(res.message || 'Erro ao registrar voto.');
        setIsRecording(false);
      }
    } catch (e) {
      console.error(e);
      alert('Falha de comunicação com a urna eletrônica.');
      setIsRecording(false);
    }
  }, [
    isRecording,
    isEnded,
    isBranco,
    digits,
    selectedCandidate,
    registerVote,
    badgeNumber,
    activeUrna,
    onVoteCompleted,
  ]);

  // Escuta de teclado físico do computador
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isEnded || isRecording) return;

      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handleDigit(e.key);
      } else if (e.key === 'Backspace' || e.key === 'Delete' || e.key.toLowerCase() === 'c') {
        e.preventDefault();
        handleCorrige();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleConfirma();
      } else if (e.key.toLowerCase() === 'b') {
        e.preventDefault();
        handleBranco();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDigit, handleCorrige, handleConfirma, handleBranco, isEnded, isRecording]);

  const toggleSound = () => {
    const next = !muted;
    tseAudio.setMuted(next);
    setMuted(next);
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Barra Superior da Urna */}
      <div className="flex items-center justify-between bg-slate-900 text-white px-4 py-2.5 rounded-t-2xl border-b border-slate-800 text-xs">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold text-slate-200">
            {activeUrna ? activeUrna.name : 'Urna Eletrônica Oficial'}
          </span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-400">Eleitor: <strong className="text-slate-200">{voterName}</strong> (Crachá: {badgeNumber})</span>
        </div>
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={toggleSound}
            className="flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
            title="Alternar Som da Urna"
          >
            {muted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
            <span className="text-[11px]">{muted ? 'Mudo' : 'Som Ativo'}</span>
          </button>
          {onToggleFullscreen && (
            <button
              type="button"
              onClick={onToggleFullscreen}
              className="flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
              title={isFullscreen ? 'Sair da Tela Cheia' : 'Expandir para Tela Cheia'}
            >
              {isFullscreen ? (
                <Minimize2 className="w-3.5 h-3.5 text-blue-400" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5 text-blue-400" />
              )}
              <span className="text-[11px]">{isFullscreen ? 'Janela' : 'Tela Cheia'}</span>
            </button>
          )}
          <button
            type="button"
            onClick={onExit}
            className="text-slate-400 hover:text-white transition-colors text-xs font-semibold px-2 py-0.5 rounded hover:bg-slate-800"
          >
            Sair da Urna
          </button>
        </div>
      </div>

      {/* Corpo da Urna: Gabinete Estilo TSE */}
      <div className="bg-slate-200 dark:bg-slate-800 p-4 sm:p-6 lg:p-8 rounded-b-2xl shadow-2xl border-4 border-slate-300 dark:border-slate-700 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* TELA DA URNA (LCD DISPLAY) - 7 Colunas */}
        <div className="lg:col-span-7 bg-[#d9ebd9] dark:bg-[#12281a] border-4 border-slate-700 dark:border-slate-900 rounded-xl p-4 sm:p-5 shadow-inner min-h-[460px] flex flex-col justify-between relative overflow-hidden font-sans text-slate-900 dark:text-emerald-100 selection:bg-emerald-700 selection:text-white">
          
          {/* Efeito sutil de linhas de varredura LCD */}
          <div className="absolute inset-0 pointer-events-none opacity-5 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px]" />

          {/* ESTADO 1: TELA FINAL "FIM" */}
          {isEnded ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex-1 flex flex-col items-center justify-center text-center p-4 space-y-4"
            >
              <div className="text-7xl sm:text-8xl font-black tracking-widest text-slate-900 dark:text-emerald-300 font-mono drop-shadow">
                FIM
              </div>
              <div className="text-base sm:text-lg font-bold text-slate-800 dark:text-emerald-200 uppercase">
                VOTO GRAVADO COM SUCESSO!
              </div>

              {/* Comprovante Eletrônico de Votação */}
              <div className="w-full max-w-sm bg-white dark:bg-slate-900/90 text-slate-900 dark:text-white p-4 rounded-xl border border-slate-300 dark:border-emerald-800/80 shadow-md text-left text-xs space-y-2">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                  <div className="flex items-center space-x-1.5 font-bold text-emerald-600 dark:text-emerald-400">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Comprovante de Votação CIPA</span>
                  </div>
                  <span className="font-mono text-[10px] text-slate-500">NR-5 / MTE</span>
                </div>
                <div>
                  <div className="text-slate-500 dark:text-slate-400">Eleitor(a):</div>
                  <div className="font-semibold text-sm">{voterName}</div>
                  <div className="text-slate-500 dark:text-slate-400">Crachá: <strong className="text-slate-800 dark:text-slate-200 font-mono">{badgeNumber}</strong></div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded border border-dashed border-slate-300 dark:border-slate-700">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">Código de Autenticidade:</div>
                  <div className="font-mono font-bold text-sm text-blue-700 dark:text-blue-300 tracking-wider">
                    {receiptCode}
                  </div>
                </div>
                <div className="text-[10px] text-slate-500 text-center">
                  Data: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}
                </div>
              </div>

              {/* Indicador de 3 segundos para o próximo eleitor */}
              <div className="w-full max-w-sm bg-emerald-950/80 border border-emerald-500/40 rounded-xl p-3 text-emerald-200 text-center space-y-2 shadow-inner">
                <div className="flex items-center justify-center space-x-2 text-xs font-semibold">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                  <span>Liberando para o próximo eleitor em <strong>{autoNextSeconds}s</strong>...</span>
                </div>
                <div className="w-full bg-emerald-950 h-1.5 rounded-full overflow-hidden border border-emerald-800">
                  <motion.div
                    initial={{ width: '100%' }}
                    animate={{ width: '0%' }}
                    transition={{ duration: 3, ease: 'linear' }}
                    className="h-full bg-emerald-400"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-semibold hover:bg-slate-700 transition-colors flex items-center space-x-1.5 cursor-pointer shadow"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir Comprovante</span>
                </button>
                <button
                  type="button"
                  onClick={onExit}
                  className="px-4 py-2 bg-emerald-700 text-white rounded-lg text-xs font-bold hover:bg-emerald-800 transition-colors flex items-center space-x-1.5 cursor-pointer shadow"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Próximo Eleitor Agora</span>
                </button>
              </div>
            </motion.div>
          ) : isRecording ? (
            /* ESTADO 2: GRAVANDO VOTO */
            <div className="flex-1 flex flex-col items-center justify-center space-y-4">
              <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
              <div className="text-2xl font-black font-mono tracking-widest text-slate-800 dark:text-emerald-300 animate-pulse">
                GRAVANDO...
              </div>
              <p className="text-xs text-slate-600 dark:text-emerald-400">
                Criptografando escolha eleitoral e emitindo autenticidade...
              </p>
            </div>
          ) : (
            /* ESTADO 3: FLUXO DE VOTAÇÃO DA URNA */
            <>
              {/* Cabeçalho da Tela */}
              <div>
                <div className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-emerald-400">
                  SEU VOTO PARA
                </div>
                <div className="text-sm sm:text-base font-extrabold uppercase text-slate-900 dark:text-white tracking-tight">
                  REPRESENTANTE DOS EMPREGADOS NA CIPA
                </div>
                <div className="text-[10px] text-slate-600 dark:text-emerald-400/80 font-medium">
                  {company.companyName} • Mandato {company.cipaTerm}
                </div>
              </div>

              {/* Centro da Tela: Campos de Número e Candidato */}
              <div className="my-auto py-2">
                {isBranco ? (
                  <div className="text-center py-6">
                    <div className="text-2xl sm:text-3xl font-black font-mono text-slate-800 dark:text-white uppercase tracking-widest animate-pulse">
                      VOTO EM BRANCO
                    </div>
                    <p className="text-xs text-slate-600 dark:text-emerald-300/80 mt-2">
                      Nenhum candidato selecionado.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                    {/* Campos de dígitos */}
                    <div className="sm:col-span-7 space-y-3">
                      <div className="flex items-center space-x-3">
                        <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-emerald-300">
                          Número:
                        </span>
                        <div className="flex space-x-2">
                          {/* Dígito 1 */}
                          <div className="w-10 h-12 sm:w-12 sm:h-14 border-2 border-slate-800 dark:border-emerald-500 bg-white/70 dark:bg-black/40 flex items-center justify-center text-2xl sm:text-3xl font-bold font-mono text-slate-900 dark:text-white shadow-inner">
                            {digits[0] || (
                              <span className="animate-ping inline-block w-2 h-4 bg-emerald-600 dark:bg-emerald-400 rounded-xs opacity-75" />
                            )}
                          </div>
                          {/* Dígito 2 */}
                          <div className="w-10 h-12 sm:w-12 sm:h-14 border-2 border-slate-800 dark:border-emerald-500 bg-white/70 dark:bg-black/40 flex items-center justify-center text-2xl sm:text-3xl font-bold font-mono text-slate-900 dark:text-white shadow-inner">
                            {digits[1] || (
                              digits.length === 1 ? (
                                <span className="animate-ping inline-block w-2 h-4 bg-emerald-600 dark:bg-emerald-400 rounded-xs opacity-75" />
                              ) : null
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Dados do Candidato ou Aviso Nulo */}
                      {selectedCandidate ? (
                        <div className="space-y-1 pt-1 text-xs">
                          <div>
                            <span className="text-slate-600 dark:text-emerald-400">Nome: </span>
                            <span className="font-extrabold text-sm text-slate-950 dark:text-white uppercase">
                              {selectedCandidate.name}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-600 dark:text-emerald-400">Setor: </span>
                            <span className="font-bold text-slate-900 dark:text-emerald-200">
                              {selectedCandidate.department}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-600 dark:text-emerald-400">Cargo: </span>
                            <span className="text-slate-800 dark:text-emerald-300">
                              {selectedCandidate.role}
                            </span>
                          </div>
                          {selectedCandidate.proposal && (
                            <div className="pt-1 text-[11px] text-slate-700 dark:text-emerald-300/90 italic line-clamp-2">
                              "{selectedCandidate.proposal}"
                            </div>
                          )}
                        </div>
                      ) : isInvalidNumber ? (
                        <div className="p-2.5 bg-rose-500/20 border border-rose-600/40 rounded-lg text-rose-900 dark:text-rose-200 text-xs">
                          <div className="font-bold uppercase tracking-wide">NÚMERO ERRADO</div>
                          <div className="text-[11px] font-black uppercase text-rose-800 dark:text-rose-300">
                            VOTO NULO
                          </div>
                          <div className="text-[10px] mt-0.5 text-slate-700 dark:text-rose-200/80">
                            Não existe candidato com este número.
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-slate-600 dark:text-emerald-400/70 italic">
                          {digits.length === 0
                            ? 'Digite os 2 dígitos do seu candidato a CIPA ou aperte BRANCO.'
                            : 'Digite o segundo dígito do candidato...'}
                        </div>
                      )}
                    </div>

                    {/* Foto do Candidato */}
                    <div className="sm:col-span-5 flex flex-col items-center justify-center">
                      <div className="w-28 h-32 sm:w-32 sm:h-36 border-2 border-slate-700 dark:border-emerald-600 bg-white/60 dark:bg-black/30 rounded-lg overflow-hidden shadow flex items-center justify-center">
                        {selectedCandidate ? (
                          <img
                            src={selectedCandidate.photoUrl}
                            alt={selectedCandidate.name}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-slate-400 dark:text-emerald-500/40 space-y-1">
                            <User className="w-12 h-12" />
                            <span className="text-[10px] uppercase font-bold tracking-wider">Foto</span>
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-600 dark:text-emerald-400 font-mono mt-1">
                        CANDIDATO CIPA
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Rodapé de Instruções da Tela */}
              <div className="border-t-2 border-slate-600 dark:border-emerald-700 pt-2 text-[10px] sm:text-xs text-slate-800 dark:text-emerald-200 space-y-0.5">
                <div className="font-semibold uppercase tracking-wider text-slate-700 dark:text-emerald-400">
                  Aperte a tecla:
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-emerald-800 dark:text-emerald-300">VERDE</span>
                  <span>para CONFIRMAR este voto</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-amber-700 dark:text-amber-400">LARANJA</span>
                  <span>para REINICIAR / CORRIGIR</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* TECLADO DA URNA (KEYPAD TSE) - 5 Colunas */}
        <div className="lg:col-span-5 bg-slate-900 text-white rounded-xl p-5 shadow-2xl border-2 border-slate-700 flex flex-col justify-between">
          {/* Brasão / Identificação Institucional */}
          <div className="text-center pb-4 border-b border-slate-800">
            <div className="text-xs font-black tracking-widest text-slate-300 uppercase">
              JUSTIÇA DO TRABALHO
            </div>
            <div className="text-[10px] font-bold text-emerald-400 tracking-wider">
              SISTEMA ELEITORAL CIPA • NR-5
            </div>
          </div>

          {/* Teclas Numéricas (1 a 0) */}
          <div className="py-4 grid grid-cols-3 gap-2.5 max-w-[240px] mx-auto">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
              <button
                key={num}
                type="button"
                id={`btn-tse-num-${num}`}
                onClick={() => handleDigit(num)}
                disabled={isEnded || isRecording}
                className="h-12 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-white font-mono font-bold text-2xl rounded-lg shadow-md border-b-4 border-slate-950 active:translate-y-1 active:border-b-0 transition-all flex items-center justify-center select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {num}
              </button>
            ))}
            {/* Linha do 0 centralizado */}
            <div className="col-start-2">
              <button
                type="button"
                id="btn-tse-num-0"
                onClick={() => handleDigit('0')}
                disabled={isEnded || isRecording}
                className="w-full h-12 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-white font-mono font-bold text-2xl rounded-lg shadow-md border-b-4 border-slate-950 active:translate-y-1 active:border-b-0 transition-all flex items-center justify-center select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                0
              </button>
            </div>
          </div>

          {/* Teclas de Ação do TSE: BRANCO, CORRIGE, CONFIRMA */}
          <div className="pt-2 grid grid-cols-3 gap-2">
            {/* Tecla BRANCO */}
            <button
              type="button"
              id="btn-tse-branco"
              onClick={handleBranco}
              disabled={isEnded || isRecording || digits.length > 0}
              className="h-14 bg-slate-100 hover:bg-white active:bg-slate-200 text-slate-950 font-extrabold text-[11px] uppercase tracking-wider rounded-lg shadow-md border-b-4 border-slate-400 active:translate-y-1 active:border-b-0 transition-all flex items-center justify-center text-center px-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              BRANCO
            </button>

            {/* Tecla CORRIGE */}
            <button
              type="button"
              id="btn-tse-corrige"
              onClick={handleCorrige}
              disabled={isEnded || isRecording || (digits.length === 0 && !isBranco)}
              className="h-14 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-slate-950 font-extrabold text-[11px] uppercase tracking-wider rounded-lg shadow-md border-b-4 border-amber-900 active:translate-y-1 active:border-b-0 transition-all flex items-center justify-center text-center px-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              CORRIGE
            </button>

            {/* Tecla CONFIRMA (Maior e Verde) */}
            <button
              type="button"
              id="btn-tse-confirma"
              onClick={handleConfirma}
              disabled={isEnded || isRecording || (!isBranco && digits.length < 2)}
              className="h-14 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-slate-950 font-black text-xs uppercase tracking-wider rounded-lg shadow-lg border-b-4 border-emerald-900 active:translate-y-1 active:border-b-0 transition-all flex items-center justify-center text-center px-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              CONFIRMA
            </button>
          </div>

          <div className="mt-3 text-center text-[10px] text-slate-500">
            Você pode usar o teclado numérico do seu computador (0-9, Backspace, Enter).
          </div>
        </div>
      </div>
    </div>
  );
};

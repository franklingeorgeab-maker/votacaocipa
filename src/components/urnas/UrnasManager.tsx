import React, { useState } from 'react';
import { useElection } from '../../context/ElectionContext';
import { Urna } from '../../types';
import {
  generateZeresimaPDF,
  generateBoletimUrnaPDF,
} from '../../utils/reportGenerators';
import {
  Monitor,
  Plus,
  Lock,
  Unlock,
  FileCheck,
  Printer,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Radio,
  MapPin,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const UrnasManager: React.FC = () => {
  const {
    company,
    candidates,
    voters,
    urnas,
    votes,
    auditLogs,
    summary,
    openUrna,
    closeUrna,
    generateZeresima,
    addUrna,
    activeUrnaId,
    setActiveUrnaId,
  } = useElection();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newUrnaName, setNewUrnaName] = useState('');
  const [newUrnaLocation, setNewUrnaLocation] = useState('');

  const handleAddUrna = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrnaName || !newUrnaLocation) return;
    addUrna({
      number: urnas.length + 1,
      name: newUrnaName,
      location: newUrnaLocation,
      isOnline: true,
    });
    setNewUrnaName('');
    setNewUrnaLocation('');
    setIsModalOpen(false);
  };

  const handleZeresima = (urna: Urna) => {
    generateZeresima(urna.id);
    const updatedUrna = { ...urna, zeresimaPrinted: true };
    generateZeresimaPDF(
      { company, candidates, voters, urnas, votes, auditLogs, summary },
      updatedUrna
    );
  };

  const handlePrintBU = (urna: Urna) => {
    generateBoletimUrnaPDF(
      { company, candidates, voters, urnas, votes, auditLogs, summary },
      urna.id
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 py-6">
      
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center space-x-3">
            <Monitor className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            <span>Gerenciamento de Urnas Eletrônicas On-line</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Controle de seções, emissão obrigatória de Zerésima e Boletins de Urna (BU) conforme normas do MTE.
          </p>
        </div>

        <button
          type="button"
          id="btn-cadastrar-urna"
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center space-x-2 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Nova Urna On-line</span>
        </button>
      </div>

      {/* Grid de Urnas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {urnas.map((urna) => {
          const urnaVotes = votes.filter((v) => v.urnaId === urna.id);
          const isSelected = activeUrnaId === urna.id;

          return (
            <div
              key={urna.id}
              className={`bg-white dark:bg-slate-900 rounded-2xl border transition-all p-6 flex flex-col justify-between space-y-4 ${
                isSelected
                  ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-lg'
                  : 'border-slate-200 dark:border-slate-800 shadow-md hover:shadow-lg'
              }`}
            >
              <div className="space-y-3">
                {/* Header do Card */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-8 h-8 rounded-lg bg-slate-900 text-emerald-400 font-mono font-black text-sm flex items-center justify-center shadow">
                      #{urna.number}
                    </span>
                    <div>
                      <span className="font-bold text-sm text-slate-900 dark:text-white block">
                        {urna.name}
                      </span>
                      <span className="text-[11px] text-slate-500 flex items-center space-x-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{urna.location}</span>
                      </span>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      urna.status === 'aberta'
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300'
                        : urna.status === 'fechada'
                        ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300'
                        : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300'
                    }`}
                  >
                    {urna.status}
                  </span>
                </div>

                {/* Detalhes Técnicos & Zerésima */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span>Zerésima Emitida:</span>
                    <strong className={urna.zeresimaPrinted ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}>
                      {urna.zeresimaPrinted ? '✓ Emitida e Auditada' : 'Pendente de Emissão'}
                    </strong>
                  </div>
                  {urna.zeresimaHash && (
                    <div className="text-[10px] text-slate-400 font-mono truncate">
                      Hash: {urna.zeresimaHash}
                    </div>
                  )}
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 pt-1 border-t border-slate-200 dark:border-slate-700">
                    <span>Votos Computados:</span>
                    <strong className="text-sm font-mono text-slate-900 dark:text-white">{urnaVotes.length}</strong>
                  </div>
                </div>
              </div>

              {/* Ações da Urna */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="grid grid-cols-2 gap-2">
                  {/* Botão de Zerésima */}
                  <button
                    type="button"
                    onClick={() => handleZeresima(urna)}
                    className="px-2.5 py-1.5 text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg transition-colors flex items-center justify-center space-x-1 cursor-pointer border border-slate-300 dark:border-slate-700"
                    title="Emitir documento oficial de Zerésima comprovando 0 votos"
                  >
                    <FileCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>Zerésima (PDF)</span>
                  </button>

                  {/* Botão de Boletim de Urna (BU) */}
                  <button
                    type="button"
                    onClick={() => handlePrintBU(urna)}
                    className="px-2.5 py-1.5 text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg transition-colors flex items-center justify-center space-x-1 cursor-pointer border border-slate-300 dark:border-slate-700"
                    title="Emitir Boletim de Urna da Seção"
                  >
                    <Printer className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>Imprimir BU</span>
                  </button>
                </div>

                <div className="flex items-center space-x-2">
                  {urna.status === 'aberta' ? (
                    <button
                      type="button"
                      onClick={() => closeUrna(urna.id)}
                      className="flex-1 py-2 text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 rounded-lg border border-rose-200 dark:border-rose-800 transition-colors flex items-center justify-center space-x-1 cursor-pointer"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Encerrar Urna</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => openUrna(urna.id)}
                      className="flex-1 py-2 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 rounded-lg border border-emerald-200 dark:border-emerald-800 transition-colors flex items-center justify-center space-x-1 cursor-pointer"
                    >
                      <Unlock className="w-3.5 h-3.5" />
                      <span>Abrir para Votação</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setActiveUrnaId(urna.id)}
                    className={`px-3 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300'
                    }`}
                  >
                    {isSelected ? 'Ativa na Cabine' : 'Selecionar'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de Cadastro de Nova Urna */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
            >
              <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
                <h3 className="font-bold text-base">Cadastrar Nova Urna On-line</h3>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddUrna} className="p-6 space-y-4">
                <div>
                  <label htmlFor="urna-name-input" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nome / Identificação da Urna*:
                  </label>
                  <input
                    id="urna-name-input"
                    type="text"
                    value={newUrnaName}
                    onChange={(e) => setNewUrnaName(e.target.value)}
                    placeholder="Ex: Urna 04 - Almoxarifado Central"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="urna-loc-input" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Localização Física / Seção*:
                  </label>
                  <input
                    id="urna-loc-input"
                    type="text"
                    value={newUrnaLocation}
                    onChange={(e) => setNewUrnaLocation(e.target.value)}
                    placeholder="Ex: Sala de Treinamento 02 - Prédio C"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-xl"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow cursor-pointer"
                  >
                    Salvar Urna
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

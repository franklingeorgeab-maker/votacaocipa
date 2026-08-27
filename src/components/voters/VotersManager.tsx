import React, { useState } from 'react';
import { useElection } from '../../context/ElectionContext';
import {
  UserCheck,
  UserPlus,
  FileSpreadsheet,
  Search,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Lock,
  Filter,
  Users,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const VotersManager: React.FC = () => {
  const { voters, addVoter, importVoters } = useElection();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'voted' | 'pending'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [batchText, setBatchText] = useState('');

  const [formData, setFormData] = useState({
    badgeNumber: '',
    name: '',
    cpfMasked: '***.***.***-**',
    department: '',
    role: '',
    email: '',
  });

  const handleAddVoter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.badgeNumber || !formData.name || !formData.department) return;
    const ok = addVoter(formData);
    if (!ok) {
      alert('Já existe um eleitor cadastrado com este crachá.');
      return;
    }
    setFormData({
      badgeNumber: '',
      name: '',
      cpfMasked: '***.***.***-**',
      department: '',
      role: '',
      email: '',
    });
    setIsAddModalOpen(false);
  };

  const handleImportBatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchText.trim()) return;

    // Parse lines: CR-1001, Carlos Santos, Usinagem, Torneiro, carlos@empresa.com
    const lines = batchText.split('\n');
    const toImport: any[] = [];

    for (const line of lines) {
      const parts = line.split(/[,;\t]/).map((p) => p.trim());
      if (parts.length >= 2 && parts[0]) {
        toImport.push({
          badgeNumber: parts[0],
          name: parts[1] || `Colaborador ${parts[0]}`,
          department: parts[2] || 'Operações',
          role: parts[3] || 'Colaborador',
          email: parts[4] || `colaborador.${parts[0]}@empresa.com.br`,
          cpfMasked: '***.' + Math.floor(100 + Math.random() * 900) + '.' + Math.floor(100 + Math.random() * 900) + '-**',
        });
      }
    }

    if (toImport.length > 0) {
      const count = importVoters(toImport);
      alert(`${count} novos colaboradores cadastrados com sucesso!`);
      setBatchText('');
      setIsImportModalOpen(false);
    }
  };

  const filtered = voters.filter((v) => {
    const matchesSearch =
      v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.badgeNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.department.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'voted') return v.hasVoted;
    if (statusFilter === 'pending') return !v.hasVoted;
    return true;
  });

  const totalVoters = voters.length;
  const votedCount = voters.filter((v) => v.hasVoted).length;
  const pendingCount = totalVoters - votedCount;

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 py-6">
      
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center space-x-3">
            <UserCheck className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            <span>Cadastro de Eleitores & Crachás (LGPD)</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Relação nominal de colaboradores aptos a votar, controle de presença e emissão de comprovantes de voto.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="px-4 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl border border-slate-300 dark:border-slate-700 transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Importar em Lote</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Cadastrar Eleitor</span>
          </button>
        </div>
      </div>

      {/* Aviso de Sigilo LGPD */}
      <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 rounded-2xl flex items-start space-x-3 text-xs text-blue-900 dark:text-blue-200">
        <Lock className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <div>
          <strong className="font-semibold block mb-0.5">Privacidade e Proteção de Dados (LGPD e NR-5):</strong>
          Esta tabela registra unicamente o status de presença (se o colaborador já votou ou não) para garantia do quórum e impedimento de voto duplicado. Não há e nunca haverá qualquer vínculo ou registro de em quem cada pessoa votou.
        </div>
      </div>

      {/* Barra de Filtros e Resumo */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por crachá, nome ou setor..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          >
            <option value="all">Todos ({totalVoters})</option>
            <option value="voted">Já Votaram ({votedCount})</option>
            <option value="pending">Pendentes ({pendingCount})</option>
          </select>
        </div>
      </div>

      {/* Tabela de Eleitores */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 text-xs uppercase font-bold border-b border-slate-200 dark:border-slate-800">
                <th className="py-3 px-4 w-28 text-center">Crachá / Matrícula</th>
                <th className="py-3 px-4">Nome do Colaborador</th>
                <th className="py-3 px-4">CPF (LGPD)</th>
                <th className="py-3 px-4">Setor / Cargo</th>
                <th className="py-3 px-4 text-center w-36">Status Presença</th>
                <th className="py-3 px-4">Data / Hora Votação</th>
                <th className="py-3 px-4">Código Comprovante</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {filtered.map((voter) => (
                <tr key={voter.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 text-center">
                    <span className="px-2.5 py-1 bg-slate-900 text-blue-400 font-mono font-bold text-xs rounded-md shadow-xs">
                      {voter.badgeNumber}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                    {voter.name}
                  </td>
                  <td className="py-3 px-4 text-slate-500 font-mono">
                    {voter.cpfMasked || '***.***.***-**'}
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-slate-800 dark:text-slate-200 font-medium">{voter.department}</div>
                    <div className="text-[11px] text-slate-500">{voter.role}</div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    {voter.hasVoted ? (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Voto Computado</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>Pendente</span>
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                    {voter.votedAt ? new Date(voter.votedAt).toLocaleString('pt-BR') : '-'}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-[11px] text-blue-600 dark:text-blue-400">
                    {voter.receiptCode || '-'}
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                    Nenhum colaborador encontrado com os filtros informados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Adicionar Eleitor */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
            >
              <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
                <h3 className="font-bold text-base">Cadastrar Eleitor Apto</h3>
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
              </div>

              <form onSubmit={handleAddVoter} className="p-6 space-y-3.5">
                <div>
                  <label htmlFor="badge-no" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Número do Crachá / Matrícula*:
                  </label>
                  <input
                    id="badge-no"
                    type="text"
                    value={formData.badgeNumber}
                    onChange={(e) => setFormData({ ...formData, badgeNumber: e.target.value })}
                    placeholder="Ex: 1050"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="voter-fullname" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nome Completo do Colaborador*:
                  </label>
                  <input
                    id="voter-fullname"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Amanda Silva Castro"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label htmlFor="voter-sector" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Setor / Área*:
                    </label>
                    <input
                      id="voter-sector"
                      type="text"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      placeholder="Ex: Manutenção"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="voter-role-input" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Função / Cargo:
                    </label>
                    <input
                      id="voter-role-input"
                      type="text"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      placeholder="Ex: Eletricista"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="voter-email-input" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    E-mail Corporativo:
                  </label>
                  <input
                    id="voter-email-input"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="amanda.silva@empresa.com.br"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end space-x-2">
                  <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400">Cancelar</button>
                  <button type="submit" className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow cursor-pointer">Salvar Eleitor</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Importar Lote */}
      <AnimatePresence>
        {isImportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
            >
              <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
                <h3 className="font-bold text-base">Importação em Lote de Colaboradores</h3>
                <button type="button" onClick={() => setIsImportModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
              </div>

              <form onSubmit={handleImportBatch} className="p-6 space-y-4">
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Cole as linhas separadas por vírgula ou ponto-e-vírgula no formato:
                  <br />
                  <code className="text-blue-600 font-mono bg-blue-50 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[11px] block mt-1">
                    CRACHÁ, NOME, SETOR, CARGO, EMAIL
                  </code>
                </p>

                <textarea
                  rows={6}
                  value={batchText}
                  onChange={(e) => setBatchText(e.target.value)}
                  placeholder="1040, Fabiano Oliveira, Expedição, Operador, fabiano@empresa.com&#10;1041, Beatriz Souza, RH, Analista, beatriz@empresa.com"
                  className="w-full p-3 text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />

                <div className="flex justify-end space-x-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <button type="button" onClick={() => setIsImportModalOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400">Cancelar</button>
                  <button type="submit" className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow cursor-pointer">Processar Importação</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

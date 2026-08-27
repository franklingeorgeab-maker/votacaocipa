import React, { useState } from 'react';
import { useElection } from '../../context/ElectionContext';
import { Candidate, CandidateStatus } from '../../types';
import {
  UserPlus,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Search,
  Users,
  Image,
  Sparkles,
  AlertCircle,
  Briefcase,
  Layers,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80',
];

export const CandidateManager: React.FC = () => {
  const { candidates, addCandidate, updateCandidate, deleteCandidate } = useElection();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    number: '',
    name: '',
    department: '',
    role: '',
    photoUrl: PRESET_AVATARS[0],
    bio: '',
    proposal: '',
    status: 'ativo' as CandidateStatus,
  });

  const handleOpenAdd = () => {
    setEditingCandidate(null);
    setFormData({
      number: '',
      name: '',
      department: '',
      role: '',
      photoUrl: PRESET_AVATARS[Math.floor(Math.random() * PRESET_AVATARS.length)],
      bio: '',
      proposal: '',
      status: 'ativo',
    });
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cand: Candidate) => {
    setEditingCandidate(cand);
    setFormData({
      number: cand.number,
      name: cand.name,
      department: cand.department,
      role: cand.role,
      photoUrl: cand.photoUrl,
      bio: cand.bio || '',
      proposal: cand.proposal || '',
      status: cand.status,
    });
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validações
    if (!formData.number || !formData.name || !formData.department || !formData.role) {
      setErrorMessage('Por favor, preencha todos os campos obrigatórios (Número, Nome, Setor e Cargo).');
      return;
    }

    if (!/^\d{2}$/.test(formData.number.trim())) {
      setErrorMessage('O número do candidato deve conter exatamente 2 dígitos numéricos (ex: 10, 22, 45).');
      return;
    }

    if (editingCandidate) {
      const ok = updateCandidate(editingCandidate.id, {
        ...formData,
        number: formData.number.trim(),
      });
      if (!ok) {
        setErrorMessage('Já existe outro candidato cadastrado com este número na urna.');
        return;
      }
    } else {
      const ok = addCandidate({
        ...formData,
        number: formData.number.trim(),
      });
      if (!ok) {
        setErrorMessage('Já existe um candidato com este número de urna.');
        return;
      }
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Tem certeza que deseja excluir a candidatura de "${name}"? Esta ação é auditada.`)) {
      deleteCandidate(id);
    }
  };

  const filtered = candidates.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.number.includes(searchTerm) ||
      c.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 py-6">
      
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center space-x-3">
            <Users className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            <span>Gestão de Candidatos (CIPA)</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Cadastro, homologação e edição dos integrantes que concorrem aos cargos de Titulares e Suplentes da CIPA.
          </p>
        </div>

        <button
          type="button"
          id="btn-novo-candidato"
          onClick={handleOpenAdd}
          className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center space-x-2 cursor-pointer self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Cadastrar Novo Candidato</span>
        </button>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar por nome, número ou setor..."
            className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
          />
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Total de {candidates.length} candidatos homologados ({candidates.filter((c) => c.status === 'ativo').length} ativos)
        </div>
      </div>

      {/* Grid de Cards de Candidatos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((cand) => (
          <div
            key={cand.id}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md hover:shadow-lg transition-all p-5 flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              {/* Header do Card com Número e Status */}
              <div className="flex items-center justify-between">
                <div className="px-3 py-1 bg-slate-900 text-emerald-400 font-mono font-black text-base rounded-lg shadow">
                  Nº {cand.number}
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    cand.status === 'ativo'
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                      : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                  }`}
                >
                  {cand.status === 'ativo' ? 'Homologado (Ativo)' : 'Inativo'}
                </span>
              </div>

              {/* Informações do Candidato */}
              <div className="flex items-start space-x-3.5">
                <img
                  src={cand.photoUrl}
                  alt={cand.name}
                  className="w-16 h-20 object-cover rounded-xl border border-slate-300 dark:border-slate-700 shadow-sm shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div className="space-y-1 min-w-0 flex-1">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                    {cand.name}
                  </h3>
                  <div className="flex items-center space-x-1 text-xs text-blue-600 dark:text-blue-400 font-semibold truncate">
                    <Layers className="w-3.5 h-3.5 shrink-0" />
                    <span>{cand.department}</span>
                  </div>
                  <div className="flex items-center space-x-1 text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    <Briefcase className="w-3.5 h-3.5 shrink-0" />
                    <span>{cand.role}</span>
                  </div>
                </div>
              </div>

              {/* Proposta de Segurança */}
              {cand.proposal && (
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 italic line-clamp-3">
                  "{cand.proposal}"
                </div>
              )}
            </div>

            {/* Ações do Card */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-mono">
                Votos apurados: <strong className="text-slate-900 dark:text-white">{cand.votesCount || 0}</strong>
              </span>

              <div className="flex items-center space-x-1.5">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(cand)}
                  className="p-2 text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  title="Editar Candidato"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(cand.id, cand.name)}
                  className="p-2 text-slate-600 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  title="Excluir Candidato"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de Criação / Edição */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8"
            >
              <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
                <h3 className="font-bold text-base">
                  {editingCandidate ? 'Editar Dados do Candidato CIPA' : 'Cadastrar Candidato na Urna'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {errorMessage && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300 font-medium flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Número na Urna (2 Dígitos) */}
                  <div>
                    <label htmlFor="cand-num" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Nº Urna (2 Dígitos)*:
                    </label>
                    <input
                      id="cand-num"
                      type="text"
                      maxLength={2}
                      value={formData.number}
                      onChange={(e) => setFormData({ ...formData, number: e.target.value.replace(/\D/g, '') })}
                      placeholder="Ex: 10"
                      className="w-full px-3 py-2 text-sm font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  {/* Nome Completo */}
                  <div className="sm:col-span-2">
                    <label htmlFor="cand-name" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Nome do Candidato*:
                    </label>
                    <input
                      id="cand-name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ex: Carlos Eduardo de Oliveira"
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Setor */}
                  <div>
                    <label htmlFor="cand-dept" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Setor / Departamento*:
                    </label>
                    <input
                      id="cand-dept"
                      type="text"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      placeholder="Ex: Usinagem Pesada"
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  {/* Cargo */}
                  <div>
                    <label htmlFor="cand-role" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Cargo / Função*:
                    </label>
                    <input
                      id="cand-role"
                      type="text"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      placeholder="Ex: Operador Especialista"
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                {/* Seleção de Foto / Avatar */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Foto do Candidato (Aparecerá na tela da Urna):
                  </label>
                  <div className="flex items-center space-x-2 overflow-x-auto py-1">
                    {PRESET_AVATARS.map((url, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setFormData({ ...formData, photoUrl: url })}
                        className={`w-12 h-14 rounded-lg overflow-hidden border-2 shrink-0 transition-all ${
                          formData.photoUrl === url
                            ? 'border-blue-600 scale-105 shadow-md'
                            : 'border-slate-300 dark:border-slate-700 opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img src={url} alt="Preset" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </button>
                    ))}
                  </div>
                  <input
                    type="url"
                    value={formData.photoUrl}
                    onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
                    placeholder="Ou cole a URL direta de uma foto..."
                    className="w-full mt-2 px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Proposta de Segurança */}
                <div>
                  <label htmlFor="cand-prop" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Proposta de Saúde & Segurança (NR-5 / MTE):
                  </label>
                  <textarea
                    id="cand-prop"
                    rows={2}
                    value={formData.proposal}
                    onChange={(e) => setFormData({ ...formData, proposal: e.target.value })}
                    placeholder="Ex: Melhorias ergonômicas na linha de produção e campanhas preventivas contra acidentes..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Status da Candidatura:
                  </label>
                  <div className="flex space-x-3">
                    <label className="flex items-center space-x-2 text-xs text-slate-800 dark:text-slate-200 cursor-pointer">
                      <input
                        type="radio"
                        checked={formData.status === 'ativo'}
                        onChange={() => setFormData({ ...formData, status: 'ativo' })}
                      />
                      <span>Homologado / Ativo na Urna</span>
                    </label>
                    <label className="flex items-center space-x-2 text-xs text-slate-800 dark:text-slate-200 cursor-pointer">
                      <input
                        type="radio"
                        checked={formData.status === 'inativo'}
                        onChange={() => setFormData({ ...formData, status: 'inativo' })}
                      />
                      <span>Inativo / Impugnado</span>
                    </label>
                  </div>
                </div>

                {/* Botões do Modal */}
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow cursor-pointer"
                  >
                    {editingCandidate ? 'Salvar Alterações' : 'Cadastrar Candidato'}
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

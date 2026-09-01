import React, { useState, useRef } from 'react';
import { useElection } from '../../context/ElectionContext';
import { Voter } from '../../types';
import * as XLSX from 'xlsx';
import {
  UserCheck,
  UserPlus,
  FileSpreadsheet,
  Search,
  CheckCircle2,
  Clock,
  Lock,
  Filter,
  Trash2,
  Upload,
  Download,
  FileText,
  AlertTriangle,
  RefreshCw,
  Eye,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ParsedVoterPreview {
  badgeNumber: string;
  name: string;
  department: string;
  role: string;
  email?: string;
  cpfMasked?: string;
  isValid: boolean;
  error?: string;
}

export const VotersManager: React.FC = () => {
  const {
    voters,
    addVoter,
    importVoters,
    replaceVoters,
    deleteVoter,
    clearAllVoters,
  } = useElection();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'voted' | 'pending'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importMode, setImportMode] = useState<'file' | 'text'>('file');
  const [importStrategy, setImportStrategy] = useState<'replace' | 'append'>('replace');

  // Preview State
  const [parsedPreview, setParsedPreview] = useState<ParsedVoterPreview[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [batchText, setBatchText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Single Add Form State
  const [formData, setFormData] = useState({
    badgeNumber: '',
    name: '',
    department: '',
    role: '',
    email: '',
  });

  const handleAddVoter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.badgeNumber.trim() || !formData.name.trim() || !formData.department.trim()) return;

    const ok = addVoter({
      badgeNumber: formData.badgeNumber.trim(),
      name: formData.name.trim(),
      department: formData.department.trim(),
      role: formData.role.trim() || 'Colaborador',
      email: formData.email.trim() || `colaborador.${formData.badgeNumber.trim()}@empresa.com.br`,
      cpfMasked: '***.' + Math.floor(100 + Math.random() * 900) + '.' + Math.floor(100 + Math.random() * 900) + '-**',
    });

    if (!ok) {
      alert('Já existe um eleitor cadastrado com este número de crachá.');
      return;
    }

    setFormData({
      badgeNumber: '',
      name: '',
      department: '',
      role: '',
      email: '',
    });
    setIsAddModalOpen(false);
  };

  // Normalização de chaves para mapeamento inteligente de colunas
  const normalizeKey = (key: string): string => {
    return key
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '');
  };

  // Processar arquivo Excel (.xlsx, .xls) ou CSV (.csv)
  const processUploadedFile = async (file: File) => {
    setIsProcessing(true);
    setFileName(file.name);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];

      // Ler como matriz de objetos (com cabeçalhos)
      const rawJson = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });

      if (rawJson.length === 0) {
        alert('O arquivo selecionado está vazio.');
        setParsedPreview([]);
        setIsProcessing(false);
        return;
      }

      const parsedList: ParsedVoterPreview[] = [];

      for (let i = 0; i < rawJson.length; i++) {
        const row = rawJson[i];
        let badge = '';
        let name = '';
        let dept = '';
        let role = '';
        let email = '';

        // Tentar mapeamento por nome de coluna
        const keys = Object.keys(row);
        for (const k of keys) {
          const norm = normalizeKey(k);
          const val = String(row[k] ?? '').trim();

          if (!badge && (norm.includes('cracha') || norm.includes('matricula') || norm.includes('badge') || norm.includes('numero') || norm === 'id' || norm === 'cod' || norm === 'codigo')) {
            badge = val;
          } else if (!name && (norm.includes('nome') || norm.includes('colaborador') || norm.includes('funcionario') || norm.includes('empregado') || norm.includes('name'))) {
            name = val;
          } else if (!dept && (norm.includes('setor') || norm.includes('departamento') || norm.includes('area') || norm.includes('dept') || norm.includes('department') || norm.includes('secao'))) {
            dept = val;
          } else if (!role && (norm.includes('cargo') || norm.includes('funcao') || norm.includes('role') || norm.includes('ocupacao') || norm.includes('position'))) {
            role = val;
          } else if (!email && (norm.includes('email') || norm.includes('correio'))) {
            email = val;
          }
        }

        // Fallback por índice caso colunas não tenham nomes padrão
        if (!badge && keys[0]) badge = String(row[keys[0]] ?? '').trim();
        if (!name && keys[1]) name = String(row[keys[1]] ?? '').trim();
        if (!dept && keys[2]) dept = String(row[keys[2]] ?? '').trim();
        if (!role && keys[3]) role = String(row[keys[3]] ?? '').trim();

        // Validar linha
        const isValid = Boolean(badge && name);
        let error = '';
        if (!badge) error = 'Crachá ausente';
        else if (!name) error = 'Nome ausente';

        parsedList.push({
          badgeNumber: badge,
          name: name || 'Nome não informado',
          department: dept || 'Geral',
          role: role || 'Colaborador',
          email: email || `colaborador.${badge}@empresa.com.br`,
          cpfMasked: '***.' + Math.floor(100 + Math.random() * 900) + '.' + Math.floor(100 + Math.random() * 900) + '-**',
          isValid,
          error,
        });
      }

      setParsedPreview(parsedList);
    } catch (err) {
      console.error('Erro ao ler planilha:', err);
      alert('Não foi possível ler o arquivo. Certifique-se de que é uma planilha Excel (.xlsx / .xls) ou CSV válido.');
      setParsedPreview([]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Processar texto colado
  const handleProcessText = () => {
    if (!batchText.trim()) return;

    const lines = batchText.split('\n');
    const parsedList: ParsedVoterPreview[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Pular cabeçalho se houver
      if (i === 0 && (line.toLowerCase().includes('crach') || line.toLowerCase().includes('matr') || line.toLowerCase().includes('nome'))) {
        continue;
      }

      const parts = line.split(/[,;\t]/).map((p) => p.trim());
      if (parts.length >= 2) {
        const badge = parts[0];
        const name = parts[1];
        const dept = parts[2] || 'Geral';
        const role = parts[3] || 'Colaborador';
        const email = parts[4] || `colaborador.${badge}@empresa.com.br`;

        parsedList.push({
          badgeNumber: badge,
          name: name,
          department: dept,
          role: role,
          email: email,
          cpfMasked: '***.' + Math.floor(100 + Math.random() * 900) + '.' + Math.floor(100 + Math.random() * 900) + '-**',
          isValid: Boolean(badge && name),
        });
      }
    }

    setParsedPreview(parsedList);
    setFileName('Texto colado manualmente');
  };

  // Confirmar Importação
  const handleConfirmImport = () => {
    const validRows = parsedPreview.filter((p) => p.isValid);
    if (validRows.length === 0) {
      alert('Nenhum registro válido encontrado para importar.');
      return;
    }

    const payload = validRows.map((p) => ({
      badgeNumber: p.badgeNumber,
      name: p.name,
      department: p.department,
      role: p.role,
      email: p.email,
      cpfMasked: p.cpfMasked,
    }));

    if (importStrategy === 'replace') {
      const count = replaceVoters(payload);
      alert(`Lista atualizada com sucesso! ${count} colaboradores cadastrados.`);
    } else {
      const count = importVoters(payload);
      alert(`Importação concluída! ${count} novos colaboradores adicionados à lista.`);
    }

    // Reset modal state
    setParsedPreview([]);
    setFileName(null);
    setBatchText('');
    setIsImportModalOpen(false);
  };

  // Baixar Modelo Excel
  const handleDownloadExcelTemplate = () => {
    const templateData = [
      { 'Número do Crachá': '1001', 'Nome': 'Carlos Eduardo da Silva', 'Setor': 'Produção & Usinagem', 'Cargo': 'Operador de CNC' },
      { 'Número do Crachá': '1002', 'Nome': 'Mariana Souza Santos', 'Setor': 'Logística & Expedição', 'Cargo': 'Conferente' },
      { 'Número do Crachá': '1003', 'Nome': 'Roberto Mendes Oliveira', 'Setor': 'Manutenção Industrial', 'Cargo': 'Eletricista' },
      { 'Número do Crachá': '1004', 'Nome': 'Juliana Costa Ferreira', 'Setor': 'Controle de Qualidade', 'Cargo': 'Inspetora' },
      { 'Número do Crachá': '1005', 'Nome': 'Fernando Alcantara Maia', 'Setor': 'Recursos Humanos', 'Cargo': 'Analista de DP' },
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Eleitores_CIPA');
    XLSX.writeFile(wb, 'modelo_eleitores_cipa.xlsx');
  };

  // Baixar Modelo CSV
  const handleDownloadCsvTemplate = () => {
    const csvContent =
      'Número do Crachá,Nome,Setor,Cargo\n' +
      '1001,Carlos Eduardo da Silva,Produção & Usinagem,Operador de CNC\n' +
      '1002,Mariana Souza Santos,Logística & Expedição,Conferente\n' +
      '1003,Roberto Mendes Oliveira,Manutenção Industrial,Eletricista\n' +
      '1004,Juliana Costa Ferreira,Controle de Qualidade,Inspetora\n' +
      '1005,Fernando Alcantara Maia,Recursos Humanos,Analista de DP\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'modelo_eleitores_cipa.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Excluir eleitor individual
  const handleDeleteVoter = (voter: Voter) => {
    if (confirm(`Deseja remover o colaborador "${voter.name}" (Crachá: ${voter.badgeNumber}) da lista de votantes?`)) {
      deleteVoter(voter.id);
    }
  };

  // Limpar todos os eleitores
  const handleClearAll = () => {
    if (voters.length === 0) return;
    if (confirm('Atenção: Deseja realmente excluir TODOS os eleitores cadastrados para iniciar uma lista 100% nova?')) {
      clearAllVoters();
    }
  };

  // Filtros de busca
  const filtered = voters.filter((v) => {
    const matchesSearch =
      v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.badgeNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.role && v.role.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    if (statusFilter === 'voted') return v.hasVoted;
    if (statusFilter === 'pending') return !v.hasVoted;
    return true;
  });

  const totalVoters = voters.length;
  const votedCount = voters.filter((v) => v.hasVoted).length;
  const pendingCount = totalVoters - votedCount;
  const validPreviewCount = parsedPreview.filter((p) => p.isValid).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 py-6">
      
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center space-x-3">
            <UserCheck className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            <span>Cadastro de Eleitores & Crachás</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Relação nominal de colaboradores aptos a votar por crachá/matrícula, setor e cargo, com controle de presença conforme NR-5.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            id="btn-importar-excel-csv"
            onClick={() => {
              setParsedPreview([]);
              setFileName(null);
              setIsImportModalOpen(true);
            }}
            className="px-4 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-100 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-xl border border-emerald-300 dark:border-emerald-700 transition-all flex items-center space-x-2 cursor-pointer shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Subir Planilha Excel / CSV</span>
          </button>

          <button
            type="button"
            id="btn-cadastrar-eleitor-manual"
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Novo Eleitor</span>
          </button>

          {totalVoters > 0 && (
            <button
              type="button"
              id="btn-limpar-todos-eleitores"
              onClick={handleClearAll}
              className="px-3 py-2.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-900 transition-colors cursor-pointer"
              title="Excluir todos os colaboradores da lista atual"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Aviso de Sigilo LGPD */}
      <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 rounded-2xl flex items-start space-x-3 text-xs text-blue-900 dark:text-blue-200">
        <Lock className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <div>
          <strong className="font-semibold block mb-0.5">Privacidade e Proteção de Dados (LGPD e NR-5):</strong>
          O sistema registra unicamente o comparecimento do colaborador para cômputo do quórum legal e emissão do comprovante, com sigilo incondicional do voto.
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            id="input-busca-eleitores"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por número do crachá, nome, setor ou cargo..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            id="select-status-eleitores"
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
                <th className="py-3 px-4 w-32 text-center">Número do Crachá</th>
                <th className="py-3 px-4">Nome do Colaborador</th>
                <th className="py-3 px-4">Setor / Área</th>
                <th className="py-3 px-4">Cargo / Função</th>
                <th className="py-3 px-4 text-center w-36">Status Presença</th>
                <th className="py-3 px-4">Data / Hora Votação</th>
                <th className="py-3 px-4 text-center w-20">Ações</th>
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
                  <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-medium">
                    {voter.department}
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                    {voter.role || '-'}
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
                  <td className="py-3 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => handleDeleteVoter(voter)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer"
                      title="Excluir eleitor"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                    {totalVoters === 0 ? (
                      <div className="space-y-3">
                        <FileSpreadsheet className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
                        <p className="font-semibold text-slate-600 dark:text-slate-300">Nenhum eleitor cadastrado ainda.</p>
                        <p className="text-slate-400 max-w-sm mx-auto">
                          Suba o arquivo da sua empresa em Excel (.xlsx) ou CSV contendo os crachás, nomes, setores e cargos.
                        </p>
                      </div>
                    ) : (
                      'Nenhum colaborador encontrado com os filtros informados.'
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Principal de Upload de Planilha Excel / CSV */}
      <AnimatePresence>
        {isImportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[90vh] flex flex-col"
            >
              {/* Header */}
              <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
                <div className="flex items-center space-x-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-bold text-base">Importação de Eleitores (Excel / CSV)</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="text-slate-400 hover:text-white p-1"
                >
                  ✕
                </button>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto space-y-5 flex-1">
                
                {/* Tabs: Upload de Arquivo vs Texto */}
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => setImportMode('file')}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center space-x-1.5 ${
                        importMode === 'file'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Arquivo (.xlsx, .xls, .csv)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setImportMode('text')}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center space-x-1.5 ${
                        importMode === 'text'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Colar Texto</span>
                    </button>
                  </div>

                  {/* Modelos para Download */}
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] text-slate-400 hidden sm:inline">Baixar modelo:</span>
                    <button
                      type="button"
                      onClick={handleDownloadExcelTemplate}
                      className="px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-center space-x-1 cursor-pointer"
                      title="Baixar planilha de exemplo no formato Excel"
                    >
                      <Download className="w-3 h-3" />
                      <span>Excel (.xlsx)</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadCsvTemplate}
                      className="px-2.5 py-1 text-[11px] font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 border border-blue-200 dark:border-blue-800 rounded-lg flex items-center space-x-1 cursor-pointer"
                      title="Baixar planilha de exemplo no formato CSV"
                    >
                      <Download className="w-3 h-3" />
                      <span>CSV</span>
                    </button>
                  </div>
                </div>

                {/* Estratégia de Importação */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
                  <div className="font-semibold text-slate-800 dark:text-slate-200">
                    O que fazer com os dados atuais?
                  </div>
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center space-x-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="importStrategy"
                        value="replace"
                        checked={importStrategy === 'replace'}
                        onChange={() => setImportStrategy('replace')}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="font-medium text-slate-900 dark:text-slate-200">
                        Substituir lista existente
                      </span>
                    </label>

                    <label className="flex items-center space-x-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="importStrategy"
                        value="append"
                        checked={importStrategy === 'append'}
                        onChange={() => setImportStrategy('append')}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="font-medium text-slate-900 dark:text-slate-200">
                        Adicionar à lista existente
                      </span>
                    </label>
                  </div>
                </div>

                {/* ABA 1: DROPZONE / UPLOAD DE ARQUIVO */}
                {importMode === 'file' && (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOver(false);
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        processUploadedFile(e.dataTransfer.files[0]);
                      }
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                      dragOver
                        ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30'
                        : 'border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 hover:border-blue-400 dark:hover:border-blue-600 hover:bg-slate-100/50'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx, .xls, .csv"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          processUploadedFile(e.target.files[0]);
                        }
                      }}
                    />

                    <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-3 shadow-xs">
                      <FileSpreadsheet className="w-7 h-7" />
                    </div>

                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      Clique para selecionar ou arraste o arquivo Excel (.xlsx, .xls) ou CSV aqui
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Colunas esperadas na planilha: <strong>Número do Crachá, Nome, Setor e Cargo</strong>
                    </p>
                  </div>
                )}

                {/* ABA 2: TEXTO COLADO */}
                {importMode === 'text' && (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      Cole as linhas separadas por vírgula, ponto-e-vírgula ou tabulação:
                      <br />
                      <code className="text-blue-600 dark:text-blue-400 font-mono bg-blue-50 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[11px] inline-block mt-1">
                        CRACHÁ, NOME, SETOR, CARGO
                      </code>
                    </p>

                    <textarea
                      rows={5}
                      value={batchText}
                      onChange={(e) => setBatchText(e.target.value)}
                      placeholder="1001, Carlos da Silva, Produção, Operador CNC&#10;1002, Mariana Santos, Logística, Conferente&#10;1003, Roberto Mendes, Manutenção, Eletricista"
                      className="w-full p-3 text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    <button
                      type="button"
                      onClick={handleProcessText}
                      className="px-4 py-2 text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 rounded-xl border border-blue-200 dark:border-blue-800 transition-colors cursor-pointer"
                    >
                      Processar Texto
                    </button>
                  </div>
                )}

                {/* PREVIEW DA PLANILHA PROCESSADA */}
                {parsedPreview.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-xs">
                        <Eye className="w-4 h-4 text-blue-600" />
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          Pré-visualização: {fileName || 'Dados Identificados'}
                        </span>
                      </div>

                      <div className="text-xs text-slate-500 font-medium">
                        {validPreviewCount} de {parsedPreview.length} registros válidos
                      </div>
                    </div>

                    <div className="max-h-56 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 shadow-inner">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold sticky top-0">
                          <tr>
                            <th className="py-2 px-3">Crachá</th>
                            <th className="py-2 px-3">Nome</th>
                            <th className="py-2 px-3">Setor</th>
                            <th className="py-2 px-3">Cargo</th>
                            <th className="py-2 px-3 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                          {parsedPreview.map((item, idx) => (
                            <tr key={idx} className={item.isValid ? '' : 'bg-rose-50/50 dark:bg-rose-950/20'}>
                              <td className="py-2 px-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                                {item.badgeNumber || '-'}
                              </td>
                              <td className="py-2 px-3 font-medium text-slate-900 dark:text-white">
                                {item.name}
                              </td>
                              <td className="py-2 px-3 text-slate-600 dark:text-slate-300">
                                {item.department}
                              </td>
                              <td className="py-2 px-3 text-slate-500">
                                {item.role}
                              </td>
                              <td className="py-2 px-3 text-center">
                                {item.isValid ? (
                                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                                    Válido
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-200 dark:border-rose-800">
                                    {item.error}
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="bg-slate-50 dark:bg-slate-800/80 px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  id="btn-confirmar-importacao-final"
                  disabled={validPreviewCount === 0 || isProcessing}
                  onClick={handleConfirmImport}
                  className={`px-5 py-2.5 text-xs font-bold text-white rounded-xl shadow transition-all cursor-pointer flex items-center space-x-2 ${
                    validPreviewCount > 0 && !isProcessing
                      ? 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 shadow-emerald-600/20'
                      : 'bg-slate-400 cursor-not-allowed opacity-60'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    Confirmar Importação de {validPreviewCount} Colaboradores
                  </span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Cadastrar Eleitor Individual */}
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
                    E-mail Corporativo (Opcional):
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
    </div>
  );
};

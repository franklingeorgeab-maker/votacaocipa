import React, { useState } from 'react';
import { useElection } from '../../context/ElectionContext';
import {
  generateAtaEleicaoPDF,
  generateBoletimUrnaPDF,
  exportElectionToExcel,
} from '../../utils/reportGenerators';
import {
  Trophy,
  Award,
  Vote,
  Users,
  CheckCircle2,
  AlertTriangle,
  FileText,
  FileSpreadsheet,
  TrendingUp,
  BarChart3,
  ShieldAlert,
  Percent,
  Clock,
  Printer,
} from 'lucide-react';
import { motion } from 'motion/react';

export const ResultsDashboard: React.FC = () => {
  const {
    company,
    candidates,
    voters,
    urnas,
    votes,
    auditLogs,
    summary,
  } = useElection();

  const [selectedUrnaFilter, setSelectedUrnaFilter] = useState<string>('all');

  // Filtragem de votos se selecionada uma urna específica
  const filteredVotes = selectedUrnaFilter === 'all'
    ? votes
    : votes.filter((v) => v.urnaId === selectedUrnaFilter);

  // Ordenar candidatos por número de votos decrescentes
  const sortedCandidates = [...candidates].sort((a, b) => {
    const vA = selectedUrnaFilter === 'all'
      ? (a.votesCount || 0)
      : filteredVotes.filter((v) => v.candidateNumber === a.number).length;
    const vB = selectedUrnaFilter === 'all'
      ? (b.votesCount || 0)
      : filteredVotes.filter((v) => v.candidateNumber === b.number).length;
    return vB - vA;
  });

  const totalFilteredVotes = filteredVotes.length;
  const filteredBlanks = filteredVotes.filter((v) => v.candidateNumber === 'BRANCO').length;
  const filteredNulls = filteredVotes.filter((v) => v.candidateNumber === 'NULO').length;
  const filteredValids = totalFilteredVotes - (filteredBlanks + filteredNulls);

  const reportData = {
    company,
    candidates,
    voters,
    urnas,
    votes,
    auditLogs,
    summary,
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 py-6">
      
      {/* Cabeçalho da Apuração */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center space-x-1">
              <BarChart3 className="w-3.5 h-3.5" />
              <span>APURAÇÃO OFICIAL EM TEMPO REAL</span>
            </span>
            <span className="text-xs text-slate-400">• CIPA {company.cipaTerm}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Painel Consolidado de Resultados
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {company.companyName} • CNPJ: {company.cnpj} • Unidade: {company.establishmentUnit}
          </p>
        </div>

        {/* Ações de Exportação Rápida */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            id="btn-export-ata-pdf"
            onClick={() => generateAtaEleicaoPDF(reportData)}
            className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl shadow transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            <FileText className="w-4 h-4 text-amber-400" />
            <span>Ata Oficial (PDF)</span>
          </button>

          <button
            type="button"
            id="btn-export-bu-pdf"
            onClick={() => generateBoletimUrnaPDF(reportData)}
            className="px-4 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl border border-slate-300 dark:border-slate-700 transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-blue-500" />
            <span>Boletim de Urna (BU)</span>
          </button>

          <button
            type="button"
            id="btn-export-excel"
            onClick={() => exportElectionToExcel(reportData)}
            className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
            <span>Excel (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* CARDS DE INDICADORES PRINCIPAIS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total de Votos */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total de Votos Apurados</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Vote className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">
            {summary.totalVotesCast}
            <span className="text-xs font-normal text-slate-400 ml-1.5">de {summary.totalVoters} aptos</span>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Participação de <strong>{summary.turnoutPercentage}%</strong> do eleitorado
          </div>
        </div>

        {/* Card 2: Quórum Legal NR-5 */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Quórum Legal (NR-5)</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              summary.quorumReached ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400' : 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
            }`}>
              {summary.quorumReached ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            </div>
          </div>
          <div className={`text-2xl font-black ${
            summary.quorumReached ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
          }`}>
            {summary.quorumReached ? 'ATINJIDO (VÁLIDO)' : 'PENDENTE'}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Mínimo exigido: <strong>{summary.quorumMinimumRequired} votantes</strong> (50% + 1)
          </div>
        </div>

        {/* Card 3: Votos Válidos Nominais */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Votos Válidos Nominais</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400">
            {summary.validVotes}
            <span className="text-xs font-normal text-slate-400 ml-1.5">
              ({summary.totalVotesCast > 0 ? ((summary.validVotes / summary.totalVotesCast) * 100).toFixed(1) : 0}%)
            </span>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Distribuídos entre os candidatos registrados
          </div>
        </div>

        {/* Card 4: Brancos e Nulos */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Brancos & Nulos</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-800 dark:text-slate-200">
            <span>{summary.blankVotes} Brancos</span>
            <span className="text-slate-400 text-base mx-2">•</span>
            <span>{summary.nullVotes} Nulos</span>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Total não nominal: {summary.blankVotes + summary.nullVotes} votos
          </div>
        </div>
      </div>

      {/* BANNER EXPLICATIVO DA NR-5 SOBRE QUÓRUM E VALIDADE */}
      <div className={`p-4 rounded-2xl border flex items-start space-x-3 text-xs ${
        summary.quorumReached
          ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50 text-emerald-900 dark:text-emerald-200'
          : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/50 text-amber-900 dark:text-amber-200'
      }`}>
        {summary.quorumReached ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        ) : (
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        )}
        <div className="space-y-1">
          <div className="font-bold text-sm">
            {summary.quorumReached
              ? 'Eleição Oficialmente Válida em 1º Turno (Conforme Item 5.5 da NR-5)'
              : 'Aguardando Quórum Mínimo de 50% + 1 (Item 5.5 da NR-5)'}
          </div>
          <p>
            {summary.quorumReached
              ? `O pleito atingiu ${summary.turnoutPercentage}% de participação (${summary.totalVotesCast} votos de ${summary.totalVoters} empregados). Não haverá necessidade de prorrogação ou 2º turno.`
              : `Até o momento votaram ${summary.totalVotesCast} colaboradores (${summary.turnoutPercentage}%). Caso não atinja ${summary.quorumMinimumRequired} votantes até o encerramento, a Comissão Eleitoral deverá organizar o 2º turno no prazo legal.`}
          </p>
        </div>
      </div>

      {/* TABELA DE CLASSIFICAÇÃO DOS CANDIDATOS (TITULARES, SUPLENTES E NÃO ELEITOS) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              <span>Classificação Oficial dos Candidatos</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Dimensionamento CIPA: <strong>{company.requiredTitulares} Titulares</strong> e <strong>{company.requiredSuplentes} Suplentes</strong> conforme Grau de Risco {company.riskGrade}.
            </p>
          </div>

          {/* Filtro de Urna */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-500 font-medium">Filtrar por Urna:</span>
            <select
              value={selectedUrnaFilter}
              onChange={(e) => setSelectedUrnaFilter(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option value="all">Todas as Urnas (Consolidado)</option>
              {urnas.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 text-xs uppercase font-bold border-b border-slate-200 dark:border-slate-800">
                <th className="py-3.5 px-4 text-center w-16">Posição</th>
                <th className="py-3.5 px-4 text-center w-20">Nº</th>
                <th className="py-3.5 px-4">Candidato</th>
                <th className="py-3.5 px-4">Setor / Cargo</th>
                <th className="py-3.5 px-4 text-center w-28">Votos</th>
                <th className="py-3.5 px-4 w-40">% Votação</th>
                <th className="py-3.5 px-4 text-center w-44">Resultado / Mandato</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {sortedCandidates.map((cand, idx) => {
                const votesCount = selectedUrnaFilter === 'all'
                  ? (cand.votesCount || 0)
                  : filteredVotes.filter((v) => v.candidateNumber === cand.number).length;

                const pct = totalFilteredVotes > 0 ? (votesCount / totalFilteredVotes) * 100 : 0;

                const isTitular = idx < company.requiredTitulares;
                const isSuplente = !isTitular && idx < company.requiredTitulares + company.requiredSuplentes;

                return (
                  <tr
                    key={cand.id}
                    className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                      isTitular ? 'bg-amber-500/5 dark:bg-amber-500/10 font-medium' : ''
                    }`}
                  >
                    {/* Posição */}
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center justify-center">
                        {idx === 0 ? (
                          <span className="w-7 h-7 rounded-full bg-amber-500 text-white font-black flex items-center justify-center shadow-sm">
                            1º
                          </span>
                        ) : idx === 1 ? (
                          <span className="w-6 h-6 rounded-full bg-slate-300 dark:bg-slate-600 text-slate-900 dark:text-white font-bold flex items-center justify-center">
                            2º
                          </span>
                        ) : idx === 2 ? (
                          <span className="w-6 h-6 rounded-full bg-amber-700/80 text-white font-bold flex items-center justify-center">
                            3º
                          </span>
                        ) : (
                          <span className="text-slate-500 dark:text-slate-400 font-mono font-bold">
                            {idx + 1}º
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Número */}
                    <td className="py-3 px-4 text-center">
                      <span className="px-2.5 py-1 bg-slate-900 text-emerald-400 font-mono font-black text-xs rounded-md shadow-sm">
                        {cand.number}
                      </span>
                    </td>

                    {/* Foto e Nome */}
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <img
                          src={cand.photoUrl}
                          alt={cand.name}
                          className="w-9 h-10 object-cover rounded-lg border border-slate-300 dark:border-slate-700 shadow-xs shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">
                            {cand.name}
                          </div>
                          {cand.proposal && (
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 italic">
                              "{cand.proposal}"
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Setor e Cargo */}
                    <td className="py-3 px-4">
                      <div className="text-slate-800 dark:text-slate-200 font-semibold">
                        {cand.department}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {cand.role}
                      </div>
                    </td>

                    {/* Contagem de Votos */}
                    <td className="py-3 px-4 text-center font-mono font-bold text-sm text-slate-900 dark:text-white">
                      {votesCount}
                    </td>

                    {/* Barra de Porcentagem */}
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="font-bold text-slate-700 dark:text-slate-300">
                            {pct.toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isTitular ? 'bg-amber-500' : isSuplente ? 'bg-blue-500' : 'bg-slate-400'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Status de Eleito */}
                    <td className="py-3 px-4 text-center">
                      {isTitular ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                          <Trophy className="w-3 h-3 text-amber-600 shrink-0" />
                          <span>ELEITO TITULAR ({idx + 1}º)</span>
                        </span>
                      ) : isSuplente ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
                          <Award className="w-3 h-3 text-blue-600 shrink-0" />
                          <span>ELEITO SUPLENTE ({idx + 1 - company.requiredTitulares}º)</span>
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium text-slate-400 dark:text-slate-500">
                          Não Eleito
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

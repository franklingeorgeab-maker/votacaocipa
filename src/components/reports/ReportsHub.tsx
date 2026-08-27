import React from 'react';
import { useElection } from '../../context/ElectionContext';
import {
  generateAtaEleicaoPDF,
  generateBoletimUrnaPDF,
  generateZeresimaPDF,
  exportElectionToExcel,
} from '../../utils/reportGenerators';
import {
  FileText,
  FileSpreadsheet,
  Printer,
  ShieldCheck,
  Download,
  Building2,
  CheckCircle2,
  Award,
} from 'lucide-react';

export const ReportsHub: React.FC = () => {
  const {
    company,
    candidates,
    voters,
    urnas,
    votes,
    auditLogs,
    summary,
  } = useElection();

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
      
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center space-x-3">
            <FileText className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            <span>Central Oficial de Relatórios e Exportação</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Geração de documentos legais exigidos pelo Ministério do Trabalho e Emprego (MTE) e NR-5 em formatos PDF e Excel (.xlsx).
          </p>
        </div>
      </div>

      {/* Grid de Documentos Oficiais */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Documento 1: Ata Oficial de Eleição CIPA (PDF) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-md border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-5">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Ata Oficial de Eleição da CIPA (PDF)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Documento principal do pleito com cabeçalho da empresa, quórum legal apurado, classificação completa de Titulares e Suplentes eleitos, e campos para assinatura da Comissão Eleitoral conforme NR-5.
              </p>
            </div>
            <div className="text-[11px] text-slate-500 space-y-1">
              <div>✓ Validade jurídica perante auditoria fiscal do trabalho (MTE)</div>
              <div>✓ Citação expressa do quórum de 50%+1 (Item 5.5)</div>
              <div>✓ Formatação oficial A4 diagramada para impressão</div>
            </div>
          </div>

          <button
            type="button"
            id="btn-download-ata"
            onClick={() => generateAtaEleicaoPDF(reportData)}
            className="w-full py-3 px-4 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Baixar Ata Oficial (PDF)</span>
          </button>
        </div>

        {/* Documento 2: Planilha Completa em Excel (.xlsx) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-md border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-5">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Planilha Consolidada do Pleito (Excel .xlsx)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Arquivo de dados com múltiplas abas contendo Apuração de Resultados, Presença LGPD dos Colaboradores, Candidatos Registrados, Urnas On-line e Trilha de Auditoria MTE.
              </p>
            </div>
            <div className="text-[11px] text-slate-500 space-y-1">
              <div>✓ 5 abas completas com todos os dados e fórmulas</div>
              <div>✓ Lista de votantes com códigos de autenticidade (LGPD)</div>
              <div>✓ Compatível com Microsoft Excel, LibreOffice e Google Sheets</div>
            </div>
          </div>

          <button
            type="button"
            id="btn-download-excel"
            onClick={() => exportElectionToExcel(reportData)}
            className="w-full py-3 px-4 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Baixar Dados Completos (.xlsx)</span>
          </button>
        </div>

        {/* Documento 3: Boletim de Urna (BU) Consolidado */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-md border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-5">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
              <Printer className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Boletim de Urna (BU) Consolidado (PDF)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Extrato com a soma de votos nominais de cada candidato, votos brancos e nulos apurados nas urnas eletrônicas para afixação no quadro de avisos da empresa.
              </p>
            </div>
            <div className="text-[11px] text-slate-500 space-y-1">
              <div>✓ Modelo idêntico aos BUs da Justiça Eleitoral</div>
              <div>✓ Assinatura digital e hash de verificação de autenticidade</div>
              <div>✓ Permite afixação pública para transparência aos colaboradores</div>
            </div>
          </div>

          <button
            type="button"
            id="btn-download-bu"
            onClick={() => generateBoletimUrnaPDF(reportData)}
            className="w-full py-3 px-4 text-xs font-bold text-slate-900 dark:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl border border-slate-300 dark:border-slate-700 shadow-sm transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-blue-600" />
            <span>Gerar Boletim de Urna (PDF)</span>
          </button>
        </div>

        {/* Documento 4: Relatório de Zerésima Inicial */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-md border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-5">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Relatório de Zerésima (PDF)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Comprovante oficial emitido antes do primeiro voto comprovando que todos os candidatos iniciaram a votação com zero votos registrados na urna.
              </p>
            </div>
            <div className="text-[11px] text-slate-500 space-y-1">
              <div>✓ Requisito indispensável de auditoria pré-votação</div>
              <div>✓ Hash criptográfico com registro do horário de emissão</div>
              <div>✓ Validação perante fiscais dos candidatos</div>
            </div>
          </div>

          <button
            type="button"
            id="btn-download-zeresima"
            onClick={() => generateZeresimaPDF(reportData, urnas[0])}
            className="w-full py-3 px-4 text-xs font-bold text-slate-900 dark:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl border border-slate-300 dark:border-slate-700 shadow-sm transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Baixar Zerésima da Urna 01 (PDF)</span>
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { useElection } from '../../context/ElectionContext';
import {
  Building2,
  Calendar,
  Clock,
  Users,
  ShieldCheck,
  Save,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

export const CompanySettings: React.FC = () => {
  const { company, updateCompany } = useElection();
  const [formData, setFormData] = useState({ ...company });
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateCompany(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 4000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-4 sm:px-6 py-6">
      
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center space-x-3">
            <Building2 className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            <span>Cadastro da Empresa & Parâmetros do Pleito</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configurações oficiais da organização, comissão eleitoral e regras do processo conforme NR-5 do MTE.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Bloco 1: Dados da Empresa */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-md border border-slate-200 dark:border-slate-800 space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-3">
            <Building2 className="w-4 h-4 text-blue-600" />
            <span>1. Informações Cadastrais da Empresa</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="company-name" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Razão Social*:
              </label>
              <input
                id="company-name"
                type="text"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="trading-name" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nome Fantasia:
              </label>
              <input
                id="trading-name"
                type="text"
                value={formData.tradingName}
                onChange={(e) => setFormData({ ...formData, tradingName: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="company-cnpj" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                CNPJ*:
              </label>
              <input
                id="company-cnpj"
                type="text"
                value={formData.cnpj}
                onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                required
              />
            </div>

            <div>
              <label htmlFor="company-establishment" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Estabelecimento / Unidade Operacional*:
              </label>
              <input
                id="company-establishment"
                type="text"
                value={formData.establishmentUnit}
                onChange={(e) => setFormData({ ...formData, establishmentUnit: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="company-cnae" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Atividade Econômica Principal (CNAE):
              </label>
              <input
                id="company-cnae"
                type="text"
                value={formData.cnae}
                onChange={(e) => setFormData({ ...formData, cnae: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="company-risk" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Grau de Risco (Quadro I da NR-4):
              </label>
              <select
                id="company-risk"
                value={formData.riskGrade}
                onChange={(e) => setFormData({ ...formData, riskGrade: parseInt(e.target.value, 10) })}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value={1}>Grau de Risco 1 (Mínimo)</option>
                <option value={2}>Grau de Risco 2 (Médio)</option>
                <option value={3}>Grau de Risco 3 (Grave - Ex: Indústria Metalúrgica)</option>
                <option value={4}>Grau de Risco 4 (Máximo - Ex: Mineração)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bloco 2: Parâmetros da Eleição e Dimensionamento */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-md border border-slate-200 dark:border-slate-800 space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-3">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <span>2. Data do Pleito e Dimensionamento da CIPA</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="election-term" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Gestão / Mandato*:
              </label>
              <input
                id="election-term"
                type="text"
                value={formData.cipaTerm}
                onChange={(e) => setFormData({ ...formData, cipaTerm: e.target.value })}
                placeholder="Ex: 2026 / 2027"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                required
              />
            </div>

            <div>
              <label htmlFor="election-date" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Dia da Votação*:
              </label>
              <input
                id="election-date"
                type="date"
                value={formData.electionDate}
                onChange={(e) => setFormData({ ...formData, electionDate: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                required
              />
            </div>

            <div>
              <label htmlFor="total-employees" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Total de Empregados do Estabelecimento*:
              </label>
              <input
                id="total-employees"
                type="number"
                min={1}
                value={formData.totalEmployees}
                onChange={(e) => setFormData({ ...formData, totalEmployees: parseInt(e.target.value, 10) || 1 })}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                required
              />
              <span className="text-[10px] text-slate-400">
                Base do quórum de 50%+1: {Math.floor(formData.totalEmployees / 2) + 1} votos
              </span>
            </div>

            <div>
              <label htmlFor="election-start-time" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Horário de Início da Votação:
              </label>
              <input
                id="election-start-time"
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>

            <div>
              <label htmlFor="election-end-time" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Horário de Encerramento:
              </label>
              <input
                id="election-end-time"
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="req-titulares" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Titulares Eleitos:
                </label>
                <input
                  id="req-titulares"
                  type="number"
                  min={1}
                  value={formData.requiredTitulares}
                  onChange={(e) => setFormData({ ...formData, requiredTitulares: parseInt(e.target.value, 10) || 1 })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>
              <div>
                <label htmlFor="req-suplentes" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Suplentes Eleitos:
                </label>
                <input
                  id="req-suplentes"
                  type="number"
                  min={0}
                  value={formData.requiredSuplentes}
                  onChange={(e) => setFormData({ ...formData, requiredSuplentes: parseInt(e.target.value, 10) || 0 })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bloco 3: Comissão Eleitoral (NR-5) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-md border border-slate-200 dark:border-slate-800 space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-3">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span>3. Comissão Eleitoral Responsável (NR-5)</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="comm-pres" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Presidente da Comissão Eleitoral*:
              </label>
              <input
                id="comm-pres"
                type="text"
                value={formData.electionCommittee.president}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    electionCommittee: { ...formData.electionCommittee, president: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="comm-sec" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Secretário(a) da Comissão*:
              </label>
              <input
                id="comm-sec"
                type="text"
                value={formData.electionCommittee.secretary}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    electionCommittee: { ...formData.electionCommittee, secretary: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>
        </div>

        {/* Notificação de Sucesso */}
        {savedSuccess && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 rounded-xl text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center space-x-2 animate-bounce">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>Dados da Empresa e Parâmetros do Pleito atualizados com sucesso e registrados na auditoria!</span>
          </div>
        )}

        {/* Botão Salvar */}
        <div className="flex justify-end">
          <button
            type="submit"
            id="btn-salvar-empresa"
            className="px-8 py-3 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center space-x-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Salvar Configurações Oficiais</span>
          </button>
        </div>
      </form>
    </div>
  );
};

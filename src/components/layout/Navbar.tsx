import React, { useState } from 'react';
import { useElection } from '../../context/ElectionContext';
import { UserRole } from '../../types';
import { tseAudio } from '../../utils/tseAudio';
import {
  Vote,
  BarChart3,
  Users,
  Building2,
  Monitor,
  UserCheck,
  ShieldCheck,
  FileText,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  RotateCcw,
  LogIn,
  LogOut,
  ChevronDown,
  User,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const {
    company,
    currentUser,
    setCurrentUser,
    loginOAuth,
    logout,
    isDarkMode,
    toggleDarkMode,
    resetElectionData,
    summary,
  } = useElection();

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [muted, setMuted] = useState(tseAudio.getMuted());

  const navItems = [
    { id: 'voting', label: 'Cabine de Votação', icon: Vote, badge: 'TSE' },
    { id: 'results', label: 'Apuração & Resultados', icon: BarChart3 },
    { id: 'candidates', label: 'Candidatos', icon: Users },
    { id: 'company', label: 'Cadastro', icon: Building2 },
    { id: 'urnas', label: 'Urnas On-line', icon: Monitor },
    { id: 'voters', label: 'Eleitores & LGPD', icon: UserCheck },
    { id: 'audit', label: 'Auditoria MTE', icon: ShieldCheck },
    { id: 'reports', label: 'Relatórios Oficiais', icon: FileText },
  ];

  const handleToggleSound = () => {
    const next = !muted;
    tseAudio.setMuted(next);
    setMuted(next);
  };

  const handleReset = () => {
    if (confirm('Deseja reiniciar a simulação e zerar os votos para uma nova eleição?')) {
      resetElectionData();
    }
  };

  const handleSelectRole = (role: UserRole) => {
    setCurrentUser({
      ...currentUser,
      role,
    });
    setIsUserMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-xs">
      {/* Top Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
        
        {/* Logo e Título */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('voting')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-indigo-700 to-emerald-600 flex items-center justify-center text-white shadow-md shadow-blue-600/20">
            <Vote className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                ELEIÇÃO CIPA
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-slate-900 text-emerald-400 font-mono shadow-xs">
                NR-5 / MTE
              </span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate max-w-[200px] sm:max-w-xs">
              {company.tradingName || company.companyName} • Gestão {company.cipaTerm}
            </div>
          </div>
        </div>

        {/* Quorum Badge e Controles */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          
          {/* Quorum Indicator */}
          <div
            className={`hidden md:flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-colors cursor-pointer ${
              summary.quorumReached
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800'
            }`}
            onClick={() => setActiveTab('results')}
            title="Quórum legal mínimo de 50% + 1 (Item 5.5 NR-5)"
          >
            <span className={`w-2 h-2 rounded-full ${summary.quorumReached ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <span>Quórum: {summary.turnoutPercentage}% ({summary.totalVotesCast}/{summary.totalVoters})</span>
          </div>

          {/* Alternar Mudo / Som */}
          <button
            type="button"
            onClick={handleToggleSound}
            className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            title={muted ? 'Ativar Som da Urna' : 'Silenciar Som'}
          >
            {muted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4 text-emerald-500" />}
          </button>

          {/* Toggle Dark/Light Mode */}
          <button
            type="button"
            onClick={toggleDarkMode}
            className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            title={isDarkMode ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro (Uso Noturno)'}
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>

          {/* Perfil do Usuário e Login OAuth Corporativo */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center space-x-2 pl-2 pr-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer"
            >
              {currentUser.avatar ? (
                <img src={currentUser.avatar} alt="Avatar" className="w-6 h-6 rounded-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
                  {currentUser.name.charAt(0)}
                </div>
              )}
              <span className="hidden sm:inline max-w-[120px] truncate">{currentUser.name.split(' ')[0]}</span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 uppercase">
                {currentUser.role.replace('_', ' ')}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Dropdown Menu de Usuário */}
            <AnimatePresence>
              {isUserMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-2 text-xs z-50"
                >
                  <div className="p-3 border-b border-slate-100 dark:border-slate-800 space-y-1">
                    <div className="font-bold text-slate-900 dark:text-white">{currentUser.name}</div>
                    <div className="text-[11px] text-slate-500 truncate">{currentUser.email}</div>
                    <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
                      Autenticado via: {currentUser.provider?.toUpperCase() || 'CORPORATIVO'}
                    </div>
                  </div>

                  {/* Trocar Nível de Acesso Rápido para Simulação */}
                  <div className="p-2 space-y-1">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                      Alternar Perfil de Acesso:
                    </div>
                    {[
                      { role: 'PRESIDENTE_CIPA' as UserRole, label: 'Presidente da CIPA' },
                      { role: 'ADMIN' as UserRole, label: 'Administrador Geral' },
                      { role: 'MESARIO' as UserRole, label: 'Mesário de Urna' },
                      { role: 'AUDITOR_MTE' as UserRole, label: 'Auditor do MTE' },
                      { role: 'ELEITOR' as UserRole, label: 'Eleitor / Colaborador' },
                    ].map((item) => (
                      <button
                        key={item.role}
                        type="button"
                        onClick={() => handleSelectRole(item.role)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between ${
                          currentUser.role === item.role
                            ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <span>{item.label}</span>
                        {currentUser.role === item.role && <span className="text-blue-600">✓</span>}
                      </button>
                    ))}
                  </div>

                  <div className="p-1 border-t border-slate-100 dark:border-slate-800 space-y-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        setIsAuthModalOpen(true);
                      }}
                      className="w-full text-left px-2.5 py-2 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 font-semibold flex items-center space-x-2"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>Autenticação OAuth Corporativo</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleReset}
                      className="w-full text-left px-2.5 py-2 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 font-semibold flex items-center space-x-2"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reiniciar Pleito (Zerar Votos)</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Barra de Navegação por Abas */}
      <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center space-x-1 overflow-x-auto py-1 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                id={`nav-tab-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-1.5 px-3.5 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{item.label}</span>
                {item.badge && (
                  <span className={`px-1.5 py-0.2 rounded text-[9px] font-black ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-900 text-emerald-400'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Modal de Autenticação OAuth Corporativo */}
      <AnimatePresence>
        {isAuthModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
            >
              <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-5 h-5 text-blue-400" />
                  <h3 className="font-bold text-base">Autenticação OAuth Corporativo</h3>
                </div>
                <button type="button" onClick={() => setIsAuthModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
              </div>

              <div className="p-6 space-y-4">
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Faça login utilizando a conta corporativa da sua organização para garantir a trilha de auditoria e segurança dos dados conforme a NR-5.
                </p>

                <div className="space-y-2.5">
                  {/* Google Workspace */}
                  <button
                    type="button"
                    onClick={() => {
                      loginOAuth('google', 'PRESIDENTE_CIPA');
                      setIsAuthModalOpen(false);
                    }}
                    className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center space-x-3 transition-colors cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center shadow-xs text-sm font-bold text-rose-500">
                      G
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-bold text-slate-900 dark:text-white">Login com Google Workspace</div>
                      <div className="text-[10px] text-slate-500">franklin.batista@sesisc.org.br</div>
                    </div>
                  </button>

                  {/* Microsoft 365 */}
                  <button
                    type="button"
                    onClick={() => {
                      loginOAuth('microsoft', 'PRESIDENTE_CIPA');
                      setIsAuthModalOpen(false);
                    }}
                    className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center space-x-3 transition-colors cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs text-xs font-bold">
                      MS
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-bold text-slate-900 dark:text-white">Login com Microsoft 365 Enterprise</div>
                      <div className="text-[10px] text-slate-500">mariana.duarte@metalbrasil.com.br</div>
                    </div>
                  </button>

                  {/* Auditoria MTE SSO */}
                  <button
                    type="button"
                    onClick={() => {
                      loginOAuth('corp-sso', 'AUDITOR_MTE');
                      setIsAuthModalOpen(false);
                    }}
                    className="w-full p-3 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/30 hover:bg-emerald-100/60 flex items-center space-x-3 transition-colors cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-full bg-emerald-700 text-white flex items-center justify-center shadow-xs text-xs font-bold">
                      MTE
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-bold text-slate-900 dark:text-white">Perfil Auditoria Oficial MTE</div>
                      <div className="text-[10px] text-emerald-700 dark:text-emerald-300">auditoria.nr5@mte.gov.br</div>
                    </div>
                  </button>
                </div>

                <div className="pt-2 text-center text-[10px] text-slate-400">
                  Criptografia de ponta a ponta e conformidade com LGPD.
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </header>
  );
};

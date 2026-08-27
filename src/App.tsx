import React, { useState } from 'react';
import { ElectionProvider } from './context/ElectionContext';
import { Navbar } from './components/layout/Navbar';
import { VotingScreen } from './components/voting/VotingScreen';
import { ResultsDashboard } from './components/results/ResultsDashboard';
import { CandidateManager } from './components/candidates/CandidateManager';
import { CompanySettings } from './components/company/CompanySettings';
import { UrnasManager } from './components/urnas/UrnasManager';
import { VotersManager } from './components/voters/VotersManager';
import { AuditLogsViewer } from './components/audit/AuditLogsViewer';
import { ReportsHub } from './components/reports/ReportsHub';
import { ShieldCheck, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

function AppContent() {
  const [activeTab, setActiveTab] = useState<string>('voting');

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Top Navbar */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Conteúdo Principal com Transições Suaves */}
      <main className="flex-1 pb-16">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            {activeTab === 'voting' && <VotingScreen />}
            {activeTab === 'results' && <ResultsDashboard />}
            {activeTab === 'candidates' && <CandidateManager />}
            {activeTab === 'company' && <CompanySettings />}
            {activeTab === 'urnas' && <UrnasManager />}
            {activeTab === 'voters' && <VotersManager />}
            {activeTab === 'audit' && <AuditLogsViewer />}
            {activeTab === 'reports' && <ReportsHub />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Rodapé Institucional */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xs py-4 px-4 sm:px-6 text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Sistema Eleitoral CIPA • Em Conformidade com a NR-5 / Portaria MTE & LGPD
            </span>
          </div>
          <div className="text-[11px] text-slate-400">
            Sigilo incondicional do voto • Urna Eletrônica Auditável com Sinal Sonoro TSE
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ElectionProvider>
      <AppContent />
    </ElectionProvider>
  );
}

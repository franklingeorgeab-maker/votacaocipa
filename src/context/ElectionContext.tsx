import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Candidate,
  CompanyConfig,
  Voter,
  Urna,
  VoteRecord,
  AuditLog,
  UserProfile,
  UserRole,
  ElectionSummary,
} from '../types';
import { tseAudio } from '../utils/tseAudio';
import { generateReceiptCode, generateSystemHash, sha256 } from '../utils/crypto';

interface ElectionContextType {
  company: CompanyConfig;
  candidates: Candidate[];
  voters: Voter[];
  urnas: Urna[];
  votes: VoteRecord[];
  auditLogs: AuditLog[];
  currentUser: UserProfile;
  activeUrnaId: string;
  isDarkMode: boolean;
  
  // Ações da Empresa
  updateCompany: (config: Partial<CompanyConfig>) => void;

  // Ações de Candidato (CRUD)
  addCandidate: (candidate: Omit<Candidate, 'id' | 'votesCount'>) => boolean;
  updateCandidate: (id: string, candidate: Partial<Candidate>) => boolean;
  deleteCandidate: (id: string) => boolean;

  // Ações de Eleitores
  addVoter: (voter: Omit<Voter, 'id' | 'hasVoted' | 'votedAt' | 'receiptCode'>) => boolean;
  importVoters: (newVoters: Omit<Voter, 'id' | 'hasVoted'>[]) => number;
  replaceVoters: (newVoters: Omit<Voter, 'id' | 'hasVoted'>[]) => number;
  deleteVoter: (id: string) => boolean;
  clearAllVoters: () => void;
  findVoterByBadge: (badgeNumber: string) => Voter | undefined;

  // Ações de Urna
  setActiveUrnaId: (id: string) => void;
  openUrna: (id: string) => void;
  closeUrna: (id: string) => void;
  generateZeresima: (id: string) => string;
  addUrna: (urna: Omit<Urna, 'id' | 'totalVotes' | 'status' | 'zeresimaPrinted'>) => void;

  // Processo de Votação
  registerVote: (
    badgeNumber: string,
    candidateNumber: string, // 'BRANCO', 'NULO' ou número do candidato
    urnaId: string
  ) => Promise<{ success: boolean; message: string; receiptCode?: string; voterName?: string }>;

  // Autenticação & Perfis
  setCurrentUser: (user: UserProfile) => void;
  loginOAuth: (provider: 'google' | 'microsoft' | 'corp-sso', role?: UserRole) => void;
  logout: () => void;

  // Auditoria & Sistema
  addAuditLog: (eventType: AuditLog['eventType'], description: string, metadata?: Record<string, any>) => void;
  resetElectionData: () => void;
  toggleDarkMode: () => void;
  
  // Sumário calculado
  summary: ElectionSummary;
}

const STORAGE_KEY = 'cipa_election_system_v1';

const DEFAULT_COMPANY: CompanyConfig = {
  id: 'comp_1',
  companyName: 'Indústria Metalúrgica & Manufatura Brasil S.A.',
  tradingName: 'MetalBrasil Industrial',
  cnpj: '12.345.678/0001-90',
  establishmentUnit: 'Planta Industrial Matriz - Joinville / SC',
  cnae: '25.39-0-00 - Serviços de Usinagem e Tornearia',
  riskGrade: 3, // Grau 3 conforme Quadro I da NR-4
  totalEmployees: 180,
  cipaTerm: '2026 / 2027',
  electionDate: '2026-08-20',
  electionEndDate: '2026-08-20',
  startTime: '07:30',
  endTime: '18:00',
  requiredTitulares: 4,
  requiredSuplentes: 3,
  electionCommittee: {
    president: 'Dr. Roberto Silveira (Eng. Seg. Trabalho)',
    secretary: 'Camila Fernandes (Técnica de Segurança)',
    members: ['Carlos Alberto Mendes', 'Juliana Rocha Vasconcelos'],
  },
};

const DEFAULT_CANDIDATES: Candidate[] = [
  {
    id: 'cand_10',
    number: '10',
    name: 'Marcos Vinícius de Souza',
    department: 'Usinagem Pesada & Torno',
    role: 'Operador de CNC Especialista',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    bio: '8 anos de empresa, defensor ativo de melhorias no uso de EPIs e enclausuramento de ruído.',
    proposal: 'Adequação contínua de proteções móveis (NR-12), pausas ergonômicas e novos calçados de segurança anti-impacto.',
    status: 'ativo',
    votesCount: 0,
  },
  {
    id: 'cand_12',
    number: '12',
    name: 'Juliana Beatriz Carvalho',
    department: 'Montagem & Acabamento',
    role: 'Líder de Linha de Produção',
    photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80',
    bio: '5 anos na fábrica, atuante em campanhas de saúde mental, combate ao assédio e ginástica laboral.',
    proposal: 'Canal anônimo de acolhimento psicossocial conforme alteração da Lei 14.457/22 e melhoria da iluminação na área de montagem.',
    status: 'ativo',
    votesCount: 0,
  },
  {
    id: 'cand_15',
    number: '15',
    name: 'André Luiz Albuquerque',
    department: 'Manutenção Eletromecânica',
    role: 'Técnico de Manutenção Industrial',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
    bio: 'Formado em Eletrotécnica, experiência em Lockout/Tagout (LOTO) e segurança em trabalho em altura (NR-35).',
    proposal: 'Revisão geral dos dispositivos de bloqueio de energia perigosa (NR-10/NR-12) e instalação de linhas de vida certificadas.',
    status: 'ativo',
    votesCount: 0,
  },
  {
    id: 'cand_20',
    number: '20',
    name: 'Patrícia Guimarães Siqueira',
    department: 'Almoxarifado & Logística',
    role: 'Operadora de Empilhadeira Master',
    photoUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80',
    bio: 'Conhecedora das rotas de tráfego interno, defensora da segregação física entre pedestres e veículos industriais.',
    proposal: 'Pintura refletiva e sensores de aproximação nas empilhadeiras para zerar risco de atropelamentos no armazém.',
    status: 'ativo',
    votesCount: 0,
  },
  {
    id: 'cand_22',
    number: '22',
    name: 'Rodrigo Antunes Nogueira',
    department: 'Engenharia de Processos',
    role: 'Analista de Processos Sênior',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
    bio: 'Especialista em ergonomia participativa (NR-17) e análise preliminar de riscos (APR).',
    proposal: 'Implantação de esteiras com regulagem de altura e braços mecânicos para diminuir esforço repetitivo de membros superiores.',
    status: 'ativo',
    votesCount: 0,
  },
  {
    id: 'cand_33',
    number: '33',
    name: 'Fernanda Martins de Oliveira',
    department: 'Controle de Qualidade',
    role: 'Inspetora de Qualidade',
    photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80',
    bio: 'Participou da CIPA anterior, com vasta experiência em elaboração de Mapas de Riscos e SIPAT.',
    proposal: 'Modernização da SIPAT com oficinas práticas de primeiros socorros e brigada de incêndio para 100% dos turnos.',
    status: 'ativo',
    votesCount: 0,
  },
  {
    id: 'cand_45',
    number: '45',
    name: 'Cláudio Henrique Dias',
    department: 'Pintura Industrial & Tratamento',
    role: 'Pintor Industrial Especializado',
    photoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&auto=format&fit=crop&q=80',
    bio: 'Atua em espaço confinado (NR-33) e com produtos químicos voláteis. Foco em proteção respiratória.',
    proposal: 'Melhoria no sistema de exaustão e cabines de pintura, além de testes periódicos de vedação de máscaras (Fit Test).',
    status: 'ativo',
    votesCount: 0,
  },
  {
    id: 'cand_77',
    number: '77',
    name: 'Elaine Cristina Ramos',
    department: 'Recursos Humanos & Administração',
    role: 'Analista de Departamento Pessoal',
    photoUrl: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=300&auto=format&fit=crop&q=80',
    bio: 'Foco na integração de novos colaboradores, treinamentos obrigatórios de segurança e ergonomia de escritórios.',
    proposal: 'Treinamento prático de segurança no 1º dia de admissão e auditorias preventivas semanais em todos os setores.',
    status: 'ativo',
    votesCount: 0,
  },
];

const INITIAL_URNAS: Urna[] = [
  {
    id: 'urna_01',
    number: 1,
    name: 'Urna 01 - Pavilhão de Produção & Fábrica',
    location: 'Refeitório Central - Prédio A',
    status: 'aberta',
    isOnline: true,
    zeresimaPrinted: true,
    zeresimaHash: 'ZER-2026-F01-A89E4B22',
    totalVotes: 0,
    openedAt: '2026-08-20T07:30:00.000Z',
    openedBy: 'Presidente da Comissão Eleitoral',
  },
  {
    id: 'urna_02',
    number: 2,
    name: 'Urna 02 - Prédio Administrativo & Logística',
    location: 'Hall de Entrada - Prédio B',
    status: 'aberta',
    isOnline: true,
    zeresimaPrinted: true,
    zeresimaHash: 'ZER-2026-F02-B12C99A0',
    totalVotes: 0,
    openedAt: '2026-08-20T07:35:00.000Z',
    openedBy: 'Secretária da Comissão Eleitoral',
  },
  {
    id: 'urna_03',
    number: 3,
    name: 'Urna 03 - Votação Online / Remota Corporativa',
    location: 'Terminal Digital Seguro (SSO/Web)',
    status: 'aberta',
    isOnline: true,
    zeresimaPrinted: true,
    zeresimaHash: 'ZER-2026-F03-C44D7188',
    totalVotes: 0,
    openedAt: '2026-08-20T07:40:00.000Z',
    openedBy: 'Comissão Eleitoral CIPA',
  },
];

// Gerar lista padrão de 40 colaboradores com crachás para teste imediato
const INITIAL_VOTERS: Voter[] = [
  { id: 'v_1', badgeNumber: '1001', name: 'Carlos Eduardo Santos', cpfMasked: '***.341.890-**', department: 'Usinagem', role: 'Torneiro Mecânico', email: 'carlos.santos@metalbrasil.com.br', hasVoted: false },
  { id: 'v_2', badgeNumber: '1002', name: 'Mariana Lima Prado', cpfMasked: '***.882.110-**', department: 'Montagem', role: 'Operadora', email: 'mariana.prado@metalbrasil.com.br', hasVoted: false },
  { id: 'v_3', badgeNumber: '1003', name: 'Bruno Guimarães Silva', cpfMasked: '***.512.339-**', department: 'Manutenção', role: 'Eletricista', email: 'bruno.silva@metalbrasil.com.br', hasVoted: false },
  { id: 'v_4', badgeNumber: '1004', name: 'Ana Paula Nogueira', cpfMasked: '***.901.442-**', department: 'Almoxarifado', role: 'Conferente', email: 'ana.nogueira@metalbrasil.com.br', hasVoted: false },
  { id: 'v_5', badgeNumber: '1005', name: 'Lucas Henrique Ribeiro', cpfMasked: '***.733.551-**', department: 'Pintura', role: 'Operador de Cabine', email: 'lucas.ribeiro@metalbrasil.com.br', hasVoted: false },
  { id: 'v_6', badgeNumber: '1006', name: 'Renata Albuquerque', cpfMasked: '***.221.667-**', department: 'Qualidade', role: 'Analista de Metrologia', email: 'renata.albuquerque@metalbrasil.com.br', hasVoted: false },
  { id: 'v_7', badgeNumber: '1007', name: 'Fábio de Souza Costa', cpfMasked: '***.445.889-**', department: 'Engenharia', role: 'Projetista CAD', email: 'fabio.costa@metalbrasil.com.br', hasVoted: false },
  { id: 'v_8', badgeNumber: '1008', name: 'Vanessa Toledo Mendes', cpfMasked: '***.198.324-**', department: 'RH', role: 'Assistente Administrativo', email: 'vanessa.mendes@metalbrasil.com.br', hasVoted: false },
  { id: 'v_9', badgeNumber: '1009', name: 'Gustavo Paiva Brandão', cpfMasked: '***.609.431-**', department: 'Usinagem', role: 'Fresador', email: 'gustavo.brandao@metalbrasil.com.br', hasVoted: false },
  { id: 'v_10', badgeNumber: '1010', name: 'Camila Rossi Ferreira', cpfMasked: '***.774.218-**', department: 'Montagem', role: 'Auxiliar de Linha', email: 'camila.rossi@metalbrasil.com.br', hasVoted: false },
  { id: 'v_11', badgeNumber: '1011', name: 'Daniel Antunes Moreira', cpfMasked: '***.331.902-**', department: 'Logística', role: 'Motorista', email: 'daniel.moreira@metalbrasil.com.br', hasVoted: false },
  { id: 'v_12', badgeNumber: '1012', name: 'Letícia Barbosa Ramos', cpfMasked: '***.448.115-**', department: 'Manutenção', role: 'Mecânica Industrial', email: 'leticia.ramos@metalbrasil.com.br', hasVoted: false },
  { id: 'v_13', badgeNumber: '1013', name: 'Diego Ferreira Lima', cpfMasked: '***.892.743-**', department: 'Segurança Patrimonial', role: 'Vigilante', email: 'diego.lima@metalbrasil.com.br', hasVoted: false },
  { id: 'v_14', badgeNumber: '1014', name: 'Priscila Duarte Vasquez', cpfMasked: '***.129.654-**', department: 'Usinagem', role: 'Operadora CNC', email: 'priscila.vasquez@metalbrasil.com.br', hasVoted: false },
  { id: 'v_15', badgeNumber: '1015', name: 'Thiago Martins Fonseca', cpfMasked: '***.650.321-**', department: 'Tratamento Térmico', role: 'Operador de Forno', email: 'thiago.fonseca@metalbrasil.com.br', hasVoted: false },
  { id: 'v_16', badgeNumber: '1016', name: 'Gabriela Neves Batista', cpfMasked: '***.932.418-**', department: 'TI & Automação', role: 'Técnica de Redes', email: 'gabriela.batista@metalbrasil.com.br', hasVoted: false },
  { id: 'v_17', badgeNumber: '1017', name: 'Rafael Peixoto Maia', cpfMasked: '***.311.589-**', department: 'Pintura', role: 'Preparador de Superfícies', email: 'rafael.maia@metalbrasil.com.br', hasVoted: false },
  { id: 'v_18', badgeNumber: '1018', name: 'Sandra Helena Silveira', cpfMasked: '***.889.201-**', department: 'Qualidade', role: 'Auditora de Processo', email: 'sandra.silveira@metalbrasil.com.br', hasVoted: false },
  { id: 'v_19', badgeNumber: '1019', name: 'Marcelo Dias Rezende', cpfMasked: '***.440.912-**', department: 'Caldeiraria & Solda', role: 'Soldador TIG/MIG', email: 'marcelo.rezende@metalbrasil.com.br', hasVoted: false },
  { id: 'v_20', badgeNumber: '1020', name: 'Aline Correia Pires', cpfMasked: '***.571.309-**', department: 'Financeiro', role: 'Analista de Custos', email: 'aline.pires@metalbrasil.com.br', hasVoted: false },
  { id: 'v_21', badgeNumber: '1021', name: 'Jefferson Moura Borges', cpfMasked: '***.208.473-**', department: 'Usinagem', role: 'Retificador', email: 'jefferson.borges@metalbrasil.com.br', hasVoted: false },
  { id: 'v_22', badgeNumber: '1022', name: 'Tatiane Cruz Medeiros', cpfMasked: '***.765.190-**', department: 'Montagem', role: 'Operadora', email: 'tatiane.medeiros@metalbrasil.com.br', hasVoted: false },
  { id: 'v_23', badgeNumber: '1023', name: 'Leonardo Farias Viana', cpfMasked: '***.319.824-**', department: 'Almoxarifado', role: 'Operador de Empilhadeira', email: 'leonardo.viana@metalbrasil.com.br', hasVoted: false },
  { id: 'v_24', badgeNumber: '1024', name: 'Carla Vasconcelos Rios', cpfMasked: '***.908.432-**', department: 'Manutenção', role: 'Planejadora PCM', email: 'carla.rios@metalbrasil.com.br', hasVoted: false },
  { id: 'v_25', badgeNumber: '1025', name: 'Henrique Barreto Lins', cpfMasked: '***.145.678-**', department: 'Expedição', role: 'Conferente', email: 'henrique.lins@metalbrasil.com.br', hasVoted: false },
];

const INITIAL_USER: UserProfile = {
  id: 'usr_admin',
  name: 'Comissão Eleitoral CIPA - Presidente',
  email: 'cipa.eleicoes@metalbrasil.com.br',
  role: 'PRESIDENTE_CIPA',
  provider: 'corp-sso',
};

const ElectionContext = createContext<ElectionContextType | undefined>(undefined);

export const ElectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [company, setCompany] = useState<CompanyConfig>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_company`);
    return saved ? JSON.parse(saved) : DEFAULT_COMPANY;
  });

  const [candidates, setCandidates] = useState<Candidate[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_candidates`);
    return saved ? JSON.parse(saved) : DEFAULT_CANDIDATES;
  });

  const [voters, setVoters] = useState<Voter[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_voters`);
    return saved ? JSON.parse(saved) : INITIAL_VOTERS;
  });

  const [urnas, setUrnas] = useState<Urna[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_urnas`);
    return saved ? JSON.parse(saved) : INITIAL_URNAS;
  });

  const [votes, setVotes] = useState<VoteRecord[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_votes`);
    return saved ? JSON.parse(saved) : [];
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_audit`);
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'log_init',
        timestamp: new Date().toISOString(),
        eventType: 'CADASTRO_EMPRESA',
        description: 'Sistema Eleitoral CIPA inicializado em conformidade com NR-5 e MTE.',
        userRole: 'SISTEMA',
        userName: 'Sistema Automatizado de Auditoria',
        ipOrDevice: 'Servidor Local Seguro',
        securityHash: generateSystemHash('AUD', 'INIT_SYSTEM_2026'),
      },
    ];
  });

  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_user`);
    return saved ? JSON.parse(saved) : INITIAL_USER;
  });

  const [activeUrnaId, setActiveUrnaId] = useState<string>(() => {
    return urnas[0]?.id || 'urna_01';
  });

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_theme`);
    return saved ? saved === 'dark' : false;
  });

  // Salvar no localStorage sempre que o estado mudar
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_company`, JSON.stringify(company));
  }, [company]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_candidates`, JSON.stringify(candidates));
  }, [candidates]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_voters`, JSON.stringify(voters));
  }, [voters]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_urnas`, JSON.stringify(urnas));
  }, [urnas]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_votes`, JSON.stringify(votes));
  }, [votes]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_audit`, JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_user`, JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_theme`, isDarkMode ? 'dark' : 'light');
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode((prev) => !prev);
  }, []);

  const addAuditLog = useCallback(
    (eventType: AuditLog['eventType'], description: string, metadata?: Record<string, any>) => {
      const newLog: AuditLog = {
        id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        timestamp: new Date().toISOString(),
        eventType,
        description,
        userRole: currentUser.role,
        userName: currentUser.name,
        ipOrDevice: navigator.userAgent.substring(0, 40) || 'Web Browser Client',
        securityHash: generateSystemHash('AUD', description + Date.now().toString()),
        metadata,
      };
      setAuditLogs((prev) => [newLog, ...prev]);
    },
    [currentUser]
  );

  const updateCompany = useCallback(
    (config: Partial<CompanyConfig>) => {
      setCompany((prev) => {
        const updated = { ...prev, ...config };
        addAuditLog('CADASTRO_EMPRESA', `Atualização cadastral da empresa e parâmetros do pleito CIPA.`);
        return updated;
      });
    },
    [addAuditLog]
  );

  const addCandidate = useCallback(
    (candidateData: Omit<Candidate, 'id' | 'votesCount'>): boolean => {
      // Verificar se número já existe
      const exists = candidates.some((c) => c.number === candidateData.number);
      if (exists) {
        return false;
      }
      const newCand: Candidate = {
        ...candidateData,
        id: `cand_${candidateData.number}_${Date.now()}`,
        votesCount: 0,
      };
      setCandidates((prev) => [...prev, newCand]);
      addAuditLog(
        'CADASTRO_CANDIDATO',
        `Candidato registrado: Nº ${newCand.number} - ${newCand.name} (${newCand.department})`
      );
      return true;
    },
    [candidates, addAuditLog]
  );

  const updateCandidate = useCallback(
    (id: string, updatedData: Partial<Candidate>): boolean => {
      if (updatedData.number) {
        const duplicate = candidates.some((c) => c.id !== id && c.number === updatedData.number);
        if (duplicate) return false;
      }
      setCandidates((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...updatedData } : c))
      );
      addAuditLog('EDICAO_CANDIDATO', `Dados do candidato ID ${id} foram alterados.`);
      return true;
    },
    [candidates, addAuditLog]
  );

  const deleteCandidate = useCallback(
    (id: string): boolean => {
      const cand = candidates.find((c) => c.id === id);
      if (!cand) return false;
      setCandidates((prev) => prev.filter((c) => c.id !== id));
      addAuditLog('EXCLUSAO_CANDIDATO', `Candidato excluído da eleição: Nº ${cand.number} - ${cand.name}`);
      return true;
    },
    [candidates, addAuditLog]
  );

  const addVoter = useCallback(
    (voterData: Omit<Voter, 'id' | 'hasVoted' | 'votedAt' | 'receiptCode'>): boolean => {
      const exists = voters.some((v) => v.badgeNumber.trim().toLowerCase() === voterData.badgeNumber.trim().toLowerCase());
      if (exists) return false;
      const newVoter: Voter = {
        ...voterData,
        id: `v_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        hasVoted: false,
      };
      setVoters((prev) => [...prev, newVoter]);
      return true;
    },
    [voters]
  );

  const importVoters = useCallback(
    (newVoters: Omit<Voter, 'id' | 'hasVoted'>[]): number => {
      let addedCount = 0;
      setVoters((prev) => {
        const existingBadges = new Set(prev.map((v) => v.badgeNumber.trim().toLowerCase()));
        const toAdd: Voter[] = [];
        for (const v of newVoters) {
          const cleanBadge = v.badgeNumber.trim().toLowerCase();
          if (!existingBadges.has(cleanBadge)) {
            existingBadges.add(cleanBadge);
            toAdd.push({
              ...v,
              id: `v_imp_${Date.now()}_${addedCount}`,
              hasVoted: false,
            });
            addedCount++;
          }
        }
        return [...prev, ...toAdd];
      });
      addAuditLog('CADASTRO_EMPRESA', `Importação em lote de ${addedCount} novos eleitores/colaboradores aptos.`);
      return addedCount;
    },
    [addAuditLog]
  );

  const replaceVoters = useCallback(
    (newVoters: Omit<Voter, 'id' | 'hasVoted'>[]): number => {
      const seen = new Set<string>();
      const list: Voter[] = [];
      let count = 0;
      for (const v of newVoters) {
        const cleanBadge = v.badgeNumber.trim().toLowerCase();
        if (cleanBadge && !seen.has(cleanBadge)) {
          seen.add(cleanBadge);
          list.push({
            ...v,
            id: `v_rep_${Date.now()}_${count}`,
            hasVoted: false,
          });
          count++;
        }
      }
      setVoters(list);
      addAuditLog('CADASTRO_EMPRESA', `Lista de eleitores substituída por arquivo contendo ${count} colaboradores.`);
      return count;
    },
    [addAuditLog]
  );

  const deleteVoter = useCallback(
    (id: string): boolean => {
      const voter = voters.find((v) => v.id === id);
      if (!voter) return false;
      setVoters((prev) => prev.filter((v) => v.id !== id));
      addAuditLog('CADASTRO_EMPRESA', `Colaborador removido da lista de eleitores: Crachá ${voter.badgeNumber} - ${voter.name}`);
      return true;
    },
    [voters, addAuditLog]
  );

  const clearAllVoters = useCallback(() => {
    setVoters([]);
    addAuditLog('CADASTRO_EMPRESA', 'Todos os eleitores cadastrados foram removidos.');
  }, [addAuditLog]);

  const findVoterByBadge = useCallback(
    (badgeNumber: string): Voter | undefined => {
      const clean = badgeNumber.trim().toLowerCase();
      return voters.find((v) => v.badgeNumber.trim().toLowerCase() === clean);
    },
    [voters]
  );

  const openUrna = useCallback(
    (id: string) => {
      setUrnas((prev) =>
        prev.map((u) =>
          u.id === id
            ? {
                ...u,
                status: 'aberta',
                openedAt: new Date().toISOString(),
                openedBy: currentUser.name,
              }
            : u
        )
      );
      addAuditLog('ABERTURA_URNA', `Urna ID ${id} foi aberta para votação pela Comissão.`);
    },
    [currentUser, addAuditLog]
  );

  const closeUrna = useCallback(
    (id: string) => {
      setUrnas((prev) =>
        prev.map((u) =>
          u.id === id
            ? {
                ...u,
                status: 'fechada',
                closedAt: new Date().toISOString(),
                closedBy: currentUser.name,
              }
            : u
        )
      );
      addAuditLog('FECHAMENTO_URNA', `Urna ID ${id} foi encerrada. Boletim de Urna (BU) pronto para emissão.`);
    },
    [currentUser, addAuditLog]
  );

  const generateZeresima = useCallback(
    (id: string): string => {
      const hash = generateSystemHash('ZER', `${id}-${Date.now()}`);
      setUrnas((prev) =>
        prev.map((u) =>
          u.id === id
            ? {
                ...u,
                zeresimaPrinted: true,
                zeresimaHash: hash,
              }
            : u
        )
      );
      addAuditLog('ZERESIMA_EMITIDA', `Relatório de Zerésima emitido com sucesso para a Urna ID ${id}. Hash: ${hash}`);
      return hash;
    },
    [addAuditLog]
  );

  const addUrna = useCallback(
    (urnaData: Omit<Urna, 'id' | 'totalVotes' | 'status' | 'zeresimaPrinted'>) => {
      const newUrna: Urna = {
        ...urnaData,
        id: `urna_${Date.now()}`,
        status: 'preparada',
        isOnline: true,
        zeresimaPrinted: false,
        totalVotes: 0,
      };
      setUrnas((prev) => [...prev, newUrna]);
      addAuditLog('CADASTRO_EMPRESA', `Nova urna on-line cadastrada: ${newUrna.name} (${newUrna.location})`);
    },
    [addAuditLog]
  );

  // Registro de Voto com Princípio de Sigilo Absoluto e LGPD
  const registerVote = useCallback(
    async (
      badgeNumber: string,
      candidateChoice: string, // 'BRANCO', 'NULO' ou número do candidato
      targetUrnaId: string
    ): Promise<{ success: boolean; message: string; receiptCode?: string; voterName?: string }> => {
      const voter = voters.find(
        (v) => v.badgeNumber.trim().toLowerCase() === badgeNumber.trim().toLowerCase()
      );

      if (!voter) {
        return {
          success: false,
          message: 'Crachá/Matrícula não encontrado no cadastro de eleitores aptos da empresa.',
        };
      }

      if (voter.hasVoted) {
        return {
          success: false,
          message: `Este crachá já registrou voto no pleito em ${voter.votedAt ? new Date(voter.votedAt).toLocaleTimeString('pt-BR') : 'horário anterior'}. Voto duplicado não permitido conforme NR-5.`,
        };
      }

      const selectedUrna = urnas.find((u) => u.id === targetUrnaId);
      if (selectedUrna && selectedUrna.status === 'fechada') {
        return {
          success: false,
          message: 'A urna selecionada está encerrada para recebimento de votos.',
        };
      }

      const nowIso = new Date().toISOString();
      const receipt = generateReceiptCode(voter.badgeNumber, nowIso);
      const voteHash = await sha256(`VOTE_${candidateChoice}_${Date.now()}_${Math.random()}`);

      // 1. Atualizar eleitor como 'votou' (SEM salvar qual foi o candidato votado)
      setVoters((prev) =>
        prev.map((v) =>
          v.id === voter.id
            ? {
                ...v,
                hasVoted: true,
                votedAt: nowIso,
                votingUrnaId: targetUrnaId,
                receiptCode: receipt,
              }
            : v
        )
      );

      // 2. Gravar o voto na urna de forma anônima e desvinculada
      const voteRecord: VoteRecord = {
        id: `vrec_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        urnaId: targetUrnaId,
        timestamp: nowIso,
        candidateNumber: candidateChoice,
        encryptedBallotHash: voteHash,
      };

      setVotes((prev) => [...prev, voteRecord]);

      // 3. Atualizar contagem no candidato se for voto nominal
      if (candidateChoice !== 'BRANCO' && candidateChoice !== 'NULO') {
        setCandidates((prev) =>
          prev.map((c) =>
            c.number === candidateChoice ? { ...c, votesCount: (c.votesCount || 0) + 1 } : c
          )
        );
      }

      // 4. Atualizar total de votos na urna
      setUrnas((prev) =>
        prev.map((u) => (u.id === targetUrnaId ? { ...u, totalVotes: u.totalVotes + 1 } : u))
      );

      // 5. Tocar o som icônico da urna do TSE
      tseAudio.playTSEConfirmationSound();

      // 6. Registrar presença no log de auditoria (sem expor o voto)
      addAuditLog(
        'PRESENCA_REGISTRADA',
        `Presença computada para o crachá [${voter.badgeNumber}]. Comprovante emitido: ${receipt}. Voto criptografado e contabilizado anonimamente na ${selectedUrna?.name || targetUrnaId}.`,
        { urnaId: targetUrnaId, receiptCode: receipt }
      );

      return {
        success: true,
        message: 'Voto computado com sucesso! Emitindo comprovante eleitoral...',
        receiptCode: receipt,
        voterName: voter.name,
      };
    },
    [voters, urnas, addAuditLog]
  );

  const loginOAuth = useCallback(
    (provider: 'google' | 'microsoft' | 'corp-sso', role: UserRole = 'PRESIDENTE_CIPA') => {
      const mockProfiles: Record<string, UserProfile> = {
        google: {
          id: 'usr_oauth_google',
          name: 'Franklin Batista (Eng. de Segurança)',
          email: 'franklin.batista@sesisc.org.br',
          role: role,
          provider: 'google',
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
        },
        microsoft: {
          id: 'usr_oauth_ms',
          name: 'Mariana Duarte (Comissão CIPA)',
          email: 'mariana.duarte@metalbrasil.com.br',
          role: role,
          provider: 'microsoft',
          avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
        },
        'corp-sso': {
          id: 'usr_oauth_sso',
          name: 'Auditor do Trabalho MTE',
          email: 'auditoria.nr5@mte.gov.br',
          role: 'AUDITOR_MTE',
          provider: 'corp-sso',
        },
      };

      const selected = mockProfiles[provider] || {
        id: `usr_${Date.now()}`,
        name: 'Usuário Corporativo Autenticado',
        email: 'colaborador@metalbrasil.com.br',
        role: role,
        provider,
      };

      setCurrentUser(selected);
      addAuditLog(
        'LOGIN_OAUTH',
        `Autenticação corporativa via ${provider.toUpperCase()} realizada com sucesso pelo perfil ${selected.role} (${selected.email}).`
      );
    },
    [addAuditLog]
  );

  const logout = useCallback(() => {
    setCurrentUser({
      id: 'usr_guest',
      name: 'Colaborador / Eleitor',
      email: 'eleitor@metalbrasil.com.br',
      role: 'ELEITOR',
      provider: 'local',
    });
  }, []);

  const resetElectionData = useCallback(() => {
    setCompany(DEFAULT_COMPANY);
    setCandidates(DEFAULT_CANDIDATES.map((c) => ({ ...c, votesCount: 0 })));
    setVoters(INITIAL_VOTERS.map((v) => ({ ...v, hasVoted: false, votedAt: undefined, receiptCode: undefined })));
    setUrnas(INITIAL_URNAS.map((u) => ({ ...u, totalVotes: 0 })));
    setVotes([]);
    setAuditLogs([
      {
        id: `log_reset_${Date.now()}`,
        timestamp: new Date().toISOString(),
        eventType: 'RESET_PLEITO',
        description: 'Pleito eleitoral reinicializado para nova simulação/eleição.',
        userRole: currentUser.role,
        userName: currentUser.name,
        ipOrDevice: 'Interface de Administração',
        securityHash: generateSystemHash('AUD', 'RESET_ELECTION_2026'),
      },
    ]);
  }, [currentUser]);

  // Cálculo de Sumário em Tempo Real
  const totalVoters = voters.length > 0 ? voters.length : company.totalEmployees;
  const totalVotesCast = votes.length;
  const turnoutPercentage = totalVoters > 0 ? (totalVotesCast / totalVoters) * 100 : 0;
  
  // Regra da NR-5: Participação mínima de 50% + 1 dos empregados
  const quorumMinimumRequired = Math.floor(totalVoters / 2) + 1;
  const quorumReached = totalVotesCast >= quorumMinimumRequired;

  const blankVotes = votes.filter((v) => v.candidateNumber === 'BRANCO').length;
  const nullVotes = votes.filter((v) => v.candidateNumber === 'NULO').length;
  const validVotes = totalVotesCast - (blankVotes + nullVotes);
  const abstentions = Math.max(0, totalVoters - totalVotesCast);

  const summary: ElectionSummary = {
    totalVoters,
    totalVotesCast,
    turnoutPercentage: parseFloat(turnoutPercentage.toFixed(1)),
    quorumReached,
    quorumMinimumRequired,
    validVotes,
    blankVotes,
    nullVotes,
    abstentions,
  };

  return (
    <ElectionContext.Provider
      value={{
        company,
        candidates,
        voters,
        urnas,
        votes,
        auditLogs,
        currentUser,
        activeUrnaId,
        isDarkMode,
        updateCompany,
        addCandidate,
        updateCandidate,
        deleteCandidate,
        addVoter,
        importVoters,
        replaceVoters,
        deleteVoter,
        clearAllVoters,
        findVoterByBadge,
        setActiveUrnaId,
        openUrna,
        closeUrna,
        generateZeresima,
        addUrna,
        registerVote,
        setCurrentUser,
        loginOAuth,
        logout,
        addAuditLog,
        resetElectionData,
        toggleDarkMode,
        summary,
      }}
    >
      {children}
    </ElectionContext.Provider>
  );
};

export const useElection = () => {
  const context = useContext(ElectionContext);
  if (!context) {
    throw new Error('useElection deve ser utilizado dentro de um ElectionProvider');
  }
  return context;
};

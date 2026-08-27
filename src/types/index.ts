export type CandidateStatus = 'ativo' | 'inativo';

export interface Candidate {
  id: string;
  number: string; // 2 dígitos (ex: "10", "12", "25")
  name: string;
  department: string;
  role: string;
  photoUrl: string;
  bio?: string;
  proposal?: string;
  status: CandidateStatus;
  companyId?: string;
  votesCount: number;
}

export interface CompanyConfig {
  id: string;
  companyName: string;
  tradingName: string; // Nome Fantasia
  cnpj: string;
  establishmentUnit: string;
  cnae: string;
  riskGrade: number; // Grau de Risco (1 a 4)
  totalEmployees: number;
  cipaTerm: string; // ex: "2026/2027"
  electionDate: string; // YYYY-MM-DD
  electionEndDate?: string;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  requiredTitulares: number;
  requiredSuplentes: number;
  electionCommittee: {
    president: string;
    secretary: string;
    members: string[];
  };
}

export interface Voter {
  id: string;
  badgeNumber: string; // Número do crachá / matrícula
  name: string;
  cpfMasked: string; // Ex: ***.456.789-**
  department: string;
  role: string;
  email: string;
  hasVoted: boolean;
  votedAt?: string;
  votingUrnaId?: string;
  receiptCode?: string; // Código de autenticidade emitido
}

export type UrnaStatus = 'preparada' | 'aberta' | 'fechada';

export interface Urna {
  id: string;
  number: number;
  name: string;
  location: string;
  status: UrnaStatus;
  isOnline: boolean;
  zeresimaPrinted: boolean;
  zeresimaHash?: string;
  totalVotes: number;
  openedAt?: string;
  closedAt?: string;
  openedBy?: string;
  closedBy?: string;
}

export interface VoteRecord {
  id: string;
  urnaId: string;
  timestamp: string;
  candidateNumber: string; // 'BRANCO' | 'NULO' | '10' etc.
  encryptedBallotHash: string; // Hash SHA-256 independente
  // Sigilo absoluto do voto: NÃO há campo de eleitor aqui
}

export type EventLogType =
  | 'CADASTRO_EMPRESA'
  | 'CADASTRO_CANDIDATO'
  | 'EDICAO_CANDIDATO'
  | 'EXCLUSAO_CANDIDATO'
  | 'ZERESIMA_EMITIDA'
  | 'ABERTURA_URNA'
  | 'FECHAMENTO_URNA'
  | 'VOTO_COMPUTADO'
  | 'PRESENCA_REGISTRADA'
  | 'EXPORTACAO_RELATORIO'
  | 'LOGIN_OAUTH'
  | 'RESET_PLEITO'
  | 'AUDITORIA_INTEGRIDADE';

export interface AuditLog {
  id: string;
  timestamp: string;
  eventType: EventLogType;
  description: string;
  userRole: string;
  userName: string;
  ipOrDevice: string;
  securityHash: string;
  metadata?: Record<string, any>;
}

export type UserRole = 'ADMIN' | 'PRESIDENTE_CIPA' | 'MESARIO' | 'ELEITOR' | 'AUDITOR_MTE';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  badgeNumber?: string;
  avatar?: string;
  department?: string;
  provider?: 'google' | 'microsoft' | 'corp-sso' | 'local';
}

export interface ElectionSummary {
  totalVoters: number;
  totalVotesCast: number;
  turnoutPercentage: number;
  quorumReached: boolean;
  quorumMinimumRequired: number; // 50% + 1
  validVotes: number;
  blankVotes: number;
  nullVotes: number;
  abstentions: number;
}

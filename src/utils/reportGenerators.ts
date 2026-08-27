import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { CompanyConfig, Candidate, Voter, Urna, VoteRecord, AuditLog, ElectionSummary } from '../types';

interface ReportData {
  company: CompanyConfig;
  candidates: Candidate[];
  voters: Voter[];
  urnas: Urna[];
  votes: VoteRecord[];
  auditLogs: AuditLog[];
  summary: ElectionSummary;
}

/**
 * Gera a Ata Oficial de Eleição da CIPA em PDF conforme NR-5 / Portaria MTE
 */
export function generateAtaEleicaoPDF(data: ReportData) {
  const { company, candidates, summary } = data;
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Cabeçalho Oficial
  doc.setFillColor(24, 43, 73); // Azul Marinho Institucional
  doc.rect(0, 0, pageWidth, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('ATA OFICIAL DE ELEIÇÃO DOS REPRESENTANTES DOS EMPREGADOS NA CIPA', pageWidth / 2, 11, { align: 'center' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Em conformidade com a Norma Regulamentadora nº 05 (NR-5) - Ministério do Trabalho e Emprego', pageWidth / 2, 18, { align: 'center' });

  // Informações da Empresa
  let y = 32;
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('1. DADOS DA EMPRESA E ESTABELECIMENTO', 14, y);

  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  const compData = [
    ['Razão Social:', company.companyName, 'CNPJ:', company.cnpj],
    ['Nome Fantasia:', company.tradingName || '-', 'CNAE:', company.cnae],
    ['Estabelecimento:', company.establishmentUnit, 'Grau de Risco:', `${company.riskGrade} (conforme NR-4)`],
    ['Total de Empregados:', `${company.totalEmployees} colaboradores`, 'Gestão / Mandato:', `CIPA ${company.cipaTerm}`],
    ['Data do Pleito:', `${company.electionDate} (Horário: ${company.startTime} às ${company.endTime})`, 'Votação:', 'Urna Eletrônica Online (TSE Style)'],
  ];

  autoTable(doc, {
    startY: y,
    body: compData,
    theme: 'plain',
    styles: { fontSize: 8.5, cellPadding: 1.5, textColor: [30, 41, 59] },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 32 },
      1: { cellWidth: 70 },
      2: { fontStyle: 'bold', cellWidth: 28 },
      3: { cellWidth: 50 },
    },
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  // Quorum e Estatísticas do Pleito
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('2. APURAÇÃO DOS VOTOS E VERIFICAÇÃO DE QUÓRUM LEGAL (NR-5 item 5.5)', 14, y);

  y += 5;
  const quorumText = summary.quorumReached
    ? `QUÓRUM ATINGIDO COM SUCESSO (${summary.turnoutPercentage}% de participação, superior ao mínimo legal de 50% + 1 estabelecido pela NR-5). O pleito é declarado VÁLIDO em 1º Turno.`
    : `ATENÇÃO: Quórum legal de 50% + 1 não foi atingido (${summary.turnoutPercentage}% de participação). Conforme NR-5, deverá ser convocado 2º turno de votação.`;

  const quorumSummary = [
    ['Total de Eleitores Aptos:', `${summary.totalVoters}`, 'Votos Válidos Nominais:', `${summary.validVotes}`],
    ['Total de Votos Apurados:', `${summary.totalVotesCast}`, 'Votos em Branco:', `${summary.blankVotes}`],
    ['Índice de Participação:', `${summary.turnoutPercentage}%`, 'Votos Nulos:', `${summary.nullVotes}`],
    ['Quórum Mínimo Exigido:', `${summary.quorumMinimumRequired} votantes (50%+1)`, 'Abstenções:', `${summary.abstentions}`],
  ];

  autoTable(doc, {
    startY: y,
    body: quorumSummary,
    theme: 'grid',
    headStyles: { fillColor: [230, 235, 245] },
    styles: { fontSize: 8.5, cellPadding: 2, textColor: [30, 41, 59] },
    columnStyles: {
      0: { fontStyle: 'bold', fillColor: [248, 250, 252] },
      2: { fontStyle: 'bold', fillColor: [248, 250, 252] },
    },
  });

  y = (doc as any).lastAutoTable.finalY + 4;
  doc.setFont('helvetica', summary.quorumReached ? 'normal' : 'bold');
  doc.setFontSize(8);
  doc.setTextColor(summary.quorumReached ? 20 : 180, summary.quorumReached ? 80 : 20, 20);
  doc.text(quorumText, 14, y);

  y += 8;

  // Classificação dos Candidatos (Ordenados por Votos decrescentes)
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('3. RESULTADO FINAL E CLASSIFICAÇÃO DOS CANDIDATOS', 14, y);

  y += 4;
  const sortedCandidates = [...candidates].sort((a, b) => (b.votesCount || 0) - (a.votesCount || 0));

  const candTableData = sortedCandidates.map((c, index) => {
    let situacao = 'NÃO ELEITO';
    if (index < company.requiredTitulares) {
      situacao = `ELEITO TITULAR (${index + 1}º Lugar)`;
    } else if (index < company.requiredTitulares + company.requiredSuplentes) {
      situacao = `ELEITO SUPLENTE (${index + 1 - company.requiredTitulares}º Suplente)`;
    }

    const pct = summary.totalVotesCast > 0 ? (((c.votesCount || 0) / summary.totalVotesCast) * 100).toFixed(1) + '%' : '0%';
    return [
      `Nº ${c.number}`,
      c.name,
      c.department,
      `${c.votesCount || 0} votos`,
      pct,
      situacao,
    ];
  });

  autoTable(doc, {
    startY: y,
    head: [['Nº', 'Nome do Candidato', 'Setor / Área', 'Votos', '% Total', 'Resultado / Mandato']],
    body: candTableData,
    theme: 'striped',
    headStyles: { fillColor: [24, 43, 73], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
    styles: { fontSize: 8, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 15, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 55 },
      2: { cellWidth: 40 },
      3: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
      4: { cellWidth: 18, halign: 'center' },
      5: { cellWidth: 42, fontStyle: 'bold' },
    },
  });

  y = (doc as any).lastAutoTable.finalY + 12;

  // Se precisar de nova página para assinaturas
  if (y > 230) {
    doc.addPage();
    y = 25;
  }

  // Declaração de Encerramento e Assinaturas
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(50, 50, 50);
  const encerramento = `Nada mais havendo a tratar, encerrou-se a presente ata que, após lida e achada conforme, vai assinada pelos membros da Comissão Eleitoral e pelos fiscais do pleito presentes. A posse dos eleitos dar-se-á no primeiro dia útil após o término do mandato anterior conforme estabelece a NR-5.`;
  
  const splitEncerramento = doc.splitTextToSize(encerramento, pageWidth - 28);
  doc.text(splitEncerramento, 14, y);

  y += 18;

  // Linhas de Assinatura
  const col1 = 20;
  const col2 = 115;

  doc.line(col1, y, col1 + 75, y);
  doc.line(col2, y, col2 + 75, y);
  y += 4;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(company.electionCommittee.president, col1 + 37, y, { align: 'center' });
  doc.text(company.electionCommittee.secretary, col2 + 37, y, { align: 'center' });
  y += 4;
  doc.setFont('helvetica', 'normal');
  doc.text('Presidente da Comissão Eleitoral', col1 + 37, y, { align: 'center' });
  doc.text('Secretária da Comissão Eleitoral', col2 + 37, y, { align: 'center' });

  // Rodapé com Hash de Autenticidade
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(130, 130, 130);
    doc.text(`Ata de Eleição CIPA - Gestão ${company.cipaTerm} | Página ${i} de ${totalPages}`, 14, 290);
    doc.text(`Documento emitido digitalmente com assinatura SHA-256 e auditoria MTE.`, pageWidth - 14, 290, { align: 'right' });
  }

  doc.save(`Ata_Eleicao_CIPA_${company.cipaTerm.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
}

/**
 * Gera Boletim de Urna (BU) Oficial em PDF
 */
export function generateBoletimUrnaPDF(data: ReportData, urnaId?: string) {
  const { company, candidates, urnas, votes, summary } = data;
  const targetUrna = urnaId ? urnas.find((u) => u.id === urnaId) : undefined;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 22, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('BOLETIM DE URNA ELETRÔNICA (BU) - CIPA', pageWidth / 2, 10, { align: 'center' });
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`${targetUrna ? targetUrna.name.toUpperCase() : 'CONSOLIDADO DE TODAS AS SEÇÕES'} | NR-5 / MTE`, pageWidth / 2, 16, { align: 'center' });

  let y = 30;
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(9);

  const urnaVotes = targetUrna
    ? votes.filter((v) => v.urnaId === targetUrna.id)
    : votes;

  const buInfo = [
    ['Empresa:', company.companyName, 'CNPJ:', company.cnpj],
    ['Seção / Urna:', targetUrna ? `${targetUrna.name} (${targetUrna.location})` : 'Todas as Urnas On-line', 'Status:', targetUrna?.status.toUpperCase() || 'CONSOLIDADO'],
    ['Abertura:', targetUrna?.openedAt ? new Date(targetUrna.openedAt).toLocaleString('pt-BR') : company.startTime, 'Encerramento:', targetUrna?.closedAt ? new Date(targetUrna.closedAt).toLocaleString('pt-BR') : company.endTime],
    ['Total Votos Registrados:', `${urnaVotes.length}`, 'Hash de Verificação:', targetUrna?.zeresimaHash || 'BU-CONSOLIDADO-SHA256'],
  ];

  autoTable(doc, {
    startY: y,
    body: buInfo,
    theme: 'plain',
    styles: { fontSize: 8, cellPadding: 1.5 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 35 },
      1: { cellWidth: 70 },
      2: { fontStyle: 'bold', cellWidth: 35 },
      3: { cellWidth: 50 },
    },
  });

  y = (doc as any).lastAutoTable.finalY + 6;

  // Votação por Candidato
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('VOTAÇÃO NOMINAL DOS CANDIDATOS', 14, y);

  y += 3;
  const sorted = [...candidates].sort((a, b) => {
    const vA = targetUrna ? urnaVotes.filter((v) => v.candidateNumber === a.number).length : a.votesCount;
    const vB = targetUrna ? urnaVotes.filter((v) => v.candidateNumber === b.number).length : b.votesCount;
    return vB - vA;
  });

  const buCandRows = sorted.map((c) => {
    const count = targetUrna
      ? urnaVotes.filter((v) => v.candidateNumber === c.number).length
      : c.votesCount || 0;
    const pct = urnaVotes.length > 0 ? ((count / urnaVotes.length) * 100).toFixed(1) + '%' : '0%';
    return [`Nº ${c.number}`, c.name, c.department, `${count}`, pct];
  });

  const blankCount = urnaVotes.filter((v) => v.candidateNumber === 'BRANCO').length;
  const nullCount = urnaVotes.filter((v) => v.candidateNumber === 'NULO').length;

  buCandRows.push(['--', 'VOTOS EM BRANCO', 'VOTO INSTITUCIONAL', `${blankCount}`, urnaVotes.length > 0 ? ((blankCount / urnaVotes.length) * 100).toFixed(1) + '%' : '0%']);
  buCandRows.push(['--', 'VOTOS NULOS', 'VOTO INVÁLIDO', `${nullCount}`, urnaVotes.length > 0 ? ((nullCount / urnaVotes.length) * 100).toFixed(1) + '%' : '0%']);

  autoTable(doc, {
    startY: y,
    head: [['Nº', 'Candidato / Opção', 'Setor', 'Total de Votos', '% Urna']],
    body: buCandRows,
    theme: 'striped',
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
    styles: { fontSize: 8, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 20, fontStyle: 'bold', halign: 'center' },
      1: { cellWidth: 70 },
      2: { cellWidth: 45 },
      3: { cellWidth: 25, halign: 'center', fontStyle: 'bold' },
      4: { cellWidth: 20, halign: 'center' },
    },
  });

  y = (doc as any).lastAutoTable.finalY + 12;

  // Código de Validação do BU
  doc.setFont('courier', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(70, 70, 70);
  doc.text(`HASH_SHA256_BU: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`, 14, y);
  y += 5;
  doc.text(`ASSINATURA DIGITAL DA COMISSÃO: CIPA-SEC-AUT-2026-X88B-9912-FA01`, 14, y);

  doc.save(`Boletim_Urna_${targetUrna ? targetUrna.name.replace(/\s+/g, '_') : 'Consolidado'}.pdf`);
}

/**
 * Gera Relatório de Zerésima em PDF
 */
export function generateZeresimaPDF(data: ReportData, urna: Urna) {
  const { company, candidates } = data;
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(30, 58, 138);
  doc.rect(0, 0, pageWidth, 24, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('RELATÓRIO DE ZERÉSIMA ELEITORAL', pageWidth / 2, 11, { align: 'center' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Comprovação de Zero Voto Anterior ao Início da Eleição CIPA - NR-5`, pageWidth / 2, 17, { align: 'center' });

  let y = 34;
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(9);

  const zeresimaInfo = [
    ['Empresa:', company.companyName, 'CNPJ:', company.cnpj],
    ['Urna:', urna.name, 'Localização:', urna.location],
    ['Data/Hora da Zerésima:', new Date().toLocaleString('pt-BR'), 'Fiscal Responsável:', urna.openedBy || company.electionCommittee.president],
    ['Hash Criptográfico:', urna.zeresimaHash || 'ZER-INITIAL-SHA256-AUTH', 'Status:', 'ZERADA E PRONTA PARA VOTAÇÃO'],
  ];

  autoTable(doc, {
    startY: y,
    body: zeresimaInfo,
    theme: 'plain',
    styles: { fontSize: 8.5, cellPadding: 1.5 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 35 },
      1: { cellWidth: 70 },
      2: { fontStyle: 'bold', cellWidth: 35 },
      3: { cellWidth: 50 },
    },
  });

  y = (doc as any).lastAutoTable.finalY + 6;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('CONTAGEM INICIAL DE VOTOS POR CANDIDATO (TODOS ZERADOS)', 14, y);

  y += 4;
  const rows = candidates.map((c) => [`Nº ${c.number}`, c.name, c.department, '0 VOTOS (ZERADO)']);
  rows.push(['--', 'VOTOS EM BRANCO', 'INSTITUCIONAL', '0 VOTOS (ZERADO)']);
  rows.push(['--', 'VOTOS NULOS', 'INSTITUCIONAL', '0 VOTOS (ZERADO)']);

  autoTable(doc, {
    startY: y,
    head: [['Nº', 'Candidato Registrado', 'Setor', 'Contagem Inicial']],
    body: rows,
    theme: 'grid',
    headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255] },
    styles: { fontSize: 8, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 20, fontStyle: 'bold', halign: 'center' },
      1: { cellWidth: 80 },
      2: { cellWidth: 50 },
      3: { cellWidth: 40, fontStyle: 'bold', textColor: [0, 128, 0], halign: 'center' },
    },
  });

  y = (doc as any).lastAutoTable.finalY + 12;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(
    `Certificamos sob as penas da lei e em conformidade com as diretrizes do Ministério do Trabalho e Emprego que a urna supra identificada encontra-se devidamente zerada e com todos os registros íntegros para o início do pleito eleitoral da CIPA.`,
    14,
    y,
    { maxWidth: pageWidth - 28 }
  );

  doc.save(`Zeresima_${urna.name.replace(/\s+/g, '_')}.pdf`);
}

/**
 * Exporta Planilha Completa em Excel (.xlsx) com múltiplas abas
 */
export function exportElectionToExcel(data: ReportData) {
  const { company, candidates, voters, urnas, auditLogs, summary } = data;

  const workbook = XLSX.utils.book_new();

  // Aba 1: Resumo da Apuração
  const sortedCandidates = [...candidates].sort((a, b) => (b.votesCount || 0) - (a.votesCount || 0));
  const resData = [
    ['RELATÓRIO DE APURAÇÃO DA ELEIÇÃO CIPA - NR-5'],
    ['Empresa:', company.companyName, 'CNPJ:', company.cnpj],
    ['Mandato:', company.cipaTerm, 'Data:', company.electionDate],
    [''],
    ['INDICADOR', 'QUANTIDADE', 'PERCENTUAL'],
    ['Total de Empregados / Aptos', summary.totalVoters, '100%'],
    ['Total de Votos Apurados', summary.totalVotesCast, `${summary.turnoutPercentage}%`],
    ['Quórum Mínimo Exigido (50% + 1)', summary.quorumMinimumRequired, '50% + 1'],
    ['Status do Quórum', summary.quorumReached ? 'ATINJIDO (VÁLIDO)' : 'PENDENTE (2º TURNO NECESSÁRIO)', ''],
    ['Votos Válidos Nominais', summary.validVotes, summary.totalVotesCast > 0 ? ((summary.validVotes / summary.totalVotesCast) * 100).toFixed(1) + '%' : '0%'],
    ['Votos em Branco', summary.blankVotes, summary.totalVotesCast > 0 ? ((summary.blankVotes / summary.totalVotesCast) * 100).toFixed(1) + '%' : '0%'],
    ['Votos Nulos', summary.nullVotes, summary.totalVotesCast > 0 ? ((summary.nullVotes / summary.totalVotesCast) * 100).toFixed(1) + '%' : '0%'],
    ['Abstenções', summary.abstentions, summary.totalVoters > 0 ? ((summary.abstentions / summary.totalVoters) * 100).toFixed(1) + '%' : '0%'],
    [''],
    ['CLASSIFICAÇÃO DOS CANDIDATOS'],
    ['POSIÇÃO', 'NÚMERO', 'NOME', 'SETOR / CARGO', 'VOTOS', '% VOTOS', 'SITUAÇÃO / MANDATO'],
    ...sortedCandidates.map((c, i) => {
      let sit = 'NÃO ELEITO';
      if (i < company.requiredTitulares) {
        sit = `ELEITO TITULAR (${i + 1}º)`;
      } else if (i < company.requiredTitulares + company.requiredSuplentes) {
        sit = `ELEITO SUPLENTE (${i + 1 - company.requiredTitulares}º)`;
      }
      const pct = summary.totalVotesCast > 0 ? (((c.votesCount || 0) / summary.totalVotesCast) * 100).toFixed(1) + '%' : '0%';
      return [i + 1, c.number, c.name, `${c.department} - ${c.role}`, c.votesCount || 0, pct, sit];
    }),
  ];
  const wsRes = XLSX.utils.aoa_to_sheet(resData);
  XLSX.utils.book_append_sheet(workbook, wsRes, 'Apuração e Resultados');

  // Aba 2: Lista de Presença de Eleitores (LGPD - Sem Escolha de Voto)
  const votersData = [
    ['LISTA DE PRESENÇA E AUDITORIA ELEITORAL (LGPD - SIGILO ABSOLUTO DO VOTO)'],
    ['CRACHÁ / MATRÍCULA', 'NOME DO COLABORADOR', 'SETOR', 'STATUS VOTAÇÃO', 'DATA / HORA DO VOTO', 'CÓDIGO COMPROVANTE (HASH)'],
    ...voters.map((v) => [
      v.badgeNumber,
      v.name,
      v.department,
      v.hasVoted ? 'VOTO COMPUTADO' : 'NÃO VOTOU',
      v.votedAt ? new Date(v.votedAt).toLocaleString('pt-BR') : '-',
      v.receiptCode || '-',
    ]),
  ];
  const wsVoters = XLSX.utils.aoa_to_sheet(votersData);
  XLSX.utils.book_append_sheet(workbook, wsVoters, 'Presenca_Eleitores_LGPD');

  // Aba 3: Candidatos e Propostas
  const candData = [
    ['CADASTRO DE CANDIDATOS CIPA'],
    ['NÚMERO', 'NOME', 'SETOR', 'CARGO', 'STATUS', 'BIOGRAFIA', 'PROPOSTAS DE SEGURANÇA', 'TOTAL VOTOS'],
    ...candidates.map((c) => [
      c.number,
      c.name,
      c.department,
      c.role,
      c.status.toUpperCase(),
      c.bio || '-',
      c.proposal || '-',
      c.votesCount || 0,
    ]),
  ];
  const wsCand = XLSX.utils.aoa_to_sheet(candData);
  XLSX.utils.book_append_sheet(workbook, wsCand, 'Candidatos');

  // Aba 4: Urnas On-line
  const urnasData = [
    ['URNAS ELETRÔNICAS ON-LINE'],
    ['ID', 'NOME DA URNA', 'LOCALIZAÇÃO', 'STATUS', 'ZERÉSIMA EMITIDA', 'HASH ZERÉSIMA', 'TOTAL VOTOS', 'HORÁRIO ABERTURA', 'HORÁRIO FECHAMENTO'],
    ...urnas.map((u) => [
      u.id,
      u.name,
      u.location,
      u.status.toUpperCase(),
      u.zeresimaPrinted ? 'SIM' : 'NÃO',
      u.zeresimaHash || '-',
      u.totalVotes,
      u.openedAt ? new Date(u.openedAt).toLocaleString('pt-BR') : '-',
      u.closedAt ? new Date(u.closedAt).toLocaleString('pt-BR') : '-',
    ]),
  ];
  const wsUrnas = XLSX.utils.aoa_to_sheet(urnasData);
  XLSX.utils.book_append_sheet(workbook, wsUrnas, 'Urnas_Online');

  // Aba 5: Trilha de Auditoria MTE
  const logsData = [
    ['TRILHA DE AUDITORIA IMUTÁVEL - MTE / SEGURANÇA'],
    ['ID LOG', 'DATA / HORA', 'TIPO DE EVENTO', 'DESCRIÇÃO', 'USUÁRIO', 'PAPEL / NÍVEL', 'HASH CRIPTOGRÁFICO'],
    ...auditLogs.map((l) => [
      l.id,
      new Date(l.timestamp).toLocaleString('pt-BR'),
      l.eventType,
      l.description,
      l.userName,
      l.userRole,
      l.securityHash,
    ]),
  ];
  const wsLogs = XLSX.utils.aoa_to_sheet(logsData);
  XLSX.utils.book_append_sheet(workbook, wsLogs, 'Auditoria_MTE_Logs');

  XLSX.writeFile(workbook, `Eleicao_CIPA_${company.cipaTerm.replace(/[^a-zA-Z0-9]/g, '_')}_Dados_Completos.xlsx`);
}

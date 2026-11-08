import { jsPDF } from 'jspdf';
import { AppState } from '../services/storage';
import { formatBRL, formatDateBR, formatMonthYear } from './formatters';

/**
 * Exporta o Resumo Completo do Mês Selecionado em formato PDF profissional
 */
export const exportMonthSummaryPDF = (monthKey: string, appState: AppState, currentUserName?: string) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  let y = margin;

  // Filtragem dos dados do mês
  const monthTx = appState.transactions.filter((t) => t.dueDate.startsWith(monthKey));
  const incomeTx = monthTx.filter((t) => t.type === 'income');
  const expenseTx = monthTx.filter(
    (t) => t.type === 'expense' && !t.isCreditCardInvoice && t.categoryId !== 'cat_cartao'
  );
  const cardExpenses = appState.creditCardExpenses.filter((c) => c.referenceMonth === monthKey);

  const totalIncome = incomeTx.filter((t) => t.status === 'paid').reduce((s, t) => s + t.amount, 0);
  const regularExpensesTotal = expenseTx.reduce((s, t) => s + t.amount, 0);
  const cardExpensesTotal = cardExpenses.reduce((s, c) => s + c.amount, 0);
  const totalExpense = regularExpensesTotal + cardExpensesTotal;
  const balance = totalIncome - totalExpense;

  const paidExpensesTotal = expenseTx.filter((t) => t.status === 'paid').reduce((s, t) => s + t.amount, 0);
  const categoryMap = new Map(appState.categories.map((c) => [c.id, c.name]));
  const memberMap = new Map(appState.members.map((m) => [m.id, m.name]));

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - margin) {
      doc.addPage();
      y = margin;
      drawHeader();
    }
  };

  const drawHeader = () => {
    // Header Banner
    doc.setFillColor(15, 23, 42); // slate-900
    doc.roundedRect(margin, y, pageWidth - margin * 2, 22, 3, 3, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('HECKLER FAMILY - RESUMO FINANCEIRO', margin + 6, y + 9);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(203, 213, 225); // slate-300
    doc.text(
      `Mês de Referência: ${formatMonthYear(monthKey)} | Emitido em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`,
      margin + 6,
      y + 16
    );

    if (currentUserName) {
      doc.text(`Usuário: ${currentUserName}`, pageWidth - margin - 35, y + 16);
    }

    y += 26;
  };

  drawHeader();

  // 1. Resumo em Cards / Caixas de Destaque
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text('1. Indicadores Consolidados do Mês', margin, y);
  y += 5;

  const cardWidth = (pageWidth - margin * 2 - 9) / 4;
  const cardHeight = 18;

  // Card 1: Entradas
  doc.setFillColor(240, 253, 244); // emerald-50
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(margin, y, cardWidth, cardHeight, 2, 2, 'FD');
  doc.setFontSize(7.5);
  doc.setTextColor(22, 101, 52);
  doc.text('TOTAL ENTRADAS (PAGAS)', margin + 3, y + 6);
  doc.setFontSize(10.5);
  doc.text(formatBRL(totalIncome), margin + 3, y + 14);

  // Card 2: Saídas
  const c2X = margin + cardWidth + 3;
  doc.setFillColor(254, 242, 242); // rose-50
  doc.setDrawColor(254, 202, 202);
  doc.roundedRect(c2X, y, cardWidth, cardHeight, 2, 2, 'FD');
  doc.setFontSize(7.5);
  doc.setTextColor(153, 27, 27);
  doc.text('TOTAL SAÍDAS (GASTOS)', c2X + 3, y + 6);
  doc.setFontSize(10.5);
  doc.text(formatBRL(totalExpense), c2X + 3, y + 14);

  // Card 3: Saldo
  const c3X = c2X + cardWidth + 3;
  doc.setFillColor(balance >= 0 ? 239 : 254, balance >= 0 ? 246 : 242, balance >= 0 ? 255 : 242);
  doc.setDrawColor(balance >= 0 ? 191 : 254, balance >= 0 ? 219 : 202, balance >= 0 ? 254 : 202);
  doc.roundedRect(c3X, y, cardWidth, cardHeight, 2, 2, 'FD');
  doc.setFontSize(7.5);
  doc.setTextColor(balance >= 0 ? 30 : 153, balance >= 0 ? 64 : 27, balance >= 0 ? 175 : 27);
  doc.text('SALDO DO MÊS', c3X + 3, y + 6);
  doc.setFontSize(10.5);
  doc.text((balance >= 0 ? '+' : '') + formatBRL(balance), c3X + 3, y + 14);

  // Card 4: Cartão
  const c4X = c3X + cardWidth + 3;
  doc.setFillColor(238, 242, 255); // indigo-50
  doc.setDrawColor(199, 210, 254);
  doc.roundedRect(c4X, y, cardWidth, cardHeight, 2, 2, 'FD');
  doc.setFontSize(7.5);
  doc.setTextColor(55, 48, 163);
  doc.text('GASTOS NO CARTÃO', c4X + 3, y + 6);
  doc.setFontSize(10.5);
  doc.text(formatBRL(cardExpensesTotal), c4X + 3, y + 14);

  y += cardHeight + 8;

  // 2. Rendas do Mês
  checkPageBreak(35);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text(`2. Rendas e Entradas (${incomeTx.length} lançamentos)`, margin, y);
  y += 5;

  // Tabela Header
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, pageWidth - margin * 2, 6, 'F');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Data', margin + 2, y + 4.2);
  doc.text('Descrição da Renda', margin + 22, y + 4.2);
  doc.text('Categoria', margin + 85, y + 4.2);
  doc.text('Beneficiário', margin + 125, y + 4.2);
  doc.text('Status', margin + 155, y + 4.2);
  doc.text('Valor', pageWidth - margin - 2, y + 4.2, { align: 'right' });
  y += 7;

  doc.setFont('helvetica', 'normal');
  incomeTx.forEach((tx) => {
    checkPageBreak(6);
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    doc.text(formatDateBR(tx.dueDate), margin + 2, y + 3.5);
    doc.text(tx.title.substring(0, 36), margin + 22, y + 3.5);
    doc.text((categoryMap.get(tx.categoryId) || 'Renda').substring(0, 22), margin + 85, y + 3.5);
    doc.text((memberMap.get(tx.memberId) || 'Família').substring(0, 16), margin + 125, y + 3.5);
    doc.setTextColor(tx.status === 'paid' ? 22 : 180, tx.status === 'paid' ? 101 : 83, tx.status === 'paid' ? 52 : 9);
    doc.text(tx.status === 'paid' ? 'PAGO' : 'PENDENTE', margin + 155, y + 3.5);
    doc.setTextColor(22, 101, 52);
    doc.setFont('helvetica', 'bold');
    doc.text(formatBRL(tx.amount), pageWidth - margin - 2, y + 3.5, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    y += 5.5;
  });

  y += 5;

  // 3. Gastos no Cartão de Crédito
  checkPageBreak(35);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text(`3. Gastos no Cartão de Crédito (${cardExpenses.length} compras - Total: ${formatBRL(cardExpensesTotal)})`, margin, y);
  y += 5;

  doc.setFillColor(238, 242, 255);
  doc.rect(margin, y, pageWidth - margin * 2, 6, 'F');
  doc.setFontSize(7.5);
  doc.setTextColor(67, 56, 202);
  doc.text('Data Compra', margin + 2, y + 4.2);
  doc.text('Item / Descrição', margin + 25, y + 4.2);
  doc.text('Cartão', margin + 75, y + 4.2);
  doc.text('Categoria', margin + 115, y + 4.2);
  doc.text('Membro', margin + 148, y + 4.2);
  doc.text('Valor', pageWidth - margin - 2, y + 4.2, { align: 'right' });
  y += 7;

  doc.setFont('helvetica', 'normal');
  cardExpenses.forEach((c) => {
    checkPageBreak(6);
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    doc.text(formatDateBR(c.purchaseDate), margin + 2, y + 3.5);
    doc.text(c.description.substring(0, 28), margin + 25, y + 3.5);
    doc.text(c.cardName.substring(0, 22), margin + 75, y + 3.5);
    doc.text((categoryMap.get(c.categoryId) || 'Cartão').substring(0, 18), margin + 115, y + 3.5);
    doc.text((memberMap.get(c.memberId) || 'Família').substring(0, 14), margin + 148, y + 3.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(67, 56, 202);
    doc.text(formatBRL(c.amount), pageWidth - margin - 2, y + 3.5, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    y += 5.5;
  });

  y += 5;

  // 4. Lançamentos e Contas Regulares do Mês
  checkPageBreak(35);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text(`4. Lançamentos Diretos e Contas a Pagar (${expenseTx.length} contas)`, margin, y);
  y += 5;

  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, pageWidth - margin * 2, 6, 'F');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Vencimento', margin + 2, y + 4.2);
  doc.text('Título / Conta', margin + 25, y + 4.2);
  doc.text('Categoria', margin + 85, y + 4.2);
  doc.text('Responsável', margin + 125, y + 4.2);
  doc.text('Status', margin + 155, y + 4.2);
  doc.text('Valor', pageWidth - margin - 2, y + 4.2, { align: 'right' });
  y += 7;

  doc.setFont('helvetica', 'normal');
  expenseTx.forEach((tx) => {
    checkPageBreak(6);
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    doc.text(formatDateBR(tx.dueDate), margin + 2, y + 3.5);
    doc.text(tx.title.substring(0, 34), margin + 25, y + 3.5);
    doc.text((categoryMap.get(tx.categoryId) || 'Despesa').substring(0, 22), margin + 85, y + 3.5);
    doc.text((memberMap.get(tx.memberId) || 'Família').substring(0, 16), margin + 125, y + 3.5);
    doc.setTextColor(tx.status === 'paid' ? 22 : 180, tx.status === 'paid' ? 101 : 83, tx.status === 'paid' ? 52 : 9);
    doc.text(tx.status === 'paid' ? 'PAGO' : 'PENDENTE', margin + 155, y + 3.5);
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.text(formatBRL(tx.amount), pageWidth - margin - 2, y + 3.5, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    y += 5.5;
  });

  // Footer on current page
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'Heckler Family - Sistema de Controle Financeiro Familiar Privado e Auditável',
    margin,
    pageHeight - 8
  );
  doc.text(
    `Documento Oficial | Página ${doc.internal.pages.length - 1}`,
    pageWidth - margin,
    pageHeight - 8,
    { align: 'right' }
  );

  doc.save(`Heckler_Resumo_${monthKey}.pdf`);
};

/**
 * Exporta o Resumo do Mês em formato Planilha Excel estruturada (.xls XML ou CSV formatado com UTF-8 BOM)
 */
export const exportMonthSummaryExcel = (monthKey: string, appState: AppState, currentUserName?: string) => {
  const monthTx = appState.transactions.filter((t) => t.dueDate.startsWith(monthKey));
  const incomeTx = monthTx.filter((t) => t.type === 'income');
  const expenseTx = monthTx.filter(
    (t) => t.type === 'expense' && !t.isCreditCardInvoice && t.categoryId !== 'cat_cartao'
  );
  const cardExpenses = appState.creditCardExpenses.filter((c) => c.referenceMonth === monthKey);

  const totalIncome = incomeTx.filter((t) => t.status === 'paid').reduce((s, t) => s + t.amount, 0);
  const regularExpensesTotal = expenseTx.reduce((s, t) => s + t.amount, 0);
  const cardExpensesTotal = cardExpenses.reduce((s, c) => s + c.amount, 0);
  const totalExpense = regularExpensesTotal + cardExpensesTotal;
  const balance = totalIncome - totalExpense;

  const categoryMap = new Map(appState.categories.map((c) => [c.id, c.name]));
  const memberMap = new Map(appState.members.map((m) => [m.id, m.name]));

  // Estrutura em HTML/XML compatível nativamente com Microsoft Excel (.xls)
  const excelContent = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
      <style>
        body { font-family: Calibri, Arial, sans-serif; }
        .header { background-color: #0F172A; color: #FFFFFF; font-size: 16pt; font-weight: bold; text-align: center; }
        .subheader { background-color: #1E293B; color: #E2E8F0; font-size: 10pt; text-align: center; }
        .section-title { background-color: #334155; color: #FFFFFF; font-size: 11pt; font-weight: bold; }
        .th { background-color: #F1F5F9; color: #334155; font-weight: bold; border: 1px solid #CBD5E1; text-align: left; }
        .td { border: 1px solid #E2E8F0; font-size: 10pt; }
        .currency { text-align: right; font-weight: bold; }
        .paid { color: #166534; font-weight: bold; }
        .pending { color: #991B1B; font-weight: bold; }
        .card-income { background-color: #F0FDF4; font-weight: bold; color: #166534; }
        .card-expense { background-color: #FEF2F2; font-weight: bold; color: #991B1B; }
        .card-balance { background-color: #EFF6FF; font-weight: bold; color: #1E40AF; }
        .card-cc { background-color: #EEF2FF; font-weight: bold; color: #3730A3; }
      </style>
    </head>
    <body>
      <table>
        <tr>
          <td colspan="7" class="header">HECKLER FAMILY - RESUMO MENSAL</td>
        </tr>
        <tr>
          <td colspan="7" class="subheader">Mês de Referência: ${formatMonthYear(monthKey)} | Exportado em: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')} | Usuário: ${currentUserName || 'Família Heckler'}</td>
        </tr>
        <tr><td colspan="7"></td></tr>

        <!-- INDICADORES CONSOLIDADOS -->
        <tr>
          <td colspan="7" class="section-title">1. INDICADORES DO MÊS</td>
        </tr>
        <tr>
          <td colspan="2" class="th">Total Entradas (Pagas)</td>
          <td colspan="2" class="th">Total Saídas (Contas + Cartão)</td>
          <td colspan="2" class="th">Saldo Líquido do Mês</td>
          <td class="th">Total Cartão de Crédito</td>
        </tr>
        <tr>
          <td colspan="2" class="td card-income currency">${formatBRL(totalIncome)}</td>
          <td colspan="2" class="td card-expense currency">${formatBRL(totalExpense)}</td>
          <td colspan="2" class="td card-balance currency">${(balance >= 0 ? '+' : '') + formatBRL(balance)}</td>
          <td class="td card-cc currency">${formatBRL(cardExpensesTotal)}</td>
        </tr>
        <tr><td colspan="7"></td></tr>

        <!-- ENTRADAS / RENDAS -->
        <tr>
          <td colspan="7" class="section-title">2. RENDAS E ENTRADAS</td>
        </tr>
        <tr>
          <th class="th">Data</th>
          <th class="th">Descrição</th>
          <th class="th">Categoria</th>
          <th class="th">Membro Beneficiário</th>
          <th class="th">Forma Pagto</th>
          <th class="th">Status</th>
          <th class="th">Valor (R$)</th>
        </tr>
        ${incomeTx.map((tx) => `
          <tr>
            <td class="td">${formatDateBR(tx.dueDate)}</td>
            <td class="td">${tx.title}</td>
            <td class="td">${categoryMap.get(tx.categoryId) || 'Renda'}</td>
            <td class="td">${memberMap.get(tx.memberId) || 'Família'}</td>
            <td class="td">${tx.paymentMethod.toUpperCase()}</td>
            <td class="td ${tx.status === 'paid' ? 'paid' : 'pending'}">${tx.status === 'paid' ? 'PAGO' : 'PENDENTE'}</td>
            <td class="td currency">${formatBRL(tx.amount)}</td>
          </tr>
        `).join('')}
        <tr><td colspan="7"></td></tr>

        <!-- GASTOS NO CARTÃO DE CRÉDITO -->
        <tr>
          <td colspan="7" class="section-title">3. GASTOS NO CARTÃO DE CRÉDITO</td>
        </tr>
        <tr>
          <th class="th">Data da Compra</th>
          <th class="th">Item / Termo</th>
          <th class="th">Cartão Utilizado</th>
          <th class="th">Categoria</th>
          <th class="th">Membro</th>
          <th class="th">Parcela</th>
          <th class="th">Valor (R$)</th>
        </tr>
        ${cardExpenses.map((c) => `
          <tr>
            <td class="td">${formatDateBR(c.purchaseDate)}</td>
            <td class="td">${c.description}</td>
            <td class="td">${c.cardName}</td>
            <td class="td">${categoryMap.get(c.categoryId) || 'Cartão'}</td>
            <td class="td">${memberMap.get(c.memberId) || 'Família'}</td>
            <td class="td">${c.installmentsTotal && c.installmentsTotal > 1 ? `${c.installmentsCurrent}/${c.installmentsTotal}` : 'À Vista'}</td>
            <td class="td currency">${formatBRL(c.amount)}</td>
          </tr>
        `).join('')}
        <tr><td colspan="7"></td></tr>

        <!-- CONTAS E LANÇAMENTOS REGULARES -->
        <tr>
          <td colspan="7" class="section-title">4. LANÇAMENTOS E CONTAS A PAGAR</td>
        </tr>
        <tr>
          <th class="th">Vencimento</th>
          <th class="th">Descrição da Conta</th>
          <th class="th">Categoria</th>
          <th class="th">Membro Responsável</th>
          <th class="th">Forma Pagto</th>
          <th class="th">Status</th>
          <th class="th">Valor (R$)</th>
        </tr>
        ${expenseTx.map((tx) => `
          <tr>
            <td class="td">${formatDateBR(tx.dueDate)}</td>
            <td class="td">${tx.title}</td>
            <td class="td">${categoryMap.get(tx.categoryId) || 'Despesa'}</td>
            <td class="td">${memberMap.get(tx.memberId) || 'Família'}</td>
            <td class="td">${tx.paymentMethod.toUpperCase()}</td>
            <td class="td ${tx.status === 'paid' ? 'paid' : 'pending'}">${tx.status === 'paid' ? 'PAGO' : 'PENDENTE'}</td>
            <td class="td currency">${formatBRL(tx.amount)}</td>
          </tr>
        `).join('')}
      </table>
    </body>
    </html>
  `;

  const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Heckler_Resumo_${monthKey}.xls`;
  link.click();
  URL.revokeObjectURL(url);
};

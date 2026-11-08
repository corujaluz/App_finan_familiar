import React, { useRef } from 'react';
import { X, Download, Upload, RefreshCw, FileSpreadsheet, ShieldAlert, ShieldCheck, User, FileText, Calendar } from 'lucide-react';
import { AppState, exportDataAsJSON, exportTransactionsAsCSV } from '../services/storage';
import { UserAccount } from '../types/finance';
import { exportMonthSummaryExcel, exportMonthSummaryPDF } from '../utils/monthReportExport';
import { formatMonthYear } from '../utils/formatters';

interface ExportImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  appState: AppState;
  onImportData: (newState: AppState) => void;
  onResetToDemo: () => void;
  currentUser?: UserAccount | null;
  currentMonthKey: string;
}

export const ExportImportModal: React.FC<ExportImportModalProps> = ({
  isOpen,
  onClose,
  appState,
  onImportData,
  onResetToDemo,
  currentUser,
  currentMonthKey,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const isAdmin = currentUser ? currentUser.role === 'admin' : true;

  const handleExportJSON = () => {
    exportDataAsJSON(appState);
  };

  const handleExportCSV = () => {
    exportTransactionsAsCSV(appState);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isAdmin) {
      alert('Ação restrita ao Administrador (Eduardo Heckler). Por favor, alterne para o usuário de Eduardo para restaurar dados.');
      if (e.target) e.target.value = '';
      return;
    }

    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.transactions && parsed.categories && parsed.members) {
          onImportData(parsed);
          alert('Dados restaurados com sucesso!');
          onClose();
        } else {
          alert('Arquivo de backup inválido. Certifique-se de usar um arquivo exportado pelo Heckler Family.');
        }
      } catch (err) {
        alert('Erro ao processar arquivo JSON: ' + (err instanceof Error ? err.message : 'Erro desconhecido'));
      }
    };
    reader.readAsText(file);
  };

  const handleResetConfirm = () => {
    if (!isAdmin) {
      alert('Ação restrita ao Administrador (Eduardo Heckler). Por favor, alterne para o perfil de Eduardo para restaurar os dados de demonstração.');
      return;
    }

    if (window.confirm('Tem certeza de que deseja restaurar os dados de demonstração da família? Todas as alterações manuais serão resetadas.')) {
      onResetToDemo();
      onClose();
    }
  };

  const handleExportMonthPDF = () => {
    exportMonthSummaryPDF(currentMonthKey, appState, currentUser?.name);
  };

  const handleExportMonthExcel = () => {
    exportMonthSummaryExcel(currentMonthKey, appState, currentUser?.name);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Download className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              Exportação & Backup de Dados
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Baixe relatórios analíticos do mês em PDF/Excel ou salve backups completos
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User status banner */}
        {currentUser && (
          <div className="px-6 pt-4 pb-0 shrink-0">
            <div className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
              isAdmin
                ? 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/40 text-blue-900 dark:text-blue-200'
                : 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/40 text-emerald-900 dark:text-emerald-200'
            }`}>
              <div className="flex items-center gap-2">
                {isAdmin ? <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" /> : <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                <span className="font-semibold">Usuário ativo: {currentUser.name}</span>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                isAdmin ? 'bg-blue-200 dark:bg-blue-900 text-blue-800 dark:text-blue-200' : 'bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200'
              }`}>
                {isAdmin ? 'Administrador' : 'Usuário'}
              </span>
            </div>
            {!isAdmin && (
              <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1.5 flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                Restaurações e reinicialização de dados exigem o perfil Administrador (Eduardo).
              </p>
            )}
          </div>
        )}

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* SECÇÃO 1: BAIXAR RESUMO DO MÊS SELECIONADO (NOVA FUNCIONALIDADE SOLICITADA) */}
          <div className="p-4 rounded-xl border-2 border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                  Resumo do Mês Selecionado ({formatMonthYear(currentMonthKey)})
                </span>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300">
                Externo
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Exporte todos os indicadores consolidados, lançamentos pagos, cartão de crédito detalhado e contas regulares do mês para análise externa.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {/* Baixar PDF */}
              <button
                onClick={handleExportMonthPDF}
                className="flex items-center gap-2.5 p-3 rounded-lg bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-800/60 hover:border-emerald-500 hover:shadow-xs transition-all text-left group"
              >
                <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    Baixar Resumo em PDF
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                    Documento formatado (.pdf)
                  </span>
                </div>
              </button>

              {/* Baixar Excel */}
              <button
                onClick={handleExportMonthExcel}
                className="flex items-center gap-2.5 p-3 rounded-lg bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-800/60 hover:border-emerald-500 hover:shadow-xs transition-all text-left group"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    Baixar Planilha Excel
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                    Tabelas com fórmulas (.xls)
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* SECÇÃO 2: BACKUP HISTÓRICO GLOBAL */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Backup e Exportação Global
            </span>

            {/* Export JSON */}
            <button
              onClick={handleExportJSON}
              className="w-full flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl hover:border-slate-400 dark:hover:border-slate-600 transition-colors group text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Download className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    Exportar Backup Completo (.JSON)
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Todos os lançamentos, cartões, fontes de renda e histórico
                  </span>
                </div>
              </div>
            </button>

            {/* Export CSV Histórico */}
            <button
              onClick={handleExportCSV}
              className="w-full flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl hover:border-slate-400 dark:hover:border-slate-600 transition-colors group text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    Exportar Todos os Lançamentos (.CSV)
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Histórico geral em CSV para planilhas
                  </span>
                </div>
              </div>
            </button>

            {/* Import JSON */}
            <div>
              <input
                type="file"
                ref={fileInputRef}
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl hover:border-slate-400 dark:hover:border-slate-600 transition-colors group text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
                    <Upload className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      Restaurar Backup (.JSON)
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Carregar dados salvos anteriormente (requer Admin)
                    </span>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Reset Demo Data */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={handleResetConfirm}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Restaurar Dados Padrão de Demonstração</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

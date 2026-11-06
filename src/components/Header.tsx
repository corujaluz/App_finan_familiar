import React from 'react';
import { Plus, Sun, Moon, Download, Upload, Wallet, Bell, Shield, User, LogIn, LogOut } from 'lucide-react';
import { UserAccount } from '../types/finance';

interface HeaderProps {
  currentTab: 'overview' | 'transactions' | 'credit_card' | 'income_sources' | 'charts' | 'budgets' | 'members';
  onSelectTab: (tab: 'overview' | 'transactions' | 'credit_card' | 'income_sources' | 'charts' | 'budgets' | 'members') => void;
  onOpenNewTransaction: () => void;
  onOpenExportImport: () => void;
  onOpenAlarmSettings: () => void;
  alarmAlertCount?: number;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  activeMonthYear: string;
  currentUser: UserAccount | null;
  onOpenLogin: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  onOpenNewTransaction,
  onOpenExportImport,
  onOpenAlarmSettings,
  alarmAlertCount = 0,
  isDarkMode,
  onToggleDarkMode,
  currentUser,
  onOpenLogin,
  onLogout,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Strict 3-Zone Top Bar Contract */}
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single text wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-sm">
              <Wallet className="w-5 h-5" />
            </div>
            <a
              href="#overview"
              onClick={(e) => {
                e.preventDefault();
                onSelectTab('overview');
              }}
              className="text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0 hover:opacity-90 transition-opacity"
            >
              Heckler Family
            </a>
          </div>

          {/* Zone 2: 4-5 single-line navigation links */}
          <nav className="hidden md:flex items-center gap-1 sm:gap-1.5 text-sm font-medium">
            <button
              onClick={() => onSelectTab('overview')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0 transition-colors ${
                currentTab === 'overview'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Visão Geral
            </button>
            <button
              onClick={() => onSelectTab('transactions')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0 transition-colors ${
                currentTab === 'transactions'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Lançamentos
            </button>
            <button
              onClick={() => onSelectTab('credit_card')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0 transition-colors ${
                currentTab === 'credit_card'
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-200/60 dark:border-indigo-800/60'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Cartão de Crédito
            </button>
            <button
              onClick={() => onSelectTab('income_sources')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0 transition-colors ${
                currentTab === 'income_sources'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Fontes de Renda
            </button>
            <button
              onClick={() => onSelectTab('charts')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0 transition-colors ${
                currentTab === 'charts'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Gráficos
            </button>
            <button
              onClick={() => onSelectTab('budgets')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0 transition-colors ${
                currentTab === 'budgets'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Orçamentos
            </button>
            <button
              onClick={() => onSelectTab('members')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0 transition-colors ${
                currentTab === 'members'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Membros
            </button>
          </nav>

          {/* Zone 3: Primary action button + quiet utilities */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              onClick={onOpenAlarmSettings}
              title={`Configurações do Alarme Sonoro${alarmAlertCount > 0 ? ` (${alarmAlertCount} contas acionando o alarme)` : ''}`}
              aria-label="Alarme Sonoro de Contas"
              className="relative p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <Bell className={`w-4 h-4 ${alarmAlertCount > 0 ? 'text-amber-600 dark:text-amber-400' : ''}`} />
              {alarmAlertCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-rose-600 text-[10px] font-bold text-white flex items-center justify-center tabular-nums shadow-xs">
                  {alarmAlertCount}
                </span>
              )}
            </button>

            <button
              onClick={onOpenExportImport}
              title="Backup e Exportação de Dados"
              aria-label="Backup e Exportação"
              className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={onToggleDarkMode}
              title={isDarkMode ? 'Modo Claro' : 'Modo Escuro'}
              aria-label="Alternar tema"
              className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* User Account / Profile Switcher Button */}
            {currentUser ? (
              <button
                onClick={onOpenLogin}
                title={`Logado como ${currentUser.name} (${currentUser.role === 'admin' ? 'Administrador' : 'Usuário'}). Clique para alternar ou sair.`}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50 dark:bg-slate-800/80 transition-colors text-left"
              >
                <div
                  className="w-6 h-6 rounded-md flex items-center justify-center text-white text-[10px] font-bold shrink-0 shadow-2xs"
                  style={{ backgroundColor: currentUser.color }}
                >
                  {currentUser.avatarInitials}
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">
                    {currentUser.name.split(' ')[0]}
                  </span>
                  <span
                    className={`text-[9px] font-bold uppercase tracking-wider ${
                      currentUser.role === 'admin'
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    {currentUser.role === 'admin' ? 'Admin' : 'Usuário'}
                  </span>
                </div>
              </button>
            ) : (
              <button
                onClick={onOpenLogin}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Entrar</span>
              </button>
            )}

            {/* Explicit Logout Button */}
            {currentUser && (
              <button
                onClick={onLogout}
                title="Fazer Logout (Bloquear Acesso)"
                aria-label="Sair da Conta"
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors border border-rose-200/80 dark:border-rose-900/50"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sair</span>
              </button>
            )}

            <button
              onClick={onOpenNewTransaction}
              className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg shadow-sm transition-all whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden sm:inline">Novo Lançamento</span>
              <span className="sm:hidden">Novo</span>
            </button>
          </div>
        </div>

        {/* Mobile secondary tab strip */}
        <div className="md:hidden flex items-center justify-between border-t border-slate-100 dark:border-slate-800 py-2 overflow-x-auto gap-2 text-xs">
          <button
            onClick={() => onSelectTab('overview')}
            className={`px-2.5 py-1 rounded-md whitespace-nowrap shrink-0 ${
              currentTab === 'overview'
                ? 'bg-slate-100 dark:bg-slate-800 font-semibold text-slate-900 dark:text-white'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Visão Geral
          </button>
          <button
            onClick={() => onSelectTab('transactions')}
            className={`px-2.5 py-1 rounded-md whitespace-nowrap shrink-0 ${
              currentTab === 'transactions'
                ? 'bg-slate-100 dark:bg-slate-800 font-semibold text-slate-900 dark:text-white'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Lançamentos
          </button>
          <button
            onClick={() => onSelectTab('credit_card')}
            className={`px-2.5 py-1 rounded-md whitespace-nowrap shrink-0 ${
              currentTab === 'credit_card'
                ? 'bg-indigo-50 dark:bg-indigo-950/60 font-semibold text-indigo-700 dark:text-indigo-300'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Cartão de Crédito
          </button>
          <button
            onClick={() => onSelectTab('income_sources')}
            className={`px-2.5 py-1 rounded-md whitespace-nowrap shrink-0 ${
              currentTab === 'income_sources'
                ? 'bg-slate-100 dark:bg-slate-800 font-semibold text-slate-900 dark:text-white'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Fontes de Renda
          </button>
          <button
            onClick={() => onSelectTab('charts')}
            className={`px-2.5 py-1 rounded-md whitespace-nowrap shrink-0 ${
              currentTab === 'charts'
                ? 'bg-slate-100 dark:bg-slate-800 font-semibold text-slate-900 dark:text-white'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Gráficos
          </button>
          <button
            onClick={() => onSelectTab('budgets')}
            className={`px-2.5 py-1 rounded-md whitespace-nowrap shrink-0 ${
              currentTab === 'budgets'
                ? 'bg-slate-100 dark:bg-slate-800 font-semibold text-slate-900 dark:text-white'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Orçamentos
          </button>
          <button
            onClick={() => onSelectTab('members')}
            className={`px-2.5 py-1 rounded-md whitespace-nowrap shrink-0 ${
              currentTab === 'members'
                ? 'bg-slate-100 dark:bg-slate-800 font-semibold text-slate-900 dark:text-white'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Membros
          </button>
        </div>
      </div>
    </header>
  );
};

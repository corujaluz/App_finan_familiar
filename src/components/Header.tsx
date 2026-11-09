import React, { useState, useRef, useEffect } from 'react';
import {
  Plus,
  Sun,
  Moon,
  Download,
  Wallet,
  Bell,
  ShieldCheck,
  User,
  LogIn,
  LogOut,
  Save,
  Check,
  RefreshCw,
  KeyRound,
  History,
  ChevronDown,
  Shield,
  Radio,
  UserCheck,
} from 'lucide-react';
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
  onSaveData?: () => void;
  isSaving?: boolean;
  hasUnsavedChanges?: boolean;
  lastSavedTime?: string | null;
  onOpenChangePin?: () => void;
  onOpenAuditLog?: () => void;
  onOpen2FAModal?: () => void;
  pendingModificationsCount?: number;
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
  onSaveData,
  isSaving = false,
  hasUnsavedChanges = false,
  lastSavedTime = null,
  onOpenChangePin,
  onOpenAuditLog,
  onOpen2FAModal,
  pendingModificationsCount = 0,
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserMenuOpen]);

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl xl:max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8">
        {/* Unified 3-Zone Bar */}
        <div className="flex items-center justify-between gap-3 md:gap-6 h-16">
          {/* Zone 1: Brand & Live Status */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-xs">
              <Wallet className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <a
                href="#overview"
                onClick={(e) => {
                  e.preventDefault();
                  onSelectTab('overview');
                }}
                className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap hover:opacity-90 transition-opacity flex items-center gap-2"
              >
                <span>Heckler Family</span>
                <span className="hidden lg:inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Ao Vivo
                </span>
              </a>
            </div>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 text-xs font-semibold">
            <button
              onClick={() => onSelectTab('overview')}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all ${
                currentTab === 'overview'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              Visão Geral
            </button>
            <button
              onClick={() => onSelectTab('transactions')}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all ${
                currentTab === 'transactions'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              Lançamentos
            </button>
            <button
              onClick={() => onSelectTab('credit_card')}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all ${
                currentTab === 'credit_card'
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200/80 dark:border-indigo-800/80 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              Cartão de Crédito
            </button>
            <button
              onClick={() => onSelectTab('income_sources')}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all ${
                currentTab === 'income_sources'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              Fontes de Renda
            </button>
            <button
              onClick={() => onSelectTab('charts')}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all ${
                currentTab === 'charts'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              Gráficos
            </button>
            <button
              onClick={() => onSelectTab('budgets')}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all ${
                currentTab === 'budgets'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              Orçamentos
            </button>
            <button
              onClick={() => onSelectTab('members')}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all ${
                currentTab === 'members'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              Membros
            </button>
          </nav>

          {/* Zone 3: Modern Action Cluster & User Popover */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Quick Utility Icons */}
            <div className="flex items-center gap-1 bg-slate-50/80 dark:bg-slate-800/50 p-1 rounded-xl border border-slate-200/80 dark:border-slate-800">
              {/* Alarme Sonoro */}
              <button
                onClick={onOpenAlarmSettings}
                title={`Alarme Sonoro de Contas${alarmAlertCount > 0 ? ` (${alarmAlertCount} contas acionando o alarme)` : ''}`}
                aria-label="Alarme de Contas"
                className="relative p-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <Bell className={`w-4 h-4 ${alarmAlertCount > 0 ? 'text-amber-500 fill-amber-500/20' : ''}`} />
                {alarmAlertCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[15px] h-[15px] px-1 rounded-full bg-rose-600 text-[9px] font-black text-white flex items-center justify-center tabular-nums shadow-xs">
                    {alarmAlertCount}
                  </span>
                )}
              </button>

              {/* Auditoria / Modificações em Tempo Real */}
              {onOpenAuditLog && (
                <button
                  onClick={onOpenAuditLog}
                  title="Auditoria de Modificações e Sincronização em Tempo Real"
                  aria-label="Histórico de Modificações"
                  className="relative p-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1"
                >
                  <History className="w-4 h-4 text-indigo-500" />
                  {pendingModificationsCount > 0 ? (
                    <span className="min-w-[15px] h-[15px] px-1 rounded-full bg-amber-500 text-[9px] font-black text-white flex items-center justify-center tabular-nums">
                      {pendingModificationsCount}
                    </span>
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                  )}
                </button>
              )}

              {/* Backup & Exportação */}
              <button
                onClick={onOpenExportImport}
                title="Backup e Exportação de Relatórios (PDF / Excel)"
                aria-label="Backup e Relatórios"
                className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
              </button>

              {/* Tema Claro/Escuro */}
              <button
                onClick={onToggleDarkMode}
                title={isDarkMode ? 'Mudar para Tema Claro' : 'Mudar para Tema Escuro'}
                aria-label="Alternar tema"
                className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>

            {/* User Profile & Security Menu (Consolidated & Clean) */}
            <div className="relative" ref={userMenuRef}>
              {currentUser ? (
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  title={`Conta: ${currentUser.name} (${currentUser.role === 'admin' ? 'Administrador' : 'Usuário'}). Clique para gerenciar segurança e perfil.`}
                  className={`flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border transition-all text-left ${
                    isUserMenuOpen
                      ? 'bg-indigo-50 dark:bg-indigo-950/70 border-indigo-300 dark:border-indigo-700 ring-2 ring-indigo-500/20'
                      : 'bg-white dark:bg-slate-800/90 hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-2xs'
                  }`}
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-2xs"
                    style={{ backgroundColor: currentUser.color }}
                  >
                    {currentUser.avatarInitials}
                  </div>
                  <div className="hidden sm:flex flex-col text-left">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                        {currentUser.name.split(' ')[0]}
                      </span>
                      <span
                        className={`text-[8px] px-1 py-0.2 rounded font-bold uppercase tracking-wider ${
                          currentUser.role === 'admin'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300'
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300'
                        }`}
                      >
                        {currentUser.role === 'admin' ? 'Admin' : 'Usuário'}
                      </span>
                    </div>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                </button>
              ) : (
                <button
                  onClick={onOpenLogin}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Entrar</span>
                </button>
              )}

              {/* Dropdown Menu Popover */}
              {isUserMenuOpen && currentUser && (
                <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-2.5 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-2">
                  {/* User Profile Header in Dropdown */}
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center gap-2.5">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white shrink-0 shadow-xs"
                      style={{ backgroundColor: currentUser.color }}
                    >
                      {currentUser.avatarInitials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate block">
                          {currentUser.name}
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
                          {currentUser.role === 'admin' ? 'Administrador' : 'Usuário'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {currentUser.email}
                      </p>
                    </div>
                  </div>

                  {/* Security Actions */}
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 px-2 block">
                      Segurança & Acesso
                    </span>

                    {/* Google Authenticator (2FA) */}
                    {onOpen2FAModal && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onOpen2FAModal();
                        }}
                        className="w-full flex items-center justify-between p-2 rounded-xl text-xs hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                          <span className="font-medium">Google Authenticator (2FA)</span>
                        </div>
                        <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded">
                          Ativo
                        </span>
                      </button>
                    )}

                    {/* Alterar PIN */}
                    {onOpenChangePin && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onOpenChangePin();
                        }}
                        className="w-full flex items-center gap-2 p-2 rounded-xl text-xs hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors font-medium"
                      >
                        <KeyRound className="w-4 h-4 text-amber-500" />
                        <span>Alterar PIN de Acesso</span>
                      </button>
                    )}

                    {/* Histórico / Auditoria */}
                    {onOpenAuditLog && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onOpenAuditLog();
                        }}
                        className="w-full flex items-center gap-2 p-2 rounded-xl text-xs hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors font-medium"
                      >
                        <History className="w-4 h-4 text-indigo-500" />
                        <span>Auditoria em Tempo Real</span>
                      </button>
                    )}
                  </div>

                  {/* Switch Profile & Logout */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onOpenLogin();
                      }}
                      className="w-full flex items-center gap-2 p-2 rounded-xl text-xs hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors font-medium"
                    >
                      <UserCheck className="w-4 h-4 text-slate-500" />
                      <span>Alternar Usuário</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onLogout();
                      }}
                      className="w-full flex items-center gap-2 p-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sair da Conta (Bloquear)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Salvar Alterações Button */}
            {onSaveData && (
              <button
                onClick={onSaveData}
                disabled={isSaving}
                title={
                  hasUnsavedChanges
                    ? 'Existem alterações pendentes. Clique para salvar agora!'
                    : lastSavedTime
                    ? `Todas as alterações foram salvas às ${lastSavedTime}.`
                    : 'Salvar alterações'
                }
                className={`relative flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl transition-all border whitespace-nowrap shrink-0 shadow-2xs ${
                  hasUnsavedChanges
                    ? 'bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white border-amber-600 ring-2 ring-amber-400/40 animate-pulse'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                {isSaving ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : hasUnsavedChanges ? (
                  <Save className="w-3.5 h-3.5 text-white" />
                ) : (
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
                )}

                <span className="hidden md:inline">
                  {isSaving
                    ? 'Salvando...'
                    : hasUnsavedChanges
                    ? 'Salvar'
                    : lastSavedTime
                    ? `Salvo ${lastSavedTime}`
                    : 'Salvo'}
                </span>

                {hasUnsavedChanges && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-white ring-2 ring-amber-600 animate-ping" />
                )}
              </button>
            )}

            {/* Novo Lançamento (Primary CTA) */}
            <button
              onClick={onOpenNewTransaction}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-xs transition-all whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden sm:inline">Novo Lançamento</span>
              <span className="sm:hidden">Novo</span>
            </button>
          </div>
        </div>

        {/* Mobile secondary tab strip */}
        <div className="lg:hidden flex items-center justify-between border-t border-slate-100 dark:border-slate-800 py-2 overflow-x-auto gap-2 text-xs">
          <button
            onClick={() => onSelectTab('overview')}
            className={`px-2.5 py-1 rounded-lg whitespace-nowrap shrink-0 ${
              currentTab === 'overview'
                ? 'bg-slate-100 dark:bg-slate-800 font-semibold text-slate-900 dark:text-white'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Visão Geral
          </button>
          <button
            onClick={() => onSelectTab('transactions')}
            className={`px-2.5 py-1 rounded-lg whitespace-nowrap shrink-0 ${
              currentTab === 'transactions'
                ? 'bg-slate-100 dark:bg-slate-800 font-semibold text-slate-900 dark:text-white'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Lançamentos
          </button>
          <button
            onClick={() => onSelectTab('credit_card')}
            className={`px-2.5 py-1 rounded-lg whitespace-nowrap shrink-0 ${
              currentTab === 'credit_card'
                ? 'bg-indigo-50 dark:bg-indigo-950/60 font-semibold text-indigo-700 dark:text-indigo-300'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Cartão de Crédito
          </button>
          <button
            onClick={() => onSelectTab('income_sources')}
            className={`px-2.5 py-1 rounded-lg whitespace-nowrap shrink-0 ${
              currentTab === 'income_sources'
                ? 'bg-slate-100 dark:bg-slate-800 font-semibold text-slate-900 dark:text-white'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Fontes de Renda
          </button>
          <button
            onClick={() => onSelectTab('charts')}
            className={`px-2.5 py-1 rounded-lg whitespace-nowrap shrink-0 ${
              currentTab === 'charts'
                ? 'bg-slate-100 dark:bg-slate-800 font-semibold text-slate-900 dark:text-white'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Gráficos
          </button>
          <button
            onClick={() => onSelectTab('budgets')}
            className={`px-2.5 py-1 rounded-lg whitespace-nowrap shrink-0 ${
              currentTab === 'budgets'
                ? 'bg-slate-100 dark:bg-slate-800 font-semibold text-slate-900 dark:text-white'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Orçamentos
          </button>
          <button
            onClick={() => onSelectTab('members')}
            className={`px-2.5 py-1 rounded-lg whitespace-nowrap shrink-0 ${
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

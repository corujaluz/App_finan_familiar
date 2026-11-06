import React, { useState } from 'react';
import { Shield, ShieldCheck, User, KeyRound, Lock, LogIn, LogOut, CheckCircle2, AlertCircle, Eye, EyeOff, Sparkles, ShieldAlert } from 'lucide-react';
import { UserAccount } from '../types/finance';

interface LoginModalProps {
  isOpen: boolean;
  onClose?: () => void;
  currentUser: UserAccount | null;
  userAccounts: UserAccount[];
  onLogin: (account: UserAccount) => void;
  onLogout?: () => void;
  onUpdatePin?: (userId: string, newPin: string) => void;
  isMandatory?: boolean; // When true, user cannot close modal without logging in
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  userAccounts,
  onLogin,
  onLogout,
  onUpdatePin,
  isMandatory = false,
}) => {
  const [selectedUserId, setSelectedUserId] = useState<string>(
    currentUser?.id || userAccounts[0]?.id || 'usr_eduardo'
  );
  const [pinInput, setPinInput] = useState<string>('');
  const [showPin, setShowPin] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isChangingPin, setIsChangingPin] = useState<boolean>(false);
  const [newPinInput, setNewPinInput] = useState<string>('');
  const [confirmPinInput, setConfirmPinInput] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  if (!isOpen) return null;

  const selectedAccount = userAccounts.find((acc) => acc.id === selectedUserId) || userAccounts[0];

  const handleSelectAccount = (acc: UserAccount) => {
    setSelectedUserId(acc.id);
    setPinInput('');
    setErrorMsg('');
    setSuccessMsg('');
    setIsChangingPin(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedAccount) return;

    if (pinInput.trim() === selectedAccount.pin) {
      onLogin(selectedAccount);
      setPinInput('');
      if (onClose) onClose();
    } else {
      setErrorMsg('Senha/PIN incorreto. O PIN padrão inicial é 1234.');
    }
  };

  const handleQuickFillPin = () => {
    setPinInput(selectedAccount.pin || '1234');
    setErrorMsg('');
  };

  const handleSaveNewPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPinInput.length < 4) {
      setErrorMsg('O novo PIN deve ter pelo menos 4 dígitos.');
      return;
    }
    if (newPinInput !== confirmPinInput) {
      setErrorMsg('Os PINs digitados não coincidem.');
      return;
    }
    if (onUpdatePin) {
      onUpdatePin(selectedAccount.id, newPinInput);
      setSuccessMsg(`PIN de ${selectedAccount.name} atualizado com sucesso!`);
      setIsChangingPin(false);
      setPinInput(newPinInput);
      setNewPinInput('');
      setConfirmPinInput('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        {/* Top Header Card */}
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-28 h-28 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-inner ${
                isMandatory ? 'bg-amber-500/20 border border-amber-400/40 text-amber-300' : 'bg-indigo-600/30 border border-indigo-400/30 text-indigo-300'
              }`}>
                {isMandatory ? <Lock className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
              </div>
              <div>
                <h2 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                  <span>Heckler Family</span>
                  {isMandatory && (
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30">
                      Bloqueado
                    </span>
                  )}
                </h2>
                <p className="text-xs text-indigo-200/80">
                  {isMandatory
                    ? 'Acesso restrito exclusivamente aos usuários cadastrados'
                    : 'Controle de Acesso e Alternância de Usuário'}
                </p>
              </div>
            </div>

            {!isMandatory && onClose && (
              <button
                onClick={onClose}
                className="text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                Voltar
              </button>
            )}
          </div>
        </div>

        {/* Account Selector Cards */}
        <div className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2.5 uppercase tracking-wider">
              Selecione o Usuário de Acesso:
            </label>
            <div className="grid grid-cols-2 gap-3">
              {userAccounts.map((acc) => {
                const isSelected = acc.id === selectedUserId;
                const isAdmin = acc.role === 'admin';

                return (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => handleSelectAccount(acc)}
                    className={`p-3.5 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
                      isSelected
                        ? isAdmin
                          ? 'border-blue-600 dark:border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 shadow-sm ring-2 ring-blue-500/20'
                          : 'border-emerald-600 dark:border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 shadow-sm ring-2 ring-emerald-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-sm shadow-xs"
                        style={{ backgroundColor: acc.color }}
                      >
                        {acc.avatarInitials}
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          isAdmin
                            ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300'
                            : 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300'
                        }`}
                      >
                        {isAdmin ? 'Admin' : 'Usuário'}
                      </span>
                    </div>

                    <div className="mt-3">
                      <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {acc.name.split(' ')[0]}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {isAdmin ? 'Administrador' : 'Usuário Padrão'}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Role details box */}
          <div
            className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 transition-colors ${
              selectedAccount.role === 'admin'
                ? 'bg-blue-50/80 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/50 text-blue-900 dark:text-blue-200'
                : 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50 text-emerald-900 dark:text-emerald-200'
            }`}
          >
            {selectedAccount.role === 'admin' ? (
              <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            ) : (
              <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            )}
            <div>
              <div className="font-semibold">
                Perfil de {selectedAccount.name} ({selectedAccount.role === 'admin' ? 'Administrador' : 'Usuário'})
              </div>
              <div className="text-[11px] opacity-90 mt-0.5">
                {selectedAccount.role === 'admin'
                  ? 'Acesso total: gerencia membros, fontes de renda, alarmes, orçamentos, limites, relatórios e lançamentos.'
                  : 'Acesso operacional: gerencia lançamentos, confirma pagamentos, cadastra despesas no cartão e analisa gráficos.'}
              </div>
            </div>
          </div>

          {/* Form for Login */}
          {!isChangingPin ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    PIN / Senha de Acesso
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsChangingPin(true)}
                    className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <KeyRound className="w-3 h-3" />
                    Alterar PIN
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showPin ? 'text' : 'password'}
                    required
                    value={pinInput}
                    onChange={(e) => {
                      setPinInput(e.target.value);
                      setErrorMsg('');
                    }}
                    placeholder="Digite seu PIN (padrão 1234)"
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white tracking-widest text-center font-mono font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <div className="flex items-center justify-between mt-2">
                  <button
                    type="button"
                    onClick={handleQuickFillPin}
                    className="text-[11px] font-medium text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-300 flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>Preencher PIN inicial padrão (1234)</span>
                  </button>
                </div>
              </div>

              {errorMsg && (
                <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              <button
                type="submit"
                className={`w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-white shadow-sm transition-all flex items-center justify-center gap-2 ${
                  selectedAccount.role === 'admin'
                    ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
                    : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
                }`}
              >
                <LogIn className="w-4 h-4" />
                <span>Entrar como {selectedAccount.name} ({selectedAccount.role === 'admin' ? 'Admin' : 'Usuário'})</span>
              </button>

              {/* Security notice for locked mode */}
              {isMandatory && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
                  <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    Acesso restrito. Somente os usuários cadastrados (<strong>Eduardo Heckler</strong> e <strong>Graciela Heckler</strong>) possuem autorização de acesso ao sistema financeiro familiar.
                  </span>
                </div>
              )}

              {/* Logout button (when already logged in and opening modal to switch/logout) */}
              {currentUser && onLogout && !isMandatory && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      onLogout();
                      if (onClose) onClose();
                    }}
                    className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 transition-colors flex items-center justify-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Fazer Logout (Bloquear Aplicativo)</span>
                  </button>
                </div>
              )}
            </form>
          ) : (
            /* Change PIN form */
            <form onSubmit={handleSaveNewPin} className="space-y-3 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between pb-1 border-b border-slate-200 dark:border-slate-700">
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Alterar PIN de {selectedAccount.name}
                </span>
                <button
                  type="button"
                  onClick={() => setIsChangingPin(false)}
                  className="text-[11px] text-slate-500 hover:text-slate-700 dark:text-slate-400"
                >
                  Cancelar
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Novo PIN (mínimo 4 caracteres)
                </label>
                <input
                  type="password"
                  required
                  value={newPinInput}
                  onChange={(e) => setNewPinInput(e.target.value)}
                  placeholder="Novo PIN"
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Confirmar Novo PIN
                </label>
                <input
                  type="password"
                  required
                  value={confirmPinInput}
                  onChange={(e) => setConfirmPinInput(e.target.value)}
                  placeholder="Repita o novo PIN"
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white font-mono"
                />
              </div>

              {errorMsg && (
                <div className="p-2 rounded bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-[11px]">
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-1.5 px-3 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
              >
                Salvar Novo PIN
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

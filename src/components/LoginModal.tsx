import React, { useState } from 'react';
import {
  Shield,
  ShieldCheck,
  User,
  KeyRound,
  Lock,
  LogIn,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldAlert,
  Mail,
  ArrowLeft,
  Send,
  HelpCircle,
} from 'lucide-react';
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
  inactivityNotice?: string | null;
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
  inactivityNotice = null,
}) => {
  const [selectedUserId, setSelectedUserId] = useState<string>(
    currentUser?.id || userAccounts[0]?.id || 'usr_eduardo'
  );
  const [pinInput, setPinInput] = useState<string>('');
  const [showPin, setShowPin] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Estados do fluxo seguro "Esqueci Senha"
  const [isRecovering, setIsRecovering] = useState<boolean>(false);
  const [recoveryStep, setRecoveryStep] = useState<'email' | 'code' | 'new_pin'>('email');
  const [recoveryEmailInput, setRecoveryEmailInput] = useState<string>('');
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [enteredCode, setEnteredCode] = useState<string>('');
  const [recoveryNewPin, setRecoveryNewPin] = useState<string>('');
  const [recoveryConfirmPin, setRecoveryConfirmPin] = useState<string>('');
  const [codeNotificationMsg, setCodeNotificationMsg] = useState<string>('');

  if (!isOpen) return null;

  const selectedAccount = userAccounts.find((acc) => acc.id === selectedUserId) || userAccounts[0];

  const handleSelectAccount = (acc: UserAccount) => {
    setSelectedUserId(acc.id);
    setPinInput('');
    setErrorMsg('');
    setSuccessMsg('');
    setIsRecovering(false);
    setRecoveryStep('email');
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
      setErrorMsg('Senha/PIN incorreto. Caso tenha esquecido, utilize a opção "Esqueci minha senha" abaixo.');
    }
  };

  // Iniciar recuperação
  const handleStartRecovery = () => {
    setIsRecovering(true);
    setRecoveryStep('email');
    setErrorMsg('');
    setSuccessMsg('');
    setRecoveryEmailInput('');
    setEnteredCode('');
    setRecoveryNewPin('');
    setRecoveryConfirmPin('');
  };

  // Enviar código de recuperação para o e-mail
  const handleSendRecoveryCode = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const targetEmail = recoveryEmailInput.trim().toLowerCase();
    const registeredEmail = (selectedAccount.email || '').trim().toLowerCase();
    const fallbackEmail = '926187@pm.sc.gov.br';

    // Valida se corresponde ao e-mail cadastrado da conta selecionada
    const isMatch = targetEmail === registeredEmail || targetEmail === fallbackEmail;

    if (!isMatch) {
      setErrorMsg(`O e-mail informado não confere com o e-mail cadastrado para ${selectedAccount.name}. Verifique a dica abaixo.`);
      return;
    }

    // Gera código aleatório de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedCode(code);
    setRecoveryStep('code');
    setCodeNotificationMsg(`Código de recuperação enviado para ${targetEmail}. Código de segurança gerado: ${code} (Válido para esta sessão).`);
  };

  // Validar código de recuperação
  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (enteredCode.trim() !== generatedCode.trim()) {
      setErrorMsg('Código de verificação incorreto. Por favor, confira o código informado.');
      return;
    }

    setRecoveryStep('new_pin');
    setCodeNotificationMsg('');
  };

  // Salvar novo PIN após recuperação por e-mail
  const handleSaveRecoveredPin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (recoveryNewPin.trim().length < 4) {
      setErrorMsg('O novo PIN deve ter pelo menos 4 dígitos ou caracteres.');
      return;
    }

    if (recoveryNewPin.trim() !== recoveryConfirmPin.trim()) {
      setErrorMsg('A confirmação do PIN não coincide com o novo PIN digitado.');
      return;
    }

    if (onUpdatePin) {
      onUpdatePin(selectedAccount.id, recoveryNewPin.trim());
    }

    setSuccessMsg(`PIN de ${selectedAccount.name} redefinido com sucesso! Você já pode entrar com o novo PIN.`);
    setIsRecovering(false);
    setRecoveryStep('email');
    setPinInput(recoveryNewPin.trim());
    setRecoveryNewPin('');
    setRecoveryConfirmPin('');
  };

  // Helper para mascarar e-mail na dica (ex: 926***@pm.sc.gov.br)
  const maskEmail = (email: string) => {
    if (!email || !email.includes('@')) return 'e-mail cadastrado';
    const [user, domain] = email.split('@');
    if (user.length <= 3) return `${user.slice(0, 1)}***@${domain}`;
    return `${user.slice(0, 3)}***@${domain}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        {/* Top Header Card */}
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-28 h-28 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-inner ${
                  isMandatory
                    ? 'bg-amber-500/20 border border-amber-400/40 text-amber-300'
                    : 'bg-indigo-600/30 border border-indigo-400/30 text-indigo-300'
                }`}
              >
                {isRecovering ? (
                  <Mail className="w-5 h-5 text-indigo-300" />
                ) : isMandatory ? (
                  <Lock className="w-5 h-5" />
                ) : (
                  <ShieldCheck className="w-5 h-5" />
                )}
              </div>
              <div>
                <h2 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                  <span>{isRecovering ? 'Recuperação de Senha' : 'Heckler Family'}</span>
                  {isMandatory && !isRecovering && (
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30">
                      Protegido
                    </span>
                  )}
                </h2>
                <p className="text-xs text-indigo-200/80">
                  {isRecovering
                    ? 'Recuperação segura de PIN via e-mail cadastrado'
                    : isMandatory
                    ? 'Acesso restrito exclusivamente aos usuários cadastrados'
                    : 'Controle de Acesso Familiar'}
                </p>
              </div>
            </div>

            {/* Close button only allowed if not mandatory */}
            {!isMandatory && onClose && (
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
                title="Fechar"
              >
                &times;
              </button>
            )}
          </div>
        </div>

        {/* Inactivity timeout alert banner */}
        {inactivityNotice && (
          <div className="bg-amber-50 dark:bg-amber-950/50 border-b border-amber-200 dark:border-amber-900/60 p-3 px-6 flex items-center gap-2 text-xs text-amber-800 dark:text-amber-200">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>{inactivityNotice}</span>
          </div>
        )}

        <div className="p-6 space-y-5">
          {/* Se NÃO estiver no fluxo de recuperação: Tela Normal de Login */}
          {!isRecovering ? (
            <>
              {/* Account selection tabs */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Selecione o Usuário para Acessar:
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {userAccounts.map((account) => {
                    const isSelected = account.id === selectedUserId;
                    return (
                      <button
                        key={account.id}
                        type="button"
                        onClick={() => handleSelectAccount(account)}
                        className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-2.5 ${
                          isSelected
                            ? 'bg-indigo-50/90 dark:bg-indigo-950/60 border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs'
                            : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700/80'
                        }`}
                      >
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-2xs"
                          style={{ backgroundColor: account.color }}
                        >
                          {account.avatarInitials}
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                            {account.name}
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">
                            {account.role === 'admin' ? 'Administrador' : 'Usuário'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Formulário de PIN */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      PIN / Senha de Acesso
                    </label>
                    <button
                      type="button"
                      onClick={handleStartRecovery}
                      className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-medium"
                    >
                      <HelpCircle className="w-3 h-3" />
                      <span>Esqueci minha senha</span>
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
                      placeholder="Digite seu PIN de 4 dígitos"
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

                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5 flex items-center justify-between">
                    <span>Acesso pessoal e intransferível</span>
                    <span className="text-[10px] text-slate-400">Alteração do PIN disponível após login</span>
                  </p>
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
                  <span>
                    Entrar como {selectedAccount.name} ({selectedAccount.role === 'admin' ? 'Admin' : 'Usuário'})
                  </span>
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
            </>
          ) : (
            /* Fluxo Seguro: Esqueci Senha por E-mail Cadastrado */
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => {
                  setIsRecovering(false);
                  setErrorMsg('');
                  setCodeNotificationMsg('');
                }}
                className="text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Voltar ao login</span>
              </button>

              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs text-indigo-900 dark:text-indigo-200">
                <span className="font-bold block">Recuperação de Credencial de Acesso:</span>
                <span>Conta: <strong>{selectedAccount.name}</strong> ({selectedAccount.role === 'admin' ? 'Administrador' : 'Usuário'})</span>
              </div>

              {/* Etapa 1: Informar E-mail Cadastrado */}
              {recoveryStep === 'email' && (
                <form onSubmit={handleSendRecoveryCode} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Informe o E-mail Cadastrado da sua Conta *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="email"
                        required
                        value={recoveryEmailInput}
                        onChange={(e) => {
                          setRecoveryEmailInput(e.target.value);
                          setErrorMsg('');
                        }}
                        placeholder="ex: seu.email@exemplo.com"
                        className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                      Dica de segurança: e-mail registrado termina em <strong>{maskEmail(selectedAccount.email || '926187@pm.sc.gov.br')}</strong>
                    </p>
                  </div>

                  {errorMsg && (
                    <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-white bg-indigo-600 hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Enviar Código de Recuperação</span>
                  </button>
                </form>
              )}

              {/* Etapa 2: Validar Código de 6 Dígitos */}
              {recoveryStep === 'code' && (
                <form onSubmit={handleVerifyCode} className="space-y-3.5">
                  {codeNotificationMsg && (
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-200 flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold">Simulação de Envio de E-mail:</p>
                        <p>{codeNotificationMsg}</p>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Código de Verificação de 6 Dígitos *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={enteredCode}
                      onChange={(e) => {
                        setEnteredCode(e.target.value);
                        setErrorMsg('');
                      }}
                      placeholder="000000"
                      className="w-full px-3 py-2 text-center text-sm font-mono tracking-widest bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white font-bold"
                    />
                  </div>

                  {errorMsg && (
                    <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setRecoveryStep('email')}
                      className="w-1/3 py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                    >
                      Alterar E-mail
                    </button>
                    <button
                      type="submit"
                      className="w-2/3 py-2 px-3 rounded-xl font-semibold text-xs text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
                    >
                      Confirmar Código
                    </button>
                  </div>
                </form>
              )}

              {/* Etapa 3: Definir Novo PIN */}
              {recoveryStep === 'new_pin' && (
                <form onSubmit={handleSaveRecoveredPin} className="space-y-3.5">
                  <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Identidade confirmada! Defina o novo PIN de {selectedAccount.name}.</span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Novo PIN (mínimo 4 caracteres) *
                    </label>
                    <input
                      type="password"
                      required
                      value={recoveryNewPin}
                      onChange={(e) => {
                        setRecoveryNewPin(e.target.value);
                        setErrorMsg('');
                      }}
                      placeholder="Novo PIN de acesso"
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white font-mono tracking-widest text-center"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Confirmar Novo PIN *
                    </label>
                    <input
                      type="password"
                      required
                      value={recoveryConfirmPin}
                      onChange={(e) => {
                        setRecoveryConfirmPin(e.target.value);
                        setErrorMsg('');
                      }}
                      placeholder="Repita o novo PIN"
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white font-mono tracking-widest text-center"
                    />
                  </div>

                  {errorMsg && (
                    <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-xs"
                  >
                    Salvar Novo PIN e Concluir
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

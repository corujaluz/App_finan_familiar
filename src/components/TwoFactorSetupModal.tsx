import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, QrCode, Key, Copy, Check, AlertCircle, RefreshCw, Smartphone, Lock, Eye, EyeOff } from 'lucide-react';
import { UserAccount } from '../types/finance';
import { createTOTP, generateTOTPSetup, verifyTOTPToken, getTOTPTimeRemaining } from '../utils/totp';
import QRCode from 'qrcode';

interface TwoFactorSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount;
  onUpdate2FA: (userId: string, enabled: boolean, secret?: string, backupCodes?: string[]) => void;
}

export const TwoFactorSetupModal: React.FC<TwoFactorSetupModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdate2FA,
}) => {
  const [currentSecret, setCurrentSecret] = useState<string>(currentUser.twoFactorSecret || 'KRUGS4ZANFZSAYJAONSWG4TFOR2HI2DF');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [copiedKey, setCopiedKey] = useState<boolean>(false);
  const [copiedCodes, setCopiedCodes] = useState<boolean>(false);
  const [testCode, setTestCode] = useState<string>('');
  const [validationResult, setValidationResult] = useState<{ success: boolean; message: string } | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(getTOTPTimeRemaining());
  const [confirmPin, setConfirmPin] = useState<string>('');
  const [showPin, setShowPin] = useState<boolean>(false);
  const [pinError, setPinError] = useState<string>('');
  const [isGeneratingNew, setIsGeneratingNew] = useState<boolean>(false);
  const [backupCodes, setBackupCodes] = useState<string[]>(
    currentUser.twoFactorBackupCodes || ['1492-4820', '3912-7401', '8294-1940', '5820-3914', '7492-1049']
  );

  const isEnabled = Boolean(currentUser.twoFactorEnabled);

  // Gera o QR Code visual baseado no segredo atual
  useEffect(() => {
    if (!isOpen) return;

    const secret = currentUser.twoFactorSecret || currentSecret;
    const totp = createTOTP(currentUser.email, secret);
    const uri = totp.toString();

    QRCode.toDataURL(uri, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 220,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((url) => setQrCodeUrl(url))
      .catch((err) => console.error('Erro ao renderizar QR Code:', err));
  }, [isOpen, currentUser.twoFactorSecret, currentSecret, currentUser.email]);

  // Atualiza o relógio regressivo do TOTP a cada segundo
  useEffect(() => {
    if (!isOpen) return;
    const timer = setInterval(() => {
      setSecondsRemaining(getTOTPTimeRemaining());
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopySecret = () => {
    navigator.clipboard.writeText(currentSecret);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2500);
  };

  const handleCopyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'));
    setCopiedCodes(true);
    setTimeout(() => setCopiedCodes(false), 2500);
  };

  const handleGenerateNewSecret = async () => {
    setIsGeneratingNew(true);
    try {
      const setup = await generateTOTPSetup(currentUser.email);
      setCurrentSecret(setup.secret);
      setQrCodeUrl(setup.qrCodeDataUrl);
      setBackupCodes(setup.backupCodes);
      setValidationResult(null);
      setTestCode('');
    } catch (err) {
      console.error('Falha ao gerar nova chave 2FA:', err);
    } finally {
      setIsGeneratingNew(false);
    }
  };

  const handleTestCode = (e: React.FormEvent) => {
    e.preventDefault();
    setPinError('');

    const isValid = verifyTOTPToken(currentSecret, testCode, currentUser.email);
    if (isValid) {
      setValidationResult({
        success: true,
        message: 'Código do Google Authenticator validado com sucesso! A chave está funcionando perfeitamente.',
      });
    } else {
      setValidationResult({
        success: false,
        message: 'Código inválido ou expirado. Verifique se a hora do seu celular está configurada como automática.',
      });
    }
  };

  const handleToggleEnable = (enableTarget: boolean) => {
    setPinError('');

    // Exige verificação do PIN atual por segurança
    if (confirmPin.trim() !== currentUser.pin) {
      setPinError('PIN de acesso incorreto. Por favor, digite seu PIN atual para confirmar a alteração.');
      return;
    }

    if (enableTarget && !validationResult?.success) {
      // Se for ativar, testa o código informado
      const isValid = verifyTOTPToken(currentSecret, testCode, currentUser.email);
      if (!isValid) {
        setPinError('Antes de ativar, insira e teste o código de 6 dígitos gerado pelo Google Authenticator para garantir que seu app está sincronizado.');
        return;
      }
    }

    onUpdate2FA(currentUser.id, enableTarget, currentSecret, backupCodes);
    setConfirmPin('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Google Authenticator (2FA)
                {isEnabled ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                    Ativo
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                    Pendente
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Autenticação em duas etapas para {currentUser.name} ({currentUser.email})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Status banner */}
          <div className={`p-3.5 rounded-xl border text-xs flex items-start gap-3 ${
            isEnabled
              ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50 text-emerald-900 dark:text-emerald-200'
              : 'bg-indigo-50/70 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-900/50 text-indigo-900 dark:text-indigo-200'
          }`}>
            <Smartphone className="w-5 h-5 shrink-0 mt-0.5 text-indigo-600 dark:text-indigo-400" />
            <div>
              <strong className="block font-semibold">
                {isEnabled
                  ? 'Sua conta está protegida por duas etapas!'
                  : 'Aumente a segurança da sua conta bancária familiar'}
              </strong>
              <p className="mt-0.5 text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                Ao entrar, além do seu PIN, o sistema solicitará o código temporário de 6 dígitos gerado pelo aplicativo <strong>Google Authenticator</strong> no seu celular.
              </p>
            </div>
          </div>

          {/* Passo 1: Escanear o QR Code */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Passo 1: Escanear o QR Code no seu celular
              </span>
              <button
                type="button"
                onClick={handleGenerateNewSecret}
                disabled={isGeneratingNew}
                className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                title="Gerar uma nova chave de segurança"
              >
                <RefreshCw className={`w-3 h-3 ${isGeneratingNew ? 'animate-spin' : ''}`} />
                <span>Nova chave</span>
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 pt-1">
              {/* QR Code Canvas */}
              <div className="p-2.5 bg-white rounded-xl shadow-xs border border-slate-200 dark:border-slate-700 shrink-0">
                {qrCodeUrl ? (
                  <img
                    src={qrCodeUrl}
                    alt="QR Code Google Authenticator"
                    className="w-40 h-40 object-contain rounded-lg"
                  />
                ) : (
                  <div className="w-40 h-40 flex items-center justify-center text-slate-400 text-xs">
                    Carregando QR...
                  </div>
                )}
              </div>

              {/* Instruções */}
              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                <p>
                  1. Abra o <strong>Google Authenticator</strong> no celular.
                </p>
                <p>
                  2. Toque no botão <strong>+</strong> e selecione <strong>Escanear código QR</strong>.
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Ou digite manualmente a chave de configuração abaixo:
                </p>

                {/* Chave manual Base32 */}
                <div className="flex items-center gap-1.5 p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-[11px]">
                  <Key className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate flex-1 tracking-wider text-slate-900 dark:text-white select-all">
                    {currentSecret}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopySecret}
                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors shrink-0"
                    title="Copiar chave"
                  >
                    {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                {copiedKey && (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block">
                    Chave copiada para a área de transferência!
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Passo 2: Testar Código do Aplicativo */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                Passo 2: Testar o código dinâmico de 6 dígitos
              </span>
              <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <span>Ciclo TOTP:</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">{secondsRemaining}s</span>
              </span>
            </div>

            <form onSubmit={handleTestCode} className="flex gap-2">
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={testCode}
                onChange={(e) => {
                  setTestCode(e.target.value.replace(/\D/g, ''));
                  setValidationResult(null);
                }}
                placeholder="Ex: 123456"
                className="w-36 text-center tracking-[0.3em] font-mono font-bold text-base px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
              />
              <button
                type="submit"
                disabled={testCode.length !== 6}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-xs"
              >
                Validar Código
              </button>
            </form>

            {validationResult && (
              <div className={`p-2.5 rounded-lg text-xs flex items-center gap-2 border ${
                validationResult.success
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                  : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
              }`}>
                {validationResult.success ? <Check className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
                <span>{validationResult.message}</span>
              </div>
            )}
          </div>

          {/* Códigos de Recuperação Reserva */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                Códigos de Backup / Emergência
              </span>
              <button
                type="button"
                onClick={handleCopyBackupCodes}
                className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-medium"
              >
                {copiedCodes ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copiedCodes ? 'Copiados!' : 'Copiar Códigos'}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Guarde estes códigos em local seguro. Cada um pode ser usado uma única vez caso você perca o celular:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 font-mono text-[11px]">
              {backupCodes.map((code, idx) => (
                <div
                  key={idx}
                  className="p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-center text-slate-700 dark:text-slate-300 font-semibold select-all"
                >
                  {code}
                </div>
              ))}
            </div>
          </div>

          {/* Confirmação com PIN e Botão de Ativação / Desativação */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Confirme seu PIN atual de 4 dígitos para autorizar:
              </label>
              <div className="relative w-44">
                <input
                  type={showPin ? 'text' : 'password'}
                  inputMode="numeric"
                  maxLength={4}
                  value={confirmPin}
                  onChange={(e) => {
                    setConfirmPin(e.target.value.replace(/\D/g, ''));
                    setPinError('');
                  }}
                  placeholder="PIN atual"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white tracking-widest font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-0.5"
                >
                  {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {pinError && (
              <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{pinError}</span>
              </div>
            )}

            <div className="flex items-center gap-3 pt-1">
              {!isEnabled ? (
                <button
                  type="button"
                  onClick={() => handleToggleEnable(true)}
                  disabled={confirmPin.length !== 4}
                  className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-xs flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Ativar Google Authenticator (2FA)</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleToggleEnable(false)}
                  disabled={confirmPin.length !== 4}
                  className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 border border-rose-300 dark:border-rose-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  <span>Desativar Autenticação em Duas Etapas</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

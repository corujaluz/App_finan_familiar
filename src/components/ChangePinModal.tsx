import React, { useState } from 'react';
import { X, KeyRound, Lock, ShieldCheck, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { UserAccount } from '../types/finance';

interface ChangePinModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount;
  onUpdatePin: (userId: string, newPin: string) => void;
}

export const ChangePinModal: React.FC<ChangePinModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdatePin,
}) => {
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPins, setShowPins] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // Validar PIN atual
    if (currentPin.trim() !== currentUser.pin) {
      setErrorMsg('O PIN atual informado está incorreto.');
      return;
    }

    // Validar novo PIN
    if (newPin.trim().length < 4) {
      setErrorMsg('O novo PIN deve conter no mínimo 4 dígitos ou caracteres.');
      return;
    }

    // Validar confirmação
    if (newPin.trim() !== confirmPin.trim()) {
      setErrorMsg('A confirmação do PIN não coincide com o novo PIN digitado.');
      return;
    }

    if (newPin.trim() === currentPin.trim()) {
      setErrorMsg('O novo PIN não pode ser idêntico ao PIN atual.');
      return;
    }

    onUpdatePin(currentUser.id, newPin.trim());
    setSuccessMsg('PIN atualizado com sucesso! Seu novo PIN de acesso já está ativo.');

    setTimeout(() => {
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
      setSuccessMsg('');
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>Alterar PIN de Acesso</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                  Autenticado
                </span>
              </h3>
              <p className="text-xs text-indigo-200/80">
                Usuário: {currentUser.name} ({currentUser.role === 'admin' ? 'Administrador' : 'Usuário'})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 rounded-xl text-xs text-indigo-900 dark:text-indigo-200 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
            <span>
              Para sua segurança, a alteração de credencial exige confirmação do seu <strong>PIN atual</strong> antes de registrar a nova senha.
            </span>
          </div>

          {/* PIN Atual */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              PIN Atual *
            </label>
            <div className="relative">
              <input
                type={showPins ? 'text' : 'password'}
                required
                value={currentPin}
                onChange={(e) => {
                  setCurrentPin(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="Digite seu PIN atual"
                className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white tracking-widest font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPins(!showPins)}
                className="absolute right-3 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showPins ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Novo PIN */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Novo PIN (mínimo 4 dígitos) *
            </label>
            <input
              type={showPins ? 'text' : 'password'}
              required
              value={newPin}
              onChange={(e) => {
                setNewPin(e.target.value);
                setErrorMsg('');
              }}
              placeholder="Digite o novo PIN"
              className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white tracking-widest font-mono"
            />
          </div>

          {/* Confirmar Novo PIN */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Confirmar Novo PIN *
            </label>
            <input
              type={showPins ? 'text' : 'password'}
              required
              value={confirmPin}
              onChange={(e) => {
                setConfirmPin(e.target.value);
                setErrorMsg('');
              }}
              placeholder="Repita o novo PIN"
              className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white tracking-widest font-mono"
            />
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all"
            >
              Salvar Novo PIN
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

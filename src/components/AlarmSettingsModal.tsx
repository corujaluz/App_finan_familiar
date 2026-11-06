import React, { useState } from 'react';
import {
  X,
  Bell,
  Volume2,
  VolumeX,
  Play,
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react';
import { AlarmSettings, Transaction } from '../types/finance';
import { playAlarmSound } from '../utils/soundAlarm';
import { formatBRL, formatDateBR } from '../utils/formatters';

interface AlarmSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AlarmSettings;
  onSaveSettings: (newSettings: AlarmSettings) => void;
  triggeredBills: { overdue: Transaction[]; upcoming: Transaction[] };
  onOpenConfirmPayment: (tx: Transaction) => void;
}

export const AlarmSettingsModal: React.FC<AlarmSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  triggeredBills,
  onOpenConfirmPayment,
}) => {
  if (!isOpen) return null;

  const [enabled, setEnabled] = useState(settings.enabled);
  const [alertOverdue, setAlertOverdue] = useState(settings.alertOverdue);
  const [alertUpcoming, setAlertUpcoming] = useState(settings.alertUpcoming);
  const [upcomingDaysThreshold, setUpcomingDaysThreshold] = useState(
    settings.upcomingDaysThreshold.toString()
  );
  const [repeatIntervalMinutes, setRepeatIntervalMinutes] = useState(
    settings.repeatIntervalMinutes.toString()
  );
  const [soundType, setSoundType] = useState<AlarmSettings['soundType']>(settings.soundType);
  const [volume, setVolume] = useState(settings.volume);
  const [isPlayingTest, setIsPlayingTest] = useState(false);

  const handleTestSound = () => {
    setIsPlayingTest(true);
    playAlarmSound(soundType, volume);
    setTimeout(() => setIsPlayingTest(false), 1200);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedDays = parseInt(upcomingDaysThreshold, 10) || 3;
    const parsedRepeat = parseInt(repeatIntervalMinutes, 10) || 0;

    onSaveSettings({
      enabled,
      alertOverdue,
      alertUpcoming,
      upcomingDaysThreshold: Math.max(1, Math.min(30, parsedDays)),
      repeatIntervalMinutes: Math.max(0, Math.min(240, parsedRepeat)),
      soundType,
      volume,
    });
    onClose();
  };

  const totalAlertBills =
    (alertOverdue ? triggeredBills.overdue.length : 0) +
    (alertUpcoming ? triggeredBills.upcoming.length : 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Configuração do Alarme Sonoro
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Avisos auditivos para contas a vencer e vencidas da família
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

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-5">
          {/* Master Enable Toggle */}
          <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl">
            <div className="flex items-center gap-3">
              {enabled ? (
                <Volume2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <VolumeX className="w-5 h-5 text-slate-400" />
              )}
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  Alarme Sonoro Ativado
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Emitir avisos sonoros no navegador para contas pendentes
                </span>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600" />
            </label>
          </div>

          {/* Trigger Conditions */}
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Disparar Alarme Quando:
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={alertOverdue}
                  onChange={(e) => setAlertOverdue(e.target.checked)}
                  className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <span className="text-xs font-semibold text-slate-900 dark:text-white block">
                    Contas Vencidas / Em Atraso
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Disparo prioritário para evitar multas e juros
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={alertUpcoming}
                  onChange={(e) => setAlertUpcoming(e.target.checked)}
                  className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <span className="text-xs font-semibold text-slate-900 dark:text-white block">
                    Contas a Vencer
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Avisar antes da data de vencimento
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Editable Threshold: Days Notice */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl space-y-4">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              <span>Período de Disparo para Contas a Vencer (Editável)</span>
            </h4>

            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-slate-700 dark:text-slate-300 font-medium">
                  Antecedência do Alarme:
                </span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {upcomingDaysThreshold} dia{parseInt(upcomingDaysThreshold, 10) > 1 ? 's' : ''} antes
                </span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="1"
                  max="30"
                  required
                  value={upcomingDaysThreshold}
                  onChange={(e) => setUpcomingDaysThreshold(e.target.value)}
                  className="w-20 px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg dark:text-white font-mono tabular-nums"
                />
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Disparar quando faltarem até esse número de dias para o vencimento.
                </span>
              </div>
            </div>

            {/* Editable Repetition Interval */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-700/80">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mb-2">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>Intervalo de Repetição do Disparo do Alarme (Editável)</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1">
                    Repetir a cada (minutos):
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="240"
                      step="5"
                      value={repeatIntervalMinutes}
                      onChange={(e) => setRepeatIntervalMinutes(e.target.value)}
                      className="w-24 px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg dark:text-white font-mono tabular-nums"
                    />
                    <span className="text-xs text-slate-500 dark:text-slate-400">minutos</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-1">
                    (Use 0 para soar apenas uma vez ao entrar no aplicativo)
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 self-center">
                  {[0, 15, 30, 60].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setRepeatIntervalMinutes(mins.toString())}
                      className={`px-2 py-1 text-[11px] font-medium rounded border transition-colors ${
                        repeatIntervalMinutes === mins.toString()
                          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {mins === 0 ? 'Único' : `${mins} min`}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sound Type & Volume */}
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Tom do Alarme & Volume
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                { id: 'gentle_chime', label: 'Sino Suave (Chime)', desc: 'Harmônico e calmo' },
                { id: 'digital_alert', label: 'Alerta Digital', desc: 'Notificação moderna' },
                { id: 'urgent_beep', label: 'Bip Insistente', desc: 'Alerta para urgências' },
              ].map((sound) => (
                <button
                  key={sound.id}
                  type="button"
                  onClick={() => {
                    setSoundType(sound.id as AlarmSettings['soundType']);
                    playAlarmSound(sound.id as AlarmSettings['soundType'], volume);
                  }}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    soundType === sound.id
                      ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-semibold shadow-2xs'
                      : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                  }`}
                >
                  <span className="text-xs block">{sound.label}</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                    {sound.desc}
                  </span>
                </button>
              ))}
            </div>

            {/* Volume slider & Test button */}
            <div className="flex items-center gap-4 pt-2">
              <div className="flex-1 flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-slate-400" />
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-full accent-emerald-600"
                />
                <span className="text-xs font-mono text-slate-500 w-8 tabular-nums">
                  {Math.round(volume * 100)}%
                </span>
              </div>

              <button
                type="button"
                onClick={handleTestSound}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors shrink-0"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{isPlayingTest ? 'Tocando...' : 'Testar Som'}</span>
              </button>
            </div>
          </div>

          {/* Current Triggered Bills Preview */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-500" />
                <span>Contas que Acionam o Alarme Agora ({totalAlertBills}):</span>
              </span>
            </div>

            {totalAlertBills === 0 ? (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 py-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Nenhuma conta pendente no período do alarme.
              </p>
            ) : (
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {alertOverdue &&
                  triggeredBills.overdue.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-2 rounded bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs"
                    >
                      <div>
                        <span className="font-semibold text-rose-800 dark:text-rose-300">
                          {tx.title}
                        </span>
                        <span className="text-[10px] text-rose-600 dark:text-rose-400 block">
                          Venceu em {formatDateBR(tx.dueDate)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-rose-700 dark:text-rose-300 tabular-nums">
                          {formatBRL(tx.amount)}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onOpenConfirmPayment(tx);
                          }}
                          className="px-2 py-0.5 text-[10px] font-semibold bg-rose-600 text-white rounded hover:bg-rose-700"
                        >
                          Dar Baixa
                        </button>
                      </div>
                    </div>
                  ))}

                {alertUpcoming &&
                  triggeredBills.upcoming.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-2 rounded bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs"
                    >
                      <div>
                        <span className="font-semibold text-amber-900 dark:text-amber-300">
                          {tx.title}
                        </span>
                        <span className="text-[10px] text-amber-700 dark:text-amber-400 block">
                          Vence em {formatDateBR(tx.dueDate)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-amber-800 dark:text-amber-300 tabular-nums">
                          {formatBRL(tx.amount)}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onOpenConfirmPayment(tx);
                          }}
                          className="px-2 py-0.5 text-[10px] font-semibold bg-amber-600 text-white rounded hover:bg-amber-700"
                        >
                          Dar Baixa
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg shadow-sm transition-all"
            >
              Salvar Configurações do Alarme
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

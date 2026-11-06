import React, { useState } from 'react';
import { Bell, Volume2, VolumeX, AlertTriangle, ShieldAlert, CheckCircle, Settings, Play } from 'lucide-react';
import { AlarmSettings, Transaction } from '../types/finance';
import { formatBRL, formatDateBR } from '../utils/formatters';

interface ActiveAlarmBannerProps {
  settings: AlarmSettings;
  triggeredBills: { overdue: Transaction[]; upcoming: Transaction[] };
  onOpenAlarmSettings: () => void;
  onPlayAlarmManual: () => void;
  onMuteSession: () => void;
  onConfirmBill: (tx: Transaction) => void;
  isMuted: boolean;
}

export const ActiveAlarmBanner: React.FC<ActiveAlarmBannerProps> = ({
  settings,
  triggeredBills,
  onOpenAlarmSettings,
  onPlayAlarmManual,
  onMuteSession,
  onConfirmBill,
  isMuted,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const totalOverdue = triggeredBills.overdue.length;
  const totalUpcoming = triggeredBills.upcoming.length;
  const totalTriggered = (settings.alertOverdue ? totalOverdue : 0) + (settings.alertUpcoming ? totalUpcoming : 0);

  if (!settings.enabled || totalTriggered === 0) return null;

  return (
    <aside
      aria-label="Alarme sonoro e aviso de contas"
      className="mb-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl p-3 sm:p-4 shadow-sm transition-all"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <Bell className="w-5 h-5 animate-bounce" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                Alarme de Contas Ativo
              </span>
              <span className="text-[11px] text-amber-700 dark:text-amber-400">
                · Período de disparo: {settings.upcomingDaysThreshold} dias de antecedência
                {settings.repeatIntervalMinutes > 0 && ` · repete a cada ${settings.repeatIntervalMinutes} min`}
              </span>
            </div>
            <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5">
              {totalOverdue > 0 && (
                <strong className="text-rose-600 dark:text-rose-400 mr-2">
                  {totalOverdue} conta(s) em atraso!
                </strong>
              )}
              {totalUpcoming > 0 && (
                <span>
                  {totalUpcoming} conta(s) a vencer nos próximos {settings.upcomingDaysThreshold} dias.
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          {/* Play/Repeat Sound Button */}
          <button
            onClick={onPlayAlarmManual}
            title="Ouvir Alarme Sonoro"
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-amber-800 dark:text-amber-200 bg-white dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-amber-900/40 border border-amber-200 dark:border-amber-700 rounded-lg transition-colors"
          >
            <Volume2 className="w-3.5 h-3.5 text-amber-600" />
            <span>Tocar Alarme</span>
          </button>

          {/* Mute toggle for this session */}
          <button
            onClick={onMuteSession}
            title={isMuted ? 'Alarme silenciado nesta sessão' : 'Silenciar alarme temporariamente'}
            className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
              isMuted
                ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-amber-200 dark:border-amber-700 hover:bg-slate-50'
            }`}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-600" /> : <Volume2 className="w-3.5 h-3.5" />}
            <span>{isMuted ? 'Silenciado' : 'Silenciar'}</span>
          </button>

          {/* Expand Details */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-2.5 py-1.5 text-xs font-medium text-amber-800 dark:text-amber-200 bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-700 hover:bg-slate-50 rounded-lg transition-colors"
          >
            {isExpanded ? 'Ocultar Detalhes' : 'Ver Contas'}
          </button>

          {/* Settings shortcut */}
          <button
            onClick={onOpenAlarmSettings}
            title="Configurar Período e Som do Alarme"
            className="p-1.5 text-amber-800 dark:text-amber-200 hover:bg-amber-200/60 dark:hover:bg-amber-900/60 rounded-lg transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expanded list of accounts */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-amber-200 dark:border-amber-800/80 space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {triggeredBills.overdue.map((tx) => (
              <div
                key={tx.id}
                className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-rose-200 dark:border-rose-900 flex items-center justify-between text-xs"
              >
                <div className="overflow-hidden mr-2">
                  <span className="font-bold text-rose-800 dark:text-rose-300 block truncate">
                    {tx.title}
                  </span>
                  <span className="text-[10px] text-rose-600 dark:text-rose-400">
                    Atrasada (Venceu {formatDateBR(tx.dueDate)})
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                    {formatBRL(tx.amount)}
                  </span>
                  <button
                    onClick={() => onConfirmBill(tx)}
                    className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded"
                  >
                    Pagar
                  </button>
                </div>
              </div>
            ))}

            {triggeredBills.upcoming.map((tx) => (
              <div
                key={tx.id}
                className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-amber-200 dark:border-amber-800 flex items-center justify-between text-xs"
              >
                <div className="overflow-hidden mr-2">
                  <span className="font-bold text-amber-900 dark:text-amber-200 block truncate">
                    {tx.title}
                  </span>
                  <span className="text-[10px] text-amber-700 dark:text-amber-400">
                    Vence em {formatDateBR(tx.dueDate)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                    {formatBRL(tx.amount)}
                  </span>
                  <button
                    onClick={() => onConfirmBill(tx)}
                    className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded"
                  >
                    Pagar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
};

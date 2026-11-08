import React, { useState } from 'react';
import {
  X,
  History,
  CheckCircle2,
  Clock,
  Save,
  Filter,
  User,
  Shield,
  CreditCard,
  Briefcase,
  DollarSign,
  AlertCircle,
  FileText,
  Activity,
} from 'lucide-react';
import { ChangeLogEntry } from '../types/finance';

interface AuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  changeLogs: ChangeLogEntry[];
  lastSavedTime: string | null;
  hasUnsavedChanges: boolean;
  onSaveNow: () => void;
  isSaving: boolean;
}

export const AuditLogModal: React.FC<AuditLogModalProps> = ({
  isOpen,
  onClose,
  changeLogs = [],
  lastSavedTime,
  hasUnsavedChanges,
  onSaveNow,
  isSaving,
}) => {
  const [selectedEntityFilter, setSelectedEntityFilter] = useState<string>('all');

  if (!isOpen) return null;

  const filteredLogs = changeLogs.filter((log) => {
    if (selectedEntityFilter === 'all') return true;
    return log.entity === selectedEntityFilter;
  });

  const getEntityIcon = (entity: string) => {
    switch (entity) {
      case 'Cartão de Crédito':
        return <CreditCard className="w-3.5 h-3.5 text-indigo-500" />;
      case 'Fonte de Renda':
        return <Briefcase className="w-3.5 h-3.5 text-emerald-500" />;
      case 'Segurança':
        return <Shield className="w-3.5 h-3.5 text-amber-500" />;
      case 'Lançamento':
        return <DollarSign className="w-3.5 h-3.5 text-blue-500" />;
      default:
        return <Activity className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'create':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'payment':
        return 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'delete':
        return 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800';
      case 'pin_change':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'save':
        return 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800';
      default:
        return 'bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 flex items-center justify-center">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Registro de Modificações do Aplicativo</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Tempo Real
                </span>
              </h2>
              <p className="text-xs text-indigo-200/80">
                Acompanhe todas as alterações salvas e dados modificados no sistema
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

        {/* Sync & Status Banner */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className={`w-3 h-3 rounded-full shrink-0 ${hasUnsavedChanges ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  {hasUnsavedChanges
                    ? 'Modificações recentes pendentes de gravação'
                    : 'Todas as modificações sincronizadas e salvas no banco'}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Último salvamento: {lastSavedTime ? `hoje às ${lastSavedTime}` : 'dados iniciais da sessão'}
                </span>
              </div>
            </div>

            {hasUnsavedChanges && (
              <button
                onClick={onSaveNow}
                disabled={isSaving}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Gravando...' : 'Salvar Alterações Agora'}</span>
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 overflow-x-auto pb-0.5">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3" />
              Filtrar:
            </span>
            {[
              { id: 'all', label: `Todas (${changeLogs.length})` },
              { id: 'Lançamento', label: 'Lançamentos' },
              { id: 'Cartão de Crédito', label: 'Cartão' },
              { id: 'Fonte de Renda', label: 'Rendas' },
              { id: 'Segurança', label: 'Segurança / PIN' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setSelectedEntityFilter(f.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors shrink-0 ${
                  selectedEntityFilter === f.id
                    ? 'bg-indigo-600 text-white font-semibold shadow-2xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Timeline Body */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12">
              <History className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Nenhuma modificação registrada com o filtro selecionado.
              </p>
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-2xs space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded-md bg-slate-100 dark:bg-slate-800">
                      {getEntityIcon(log.entity)}
                    </span>
                    <strong className="text-slate-900 dark:text-white font-semibold">
                      {log.entity}
                    </strong>
                    <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase border ${getActionBadgeColor(log.action)}`}>
                      {log.actionLabel}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-slate-400 text-[11px] tabular-nums">
                    <Clock className="w-3 h-3" />
                    <span>{log.timestamp}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed pl-1">
                  {log.details}
                </p>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <User className="w-3 h-3 text-slate-400" />
                    <span>Responsável: <strong>{log.user}</strong></span>
                  </span>

                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{log.status === 'saved' ? `Salvo às ${log.savedAt || log.timestamp}` : 'Gravado em sessão'}</span>
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 shrink-0">
          <span>{filteredLogs.length} eventos registrados em tempo real</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

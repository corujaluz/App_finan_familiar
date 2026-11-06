import React from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { formatMonthYear } from '../utils/formatters';

interface MonthSelectorProps {
  currentMonthKey: string; // "YYYY-MM"
  onChangeMonth: (newMonthKey: string) => void;
}

export const MonthSelector: React.FC<MonthSelectorProps> = ({ currentMonthKey, onChangeMonth }) => {
  const [yearStr, monthStr] = currentMonthKey.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);

  const todayKey = new Date().toISOString().slice(0, 7);
  const isCurrentMonth = currentMonthKey === todayKey;

  const handlePrevMonth = () => {
    let newYear = year;
    let newMonth = month - 1;
    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }
    onChangeMonth(`${newYear}-${String(newMonth).padStart(2, '0')}`);
  };

  const handleNextMonth = () => {
    let newYear = year;
    let newMonth = month + 1;
    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }
    onChangeMonth(`${newYear}-${String(newMonth).padStart(2, '0')}`);
  };

  const handleResetToCurrent = () => {
    onChangeMonth(todayKey);
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-3 border-b border-slate-200 dark:border-slate-800">
      <div className="flex items-center gap-2">
        <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-0.5 shadow-2xs">
          <button
            onClick={handlePrevMonth}
            aria-label="Mês anterior"
            className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-md transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 px-3 py-1 font-semibold text-sm sm:text-base text-slate-900 dark:text-white min-w-[170px] justify-center">
            <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{formatMonthYear(currentMonthKey)}</span>
          </div>

          <button
            onClick={handleNextMonth}
            aria-label="Próximo mês"
            className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-md transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {!isCurrentMonth && (
          <button
            onClick={handleResetToCurrent}
            className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 px-2 py-1 rounded hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
          >
            Voltar para o Mês Atual
          </button>
        )}
      </div>

      <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
        <span>Período de Referência Contábil</span>
      </div>
    </div>
  );
};

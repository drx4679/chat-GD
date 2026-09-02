'use client';

import { useOrderCounts } from '@/hooks/useOrderCounts';

interface Props {
  compact?: boolean;
}

export default function OrderCounters({ compact = false }: Props) {
  const counts = useOrderCounts();

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        {/* Total */}
        <div 
          className="flex items-center space-x-1 bg-gray-50 border border-gray-200/80 text-gray-700 px-2 py-1 rounded-lg text-xs font-semibold"
          title="Total commandes"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <span className="text-[11px]">{counts.total}</span>
        </div>

        {/* Validées */}
        <div 
          className="flex items-center space-x-1 bg-emerald-50 border border-emerald-200/70 text-emerald-700 px-2 py-1 rounded-lg text-xs font-semibold"
          title="Commandes validées"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-[11px]">{counts.confirmed}</span>
        </div>

        {/* En attente / Nouvelles */}
        <div 
          className={`flex items-center space-x-1 border px-2 py-1 rounded-lg text-xs font-semibold relative ${
            counts.pending > 0 
              ? 'bg-amber-50 border-amber-300 text-amber-800 ring-1 ring-amber-200/60' 
              : 'bg-amber-50/70 border-amber-200/70 text-amber-700'
          }`}
          title="Commandes en attente / Nouvelles"
        >
          {counts.pending > 0 ? (
            <span className="relative flex h-2 w-2 mr-0.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          <span className="text-[11px]">{counts.pending}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 w-full">
      {/* Total */}
      <div 
        className="flex-1 flex items-center justify-center space-x-1.5 bg-gray-50/90 border border-gray-200/70 text-gray-700 px-2 py-1.5 rounded-lg text-xs font-medium transition-all"
        title="Total des commandes"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
        <span className="text-[11px] text-gray-500 hidden sm:inline">Total</span>
        <span className="font-bold text-gray-900">{counts.total}</span>
      </div>

      {/* Validées */}
      <div 
        className="flex-1 flex items-center justify-center space-x-1.5 bg-emerald-50/80 border border-emerald-200/70 text-emerald-700 px-2 py-1.5 rounded-lg text-xs font-medium transition-all"
        title="Commandes validées"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
        <span className="text-[11px] text-emerald-600 hidden sm:inline">Validées</span>
        <span className="font-bold">{counts.confirmed}</span>
      </div>

      {/* En attente / Nouvelles avec marqueur animé */}
      <div 
        className={`flex-1 flex items-center justify-center space-x-1.5 border px-2 py-1.5 rounded-lg text-xs font-medium transition-all relative ${
          counts.pending > 0 
            ? 'bg-amber-50 border-amber-300 text-amber-800 shadow-2xs' 
            : 'bg-amber-50/80 border-amber-200/70 text-amber-700'
        }`}
        title="Commandes en attente de traitement"
      >
        {counts.pending > 0 ? (
          <span className="relative flex h-2 w-2 flex-shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
        <span className="text-[11px] text-amber-700 hidden sm:inline font-medium">Attente</span>
        <span className="font-bold">{counts.pending}</span>
      </div>
    </div>
  );
}

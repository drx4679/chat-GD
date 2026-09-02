'use client';

import { useState, useEffect, useRef } from 'react';
import { useOrders } from '@/hooks/useOrders';
import type { Order, OrderStatus } from '@/types/database';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelectOrder: (orderNumber: string) => void;
}

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  pending: { label: 'En attente', color: 'text-yellow-700', bg: 'bg-yellow-100' },
  confirmed: { label: 'Confirmée', color: 'text-blue-700', bg: 'bg-blue-100' },
  paid: { label: 'Payée', color: 'text-green-700', bg: 'bg-green-100' },
  processing: { label: 'En préparation', color: 'text-indigo-700', bg: 'bg-indigo-100' },
  shipped: { label: 'Expédiée', color: 'text-purple-700', bg: 'bg-purple-100' },
  delivered: { label: 'Livrée', color: 'text-emerald-700', bg: 'bg-emerald-100' },
  cancelled: { label: 'Annulée', color: 'text-red-700', bg: 'bg-red-100' },
  refunded: { label: 'Remboursée', color: 'text-gray-700', bg: 'bg-gray-100' },
};

export default function OrderSearchModal({ isOpen, onClose, onSelectOrder }: Props) {
  const { orders, loading, searchOrders } = useOrders();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery('');
    }
  }, [isOpen]);

  const handleSearch = (value: string) => {
    setQuery(value);
    
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      searchOrders(value);
    }, 300);
  };

  const handleSelect = (order: Order) => {
    onSelectOrder(order.order_number);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 animate-[fadeIn_0.15s_ease-out]" onClick={onClose}>
      <div 
        className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-xl border border-gray-100 max-h-[85vh] flex flex-col animate-[popIn_0.15s_ease-out]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h2 className="text-base font-semibold text-gray-900 tracking-tight">Rechercher une commande</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="p-4 pb-2">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => handleSearch(e.target.value)}
            placeholder="N° commande, téléphone ou email..."
            className="w-full bg-gray-50/80 border border-gray-200/80 rounded-xl px-3.5 py-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all placeholder:text-gray-400"
          />
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin">
          {loading ? (
            <div className="flex items-center justify-center py-8 space-x-2">
              <div className="w-5 h-5 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
              <span className="text-xs text-gray-400 font-medium">Recherche...</span>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 mx-auto mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <p className="text-xs text-gray-400 font-medium">
                {query ? 'Aucune commande trouvée' : 'Tapez pour rechercher une commande'}
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {orders.map(order => {
                const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
                return (
                  <button
                    key={order.id}
                    onClick={() => handleSelect(order)}
                    className="w-full text-left bg-gray-50/60 hover:bg-indigo-50/70 rounded-xl p-3 transition-colors border border-gray-100/90 hover:border-indigo-200/80"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-sm text-gray-900 tracking-tight">{order.order_number}</span>
                      <span className={`${status.bg} ${status.color} text-[10px] font-semibold px-2 py-0.5 rounded-full border border-black/5`}>
                        {status.label}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{order.customer_name || order.customer_phone}</span>
                      <span className="font-bold text-gray-900">
                        {new Intl.NumberFormat('fr-FR').format(order.final_amount)} {order.currency || 'XOF'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

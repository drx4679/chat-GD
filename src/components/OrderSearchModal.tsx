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
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50" onClick={onClose}>
      <div 
        className="bg-white w-full sm:max-w-md sm:rounded-xl rounded-t-xl max-h-[80vh] flex flex-col animate-[fadeIn_0.2s_ease-out]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">📦 Rechercher une commande</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-900 p-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="p-4">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => handleSearch(e.target.value)}
            placeholder="N° commande, téléphone ou email..."
            className="w-full bg-gray-100 rounded-lg px-4 py-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none transition-all"
          />
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-3 border-indigo-200 border-t-indigo-500 rounded-full animate-spin"></div>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-3xl mb-2">🔍</p>
              <p className="text-gray-400 text-sm">
                {query ? 'Aucune commande trouvée' : 'Tapez pour rechercher'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {orders.map(order => {
                const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
                return (
                  <button
                    key={order.id}
                    onClick={() => handleSelect(order)}
                    className="w-full text-left bg-gray-50 hover:bg-indigo-50 rounded-lg p-3 transition-colors border border-transparent hover:border-indigo-200"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-sm text-gray-900">{order.order_number}</span>
                      <span className={`${status.bg} ${status.color} text-xs font-medium px-2 py-0.5 rounded-full`}>
                        {status.label}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{order.customer_name || order.customer_phone}</span>
                      <span className="font-semibold text-gray-900">
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

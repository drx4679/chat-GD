'use client';

import { useState, useEffect } from 'react';
import type { Order, OrderStatus } from '@/types/database';
import { supabaseOrders } from '@/lib/supabase-orders';
import DeliveryTracker from './DeliveryTracker';

interface OrderCardProps {
  orderNumber: string;
  isOwn: boolean;
}

const STATUS_CONFIG: Record<OrderStatus, { label: string; badgeLabel: string; color: string; bg: string }> = {
  pending: { label: 'Mettre en attente', badgeLabel: 'En attente', color: 'text-yellow-700', bg: 'bg-yellow-100' },
  confirmed: { label: 'Confirmer', badgeLabel: 'Validée', color: 'text-green-700', bg: 'bg-green-100' },
  paid: { label: 'Marquer payée', badgeLabel: 'Payée', color: 'text-green-700', bg: 'bg-green-100' },
  processing: { label: 'Passer en préparation', badgeLabel: 'En préparation', color: 'text-indigo-700', bg: 'bg-indigo-100' },
  shipped: { label: 'Expédier', badgeLabel: 'Expédiée', color: 'text-purple-700', bg: 'bg-purple-100' },
  delivered: { label: 'Marquer livrée', badgeLabel: 'Livrée', color: 'text-emerald-700', bg: 'bg-emerald-100' },
  cancelled: { label: 'Annuler', badgeLabel: 'Annulée', color: 'text-red-700', bg: 'bg-red-100' },
  refunded: { label: 'Rembourser', badgeLabel: 'Remboursée', color: 'text-gray-700', bg: 'bg-gray-100' },
};

const STATUS_FLOW: OrderStatus[] = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

function formatCurrency(amount: number, currency: string | null): string {
  const cur = currency || 'XOF';
  return new Intl.NumberFormat('fr-FR').format(amount) + ' ' + cur;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function OrderCard({ orderNumber, isOwn }: OrderCardProps) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      const { data, error } = await supabaseOrders
        .from('orders')
        .select('*')
        .eq('order_number', orderNumber)
        .single();

      if (!error && data) {
        setOrder(data as Order);
      }
      setLoading(false);
    };

    setLoading(true);
    fetchOrder();

    // Polling toutes les 10 secondes pour les mises à jour
    const interval = setInterval(fetchOrder, 10000);

    // Realtime en bonus (si activé sur la 2e base)
    const channelName = `order_${orderNumber}_${Date.now()}`;
    let channel: any;
    try {
      channel = supabaseOrders
        .channel(channelName)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'orders', filter: `order_number=eq.${orderNumber}` },
          (payload) => {
            setOrder(payload.new as Order);
          }
        )
        .subscribe();
    } catch {}

    return () => {
      clearInterval(interval);
      if (channel) supabaseOrders.removeChannel(channel);
    };
  }, [orderNumber]);

  const handleStatusChange = async (newStatus: OrderStatus) => {
    if (!order || updating) return;
    setUpdating(true);

    const { error } = await supabaseOrders
      .from('orders')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', order.id);

    if (!error) {
      setOrder(prev => prev ? { ...prev, status: newStatus } : null);
    }
    setUpdating(false);
  };

  if (loading) {
    return (
      <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
        <div className="bg-white border border-gray-200 rounded-xl p-4 max-w-[85%] md:max-w-[70%] shadow-sm animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-48 mb-1"></div>
          <div className="h-3 bg-gray-200 rounded w-24"></div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 max-w-[85%]">
          <p className="text-sm text-red-600">📦 Commande {orderNumber} introuvable</p>
        </div>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const currentIdx = STATUS_FLOW.indexOf(order.status);
  const nextStatus = currentIdx >= 0 && currentIdx < STATUS_FLOW.length - 1 ? STATUS_FLOW[currentIdx + 1] : null;

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className="bg-white border border-gray-200/80 rounded-2xl overflow-hidden max-w-[95%] sm:max-w-[80%] md:max-w-[70%] shadow-xs">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 via-indigo-600 to-purple-600 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white opacity-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <span className="text-white font-semibold text-sm tracking-tight">{order.order_number}</span>
          </div>
          {(() => {
            const badge = order.is_delivered
              ? { label: 'Livré', color: 'text-emerald-700 bg-emerald-100/90 border-emerald-200/60' }
              : order.is_shipped
              ? { label: 'Expédié', color: 'text-purple-700 bg-purple-100/90 border-purple-200/60' }
              : order.is_processing
              ? { label: 'En préparation', color: 'text-indigo-700 bg-indigo-100/90 border-indigo-200/60' }
              : order.status !== 'pending'
              ? { label: 'Validée', color: 'text-emerald-700 bg-emerald-100/90 border-emerald-200/60' }
              : { label: 'En attente', color: 'text-amber-800 bg-amber-100/90 border-amber-200/60' };
            return (
              <span className={`${badge.color} border text-[11px] font-semibold px-2.5 py-0.5 rounded-full flex items-center space-x-1 shadow-2xs`}>
                {badge.label !== 'En attente' && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
                <span>{badge.label}</span>
              </span>
            );
          })()}
        </div>

        {/* Body */}
        <div className="p-4 space-y-2.5">
          {/* Client */}
          <div className="flex items-start space-x-2.5">
            <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 flex-shrink-0 mt-0.5">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="text-sm min-w-0">
              <p className="font-semibold text-gray-900 leading-tight">{order.customer_name || 'Client'}</p>
              <p className="text-gray-500 text-xs mt-0.5">{order.customer_phone}</p>
              {order.customer_email && (
                <p className="text-gray-400 text-xs truncate">{order.customer_email}</p>
              )}
            </div>
          </div>

          {/* Montant */}
          <div className="flex items-center justify-between bg-gray-50/80 border border-gray-100 rounded-xl px-3.5 py-2.5">
            <span className="text-xs font-medium text-gray-500">Montant total</span>
            <span className="text-base font-bold text-gray-900 tracking-tight">{formatCurrency(order.final_amount, order.currency)}</span>
          </div>

          {/* Paiement & Date */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-gray-50/50 rounded-lg p-2 border border-gray-100/70">
              <span className="text-gray-400 block text-[10px] uppercase font-medium tracking-wider">Paiement</span>
              <span className={`font-semibold inline-flex items-center space-x-1 mt-0.5 ${order.payment_status === 'paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${order.payment_status === 'paid' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                <span>{order.payment_method || '-'} • {order.payment_status === 'paid' ? 'Payé' : 'Attente'}</span>
              </span>
            </div>
            <div className="bg-gray-50/50 rounded-lg p-2 border border-gray-100/70">
              <span className="text-gray-400 block text-[10px] uppercase font-medium tracking-wider">Date</span>
              <span className="font-medium text-gray-700 mt-0.5 block">{formatDate(order.created_at)}</span>
            </div>
          </div>

          {/* Détails extensibles */}
          {expanded && (
            <div className="border-t border-gray-100 pt-2.5 mt-2 space-y-2 text-xs animate-[fadeIn_0.15s_ease-out]">
              <div className="flex justify-between">
                <span className="text-gray-400 font-medium">Adresse :</span>
                <span className="text-gray-700 text-right max-w-[65%] font-medium">{order.delivery_address}, {order.delivery_city}</span>
              </div>
              {order.delivery_fee && order.delivery_fee > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-400 font-medium">Frais livraison :</span>
                  <span className="text-gray-700 font-medium">{formatCurrency(order.delivery_fee, order.currency)}</span>
                </div>
              )}
              {order.discount_amount && order.discount_amount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-400 font-medium">Remise :</span>
                  <span className="text-emerald-600 font-medium">-{formatCurrency(order.discount_amount, order.currency)}</span>
                </div>
              )}
              {order.notes && (
                <div className="bg-amber-50/80 border border-amber-200/50 rounded-lg p-2 text-xs text-amber-800">
                  <span className="font-semibold">Note :</span> {order.notes}
                </div>
              )}
              {order.items && order.items.length > 0 && (
                <div className="border-t border-gray-100 pt-2">
                  <p className="text-gray-400 text-[11px] font-semibold uppercase tracking-wider mb-1.5">Articles commandés :</p>
                  <div className="space-y-1">
                    {order.items.map((item: any, i: number) => (
                      <div key={i} className="flex justify-between text-xs text-gray-700 bg-gray-50/60 p-1.5 rounded-md">
                        <span className="font-medium">{item.quantity || 1}x {item.name || item.product_name || 'Article'}</span>
                        <span className="font-semibold">{item.price ? formatCurrency(item.price * (item.quantity || 1), order.currency) : ''}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Toggle détails */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full text-center text-xs font-medium text-indigo-600 hover:text-indigo-700 py-1 hover:bg-indigo-50/50 rounded-lg transition-colors flex items-center justify-center space-x-1"
          >
            <span>{expanded ? 'Masquer les détails' : 'Afficher les détails'}</span>
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>



          {/* Suivi de livraison */}
          <DeliveryTracker 
            order={order} 
            onUpdate={(updates) => setOrder(prev => prev ? { ...prev, ...updates } : null)} 
          />
        </div>
      </div>
    </div>
  );
}

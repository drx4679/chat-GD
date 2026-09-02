'use client';

import { useState, useEffect } from 'react';
import type { Order, OrderStatus } from '@/types/database';
import { supabaseOrders } from '@/lib/supabase-orders';
import DeliveryTracker from './DeliveryTracker';

interface OrderCardProps {
  orderNumber: string;
  isOwn: boolean;
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
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden max-w-[90%] md:max-w-[75%] shadow-sm">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-lg">📦</span>
            <span className="text-white font-semibold text-sm">{order.order_number}</span>
          </div>
          <span className={`${statusConfig.bg} ${statusConfig.color} text-xs font-semibold px-2.5 py-1 rounded-full`}>
            {statusConfig.label}
          </span>
        </div>

        {/* Body */}
        <div className="p-4 space-y-2">
          {/* Client */}
          <div className="flex items-start space-x-2">
            <span className="text-gray-400 text-sm">👤</span>
            <div className="text-sm">
              <p className="font-medium text-gray-900">{order.customer_name || 'Client'}</p>
              <p className="text-gray-500">{order.customer_phone}</p>
              {order.customer_email && (
                <p className="text-gray-400 text-xs">{order.customer_email}</p>
              )}
            </div>
          </div>

          {/* Montant */}
          <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
            <span className="text-sm text-gray-500">Total</span>
            <span className="text-lg font-bold text-gray-900">{formatCurrency(order.final_amount, order.currency)}</span>
          </div>

          {/* Paiement */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Paiement</span>
            <span className={`font-medium ${order.payment_status === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>
              {order.payment_method || '-'} • {order.payment_status === 'paid' ? '✅ Payé' : '⏳ En attente'}
            </span>
          </div>

          {/* Date */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Date</span>
            <span className="text-gray-700">{formatDate(order.created_at)}</span>
          </div>

          {/* Détails extensibles */}
          {expanded && (
            <div className="border-t border-gray-100 pt-2 mt-2 space-y-1.5 text-sm animate-[fadeIn_0.2s_ease-out]">
              <div className="flex justify-between">
                <span className="text-gray-500">Livraison</span>
                <span className="text-gray-700 text-right max-w-[60%]">{order.delivery_address}, {order.delivery_city}</span>
              </div>
              {order.delivery_fee && order.delivery_fee > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Frais livraison</span>
                  <span className="text-gray-700">{formatCurrency(order.delivery_fee, order.currency)}</span>
                </div>
              )}
              {order.discount_amount && order.discount_amount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Remise</span>
                  <span className="text-green-600">-{formatCurrency(order.discount_amount, order.currency)}</span>
                </div>
              )}
              {order.notes && (
                <div className="bg-yellow-50 rounded p-2 text-xs text-yellow-800">
                  💡 {order.notes}
                </div>
              )}
              {order.items && order.items.length > 0 && (
                <div className="border-t border-gray-100 pt-2">
                  <p className="text-gray-500 text-xs font-medium mb-1">Articles :</p>
                  {order.items.map((item: any, i: number) => (
                    <div key={i} className="flex justify-between text-xs text-gray-600">
                      <span>{item.quantity || 1}x {item.name || item.product_name || 'Article'}</span>
                      <span>{item.price ? formatCurrency(item.price * (item.quantity || 1), order.currency) : ''}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Toggle détails */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full text-center text-xs text-indigo-500 hover:text-indigo-700 py-1"
          >
            {expanded ? '▲ Moins de détails' : '▼ Plus de détails'}
          </button>

          {/* Actions statut */}
          {nextStatus && (
            <div className="border-t border-gray-100 pt-2 flex space-x-2">
              <button
                onClick={() => handleStatusChange(nextStatus)}
                disabled={updating}
                className="flex-1 bg-indigo-500 text-white text-sm font-medium py-2 rounded-lg hover:bg-indigo-600 disabled:opacity-50 transition-colors"
              >
                {updating ? '...' : `→ ${STATUS_CONFIG[nextStatus].label}`}
              </button>
              {order.status !== 'cancelled' && (
                <button
                  onClick={() => handleStatusChange('cancelled')}
                  disabled={updating}
                  className="px-3 bg-red-50 text-red-600 text-sm font-medium py-2 rounded-lg hover:bg-red-100 disabled:opacity-50 transition-colors"
                >
                  ✕
                </button>
              )}
            </div>
          )}

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

'use client';

import { useState } from 'react';
import { supabaseOrders } from '@/lib/supabase-orders';
import type { Order, OrderStatus } from '@/types/database';

interface UseOrdersReturn {
  orders: Order[];
  loading: boolean;
  searchOrders: (query: string) => Promise<void>;
  getOrder: (orderNumber: string) => Promise<Order | null>;
  updateOrderStatus: (orderId: number, newStatus: OrderStatus) => Promise<boolean>;
}

export function useOrders(): UseOrdersReturn {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  // Recherche par numéro, téléphone ou email
  const searchOrders = async (query: string) => {
    if (!query.trim()) {
      setOrders([]);
      return;
    }

    setLoading(true);
    try {
      const q = query.trim();

      // Recherche combinée : or filter
      const { data, error } = await supabaseOrders
        .from('orders')
        .select('*')
        .or(`order_number.ilike.%${q}%,customer_phone.ilike.%${q}%,customer_email.ilike.%${q}%`)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Erreur recherche commandes :', error);
        setOrders([]);
      } else {
        setOrders((data || []) as Order[]);
      }
    } catch (err) {
      console.error('Erreur recherche commandes :', err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // Récupérer une commande par numéro
  const getOrder = async (orderNumber: string): Promise<Order | null> => {
    try {
      const { data, error } = await supabaseOrders
        .from('orders')
        .select('*')
        .eq('order_number', orderNumber)
        .single();

      if (error || !data) return null;
      return data as Order;
    } catch {
      return null;
    }
  };

  // Mettre à jour le statut d'une commande
  const updateOrderStatus = async (orderId: number, newStatus: OrderStatus): Promise<boolean> => {
    try {
      const { error } = await supabaseOrders
        .from('orders')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', orderId);

      if (error) {
        console.error('Erreur mise à jour statut :', error);
        return false;
      }
      
      // Mettre à jour localement
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      return true;
    } catch {
      return false;
    }
  };

  return { orders, loading, searchOrders, getOrder, updateOrderStatus };
}

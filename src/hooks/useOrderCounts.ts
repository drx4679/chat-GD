'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabaseOrders } from '@/lib/supabase-orders';

interface OrderCounts {
  total: number;
  confirmed: number;
  pending: number;
}

export function useOrderCounts(): OrderCounts {
  const [counts, setCounts] = useState<OrderCounts>({ total: 0, confirmed: 0, pending: 0 });

  const fetchCounts = useCallback(async () => {
    try {
      // Total commandes
      const { count: total } = await supabaseOrders
        .from('orders')
        .select('*', { count: 'exact', head: true });

      // Commandes confirmées (status != 'pending')
      const { count: confirmed } = await supabaseOrders
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .neq('status', 'pending');

      // Commandes en attente
      const { count: pending } = await supabaseOrders
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      setCounts({
        total: total ?? 0,
        confirmed: confirmed ?? 0,
        pending: pending ?? 0,
      });
    } catch (err) {
      console.warn('Erreur récupération compteurs commandes:', err);
    }
  }, []);

  useEffect(() => {
    fetchCounts();

    // Polling toutes les 5 secondes
    const interval = setInterval(fetchCounts, 5000);

    // Écoute Realtime sur la table orders
    const channelName = `order_counts_${Date.now()}`;
    let channel: any;
    try {
      channel = supabaseOrders
        .channel(channelName)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'orders' },
          () => {
            fetchCounts();
          }
        )
        .subscribe();
    } catch (e) {
      console.warn('Erreur abonnement Realtime compteurs:', e);
    }

    return () => {
      clearInterval(interval);
      if (channel) supabaseOrders.removeChannel(channel);
    };
  }, [fetchCounts]);

  return counts;
}

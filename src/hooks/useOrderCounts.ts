'use client';

import { useState, useEffect } from 'react';
import { supabaseOrders } from '@/lib/supabase-orders';

interface OrderCounts {
  total: number;
  confirmed: number;
  pending: number;
}

export function useOrderCounts(): OrderCounts {
  const [counts, setCounts] = useState<OrderCounts>({ total: 0, confirmed: 0, pending: 0 });

  useEffect(() => {
    const fetchCounts = async () => {
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
        total: total || 0,
        confirmed: confirmed || 0,
        pending: pending || 0,
      });
    };

    fetchCounts();
    const interval = setInterval(fetchCounts, 10000);
    return () => clearInterval(interval);
  }, []);

  return counts;
}

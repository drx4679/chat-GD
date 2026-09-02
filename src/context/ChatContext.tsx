'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase-browser';
import { supabaseOrders } from '@/lib/supabase-orders';
import { useAuth } from '@/hooks/useAuth';
import { playNotificationSound } from '@/lib/sound';
import type { ConversationWithDetails, Message } from '@/types/database';

interface OrderCounts {
  total: number;
  confirmed: number;
  pending: number;
}

interface ChatContextValue {
  conversations: ConversationWithDetails[];
  loading: boolean;
  orderCounts: OrderCounts;
  totalUnread: number;
  createConversation: (otherUserId: string) => Promise<string>;
  refreshConversations: () => Promise<void>;
  refreshOrderCounts: () => Promise<void>;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [orderCounts, setOrderCounts] = useState<OrderCounts>({ total: 0, confirmed: 0, pending: 0 });

  // 1. Récupération des conversations (RPC optimisé)
  const fetchConversations = useCallback(async () => {
    if (!user) return;

    try {
      const { data: convs, error: convError } = await supabase
        .rpc('get_user_conversations', { p_user_id: user.id });

      if (convError) throw convError;

      if (!convs || convs.length === 0) {
        setConversations([]);
        return;
      }

      // Mapper les données
      const mappedConvs: ConversationWithDetails[] = convs.map((c: any) => ({
        id: c.id,
        created_at: c.created_at,
        updated_at: c.updated_at,
        contact_name: c.contact_name,
        contact_phone: c.contact_phone,
        contact_email: c.contact_email,
        participants: Array.isArray(c.participants) ? c.participants : [],
        last_message: c.last_message_content ? {
          id: c.last_message_id,
          conversation_id: c.id,
          sender_id: c.last_message_sender_id,
          content: c.last_message_content,
          created_at: c.last_message_created_at,
          read_at: null,
        } : null,
        unread_count: Number(c.unread_count) || 0,
      }));

      // Trier par message le plus récent
      mappedConvs.sort((a, b) => {
        const dateA = a.last_message ? new Date(a.last_message.created_at).getTime() : new Date(a.updated_at).getTime();
        const dateB = b.last_message ? new Date(b.last_message.created_at).getTime() : new Date(b.updated_at).getTime();
        return dateB - dateA;
      });

      setConversations(mappedConvs);
    } catch (err) {
      console.warn('Erreur récupération conversations:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // 2. Récupération des compteurs de commandes
  const fetchOrderCounts = useCallback(async () => {
    try {
      const [totalRes, confirmedRes, pendingRes] = await Promise.all([
        supabaseOrders.from('orders').select('*', { count: 'exact', head: true }),
        supabaseOrders.from('orders').select('*', { count: 'exact', head: true }).neq('status', 'pending'),
        supabaseOrders.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      ]);

      setOrderCounts({
        total: totalRes.count ?? 0,
        confirmed: confirmedRes.count ?? 0,
        pending: pendingRes.count ?? 0,
      });
    } catch (err) {
      console.warn('Erreur compteurs commandes:', err);
    }
  }, []);

  // 3. Initialisation et abonnements temps réel UNIQUES pour toute l'application
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setConversations([]);
      setLoading(false);
      return;
    }

    fetchConversations();
    fetchOrderCounts();

    // Polling doux uniquement en arrière-plan toutes les 30s
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchConversations();
        fetchOrderCounts();
      }
    }, 30000);

    // Écoute Realtime sur Chat Supabase
    const chatChannelName = `chat_hub_${user.id}`;
    const chatChannel = supabase
      .channel(chatChannelName)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const newMsg = payload.new as Message;
          if (newMsg) {
            const isOrder = newMsg.content?.startsWith('[ORDER:');
            const isIncoming = newMsg.sender_id !== user.id;

            if (isOrder || isIncoming) {
              playNotificationSound();

              if (typeof window !== 'undefined' && document.visibilityState !== 'visible' && 'Notification' in window && Notification.permission === 'granted') {
                try {
                  new Notification(isOrder ? '📦 Nouvelle commande reçue' : '💬 Nouveau message', {
                    body: isOrder ? 'Une nouvelle commande est arrivée sur votre boutique.' : newMsg.content,
                    icon: '/icons/icon-192.png',
                    tag: `msg-${newMsg.id}`,
                  });
                } catch {}
              }
            }
          }
          fetchConversations();
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'conversation_participants' },
        () => { fetchConversations(); }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'conversations' },
        () => { fetchConversations(); }
      )
      .subscribe();

    // Écoute Realtime sur Orders Supabase
    const ordersChannelName = `orders_hub_${user.id}`;
    const ordersChannel = supabaseOrders
      .channel(ordersChannelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          fetchOrderCounts();
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(chatChannel);
      supabaseOrders.removeChannel(ordersChannel);
    };
  }, [user, authLoading, fetchConversations, fetchOrderCounts]);

  const createConversation = async (otherUserId: string): Promise<string> => {
    if (!user) throw new Error('Utilisateur non connecté');

    const { data: convId, error: rpcError } = await supabase
      .rpc('create_conversation', {
        p_other_user_id: otherUserId,
      });

    if (rpcError) throw rpcError;
    await fetchConversations();
    return convId as string;
  };

  const totalUnread = useMemo(() => {
    return conversations.reduce((acc, c) => acc + (c.unread_count || 0), 0);
  }, [conversations]);

  const value = useMemo(() => ({
    conversations,
    loading,
    orderCounts,
    totalUnread,
    createConversation,
    refreshConversations: fetchConversations,
    refreshOrderCounts: fetchOrderCounts,
  }), [conversations, loading, orderCounts, totalUnread, fetchConversations, fetchOrderCounts]);

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat doit être utilisé au sein d\'un ChatProvider');
  }
  return context;
}

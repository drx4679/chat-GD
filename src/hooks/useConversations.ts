'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase-browser';
import type { Profile, Message, ConversationWithDetails } from '@/types/database';
import { useAuth } from './useAuth';

interface UseConversationsReturn {
  conversations: ConversationWithDetails[];
  loading: boolean;
  createConversation: (otherUserId: string) => Promise<string>;
}

export function useConversations(): UseConversationsReturn {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    if (!user) return;

    try {
      // Utiliser la fonction RPC pour contourner le RLS
      const { data: convs, error: convError } = await supabase
        .rpc('get_user_conversations', { p_user_id: user.id });

      if (convError || !convs) {
        console.error('Erreur get_user_conversations:', convError);
        setLoading(false);
        return;
      }

      if (convs.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      // Pour chaque conversation, récupérer les participants et le dernier message
      const formatted: ConversationWithDetails[] = await Promise.all(
        convs.map(async (c: any) => {
          // Récupérer les participants via RPC
          const { data: participants } = await supabase
            .rpc('get_conversation_participants', { p_conversation_id: c.conversation_id });

          // Récupérer le dernier message
          const { data: lastMessages } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', c.conversation_id)
            .order('created_at', { ascending: false })
            .limit(1);

          // Compter les messages non lus (envoyés par l'autre, pas encore lus)
          const { count: unreadCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', c.conversation_id)
            .neq('sender_id', user!.id)
            .is('read_at', null);

          return {
            id: c.conversation_id,
            created_at: c.created_at,
            updated_at: c.updated_at,
            participants: (participants || []).map((p: any) => ({
              id: p.user_id,
              username: p.username,
              avatar_url: p.avatar_url,
              last_seen: p.last_seen,
              created_at: p.last_seen,
            })) as Profile[],
            last_message: (lastMessages && lastMessages.length > 0 ? lastMessages[0] : null) as Message | null,
            unread_count: unreadCount || 0,
          };
        })
      );

      setConversations(formatted);
    } catch (err) {
      console.error('Erreur chargement conversations :', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setConversations([]);
      setLoading(false);
      return;
    }

    fetchConversations();

    // S'abonner aux nouveaux messages pour rafraîchir la liste
    // Nom unique avec timestamp pour éviter les conflits React 18 Strict Mode
    const channelName = `conv_${user.id}_${Date.now()}`;
    
    try {
      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'messages' },
          () => { fetchConversations(); }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (err) {
      console.warn('Erreur subscription Realtime:', err);
      return () => {};
    }
  }, [user, fetchConversations]);

  const createConversation = async (otherUserId: string): Promise<string> => {
    if (!user) throw new Error('Non authentifié');

    // Utiliser la fonction RPC qui gère la déduplication et la création
    const { data, error } = await supabase
      .rpc('create_conversation', { p_other_user_id: otherUserId });

    if (error || !data) {
      console.error('Erreur création conversation :', error);
      throw new Error('Impossible de créer la conversation');
    }

    await fetchConversations();
    return data as string;
  };

  return { conversations, loading, createConversation };
}

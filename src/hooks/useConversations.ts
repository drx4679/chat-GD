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

          return {
            id: c.conversation_id,
            created_at: c.created_at,
            updated_at: c.updated_at,
            participants: (participants || []).map((p: any) => ({
              id: p.user_id,
              username: p.username,
              avatar_url: p.avatar_url,
              last_seen: p.last_seen,
              created_at: p.last_seen, // fallback
            })) as Profile[],
            last_message: (lastMessages && lastMessages.length > 0 ? lastMessages[0] : null) as Message | null,
            unread_count: 0,
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
    const channelName = `conv_updates_${user.id}`;
    const channel = supabase.channel(channelName);
    
    channel.on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages' },
      () => { fetchConversations(); }
    );
    
    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchConversations]);

  const createConversation = async (otherUserId: string): Promise<string> => {
    if (!user) throw new Error('Non authentifié');

    // Vérifier si une conversation 1-to-1 existe déjà via RPC
    const { data: myConvs } = await supabase
      .rpc('get_user_conversations', { p_user_id: user.id });

    if (myConvs) {
      for (const conv of myConvs) {
        const { data: parts } = await supabase
          .rpc('get_conversation_participants', { p_conversation_id: conv.conversation_id });
        
        if (parts && parts.length === 2) {
          const hasOther = parts.some((p: any) => p.user_id === otherUserId);
          if (hasOther) {
            return conv.conversation_id; // Conversation existante
          }
        }
      }
    }

    // Créer une nouvelle conversation
    const { data: newConv, error: createError } = await supabase
      .from('conversations')
      .insert({ updated_at: new Date().toISOString() })
      .select('id')
      .single();

    if (createError || !newConv) {
      console.error('Erreur création conversation :', createError);
      throw new Error('Impossible de créer la conversation');
    }

    // Ajouter les deux participants
    const { error: partError } = await supabase
      .from('conversation_participants')
      .insert([
        { conversation_id: newConv.id, user_id: user.id },
        { conversation_id: newConv.id, user_id: otherUserId }
      ]);

    if (partError) {
      console.error('Erreur ajout participants :', partError);
      throw new Error('Impossible d\'ajouter les participants');
    }

    await fetchConversations();
    return newConv.id;
  };

  return { conversations, loading, createConversation };
}

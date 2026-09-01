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
      // 1. Récupérer les conversations où l'utilisateur est participant
      const { data: participations, error: partError } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', user.id);

      if (partError || !participations) {
        setLoading(false);
        return;
      }

      const convIds = participations.map(p => p.conversation_id);
      if (convIds.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      // 2. Récupérer les conversations avec les participants
      const { data: convs, error: convError } = await supabase
        .from('conversations')
        .select('*, conversation_participants(user_id)')
        .in('id', convIds)
        .order('updated_at', { ascending: false });

      if (convError || !convs) {
        setLoading(false);
        return;
      }

      // 3. Pour chaque conversation, récupérer les profils et le dernier message
      const formatted: ConversationWithDetails[] = await Promise.all(
        convs.map(async (c: any) => {
          const participantIds = (c.conversation_participants || []).map((p: any) => p.user_id);
          
          // Récupérer les profils des participants
          const { data: profiles } = participantIds.length > 0
            ? await supabase.from('profiles').select('*').in('id', participantIds)
            : { data: [] };

          // Récupérer uniquement le dernier message (pas tous)
          const { data: lastMessages } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', c.id)
            .order('created_at', { ascending: false })
            .limit(1);

          return {
            id: c.id,
            created_at: c.created_at,
            updated_at: c.updated_at,
            participants: (profiles || []) as Profile[],
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
    // Utiliser un nom unique pour éviter les conflits de canaux
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

    // Vérifier si une conversation 1-to-1 existe déjà entre les deux users
    const { data: userConvs } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', user.id);
      
    const { data: otherConvs } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', otherUserId);

    if (userConvs && otherConvs) {
      const userIds = new Set(userConvs.map(c => c.conversation_id));
      const existing = otherConvs.find(c => userIds.has(c.conversation_id));
      
      if (existing) {
        return existing.conversation_id; // Conversation existante
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

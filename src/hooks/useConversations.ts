'use client';

import { useState, useEffect } from 'react';
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

  const fetchConversations = async () => {
    if (!user) return;

    // Récupérer les conversations où l'utilisateur est participant
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

    const { data: convs, error: convError } = await supabase
      .from('conversations')
      .select('*, conversation_participants(user_id), messages(*)')
      .in('id', convIds);

    if (convError || !convs) {
      setLoading(false);
      return;
    }

    // Processus pour formater avec les participants et le dernier message
    const formatted: ConversationWithDetails[] = await Promise.all(
      convs.map(async (c: any) => {
        const participantIds = c.conversation_participants.map((p: any) => p.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('*')
          .in('id', participantIds);

        const sortedMessages = c.messages.sort((a: any, b: any) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        return {
          id: c.id,
          created_at: c.created_at,
          updated_at: c.updated_at,
          participants: (profiles || []) as Profile[],
          last_message: (sortedMessages.length > 0 ? sortedMessages[0] : null) as Message | null,
          unread_count: 0 // Simplifié pour l'exemple
        };
      })
    );

    formatted.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    setConversations(formatted);
    setLoading(false);
  };

  useEffect(() => {
    if (!user) {
      setConversations([]);
      setLoading(false);
      return;
    }

    fetchConversations();

    // S'abonner aux nouveaux messages
    const channel = supabase.channel('conversations_updates')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        // Rafraîchir les conversations lorsqu'un nouveau message arrive
        fetchConversations();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const createConversation = async (otherUserId: string): Promise<string> => {
    if (!user) throw new Error('Not authenticated');

    // Vérifier si une conversation existe déjà
    const { data: userConvs } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', user.id);
      
    const { data: otherConvs } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', otherUserId);

    if (userConvs && otherConvs) {
      const userIds = userConvs.map(c => c.conversation_id);
      const otherIds = otherConvs.map(c => c.conversation_id);
      const intersection = userIds.find(id => otherIds.includes(id));
      
      if (intersection) {
        return intersection; // Retourner l'existant
      }
    }

    // Créer une nouvelle conversation
    const { data: newConv, error: createError } = await supabase
      .from('conversations')
      .insert({})
      .select('id')
      .single();

    if (createError || !newConv) throw new Error('Error creating conversation');

    await supabase
      .from('conversation_participants')
      .insert([
        { conversation_id: newConv.id, user_id: user.id },
        { conversation_id: newConv.id, user_id: otherUserId }
      ]);

    fetchConversations();
    return newConv.id;
  };

  return { conversations, loading, createConversation };
}

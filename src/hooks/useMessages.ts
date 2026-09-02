'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase-browser';
import type { Message } from '@/types/database';
import { useAuth } from './useAuth';

interface UseMessagesReturn {
  messages: Message[];
  loading: boolean;
  sendMessage: (content: string) => Promise<void>;
  markAsRead: (messageId: string) => Promise<void>;
  markMessagesAsRead: (messageIds: string[]) => Promise<void>;
}

export function useMessages(conversationId: string): UseMessagesReturn {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!conversationId) return;

    let isMounted = true;

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (isMounted) {
        if (!error && data) {
          setMessages(data as Message[]);
        }
        setLoading(false);
      }
    };

    fetchMessages();

    // S'abonner aux nouveaux messages
    const channelName = `msg_${conversationId}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          const newMsg = payload.new as Message;
          if (isMounted) {
            setMessages(prev => {
              if (prev.some(m => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  const sendMessage = useCallback(async (content: string) => {
    if (!user || !conversationId) return;

    // Optimistic update immédiat
    const tempId = crypto.randomUUID();
    const optimisticMessage: Message = {
      id: tempId,
      conversation_id: conversationId,
      sender_id: user.id,
      content,
      created_at: new Date().toISOString(),
      read_at: null,
    };
    setMessages(prev => [...prev, optimisticMessage]);

    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content
      })
      .select()
      .single();

    if (error) {
      setMessages(prev => prev.filter(m => m.id !== tempId));
      console.error('Erreur envoi message :', error);
    } else if (data) {
      setMessages(prev => prev.map(m => m.id === tempId ? data as Message : m));
    }
  }, [user, conversationId]);

  const markAsRead = useCallback(async (messageId: string) => {
    await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('id', messageId);
  }, []);

  const markMessagesAsRead = useCallback(async (messageIds: string[]) => {
    if (!messageIds || messageIds.length === 0) return;
    await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .in('id', messageIds);
  }, []);

  return { messages, loading, sendMessage, markAsRead, markMessagesAsRead };
}

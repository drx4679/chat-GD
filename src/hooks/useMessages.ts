'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-browser';
import type { Message } from '@/types/database';
import { useAuth } from './useAuth';

interface UseMessagesReturn {
  messages: Message[];
  loading: boolean;
  sendMessage: (content: string) => Promise<void>;
  markAsRead: (messageId: string) => Promise<void>;
}

export function useMessages(conversationId: string): UseMessagesReturn {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!conversationId) return;

    const fetchMessages = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (!error && data) {
        setMessages(data as Message[]);
      }
      setLoading(false);
    };

    fetchMessages();

    // S'abonner aux nouveaux messages avec nom unique (évite conflit React Strict Mode)
    const channelName = `msg_${conversationId}_${Date.now()}`;
    
    try {
      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
          (payload) => {
            const newMsg = payload.new as Message;
            // Éviter les doublons (message optimiste déjà affiché)
            setMessages(prev => {
              if (prev.some(m => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });

            // Notification navigateur si le message vient d'un autre utilisateur
            if (newMsg.sender_id !== user?.id && document.hidden) {
              if (Notification.permission === 'granted') {
                new Notification('Nouveau message', {
                  body: newMsg.content.length > 100 ? newMsg.content.slice(0, 97) + '...' : newMsg.content,
                  icon: '/icons/icon.svg',
                });
              }
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (err) {
      console.warn('Erreur subscription messages:', err);
      return () => {};
    }
  }, [conversationId]);

  const sendMessage = async (content: string) => {
    if (!user || !conversationId) return;

    // Ajouter le message localement immédiatement (optimistic update)
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

    // Insérer dans la base de données
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
      // En cas d'erreur, retirer le message optimiste
      setMessages(prev => prev.filter(m => m.id !== tempId));
      console.error('Erreur envoi message :', error);
    } else if (data) {
      // Remplacer le message optimiste par le vrai (avec l'id serveur)
      setMessages(prev => prev.map(m => m.id === tempId ? data as Message : m));
    }
  };

  const markAsRead = async (messageId: string) => {
    await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('id', messageId);
  };

  return { messages, loading, sendMessage, markAsRead };
}

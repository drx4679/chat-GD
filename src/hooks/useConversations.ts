'use client';

import { useChat } from '@/context/ChatContext';

export function useConversations() {
  const { conversations, loading, createConversation, refreshConversations } = useChat();
  return { conversations, loading, createConversation, refreshConversations };
}

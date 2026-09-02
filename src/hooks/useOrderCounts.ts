'use client';

import { useChat } from '@/context/ChatContext';

export function useOrderCounts() {
  const { orderCounts } = useChat();
  return orderCounts;
}

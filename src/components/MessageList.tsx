'use client';

// Liste des messages d'une conversation
import { useEffect, useRef } from 'react';
import { useMessages } from '@/hooks/useMessages';
import { useAuth } from '@/hooks/useAuth';
import MessageBubble from './MessageBubble';
import { Message } from '@/types/database';

interface Props {
  conversationId: string;
}

export default function MessageList({ conversationId }: Props) {
  const { messages, loading, markAsRead } = useMessages(conversationId);
  const { profile } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll et marquage comme lu
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    
    // Marquer les messages non lus comme lus
    if (profile?.id) {
      const unreadMessages = messages.filter(m => !m.read_at && m.sender_id !== profile.id);
      unreadMessages.forEach(m => markAsRead(m.id));
    }
  }, [messages, profile?.id, markAsRead]);

  if (loading && messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
      {messages.map((message: Message) => (
        <MessageBubble 
          key={message.id} 
          message={message} 
          isOwn={message.sender_id === profile?.id} 
          senderName={""} 
        />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}

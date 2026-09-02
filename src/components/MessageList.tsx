'use client';

// Liste des messages avec auto-scroll et marquage des messages lus
import { useEffect, useRef, useCallback } from 'react';
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
  const containerRef = useRef<HTMLDivElement>(null);
  const prevMessageCount = useRef(0);

  // Auto-scroll vers le bas quand de nouveaux messages arrivent
  useEffect(() => {
    if (messages.length > prevMessageCount.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: messages.length - prevMessageCount.current > 1 ? 'auto' : 'smooth' });
    }
    prevMessageCount.current = messages.length;
  }, [messages.length]);

  // Marquer les messages reçus comme lus
  const markUnreadMessages = useCallback(() => {
    if (!profile?.id) return;
    const unread = messages.filter(m => !m.read_at && m.sender_id !== profile.id);
    unread.forEach(m => markAsRead(m.id));
  }, [messages, profile?.id, markAsRead]);

  useEffect(() => {
    markUnreadMessages();
  }, [markUnreadMessages]);

  if (loading && messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-2">
          <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin"></div>
          <span className="text-sm text-gray-400">Chargement des messages...</span>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-4xl mb-2">💬</div>
          <p className="text-gray-400 text-sm">Commencez la conversation !</p>
        </div>
      </div>
    );
  }

  // Grouper les messages par date
  const groupedMessages: { date: string; messages: Message[] }[] = [];
  let currentDate = '';

  messages.forEach(msg => {
    const msgDate = new Date(msg.created_at).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
    if (msgDate !== currentDate) {
      currentDate = msgDate;
      groupedMessages.push({ date: msgDate, messages: [msg] });
    } else {
      groupedMessages[groupedMessages.length - 1].messages.push(msg);
    }
  });

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
      {groupedMessages.map((group) => (
        <div key={group.date}>
          {/* Séparateur de date */}
          <div className="flex items-center justify-center my-3">
            <span className="bg-gray-200 text-gray-500 text-xs px-3 py-1 rounded-full capitalize">
              {group.date}
            </span>
          </div>
          {/* Messages du jour */}
          <div className="space-y-2">
            {group.messages.map((message: Message) => (
              <MessageBubble 
                key={message.id} 
                message={message} 
                isOwn={message.sender_id === profile?.id} 
              />
            ))}
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}

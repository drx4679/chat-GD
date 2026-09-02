'use client';

// Liste des messages avec support des commandes
import { useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { useMessages } from '@/hooks/useMessages';
import { useAuth } from '@/hooks/useAuth';
import MessageBubble from './MessageBubble';
import OrderCard from './OrderCard';
import { Message } from '@/types/database';

interface Props {
  conversationId: string;
}

// Détecte si un message est une commande : [ORDER:CMD-xxxx]
function extractOrderNumber(content: string): string | null {
  const match = content.match(/\[ORDER:([^\]]+)\]/);
  return match ? match[1] : null;
}

function MessageListComponent({ conversationId }: Props) {
  const { messages, loading, markMessagesAsRead } = useMessages(conversationId);
  const { profile } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevMessageCount = useRef(0);

  // Auto-scroll vers le bas
  useEffect(() => {
    if (messages.length > prevMessageCount.current) {
      messagesEndRef.current?.scrollIntoView({ 
        behavior: messages.length - prevMessageCount.current > 1 ? 'auto' : 'smooth' 
      });
    }
    prevMessageCount.current = messages.length;
  }, [messages.length]);

  // Marquer les messages reçus comme lus en UNE SEULE requête groupée (Batch)
  const markUnreadMessages = useCallback(() => {
    if (!profile?.id) return;
    const unreadIds = messages
      .filter(m => !m.read_at && m.sender_id !== profile.id)
      .map(m => m.id);

    if (unreadIds.length > 0) {
      markMessagesAsRead(unreadIds);
    }
  }, [messages, profile?.id, markMessagesAsRead]);

  useEffect(() => {
    markUnreadMessages();
  }, [markUnreadMessages]);

  // Grouper les messages par date avec useMemo pour éviter le recalcul à chaque render
  const groupedMessages = useMemo(() => {
    const groups: { date: string; messages: Message[] }[] = [];
    let currentDate = '';

    messages.forEach(msg => {
      const msgDate = new Date(msg.created_at).toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      });
      if (msgDate !== currentDate) {
        currentDate = msgDate;
        groups.push({ date: msgDate, messages: [msg] });
      } else {
        groups[groups.length - 1].messages.push(msg);
      }
    });

    return groups;
  }, [messages]);

  if (loading && messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#f8fafc]">
        <div className="flex flex-col items-center space-y-2">
          <div className="w-7 h-7 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <span className="text-xs text-gray-400 font-medium">Chargement des messages...</span>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#f8fafc]">
        <div className="text-center p-6">
          <div className="w-12 h-12 rounded-2xl bg-white border border-gray-100 shadow-xs flex items-center justify-center text-gray-400 mx-auto mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-600">Aucun message pour l'instant</p>
          <p className="text-xs text-gray-400 mt-0.5">Envoyez le premier message pour démarrer</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-4 bg-[#f8fafc] scrollbar-thin overscroll-contain">
      {groupedMessages.map((group) => (
        <div key={group.date} className="space-y-2.5">
          {/* Séparateur de date */}
          <div className="flex items-center justify-center my-3">
            <span className="bg-white/95 text-gray-500 text-[11px] font-medium px-3 py-0.5 rounded-full border border-gray-200/70 shadow-2xs capitalize tracking-wide">
              {group.date}
            </span>
          </div>
          {/* Messages du jour */}
          <div className="space-y-2">
            {group.messages.map((message: Message) => {
              const orderNumber = extractOrderNumber(message.content);
              
              if (orderNumber) {
                return (
                  <OrderCard
                    key={message.id}
                    orderNumber={orderNumber}
                    isOwn={message.sender_id === profile?.id}
                  />
                );
              }

              return (
                <MessageBubble 
                  key={message.id} 
                  message={message} 
                  isOwn={message.sender_id === profile?.id} 
                />
              );
            })}
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}

export default memo(MessageListComponent);

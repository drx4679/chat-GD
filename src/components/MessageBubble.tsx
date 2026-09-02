'use client';

// Bulle d'un message avec indicateurs de lecture
import { memo } from 'react';
import { Message } from '@/types/database';

interface Props {
  message: Message;
  isOwn: boolean;
  senderName?: string;
}

function MessageBubbleComponent({ message, isOwn, senderName }: Props) {
  const timeString = new Date(message.created_at).toLocaleTimeString('fr-FR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  return (
    <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} animate-[fadeIn_0.15s_ease-out]`}>
      {!isOwn && senderName && (
        <span className="text-[11px] font-medium text-gray-400 mb-1 ml-1.5">{senderName}</span>
      )}
      <div 
        className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 ${
          isOwn 
            ? 'bg-indigo-600 text-white rounded-br-xs shadow-xs' 
            : 'bg-white text-gray-800 border border-gray-100 rounded-bl-xs shadow-2xs'
        }`}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
      </div>
      <div className={`flex items-center mt-1 space-x-1 ${isOwn ? 'mr-1' : 'ml-1'}`}>
        <span className="text-[10px] font-medium text-gray-400">{timeString}</span>
        {isOwn && (
          <span className="flex items-center">
            {message.read_at ? (
              // Double check bleu = lu
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <polyline points="18 7 11 14 7 10"></polyline>
                <polyline points="22 7 15 14 13 12"></polyline>
              </svg>
            ) : (
              // Simple check gris = envoyé
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            )}
          </span>
        )}
      </div>
    </div>
  );
}

export default memo(MessageBubbleComponent);

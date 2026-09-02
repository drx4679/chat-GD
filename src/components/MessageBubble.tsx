'use client';

// Bulle d'un message avec indicateurs de lecture
import { Message } from '@/types/database';

interface Props {
  message: Message;
  isOwn: boolean;
  senderName?: string;
}

export default function MessageBubble({ message, isOwn, senderName }: Props) {
  const timeString = new Date(message.created_at).toLocaleTimeString('fr-FR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  return (
    <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} animate-[fadeIn_0.2s_ease-out]`}>
      {!isOwn && senderName && (
        <span className="text-xs text-gray-500 mb-1 ml-1">{senderName}</span>
      )}
      <div 
        className={`max-w-[80%] md:max-w-[70%] rounded-2xl px-4 py-2 ${
          isOwn 
            ? 'bg-indigo-500 text-white rounded-br-none' 
            : 'bg-white text-gray-900 border border-gray-100 rounded-bl-none shadow-sm'
        }`}
      >
        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
      </div>
      <div className={`flex items-center mt-0.5 space-x-1 ${isOwn ? 'mr-1' : 'ml-1'}`}>
        <span className={`text-[11px] ${isOwn ? 'text-gray-400' : 'text-gray-400'}`}>{timeString}</span>
        {isOwn && (
          <span className="flex items-center">
            {message.read_at ? (
              // Double check bleu = lu
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="18 7 11 14 7 10"></polyline>
                <polyline points="22 7 15 14 13 12"></polyline>
              </svg>
            ) : (
              // Simple check gris = envoyé
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            )}
          </span>
        )}
      </div>
    </div>
  );
}

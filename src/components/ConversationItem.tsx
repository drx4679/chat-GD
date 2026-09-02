'use client';

// Élément individuel dans la liste des conversations
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ConversationWithDetails, Profile } from '@/types/database';
import UserAvatar from './UserAvatar';

interface ConversationItemProps {
  conversation: ConversationWithDetails;
  currentUserId: string;
}

export default function ConversationItem({ conversation, currentUserId }: ConversationItemProps) {
  const pathname = usePathname();
  const isActive = pathname === `/chat/${conversation.id}`;
  
  // Conversation client (commande) ou conversation normale
  const isOrderConversation = !!conversation.contact_name;
  
  // Trouver l'autre participant (conversations normales)
  const otherParticipant = conversation.participants.find(p => p.id !== currentUserId) as Profile;
  
  const displayName = isOrderConversation 
    ? conversation.contact_name! 
    : (otherParticipant?.username || 'Utilisateur');

  const displaySubtitle = isOrderConversation
    ? conversation.contact_phone || ''
    : '';

  const lastMessage = conversation.last_message;
  const timeString = lastMessage 
    ? formatTime(lastMessage.created_at)
    : '';

  const hasUnread = conversation.unread_count > 0;

  // Déterminer le preview du dernier message
  let lastMessagePreview = 'Nouvelle conversation';
  if (lastMessage) {
    if (lastMessage.content.startsWith('[ORDER:')) {
      lastMessagePreview = '📦 Nouvelle commande';
    } else {
      lastMessagePreview = (lastMessage.sender_id === currentUserId ? '✓ ' : '') + lastMessage.content;
    }
  }

  return (
    <Link 
      href={`/chat/${conversation.id}`} 
      className={`block transition-all duration-150 relative border-b border-gray-100/70 ${
        isActive 
          ? 'bg-indigo-50/70 border-l-[3px] border-l-indigo-600' 
          : 'hover:bg-gray-50/90 border-l-[3px] border-l-transparent'
      }`}
    >
      <div className="flex items-center px-3.5 py-3">
        {isOrderConversation ? (
          // Avatar client commande
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 via-amber-500 to-amber-600 flex items-center justify-center flex-shrink-0 shadow-sm ring-2 ring-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white drop-shadow-xs" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
        ) : (
          <UserAvatar 
            username={otherParticipant?.username || '?'} 
            avatarUrl={otherParticipant?.avatar_url} 
          />
        )}
        <div className="ml-3 flex-1 min-w-0">
          <div className="flex justify-between items-baseline mb-0.5">
            <div className="truncate pr-2">
              <h3 className={`text-sm truncate leading-snug ${hasUnread ? 'font-bold text-gray-950' : 'font-semibold text-gray-800'}`}>
                {displayName}
              </h3>
            </div>
            <span className={`text-[11px] flex-shrink-0 font-medium ${hasUnread ? 'text-indigo-600 font-semibold' : 'text-gray-400'}`}>
              {timeString}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <p className={`text-xs truncate ${hasUnread ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
              {displaySubtitle ? (
                <span className="text-gray-400 font-normal mr-1.5">{displaySubtitle} •</span>
              ) : null}
              {lastMessagePreview}
            </p>
            {hasUnread && (
              <span className="ml-2 bg-indigo-600 text-white text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full flex-shrink-0 px-1 shadow-xs animate-[popIn_0.15s_ease-out]">
                {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  } else if (diffDays === 1) {
    return 'Hier';
  } else if (diffDays < 7) {
    return date.toLocaleDateString('fr-FR', { weekday: 'short' });
  } else {
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
  }
}

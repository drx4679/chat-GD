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
      className={`block border-b border-gray-100 transition-colors ${
        isActive ? 'bg-indigo-50' : 'hover:bg-gray-50'
      }`}
    >
      <div className="flex items-center p-4">
        {isOrderConversation ? (
          // Avatar client commande
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center flex-shrink-0 shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
        ) : (
          <UserAvatar 
            username={otherParticipant?.username || '?'} 
            avatarUrl={otherParticipant?.avatar_url} 
          />
        )}
        <div className="ml-3 flex-1 overflow-hidden">
          <div className="flex justify-between items-baseline">
            <div className="truncate">
              <h3 className={`truncate ${hasUnread ? 'font-bold text-gray-900' : 'font-medium text-gray-900'}`}>
                {displayName}
              </h3>
              {displaySubtitle && (
                <span className="text-xs text-gray-400">{displaySubtitle}</span>
              )}
            </div>
            <span className={`text-xs flex-shrink-0 ml-2 ${hasUnread ? 'text-indigo-500 font-semibold' : 'text-gray-400'}`}>
              {timeString}
            </span>
          </div>
          <div className="flex justify-between items-center mt-0.5">
            <p className={`text-sm truncate ${hasUnread ? 'text-gray-800 font-medium' : 'text-gray-500'}`}>
              {lastMessagePreview}
            </p>
            {hasUnread && (
              <span className="ml-2 bg-indigo-500 text-white text-xs font-bold min-w-[20px] h-5 flex items-center justify-center rounded-full flex-shrink-0 px-1.5">
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

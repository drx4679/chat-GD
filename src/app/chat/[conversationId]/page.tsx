'use client';

import { useParams, useRouter } from 'next/navigation';
import { useConversations } from '@/hooks/useConversations';
import { useAuth } from '@/hooks/useAuth';
import { usePresence } from '@/hooks/usePresence';
import { useMessages } from '@/hooks/useMessages';
import MessageList from '@/components/MessageList';
import MessageInput from '@/components/MessageInput';
import UserAvatar from '@/components/UserAvatar';
import PresenceIndicator from '@/components/PresenceIndicator';
import { Profile } from '@/types/database';

export default function ConversationPage() {
  const params = useParams();
  const conversationId = params.conversationId as string;
  const router = useRouter();
  const { conversations, loading: convsLoading } = useConversations();
  const { profile } = useAuth();
  const { onlineUsers } = usePresence(conversationId);
  const { sendMessage } = useMessages(conversationId);

  const conversation = conversations.find(c => c.id === conversationId);
  const isOrderConversation = !!conversation?.contact_name;
  const otherParticipant = conversation?.participants.find(p => p.id !== profile?.id) as Profile;

  if (convsLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!conversation || (!otherParticipant && !isOrderConversation)) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Conversation introuvable</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-white relative">
      {/* Header */}
      <div className="flex items-center p-3 border-b border-gray-200 bg-white shadow-sm z-10">
        <button 
          onClick={() => router.push('/chat')}
          className="md:hidden mr-3 p-2 text-gray-500 hover:text-gray-900 rounded-full hover:bg-gray-100"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        {isOrderConversation ? (
          <>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center flex-shrink-0 shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <h2 className="font-semibold text-gray-900 leading-tight">
                {conversation.contact_name}
              </h2>
              <p className="text-xs text-gray-500">
                {conversation.contact_phone}
                {conversation.contact_email ? ` • ${conversation.contact_email}` : ''}
              </p>
            </div>
          </>
        ) : (
          <>
            <UserAvatar 
              username={otherParticipant.username} 
              avatarUrl={otherParticipant.avatar_url}
              size="md"
              online={onlineUsers[otherParticipant.id]?.online}
            />
            <div className="ml-3">
              <h2 className="font-semibold text-gray-900 leading-tight">
                {otherParticipant.username}
              </h2>
              <PresenceIndicator 
                userId={otherParticipant.id} 
                onlineUsers={onlineUsers} 
              />
            </div>
          </>
        )}
      </div>

      {/* Messages */}
      <MessageList conversationId={conversationId} />

      {/* Input ou bouton appel */}
      <div className="mt-auto z-10 bg-white">
        {isOrderConversation ? (
          <div className="border-t border-gray-200 p-3 flex items-center justify-center">
            <a
              href={`tel:${conversation.contact_phone}`}
              className="flex items-center space-x-3 bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-6 rounded-full transition-colors shadow-md"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.57.57a1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.45.57 3.57a1 1 0 01-.24 1.01l-2.2 2.2z"/>
              </svg>
              <span>Appeler {conversation.contact_name}</span>
            </a>
          </div>
        ) : (
          <MessageInput onSend={sendMessage} />
        )}
      </div>
    </div>
  );
}

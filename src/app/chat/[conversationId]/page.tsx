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
import OrderCounters from '@/components/OrderCounters';
import { Profile } from '@/types/database';

export default function ConversationPage() {
  const params = useParams();
  const conversationId = params.conversationId as string;
  const router = useRouter();
  const { conversations, loading: convsLoading } = useConversations();
  const { profile, loading: authLoading } = useAuth();
  const { onlineUsers } = usePresence(conversationId);
  const { sendMessage } = useMessages(conversationId);

  const conversation = conversations.find(c => c.id === conversationId);
  const isOrderConversation = !!conversation?.contact_name;
  const otherParticipant = conversation?.participants.find(p => p.id !== profile?.id) as Profile;

  if (convsLoading || authLoading) {
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
    <div className="flex-1 flex flex-col h-full bg-[#f8fafc] relative">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white/95 backdrop-blur-xs shadow-xs z-10">
        <div className="flex items-center min-w-0">
          <button 
            onClick={() => router.push('/chat')}
            className="md:hidden mr-2.5 p-1.5 text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
            title="Retour aux discussions"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          {isOrderConversation ? (
            <>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 via-amber-500 to-amber-600 flex items-center justify-center flex-shrink-0 shadow-sm ring-2 ring-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-3 min-w-0">
                <div className="flex items-center space-x-2">
                  <h2 className="font-semibold text-gray-900 leading-snug text-sm md:text-base truncate">
                    {conversation.contact_name}
                  </h2>
                  <span className="text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200/60 px-1.5 py-0.5 rounded-md">
                    Commande
                  </span>
                </div>
                <p className="text-xs text-gray-400 truncate">
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
              <div className="ml-3 min-w-0">
                <h2 className="font-semibold text-gray-900 leading-snug text-sm md:text-base truncate">
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

        <div className="flex items-center space-x-2 flex-shrink-0">
          <OrderCounters compact />

          {/* Quick action for order conversations in header */}
          {isOrderConversation && conversation.contact_phone && (
            <a
              href={`tel:${conversation.contact_phone}`}
              className="hidden sm:flex items-center space-x-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-emerald-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.57.57a1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.45.57 3.57a1 1 0 01-.24 1.01l-2.2 2.2z"/>
              </svg>
              <span>Appeler</span>
            </a>
          )}
        </div>
      </div>

      {/* Messages */}
      <MessageList conversationId={conversationId} />

      {/* Input ou bouton appel */}
      <div className="mt-auto z-10 bg-white">
        {isOrderConversation ? (
          <div className="border-t border-gray-100 p-3 bg-white flex items-center justify-center">
            <a
              href={`tel:${conversation.contact_phone}`}
              className="w-full sm:w-auto flex items-center justify-center space-x-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-medium py-2.5 px-6 rounded-xl transition-all shadow-sm shadow-emerald-600/20 text-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.57.57a1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.45.57 3.57a1 1 0 01-.24 1.01l-2.2 2.2z"/>
              </svg>
              <span>Appeler le client ({conversation.contact_phone || conversation.contact_name})</span>
            </a>
          </div>
        ) : (
          <MessageInput onSend={sendMessage} />
        )}
      </div>
    </div>
  );
}

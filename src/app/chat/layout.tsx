'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import ConversationList from '@/components/ConversationList';
import NotificationPrompt from '@/components/NotificationPrompt';

import { useOrderCounts } from '@/hooks/useOrderCounts';

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const orderCounts = useOrderCounts();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Sur mobile, si on est sur une page de conversation spécifique, on cache la liste
  const isConversationView = pathname !== '/chat';

  return (
    <div className="h-full flex flex-col bg-white">
      <NotificationPrompt />
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar : Liste des conversations */}
        <div className={`${isConversationView ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-80 lg:w-96 border-r border-gray-200 bg-white`}>
          <div className="p-4 border-b border-gray-200 bg-white shadow-sm z-10">
            <div className="flex justify-between items-center mb-2">
              <h1 className="text-xl font-bold text-gray-900">Discussions</h1>
              <button 
                onClick={() => signOut()}
                className="text-sm text-gray-500 hover:text-gray-900"
              >
                Déconnexion
              </button>
            </div>
            {/* Compteurs commandes */}
            <div className="flex items-center space-x-3 text-xs">
              {/* Total */}
              <div className="flex items-center space-x-1 text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <span className="font-semibold">{orderCounts.total}</span>
              </div>
              {/* Confirmées */}
              <div className="flex items-center space-x-1 text-green-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-semibold">{orderCounts.confirmed}</span>
              </div>
              {/* En attente */}
              <div className="flex items-center space-x-1 text-yellow-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-semibold">{orderCounts.pending}</span>
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-hidden">
            <ConversationList />
          </div>
        </div>

        {/* Vue principale : Chat ou Placeholder */}
        <div className={`${!isConversationView ? 'hidden md:flex' : 'flex'} flex-1 flex-col bg-gray-50`}>
          {children}
        </div>
      </div>
    </div>
  );
}

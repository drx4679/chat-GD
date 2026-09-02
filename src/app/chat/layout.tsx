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
    <div className="h-full flex flex-col bg-gray-50/50">
      <NotificationPrompt />
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar : Liste des conversations */}
        <div className={`${isConversationView ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-80 lg:w-96 border-r border-gray-200/80 bg-white z-20`}>
          <div className="px-4 py-3.5 border-b border-gray-100 bg-white">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                <h1 className="text-lg font-bold text-gray-900 tracking-tight">Discussions</h1>
              </div>
              <button 
                onClick={() => signOut()}
                className="text-xs font-medium text-gray-500 hover:text-red-600 hover:bg-red-50/80 px-2.5 py-1.5 rounded-lg transition-all flex items-center space-x-1"
                title="Se déconnecter"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Déconnexion</span>
              </button>
            </div>

            {/* Compteurs commandes en pilules modernes */}
            <div className="flex items-center gap-1.5">
              {/* Total */}
              <div className="flex-1 flex items-center justify-center space-x-1.5 bg-gray-50 border border-gray-100/90 text-gray-600 px-2.5 py-1.5 rounded-lg text-xs font-medium" title="Total commandes">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <span className="text-[11px] text-gray-500">Total</span>
                <span className="font-semibold text-gray-800">{orderCounts.total}</span>
              </div>
              {/* Confirmées */}
              <div className="flex-1 flex items-center justify-center space-x-1.5 bg-emerald-50/70 border border-emerald-100 text-emerald-700 px-2.5 py-1.5 rounded-lg text-xs font-medium" title="Commandes validées">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-[11px] text-emerald-600">Validées</span>
                <span className="font-semibold">{orderCounts.confirmed}</span>
              </div>
              {/* En attente */}
              <div className="flex-1 flex items-center justify-center space-x-1.5 bg-amber-50/70 border border-amber-100 text-amber-700 px-2.5 py-1.5 rounded-lg text-xs font-medium" title="Commandes en attente">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-[11px] text-amber-600">Attente</span>
                <span className="font-semibold">{orderCounts.pending}</span>
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-hidden bg-white">
            <ConversationList />
          </div>
        </div>

        {/* Vue principale : Chat ou Placeholder */}
        <div className={`${!isConversationView ? 'hidden md:flex' : 'flex'} flex-1 flex-col bg-[#f8fafc]`}>
          {children}
        </div>
      </div>
    </div>
  );
}

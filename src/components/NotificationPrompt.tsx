'use client';

import { useState } from 'react';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export default function NotificationPrompt() {
  const { isSubscribed, isSupported, permission, subscribe } = usePushNotifications();
  const [dismissed, setDismissed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  if (!isSupported || isSubscribed || dismissed) return null;

  const handleSubscribe = async () => {
    setSubscribing(true);
    await subscribe();
    setSubscribing(false);
  };

  if (permission === 'denied') {
    return (
      <div className="bg-amber-50 border-b border-amber-200/80 px-4 py-2.5 flex items-center justify-between text-xs animate-[fadeIn_0.2s_ease-out]">
        <div className="flex items-center space-x-2 text-amber-800">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-amber-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>
            Notifications bloquées sur ce PC : cliquez sur l'icône de cadenas à gauche de l'URL pour les autoriser.
          </span>
        </div>
        <button 
          onClick={() => setDismissed(true)}
          className="text-amber-500 hover:text-amber-800 p-1"
          title="Fermer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-indigo-50 to-indigo-100/60 border-b border-indigo-100 px-4 py-2.5 flex items-center justify-between text-xs animate-[fadeIn_0.2s_ease-out]">
      <div className="flex items-center space-x-2 text-indigo-900 font-medium">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-indigo-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        <span>Activer les notifications sur ce PC pour recevoir les nouvelles commandes et messages</span>
      </div>
      <div className="flex items-center space-x-2 flex-shrink-0">
        <button 
          onClick={handleSubscribe}
          disabled={subscribing}
          className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white px-3 py-1.5 rounded-lg font-semibold transition-all shadow-xs disabled:opacity-50"
        >
          {subscribing ? 'Activation...' : 'Activer'}
        </button>
        <button 
          onClick={() => setDismissed(true)}
          className="text-indigo-400 hover:text-indigo-700 p-1 rounded-md"
          title="Plus tard"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
}

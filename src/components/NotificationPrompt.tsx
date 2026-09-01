'use client';

// Bannière pour demander l'activation des notifications push
import { useState } from 'react';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export default function NotificationPrompt() {
  const { isSubscribed, isSupported, subscribe } = usePushNotifications();
  const [dismissed, setDismissed] = useState(false);

  if (!isSupported || isSubscribed || dismissed) return null;

  return (
    <div className="bg-indigo-50 border-b border-indigo-100 p-3 flex items-center justify-between">
      <p className="text-sm text-indigo-800 font-medium truncate pr-4">
        Activer les notifications pour ne rien manquer
      </p>
      <div className="flex items-center space-x-3 flex-shrink-0">
        <button 
          onClick={() => subscribe()}
          className="text-xs bg-indigo-500 text-white px-3 py-1.5 rounded-full font-medium hover:bg-indigo-600 transition-colors"
        >
          Activer
        </button>
        <button 
          onClick={() => setDismissed(true)}
          className="text-indigo-400 hover:text-indigo-600"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
}

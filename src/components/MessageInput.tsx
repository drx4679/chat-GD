'use client';

// Zone de saisie avec bouton commande
import { useState, KeyboardEvent } from 'react';
import OrderSearchModal from './OrderSearchModal';

interface Props {
  onSend: (content: string) => void;
}

export default function MessageInput({ onSend }: Props) {
  const [content, setContent] = useState('');
  const [orderModalOpen, setOrderModalOpen] = useState(false);

  const handleSend = () => {
    if (content.trim()) {
      onSend(content.trim());
      setContent('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleOrderSelect = (orderNumber: string) => {
    onSend(`[ORDER:${orderNumber}]`);
  };

  return (
    <>
      <div className="bg-white border-t border-gray-100 p-3 flex items-center space-x-2">
        {/* Bouton commande */}
        <button
          onClick={() => setOrderModalOpen(true)}
          className="p-2.5 rounded-xl flex-shrink-0 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50/80 transition-colors"
          title="Insérer une commande"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </button>

        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Écrivez un message..."
          className="flex-1 bg-gray-50/80 hover:bg-gray-100/80 border border-gray-200/60 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl px-4 py-2.5 text-sm transition-all outline-none placeholder:text-gray-400"
        />
        <button
          onClick={handleSend}
          disabled={!content.trim()}
          className={`p-2.5 rounded-xl flex-shrink-0 transition-all ${
            content.trim() 
              ? 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 shadow-xs' 
              : 'bg-gray-100 text-gray-300 cursor-not-allowed'
          }`}
          title="Envoyer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </div>

      <OrderSearchModal
        isOpen={orderModalOpen}
        onClose={() => setOrderModalOpen(false)}
        onSelectOrder={handleOrderSelect}
      />
    </>
  );
}

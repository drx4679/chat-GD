'use client';

// Page par défaut du chat (bureau uniquement, sur mobile c'est la liste qui est affichée)
export default function ChatPlaceholderPage() {
  return (
    <div className="hidden md:flex flex-1 items-center justify-center bg-[#f8fafc]">
      <div className="text-center p-8 max-w-sm">
        <div className="w-16 h-16 mx-auto mb-4 bg-white border border-gray-100 shadow-xs rounded-2xl flex items-center justify-center text-indigo-600">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <h2 className="text-base font-semibold text-gray-900 tracking-tight">GD Shop Messenger</h2>
        <p className="mt-1.5 text-xs text-gray-500 leading-relaxed">
          Sélectionnez une discussion à gauche pour afficher les messages et gérer les commandes.
        </p>
      </div>
    </div>
  );
}

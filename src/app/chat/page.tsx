'use client';

// Page par défaut du chat (bureau uniquement, sur mobile c'est la liste qui est affichée)
export default function ChatPlaceholderPage() {
  return (
    <div className="hidden md:flex flex-1 items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-20 h-20 mx-auto mb-4 bg-indigo-100 text-indigo-500 rounded-full flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <h2 className="text-xl font-medium text-gray-900">GD Shop Chat</h2>
        <p className="mt-2 text-gray-500">Sélectionnez une conversation pour commencer</p>
      </div>
    </div>
  );
}

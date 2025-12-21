import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';
import { ElkFlowDiagram } from './ElkFlowDiagram';
import { modules, appMetadata } from '../../data/docs/productReferenceData';

export function ProductReference() {
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Show scroll to top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-100">
      {/* Main Content */}
      <main className="w-full px-4 py-12">
        {/* Afficher seulement le Hub */}
        <ElkFlowDiagram
          nodes={modules[0].flowNodes}
          edges={modules[0].flowEdges}
          title={`Flow : ${modules[0].name}`}
        />

        {/* Footer */}
        <footer className="mt-24 pt-12 border-t border-gray-800 text-center text-gray-500 text-sm">
          <p>
            NewMars v{appMetadata.version} — Document de référence produit
          </p>
          <p className="mt-2">
            Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
          </p>
        </footer>
      </main>

      {/* Scroll to top button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 p-3 rounded-full bg-blue-500 hover:bg-blue-600 text-white shadow-2xl transition-all duration-300 hover:scale-110 z-50"
          aria-label="Retour en haut"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}


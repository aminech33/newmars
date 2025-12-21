import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Feature } from '../../data/docs/productReferenceData';

interface FeatureAccordionProps {
  features: Feature[];
  title?: string;
}

export function FeatureAccordion({ features, title = 'Fonctionnalités détaillées' }: FeatureAccordionProps) {
  const [isOpen, setIsOpen] = useState(true); // Ouvert par défaut

  const getStatusBadge = (status: Feature['status']) => {
    switch (status) {
      case 'implemented':
        return <span className="px-2 py-1 text-xs font-semibold rounded bg-green-500/20 text-green-400 border border-green-500/30">✅ Implémenté</span>;
      case 'planned':
        return <span className="px-2 py-1 text-xs font-semibold rounded bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">🚧 Prévu</span>;
      case 'excluded':
        return <span className="px-2 py-1 text-xs font-semibold rounded bg-red-500/20 text-red-400 border border-red-500/30">❌ Exclu</span>;
    }
  };

  return (
    <div className="border border-gray-700 rounded-lg overflow-hidden bg-gray-800/50 backdrop-blur-sm hover:border-blue-500/50 transition-all duration-300">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-6 py-4 bg-gray-800/70 hover:bg-gray-700/70 transition-colors duration-200"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">📋</span>
          <span className="text-lg font-semibold text-gray-200">{title}</span>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="p-6 bg-gray-800/30 animate-in slide-in-from-top-2 duration-300">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Fonctionnalité</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300 w-40">Statut</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Description</th>
              </tr>
            </thead>
            <tbody>
              {features.map((feature, index) => (
                <tr
                  key={index}
                  className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors duration-150"
                >
                  <td className="py-3 px-4 text-sm font-medium text-gray-200">{feature.name}</td>
                  <td className="py-3 px-4">{getStatusBadge(feature.status)}</td>
                  <td className="py-3 px-4 text-sm text-gray-400">{feature.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}


import React from 'react';
import { ModuleData } from '../../data/docs/productReferenceData';

interface DocsSidebarProps {
  modules: ModuleData[];
  activeModule?: string;
}

export function DocsSidebar({ modules, activeModule }: DocsSidebarProps) {
  const scrollToModule = (moduleId: string) => {
    const element = document.getElementById(moduleId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <aside className="fixed left-8 top-32 w-64 h-[calc(100vh-180px)] overflow-y-auto">
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-4 shadow-xl">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            📑 Navigation
          </h3>
        </div>
        
        <nav className="space-y-1">
          {modules.map((module) => (
            <button
              key={module.id}
              onClick={() => scrollToModule(module.id)}
              className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-200 flex items-center gap-3 ${
                activeModule === module.id
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'text-gray-400 hover:bg-gray-700/50 hover:text-gray-200'
              }`}
            >
              <span className="text-lg">{module.icon}</span>
              <span className="text-sm font-medium">{module.name}</span>
            </button>
          ))}
        </nav>

        {/* Quick stats */}
        <div className="mt-6 pt-4 border-t border-gray-700">
          <div className="text-xs text-gray-500 space-y-1">
            <div className="flex justify-between">
              <span>Modules</span>
              <span className="text-gray-400 font-semibold">{modules.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Features</span>
              <span className="text-gray-400 font-semibold">
                {modules.reduce((sum, m) => sum + m.features.length, 0)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}


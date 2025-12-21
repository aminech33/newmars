import React, { useCallback, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  BackgroundVariant,
  OnNodesChange,
  OnSelectionChangeParams,
  Connection,
  addEdge,
} from 'reactflow';
import 'reactflow/dist/style.css';

interface ModuleFlowDiagramProps {
  nodes: Node[];
  edges: Edge[];
  title: string;
}

export function ModuleFlowDiagram({ nodes, edges }: ModuleFlowDiagramProps) {
  const [nodesState, , onNodesChange] = useNodesState(nodes);
  const [edgesState, setEdges, onEdgesChange] = useEdgesState(edges);
  const [showPositions, setShowPositions] = useState(false);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [showEdgeInfo, setShowEdgeInfo] = useState(false);

  // Handler pour afficher les positions après déplacement
  const handleNodesChange: OnNodesChange = useCallback((changes) => {
    onNodesChange(changes);
  }, [onNodesChange]);

  // Handler pour la sélection d'un edge
  const handleEdgeClick = useCallback((_event: React.MouseEvent, edge: Edge) => {
    setSelectedEdge(edge);
    setShowEdgeInfo(true);
  }, []);

  // Handler pour les changements de sélection
  const handleSelectionChange = useCallback((params: OnSelectionChangeParams) => {
    if (params.edges && params.edges.length > 0) {
      setSelectedEdge(params.edges[0]);
      setShowEdgeInfo(true);
    } else if (params.edges && params.edges.length === 0) {
      // Déselection
      setSelectedEdge(null);
      setShowEdgeInfo(false);
    }
  }, []);

  // Handler pour la suppression d'edges
  const onEdgesDelete = useCallback((edgesToDelete: Edge[]) => {
    console.log('🗑️ Edges supprimés:', edgesToDelete);
    
    // Copie les IDs supprimés dans le presse-papier
    const deletedIds = edgesToDelete.map(e => e.id).join('\n');
    navigator.clipboard.writeText(deletedIds);
    
    alert(`✅ ${edgesToDelete.length} fil(s) supprimé(s) !\n\n📋 IDs copiés dans le presse-papier.\n\n⚠️ Pour sauvegarder définitivement :\n1. Ouvre productReferenceData.ts\n2. Cherche et supprime ces IDs\n\nSupprimés :\n${deletedIds}`);
    
    setSelectedEdge(null);
    setShowEdgeInfo(false);
  }, []);

  // Handler pour la connexion de nouveaux edges
  const onConnect = useCallback((connection: Connection) => {
    if (!connection.source || !connection.target) return;
    
    const newEdge: Edge = {
      id: `e-new-${connection.source}-${connection.target}-${Date.now()}`,
      source: connection.source,
      target: connection.target,
      animated: false,
      style: { stroke: '#4a9eff', strokeWidth: 2 }
    };
    
    setEdges((eds) => addEdge(newEdge, eds));
    
    // Copie le code du nouvel edge
    const edgeCode = `{ id: '${newEdge.id}', source: '${newEdge.source}', target: '${newEdge.target}', style: { stroke: '#4a9eff', strokeWidth: 2 } },`;
    navigator.clipboard.writeText(edgeCode);
    
    alert(`✅ Nouveau fil créé !\n\n📋 Code copié dans le presse-papier.\n\nColle-le dans productReferenceData.ts → flowEdges\n\nNouveau fil :\nID: ${newEdge.id}\nDe: ${connection.source}\nVers: ${connection.target}`);
  }, [setEdges]);

  // Fonction pour copier les positions dans le presse-papier
  const copyPositions = () => {
    const positions = nodesState.map(node => ({
      id: node.id,
      position: node.position
    }));
    
    const positionsText = JSON.stringify(positions, null, 2);
    navigator.clipboard.writeText(positionsText);
    alert('✅ Positions copiées dans le presse-papier !');
  };

  // Fonction pour copier les infos de l'edge sélectionné
  const copyEdgeInfo = () => {
    if (!selectedEdge) return;
    
    const edgeInfo = {
      id: selectedEdge.id,
      source: selectedEdge.source,
      target: selectedEdge.target,
      label: selectedEdge.label || '',
      animated: selectedEdge.animated || false,
      type: selectedEdge.type || 'default',
      style: selectedEdge.style || {}
    };
    
    const edgeText = JSON.stringify(edgeInfo, null, 2);
    navigator.clipboard.writeText(edgeText);
    alert('✅ Informations du fil copiées !');
  };

  // Fonction pour supprimer l'edge sélectionné
  const deleteSelectedEdge = () => {
    if (!selectedEdge) return;
    
    // Copie l'ID dans le presse-papier
    const searchText = `id: '${selectedEdge.id}'`;
    navigator.clipboard.writeText(searchText);
    
    alert(`✅ ID copié : ${selectedEdge.id}\n\n📝 Pour supprimer définitivement :\n\n1. Ouvre : src/data/docs/productReferenceData.ts\n2. Ctrl+F et colle (déjà copié)\n3. Supprime la ligne complète\n4. Sauvegarde → Le fil disparaît !`);
    
    setShowEdgeInfo(false);
    setSelectedEdge(null);
  };

  // Fonction pour afficher les positions
  const togglePositions = () => {
    setShowPositions(!showPositions);
  };

  return (
    <div className="flex gap-4 h-[800px]">
      {/* Diagramme à gauche - Prend tout l'espace disponible */}
      <div className="flex-1 rounded-xl border-2 border-blue-500 bg-gray-900 overflow-hidden shadow-2xl relative min-w-0">
        {/* Boutons de contrôle en haut du diagramme */}
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <button
            onClick={togglePositions}
            className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm rounded-lg border border-gray-600 transition-colors"
            title="Afficher/Masquer les positions"
          >
            {showPositions ? '👁️' : '📍'}
          </button>
          <button
            onClick={copyPositions}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg border border-blue-400 transition-colors"
            title="Copier les positions dans le presse-papier"
          >
            📋
          </button>
        </div>

        {/* Affichage des positions (modal flottant) */}
        {showPositions && (
          <div className="absolute top-16 right-4 z-10 max-w-xs max-h-96 overflow-auto bg-gray-800 border border-gray-600 rounded-lg p-3 text-xs text-gray-300 font-mono">
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-white text-sm">Positions</span>
              <button
                onClick={() => setShowPositions(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <pre className="whitespace-pre-wrap text-[10px]">
              {JSON.stringify(nodesState.map(n => ({ id: n.id, x: Math.round(n.position.x), y: Math.round(n.position.y) })), null, 2)}
            </pre>
          </div>
        )}

        <ReactFlow
          nodes={nodesState}
          edges={edgesState}
          onNodesChange={handleNodesChange}
          onEdgesChange={onEdgesChange}
          onEdgeClick={handleEdgeClick}
          onSelectionChange={handleSelectionChange}
          onEdgesDelete={onEdgesDelete}
          onConnect={onConnect}
          fitView
          attributionPosition="bottom-left"
          className="bg-gray-900"
          nodesDraggable={true}
          nodesConnectable={true}
          elementsSelectable={true}
          selectNodesOnDrag={false}
          edgesFocusable={true}
          deleteKeyCode="Delete"
          defaultEdgeOptions={{
            animated: false,
            style: { stroke: '#9d9d9d', strokeWidth: 2 },
          }}
        >
          <Background
            color="#4a9eff"
            variant={BackgroundVariant.Dots}
            gap={16}
            size={1}
            className="bg-gray-900"
          />
          <Controls className="bg-gray-800 border-gray-700 rounded-lg" />
        </ReactFlow>
      </div>

      {/* Panneau d'information à droite - Largeur fixe compacte */}
      <div className="w-80 flex-shrink-0 rounded-xl border-2 border-gray-700 bg-gray-800 overflow-hidden shadow-2xl flex flex-col">
        {/* Header du panneau */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-3 border-b border-blue-400">
          <h3 className="text-white font-bold text-base flex items-center gap-2">
            <span>🔧</span>
            Contrôle
          </h3>
        </div>

        {/* Contenu du panneau */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {/* Instructions */}
          <div className="bg-gray-900 rounded-lg p-3 border border-gray-700">
            <h4 className="text-yellow-400 font-semibold text-xs mb-2 flex items-center gap-2">
              💡 Utilisation
            </h4>
            <ul className="text-gray-300 text-[11px] space-y-1">
              <li>• Clique sur un <strong>fil</strong></li>
              <li>• <strong>Delete</strong> = supprimer fil</li>
              <li>• <strong>Drag nœud→nœud</strong> = créer fil</li>
              <li>• Molette = <strong>zoom</strong></li>
            </ul>
          </div>

          {/* Informations du fil sélectionné */}
          {selectedEdge ? (
            <div className="bg-gradient-to-br from-yellow-900/30 to-orange-900/30 rounded-lg p-3 border-2 border-yellow-500">
              <div className="flex justify-between items-start mb-3">
                <h4 className="text-yellow-400 font-bold text-sm">🔗 Fil sélectionné</h4>
                <button
                  onClick={() => {
                    setShowEdgeInfo(false);
                    setSelectedEdge(null);
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-2">
                {/* Infos essentielles seulement */}
                <div className="bg-gray-900/50 rounded p-2">
                  <div className="text-[10px] text-gray-400 mb-1">ID</div>
                  <div className="font-mono text-white text-xs break-all">{selectedEdge.id}</div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-gray-900/50 rounded p-2">
                    <div className="text-[10px] text-gray-400 mb-1">De</div>
                    <div className="font-mono text-blue-400 text-[10px]">{selectedEdge.source.split('-').pop()}</div>
                  </div>
                  <div className="bg-gray-900/50 rounded p-2">
                    <div className="text-[10px] text-gray-400 mb-1">Vers</div>
                    <div className="font-mono text-green-400 text-[10px]">{selectedEdge.target.split('-').pop()}</div>
                  </div>
                </div>

                {/* Propriétés en ligne compacte */}
                <div className="flex gap-2 text-xs">
                  <div className="bg-gray-900/50 rounded px-2 py-1">
                    {selectedEdge.animated ? '⚡ Animé' : '➖ Statique'}
                  </div>
                  {selectedEdge.label && (
                    <div className="bg-gray-900/50 rounded px-2 py-1 flex-1 truncate">
                      "{selectedEdge.label}"
                    </div>
                  )}
                </div>

                {/* Boutons d'action - Simplifié */}
                <div className="space-y-2 pt-2">
                  <button
                    onClick={() => {
                      const code = `{ id: '${selectedEdge.id}', source: '${selectedEdge.source}', target: '${selectedEdge.target}', ${selectedEdge.animated ? 'animated: true, ' : ''}${selectedEdge.label ? `label: '${selectedEdge.label}', ` : ''}style: ${JSON.stringify(selectedEdge.style || {})} }`;
                      navigator.clipboard.writeText(code);
                      alert('✅ Code copié dans le presse-papier !');
                    }}
                    className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded transition-colors font-medium"
                  >
                    📋 Copier le code
                  </button>
                  <button
                    onClick={deleteSelectedEdge}
                    className="w-full px-3 py-2 bg-red-600 hover:bg-red-500 text-white text-xs rounded transition-colors font-bold"
                  >
                    🗑️ Supprimer (1 clic)
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-900 rounded-lg p-4 border border-gray-700 text-center">
              <div className="text-gray-500 text-4xl mb-2">🔗</div>
              <p className="text-gray-400 text-xs">
                Clique sur un fil pour voir ses infos
              </p>
            </div>
          )}

          {/* Stats du diagramme */}
          <div className="bg-gray-900 rounded-lg p-3 border border-gray-700">
            <h4 className="text-blue-400 font-semibold text-xs mb-2 flex items-center gap-2">
              📊 Stats
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-400">Nœuds:</span>
                <span className="ml-1 text-white font-bold">{nodesState.length}</span>
              </div>
              <div>
                <span className="text-gray-400">Fils:</span>
                <span className="ml-1 text-white font-bold">{edgesState.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


import React, { useCallback, useState, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  BackgroundVariant,
  Connection,
  addEdge,
} from 'reactflow';
import ELK, { ElkNode } from 'elkjs/lib/elk.bundled.js';
import 'reactflow/dist/style.css';

interface ElkFlowDiagramProps {
  nodes: Node[];
  edges: Edge[];
  title: string;
}

// Initialisation d'ELK
const elk = new ELK();

// Configuration du layout ELK
const elkOptions = {
  'elk.algorithm': 'layered',
  'elk.layered.spacing.nodeNodeBetweenLayers': '150', // Plus d'espace vertical
  'elk.spacing.nodeNode': '120', // Plus d'espace horizontal
  'elk.direction': 'DOWN',
};

// Fonction pour calculer le layout avec ELK
const getLayoutedElements = async (nodes: Node[], edges: Edge[]) => {
  const graph: ElkNode = {
    id: 'root',
    layoutOptions: elkOptions,
    children: nodes.map((node) => ({
      id: node.id,
      width: 180, // Plus large
      height: 60, // Plus haut
    })),
    edges: edges.map((edge) => ({
      id: edge.id,
      sources: [edge.source],
      targets: [edge.target],
    })),
  };

  const layoutedGraph = await elk.layout(graph);

  const layoutedNodes = nodes.map((node) => {
    const layoutedNode = layoutedGraph.children?.find((n) => n.id === node.id);
    return {
      ...node,
      position: {
        x: layoutedNode?.x ?? 0,
        y: layoutedNode?.y ?? 0,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};

export function ElkFlowDiagram({ nodes, edges, title }: ElkFlowDiagramProps) {
  const [nodesState, setNodes, onNodesChange] = useNodesState([]);
  const [edgesState, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isLayouting, setIsLayouting] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Mode création de parcours
  const [isCreatingPath, setIsCreatingPath] = useState(false);
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [pathName, setPathName] = useState('');

  // Clé localStorage unique par diagramme
  const localStorageKey = `elk-positions-${title}`;
  const localStorageEdgesKey = `elk-edges-${title}`;

  // Charger les positions depuis localStorage
  const loadPositionsFromStorage = (): Record<string, { x: number; y: number }> | null => {
    try {
      const saved = localStorage.getItem(localStorageKey);
      if (saved) {
        console.log('📂 Positions chargées depuis localStorage:', localStorageKey);
        return JSON.parse(saved);
      }
      return null;
    } catch (error) {
      console.error('Erreur lors du chargement des positions:', error);
      return null;
    }
  };

  // Charger les edges depuis localStorage
  const loadEdgesFromStorage = (): Edge[] | null => {
    try {
      const saved = localStorage.getItem(localStorageEdgesKey);
      if (saved) {
        console.log('📂 Edges chargés depuis localStorage:', localStorageEdgesKey);
        return JSON.parse(saved);
      }
      return null;
    } catch (error) {
      console.error('Erreur lors du chargement des edges:', error);
      return null;
    }
  };

  // Sauvegarder les positions ET les edges dans localStorage
  const saveToStorage = (nodesToSave: Node[], edgesToSave: Edge[]) => {
    try {
      // Sauvegarder positions
      const positions: Record<string, { x: number; y: number }> = {};
      nodesToSave.forEach(node => {
        positions[node.id] = { x: Math.round(node.position.x), y: Math.round(node.position.y) };
      });
      localStorage.setItem(localStorageKey, JSON.stringify(positions));
      
      // Sauvegarder edges
      const edgesData = edgesToSave.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        animated: edge.animated,
        label: edge.label,
        style: edge.style,
        type: edge.type,
      }));
      localStorage.setItem(localStorageEdgesKey, JSON.stringify(edgesData));
      
      console.log('💾 Sauvegardé:', nodesToSave.length, 'nœuds et', edgesToSave.length, 'liens');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  };

  // Calcul du layout initial avec ELK (ou chargement depuis localStorage)
  useEffect(() => {
    // Ne s'exécute qu'une seule fois au montage
    if (isInitialized) return;

    const layoutElements = async () => {
      setIsLayouting(true);
      
      // Charger les positions et edges sauvegardés
      const savedPositions = loadPositionsFromStorage();
      const savedEdges = loadEdgesFromStorage();
      
      if (savedPositions && Object.keys(savedPositions).length > 0) {
        // Utiliser les positions et edges sauvegardés
        console.log('✅ Utilisation des données sauvegardées');
        const nodesWithSavedPositions = nodes.map(node => ({
          ...node,
          position: savedPositions[node.id] || node.position || { x: 0, y: 0 }
        }));
        setNodes(nodesWithSavedPositions);
        
        // Utiliser les edges sauvegardés s'ils existent, sinon les edges par défaut
        if (savedEdges && savedEdges.length > 0) {
          setEdges(savedEdges);
          console.log('✅', savedEdges.length, 'liens chargés');
        } else {
          setEdges(edges);
        }
      } else {
        // Calculer avec ELK si pas de positions sauvegardées
        console.log('🔄 Calcul du layout avec ELK...');
        const { nodes: layoutedNodes, edges: layoutedEdges } = await getLayoutedElements(nodes, edges);
        setNodes(layoutedNodes);
        setEdges(layoutedEdges);
        // Sauvegarder immédiatement
        saveToStorage(layoutedNodes, layoutedEdges);
      }
      
      setIsLayouting(false);
      setIsInitialized(true);
    };
    
    layoutElements();
  }, [isInitialized]); // Seulement isInitialized comme dépendance

  // Sauvegarder automatiquement les positions après chaque déplacement
  const handleNodesChange = useCallback((changes: any) => {
    onNodesChange(changes);
    
    // Détecter la fin d'un déplacement
    const moveChange = changes.find((c: any) => c.type === 'position' && c.dragging === false);
    if (moveChange) {
      // Utiliser setTimeout pour laisser le state se mettre à jour
      setTimeout(() => {
        // Récupérer directement depuis le DOM les positions actuelles
        const reactFlowWrapper = document.querySelector('.react-flow');
        if (reactFlowWrapper) {
          // Forcer une lecture du state avec setNodes
          setNodes((currentNodes) => {
            setEdges((currentEdges) => {
              // Sauvegarder les positions ET les edges actuels
              saveToStorage(currentNodes, currentEdges);
              console.log('🎯 Auto-save - Nœuds:', currentNodes.length, 'Liens:', currentEdges.length);
              return currentEdges;
            });
            return currentNodes;
          });
        }
      }, 100);
    }
  }, [onNodesChange, setNodes, setEdges]);

  // Recalculer le layout ELK (reset les positions)
  const relayout = useCallback(async () => {
    setIsLayouting(true);
    const { nodes: layoutedNodes, edges: layoutedEdges } = await getLayoutedElements(nodesState, edgesState);
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
    // Sauvegarder les nouvelles positions et edges
    saveToStorage(layoutedNodes, layoutedEdges);
    setIsLayouting(false);
    alert('✅ Layout recalculé et sauvegardé !');
  }, [nodesState, edgesState, setNodes, setEdges]);

  // Réinitialiser les positions (supprimer localStorage)
  const resetPositions = useCallback(() => {
    if (confirm('⚠️ Réinitialiser les positions ET les liens ?\n\nCela supprimera toutes les modifications sauvegardées.')) {
      localStorage.removeItem(localStorageKey);
      localStorage.removeItem(localStorageEdgesKey);
      console.log('🗑️ localStorage supprimé:', localStorageKey, localStorageEdgesKey);
      setIsInitialized(false); // Force le recalcul
      window.location.reload(); // Reload pour relancer l'initialisation
    }
  }, [localStorageKey, localStorageEdgesKey]);

  // Handler pour la sélection d'un nœud
  const handleNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    if (isCreatingPath) {
      // Mode création : ajouter ou retirer du parcours (toggle)
      setCurrentPath(prev => {
        const index = prev.indexOf(node.id);
        if (index !== -1) {
          // Nœud déjà dans le parcours → le retirer
          return prev.filter((id, i) => i !== index);
        } else {
          // Nœud pas dans le parcours → l'ajouter
          return [...prev, node.id];
        }
      });
    } else {
      // Mode édition normal
      setSelectedNode(node);
      setSelectedEdge(null);
    }
  }, [isCreatingPath]);

  // Handler pour la sélection d'un edge
  const handleEdgeClick = useCallback((_event: React.MouseEvent, edge: Edge) => {
    setSelectedEdge(edge);
    setSelectedNode(null); // Désélectionner le nœud si un edge est sélectionné
  }, []);

  // Handler pour la suppression d'edges
  const onEdgesDelete = useCallback((edgesToDelete: Edge[]) => {
    const deletedIds = edgesToDelete.map(e => e.id).join('\n');
    navigator.clipboard.writeText(deletedIds);
    
    // Sauvegarder automatiquement après suppression
    setNodes((currentNodes) => {
      setEdges((currentEdges) => {
        const remainingEdges = currentEdges.filter(e => !edgesToDelete.find(d => d.id === e.id));
        saveToStorage(currentNodes, remainingEdges);
        console.log('🗑️ Liens supprimés et sauvegardé automatiquement');
        return currentEdges; // Pas besoin de modifier, React Flow le fait
      });
      return currentNodes;
    });
    
    alert(`✅ ${edgesToDelete.length} fil(s) supprimé(s) et SAUVEGARDÉ automatiquement !\n\n📋 IDs copiés si besoin.`);
    
    setSelectedEdge(null);
  }, [setNodes, setEdges]);

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
    
    setEdges((eds) => {
      const updatedEdges = addEdge(newEdge, eds);
      
      // Sauvegarder automatiquement avec les nouvelles edges
      setNodes((currentNodes) => {
        saveToStorage(currentNodes, updatedEdges);
        console.log('✅ Nouveau lien créé et sauvegardé automatiquement !');
        return currentNodes;
      });
      
      return updatedEdges;
    });
    
    const edgeCode = `{ id: '${newEdge.id}', source: '${newEdge.source}', target: '${newEdge.target}', style: { stroke: '#4a9eff', strokeWidth: 2 } },`;
    navigator.clipboard.writeText(edgeCode);
    
    alert(`✅ Nouveau fil créé et SAUVEGARDÉ automatiquement !\n\n📋 Code aussi copié dans le presse-papier si tu veux l'ajouter au fichier source.`);
  }, [setEdges, setNodes]);

  // Fonction pour supprimer l'edge sélectionné
  const deleteSelectedEdge = () => {
    if (!selectedEdge) return;

    navigator.clipboard.writeText(selectedEdge.id);
    
    // Supprime l'edge
    setEdges((eds) => {
      const updatedEdges = eds.filter(e => e.id !== selectedEdge.id);
      
      // Sauvegarder automatiquement
      setNodes((currentNodes) => {
        saveToStorage(currentNodes, updatedEdges);
        console.log('🗑️ Fil supprimé et sauvegardé automatiquement');
        return currentNodes;
      });
      
      return updatedEdges;
    });
    
    alert(`✅ Fil supprimé et SAUVEGARDÉ automatiquement !`);
    
    setSelectedEdge(null);
  };

  // Fonction pour exporter les données JSON
  const exportData = () => {
    const data = {
      nodes: nodesState.map(n => ({
        id: n.id,
        label: n.data.label,
        style: n.style,
      })),
      edges: edgesState.map(e => ({
        id: e.id,
        source: e.source,
        target: e.target,
        animated: e.animated,
        style: e.style,
      })),
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    navigator.clipboard.writeText(dataStr);
    alert('✅ Données exportées dans le presse-papier !\n\n💡 Format JSON compatible IA');
  };

  // Fonction pour appliquer la surbrillance au parcours
  const getNodeStyleWithPath = (nodeId: string): React.CSSProperties => {
    const baseNode = nodesState.find(n => n.id === nodeId);
    const baseStyle = baseNode?.style || {};
    
    const pathIndex = currentPath.indexOf(nodeId);
    
    if (pathIndex === -1) {
      // Nœud pas dans le parcours - style normal
      return baseStyle;
    }
    
    // Nœud dans le parcours → surbrillance (sans écraser le style de base)
    return {
      ...baseStyle,
      // Ajouter une ombre bleue lumineuse
      boxShadow: `0 0 25px 8px rgba(74, 158, 255, 0.8), ${baseStyle.boxShadow || ''}`,
      // Utiliser outline au lieu de border pour ne pas écraser
      outline: '4px solid #4a9eff',
      outlineOffset: '2px',
      // Légère augmentation de taille
      transform: 'scale(1.08)',
      // Assurer que le z-index est élevé
      zIndex: 100,
    };
  };

  // Appliquer les styles dynamiques aux nœuds
  const nodesWithStyles = nodesState.map(node => {
    const isInPath = currentPath.includes(node.id);
    
    return {
      ...node,
      className: isCreatingPath && isInPath ? 'highlighted-node' : '',
      style: node.style, // Garder le style original
    };
  });

  return (
    <div className="flex gap-4 h-[800px]">
      {/* Style CSS pour la surbrillance des nœuds */}
      <style>{`
        .react-flow__node.highlighted-node {
          outline: 4px solid #4a9eff !important;
          outline-offset: 3px !important;
          box-shadow: 0 0 30px 10px rgba(74, 158, 255, 0.9) !important;
          animation: pulse-glow 1.5s ease-in-out infinite !important;
          z-index: 1000 !important;
        }
        
        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 30px 10px rgba(74, 158, 255, 0.9);
          }
          50% {
            box-shadow: 0 0 40px 15px rgba(74, 158, 255, 1);
          }
        }
        
        /* Améliorer la sélectabilité des nœuds */
        .react-flow__node {
          cursor: pointer !important;
          transition: all 0.2s ease !important;
        }
        
        .react-flow__node:hover {
          transform: scale(1.02) !important;
          filter: brightness(1.1) !important;
          z-index: 10 !important;
        }
        
        /* Rendre toute la zone du nœud cliquable */
        .react-flow__node > div {
          pointer-events: all !important;
        }
      `}</style>
      
      {/* Diagramme à gauche */}
      <div className="flex-1 rounded-xl border-2 border-blue-500 bg-gray-900 overflow-hidden shadow-2xl relative min-w-0">
        {/* Loading overlay */}
        {isLayouting && (
          <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm z-20 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4 animate-spin">⚙️</div>
              <div className="text-white font-bold text-xl">Calcul du layout...</div>
              <div className="text-gray-400 text-sm mt-2">ELK.js optimise l'affichage</div>
            </div>
          </div>
        )}

        {/* Boutons de contrôle */}
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <button
            onClick={() => {
              setIsCreatingPath(!isCreatingPath);
              if (!isCreatingPath) {
                setCurrentPath([]);
                setPathName('');
              }
            }}
            className={`px-4 py-2 ${
              isCreatingPath 
                ? 'bg-blue-600 hover:bg-blue-500 ring-2 ring-blue-300' 
                : 'bg-gray-700 hover:bg-gray-600'
            } text-white text-sm rounded-lg font-bold transition-all shadow-lg`}
            title="Activer/Désactiver le mode création de parcours"
          >
            🎯 {isCreatingPath ? 'Mode Parcours ON' : 'Créer Parcours'}
          </button>
          <button
            onClick={() => {
              setNodes((currentNodes) => {
                setEdges((currentEdges) => {
                  saveToStorage(currentNodes, currentEdges);
                  console.log('💾 Sauvegarde manuelle - Nœuds:', currentNodes.length, 'Liens:', currentEdges.length);
                  alert('✅ Positions ET liens sauvegardés !');
                  return currentEdges;
                });
                return currentNodes;
              });
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg font-bold transition-colors shadow-lg"
            title="Sauvegarder les positions ET les liens"
          >
            💾 Sauvegarder
          </button>
          <button
            onClick={relayout}
            disabled={isLayouting}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-600 text-white text-sm rounded-lg font-bold transition-colors shadow-lg"
            title="Recalculer le layout automatiquement avec ELK"
          >
            🔄 Recalculer
          </button>
          <button
            onClick={resetPositions}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white text-sm rounded-lg font-bold transition-colors shadow-lg"
            title="Réinitialiser les positions sauvegardées"
          >
            ♻️ Reset
          </button>
          <button
            onClick={exportData}
            className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-sm rounded-lg font-bold transition-colors shadow-lg"
            title="Exporter les données JSON"
          >
            📤 Export
          </button>
        </div>

        {/* Panel de création de parcours */}
        {isCreatingPath && (
          <div className="absolute top-20 left-4 z-10 bg-gray-900/95 border-2 border-blue-500 rounded-lg p-4 w-80 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-blue-400 font-bold flex items-center gap-2">
                <span>🎯</span>
                Création de parcours
              </h3>
              <button
                onClick={() => {
                  setIsCreatingPath(false);
                  setCurrentPath([]);
                  setPathName('');
                }}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <input
              type="text"
              placeholder="Nom du parcours..."
              value={pathName}
              onChange={(e) => setPathName(e.target.value)}
              className="w-full bg-gray-800 text-white text-sm p-2 rounded border border-gray-600 mb-3"
            />

            <div className="bg-gray-800/50 rounded p-2 mb-3 max-h-32 overflow-y-auto">
              <div className="text-xs text-gray-400 mb-1">Parcours ({currentPath.length} étapes)</div>
              {currentPath.length === 0 ? (
                <div className="text-gray-500 text-xs italic">Cliquez sur les nœuds...</div>
              ) : (
                <div className="space-y-1">
                  {currentPath.map((nodeId, index) => {
                    const node = nodesState.find(n => n.id === nodeId);
                    const label = node?.data?.label || nodeId;
                    return (
                      <div key={index} className="flex items-center gap-2 text-xs">
                        <span className="text-blue-400">{index + 1}.</span>
                        <span className="text-white truncate">{label}</span>
                        <button
                          onClick={() => setCurrentPath(prev => prev.filter((_, i) => i !== index))}
                          className="ml-auto text-red-400 hover:text-red-300"
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  const pathData = {
                    name: pathName || 'Parcours sans nom',
                    created: new Date().toISOString(),
                    steps: currentPath.map((nodeId, index) => {
                      const node = nodesState.find(n => n.id === nodeId);
                      return {
                        order: index + 1,
                        nodeId: nodeId,
                        label: node?.data?.label || 'Inconnu',
                      };
                    }),
                    metadata: {
                      totalSteps: currentPath.length,
                      startNode: currentPath[0],
                      endNode: currentPath[currentPath.length - 1],
                    }
                  };
                  
                  const json = JSON.stringify(pathData, null, 2);
                  navigator.clipboard.writeText(json);
                  alert('✅ Parcours exporté en JSON !\n\n💡 Collé dans le presse-papier pour analyse IA');
                }}
                disabled={currentPath.length === 0}
                className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-xs rounded transition-colors font-bold"
              >
                📤 Exporter JSON
              </button>
              <button
                onClick={() => {
                  setCurrentPath([]);
                  setPathName('');
                }}
                className="px-3 py-2 bg-red-600 hover:bg-red-500 text-white text-xs rounded transition-colors font-bold"
              >
                🗑️
              </button>
            </div>
          </div>
        )}

        <ReactFlow
          nodes={nodesWithStyles}
          edges={edgesState}
          onNodesChange={handleNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={handleNodeClick}
          onEdgeClick={handleEdgeClick}
          onEdgesDelete={onEdgesDelete}
          onConnect={onConnect}
          fitView
          attributionPosition="bottom-left"
          className="bg-gray-900"
          nodesDraggable={true}
          nodesConnectable={true}
          elementsSelectable={true}
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

      {/* Panneau d'information à droite */}
      <div className="w-80 flex-shrink-0 rounded-xl border-2 border-gray-700 bg-gray-800 overflow-hidden shadow-2xl flex flex-col">
        {/* Header du panneau */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-500 px-4 py-3 border-b border-purple-400">
          <h3 className="text-white font-bold text-base flex items-center gap-2">
            <span>⚡</span>
            ELK.js Layout Auto
          </h3>
        </div>

        {/* Contenu du panneau */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {/* Instructions */}
          <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 rounded-lg p-3 border border-purple-500">
            <h4 className="text-purple-400 font-semibold text-xs mb-2 flex items-center gap-2">
              💾 Utilisation
            </h4>
            <ul className="text-gray-300 text-[11px] space-y-1">
              <li>✅ <strong>Clic nœud</strong> = éditer →</li>
              <li>✅ <strong>Drag nœud→nœud</strong> = lien</li>
              <li>✅ <strong>Delete</strong> = supprimer</li>
            </ul>
          </div>

          {/* Informations du nœud OU du fil sélectionné */}
          {selectedNode ? (
            <div className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 rounded-lg p-3 border-2 border-blue-500">
              <div className="flex justify-between items-start mb-3">
                <h4 className="text-blue-400 font-bold text-sm">📦 Nœud sélectionné</h4>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-3">
                {/* ID */}
                <div className="bg-gray-900/50 rounded p-2">
                  <div className="text-[10px] text-gray-400 mb-1">ID</div>
                  <div className="font-mono text-white text-[10px] break-all">{selectedNode.id}</div>
                </div>

                {/* Édition du label */}
                <div className="bg-gray-900/50 rounded p-2">
                  <div className="text-[10px] text-gray-400 mb-2">LABEL (Texte du nœud)</div>
                  <textarea
                    value={selectedNode.data?.label || ''}
                    onChange={(e) => {
                      const newLabel = e.target.value;
                      setNodes((nds) => {
                        const updatedNodes = nds.map((node) => {
                          if (node.id === selectedNode.id) {
                            return {
                              ...node,
                              data: { ...node.data, label: newLabel },
                            };
                          }
                          return node;
                        });
                        
                        // Mettre à jour aussi selectedNode
                        setSelectedNode({
                          ...selectedNode,
                          data: { ...selectedNode.data, label: newLabel },
                        });
                        
                        return updatedNodes;
                      });
                    }}
                    className="w-full bg-gray-800 text-white text-xs p-2 rounded border border-gray-600 focus:border-blue-500 outline-none resize-none"
                    rows={3}
                  />
                </div>

                {/* Position */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gray-900/50 rounded p-2">
                    <div className="text-[10px] text-gray-400 mb-1">X</div>
                    <div className="font-mono text-white text-xs">{Math.round(selectedNode.position.x)}</div>
                  </div>
                  <div className="bg-gray-900/50 rounded p-2">
                    <div className="text-[10px] text-gray-400 mb-1">Y</div>
                    <div className="font-mono text-white text-xs">{Math.round(selectedNode.position.y)}</div>
                  </div>
                </div>

                {/* Boutons d'action */}
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setNodes((currentNodes) => {
                        setEdges((currentEdges) => {
                          saveToStorage(currentNodes, currentEdges);
                          console.log('✏️ Nœud modifié et sauvegardé:', selectedNode.id);
                          alert('✅ Nœud sauvegardé !');
                          return currentEdges;
                        });
                        return currentNodes;
                      });
                    }}
                    className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded transition-colors font-bold"
                  >
                    💾 Sauvegarder les modifications
                  </button>
                  
                  <button
                    onClick={() => {
                      if (confirm(`⚠️ Supprimer définitivement le nœud "${selectedNode.data?.label || selectedNode.id}" ?\n\nCette action supprimera aussi tous les liens connectés.`)) {
                        const nodeIdToDelete = selectedNode.id;
                        
                        // Désélectionner immédiatement
                        setSelectedNode(null);
                        
                        // Supprimer le nœud et ses edges
                        const updatedNodes = nodesState.filter(n => n.id !== nodeIdToDelete);
                        const updatedEdges = edgesState.filter(e => 
                          e.source !== nodeIdToDelete && e.target !== nodeIdToDelete
                        );
                        
                        // Appliquer les changements
                        setNodes(updatedNodes);
                        setEdges(updatedEdges);
                        
                        // Sauvegarder
                        saveToStorage(updatedNodes, updatedEdges);
                        
                        console.log('🗑️ Nœud supprimé:', nodeIdToDelete);
                        console.log('📊 Nœuds restants:', updatedNodes.length);
                        console.log('🔗 Edges restants:', updatedEdges.length);
                        
                        alert('✅ Nœud supprimé !');
                      }
                    }}
                    className="w-full px-3 py-2 bg-red-600 hover:bg-red-500 text-white text-xs rounded transition-colors font-bold"
                  >
                    🗑️ Supprimer ce nœud
                  </button>
                </div>
              </div>
            </div>
          ) : selectedEdge ? (
            <div className="bg-gradient-to-br from-yellow-900/30 to-orange-900/30 rounded-lg p-3 border-2 border-yellow-500">
              <div className="flex justify-between items-start mb-3">
                <h4 className="text-yellow-400 font-bold text-sm">🔗 Fil sélectionné</h4>
                <button
                  onClick={() => setSelectedEdge(null)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-2">
                {/* Infos essentielles */}
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

                {/* Boutons d'action */}
                <div className="space-y-2 pt-2">
                  <button
                    onClick={() => {
                      const code = `{ id: '${selectedEdge.id}', source: '${selectedEdge.source}', target: '${selectedEdge.target}', style: { stroke: '#4a9eff', strokeWidth: 2 } }`;
                      navigator.clipboard.writeText(code);
                      alert('✅ Code copié !');
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
              <div className="text-gray-500 text-4xl mb-2">👆</div>
              <p className="text-gray-400 text-xs">
                Clique sur un nœud ou un fil pour l'éditer
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


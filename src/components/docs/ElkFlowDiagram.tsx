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
import { useStore } from '../../store/useStore';

// Mapping des IDs de nœuds vers les vues de l'app
const nodeToViewMapping: Record<string, string> = {
  'hub-start': 'hub',
  'hub-tasks': 'tasks',
  'hub-myday': 'myday',
  'hub-learning': 'learning',
  'hub-library': 'library',
  'hub-dashboard': 'dashboard',
  'hub-docs': 'docs',
  'hub-settings': 'settings',
};

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
  
  // Mode simulation guidée
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationStep, setSimulationStep] = useState(0);
  const [simulationPath, setSimulationPath] = useState<string[]>([]);
  
  // Type de connexion sélectionné
  const [connectionType, setConnectionType] = useState<'normal' | 'passive' | 'algorithm'>('normal');
  
  // Navigation vers l'app réelle
  const setView = useStore((state) => state.setView);
  const addTask = useStore((state) => state.addTask);

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
  
  // Handler pour double-clic sur un nœud → Navigation vers module
  const handleNodeDoubleClick = useCallback((_event: React.MouseEvent, node: Node) => {
    const viewName = nodeToViewMapping[node.id];
    if (viewName) {
      console.log('🚀 Navigation vers:', viewName);
      setView(viewName as any);
    } else {
      console.log('ℹ️ Pas de navigation définie pour:', node.id);
    }
  }, [setView]);
  
  // Fonction pour démarrer la simulation d'un parcours
  const startSimulation = useCallback((path: string[]) => {
    if (path.length === 0) return;
    
    setIsSimulating(true);
    setSimulationStep(0);
    setSimulationPath(path);
    
    // Naviguer vers le premier nœud
    const firstNodeId = path[0];
    const firstNode = nodesState.find(n => n.id === firstNodeId);
    const viewName = nodeToViewMapping[firstNodeId];
    if (viewName) {
      setView(viewName as any);
    }
    
    alert(`🎬 Simulation démarrée !\n\n📍 Étape 1/${path.length}: ${firstNode?.data?.label || firstNodeId}\n\nCliquez sur "▶️ Étape suivante" pour continuer.`);
  }, [setView, nodesState]);
  
  // Fonction pour passer à l'étape suivante de la simulation
  const nextSimulationStep = useCallback(() => {
    if (!isSimulating || simulationStep >= simulationPath.length - 1) {
      setIsSimulating(false);
      setSimulationStep(0);
      alert('✅ Simulation terminée !');
      return;
    }
    
    const nextStep = simulationStep + 1;
    setSimulationStep(nextStep);
    
    const nextNodeId = simulationPath[nextStep];
    const node = nodesState.find(n => n.id === nextNodeId);
    const viewName = nodeToViewMapping[nextNodeId];
    
    // Si le nœud a une action spécifique
    if (nextNodeId === 'hub-tasks') {
      // Exemple : Créer une tâche automatiquement
      addTask({
        title: `[Simulation] Tâche créée automatiquement`,
        completed: false,
        category: 'dev',
        status: 'todo',
        priority: 'medium',
        estimatedTime: 30,
      });
    }
    
    if (viewName) {
      setView(viewName as any);
      alert(`📍 Étape ${nextStep + 1}/${simulationPath.length}: ${node?.data?.label || nextNodeId}\n\nCliquez "▶️ Étape suivante" pour continuer.`);
    } else {
      alert(`📍 Étape ${nextStep + 1}/${simulationPath.length}: ${node?.data?.label || nextNodeId}`);
    }
  }, [isSimulating, simulationStep, simulationPath, nodesState, setView, addTask]);

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

  // Handler pour la suppression de nœuds
  const onNodesDelete = useCallback((nodesToDelete: Node[]) => {
    const deletedIds = nodesToDelete.map(n => n.id).join('\n');
    navigator.clipboard.writeText(deletedIds);
    
    // Supprimer les nœuds et leurs edges connectés
    const nodeIdsToDelete = nodesToDelete.map(n => n.id);
    
    setNodes((currentNodes) => {
      const remainingNodes = currentNodes.filter(n => !nodeIdsToDelete.includes(n.id));
      
      setEdges((currentEdges) => {
        // Supprimer aussi tous les edges connectés à ces nœuds
        const remainingEdges = currentEdges.filter(e => 
          !nodeIdsToDelete.includes(e.source) && !nodeIdsToDelete.includes(e.target)
        );
        
        saveToStorage(remainingNodes, remainingEdges);
        console.log('🗑️ Nœuds et liens connectés supprimés et sauvegardés');
        return remainingEdges;
      });
      
      return remainingNodes;
    });
    
    alert(`✅ ${nodesToDelete.length} nœud(s) supprimé(s) (+ leurs liens) et SAUVEGARDÉ !\n\n📋 IDs copiés.`);
    
    setSelectedNode(null);
  }, [setNodes, setEdges]);

  // Handler pour la connexion de nouveaux edges
  const onConnect = useCallback((connection: Connection) => {
    if (!connection.source || !connection.target) return;
    
    // Obtenir le style selon le type sélectionné
    let edgeConfig: { animated: boolean; style: any } = {
      animated: false,
      style: { stroke: '#4a9eff', strokeWidth: 2 }
    };
    
    switch (connectionType) {
      case 'normal':
        edgeConfig = {
          animated: false,
          style: { stroke: '#6ccb5f', strokeWidth: 2 }
        };
        break;
      case 'passive':
        edgeConfig = {
          animated: false,
          style: { stroke: '#b392f0', strokeDasharray: '5,5', strokeWidth: 1 }
        };
        break;
      case 'algorithm':
        edgeConfig = {
          animated: true,
          style: { stroke: '#ff9500', strokeWidth: 2 }
        };
        break;
    }
    
    const newEdge: Edge = {
      id: `e-new-${connection.source}-${connection.target}-${Date.now()}`,
      source: connection.source,
      target: connection.target,
      ...edgeConfig
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
    
    const typeLabel = connectionType === 'normal' ? 'Normal' : connectionType === 'passive' ? 'Passif' : 'Algorithme';
    const edgeCode = `{ id: '${newEdge.id}', source: '${newEdge.source}', target: '${newEdge.target}', animated: ${newEdge.animated}, style: ${JSON.stringify(newEdge.style)} },`;
    navigator.clipboard.writeText(edgeCode);
    
    alert(`✅ Nouveau fil (${typeLabel}) créé et SAUVEGARDÉ !\n\n📋 Code copié.`);
  }, [setEdges, setNodes, connectionType]);

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

  // Fonction pour supprimer le nœud sélectionné
  const deleteSelectedNode = () => {
    if (!selectedNode) return;

    navigator.clipboard.writeText(selectedNode.id);
    
    const nodeIdToDelete = selectedNode.id;
    
    // Supprime le nœud et ses edges
    setNodes((currentNodes) => {
      const updatedNodes = currentNodes.filter(n => n.id !== nodeIdToDelete);
      
      setEdges((currentEdges) => {
        const updatedEdges = currentEdges.filter(e => 
          e.source !== nodeIdToDelete && e.target !== nodeIdToDelete
        );
        
        saveToStorage(updatedNodes, updatedEdges);
        console.log('🗑️ Nœud et ses fils supprimés et sauvegardés automatiquement');
        
        return updatedEdges;
      });
      
      return updatedNodes;
    });
    
    alert(`✅ Nœud supprimé (+ fils connectés) et SAUVEGARDÉ !`);
    
    setSelectedNode(null);
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
    <div className="flex gap-4 h-screen w-full fixed inset-0 p-4 bg-gray-900">
      {/* Style CSS pour la surbrillance des nœuds */}
      <style>{`
        /* Fix flou lors du zoom - Rendu vectoriel optimal */
        .react-flow__renderer {
          image-rendering: -webkit-optimize-contrast !important;
        }
        
        .react-flow__viewport {
          will-change: transform;
        }
        
        .react-flow__node {
          cursor: pointer !important;
          transition: filter 0.2s ease, box-shadow 0.2s ease !important;
          /* Force GPU rendering pour performance */
          transform: translate3d(0, 0, 0);
          will-change: transform;
          /* Désactive l'anti-aliasing qui rend flou */
          image-rendering: -webkit-optimize-contrast;
          image-rendering: crisp-edges;
        }
        
        /* Texte ultra-net à tous les zoom levels */
        .react-flow__node * {
          -webkit-font-smoothing: subpixel-antialiased !important;
          -moz-osx-font-smoothing: auto !important;
          text-rendering: geometricPrecision !important;
          /* Garde la netteté au zoom */
          image-rendering: -webkit-optimize-contrast;
          transform: translateZ(0);
        }
        
        .react-flow__node.highlighted-node {
          outline: 4px solid #4a9eff !important;
          outline-offset: 3px !important;
          box-shadow: 0 0 30px 10px rgba(74, 158, 255, 0.9) !important;
          animation: pulse-glow 2s ease-in-out infinite !important;
          z-index: 1000 !important;
        }
        
        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 30px 10px rgba(74, 158, 255, 0.85);
          }
          50% {
            box-shadow: 0 0 35px 12px rgba(74, 158, 255, 0.95);
          }
        }
        
        .react-flow__node:hover {
          filter: brightness(1.15) !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
          z-index: 10 !important;
        }
        
        /* Rendre toute la zone du nœud cliquable */
        .react-flow__node > div {
          pointer-events: all !important;
        }
        
        /* Edges nets - rendu vectoriel */
        .react-flow__edge path {
          shape-rendering: geometricPrecision;
          stroke-linecap: round;
          stroke-linejoin: round;
        }
        
        /* Force qualité maximale pour les connexions */
        .react-flow__edges {
          shape-rendering: geometricPrecision;
        }
        
        /* Background net */
        .react-flow__background {
          image-rendering: pixelated;
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
        <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
          {/* Ligne 1 : Boutons principaux */}
          <div className="flex gap-2">
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
          
          {/* Ligne 2 : Sélecteur de type de fil */}
          <div className="flex gap-2 bg-gray-800/95 px-3 py-2 rounded-lg border border-gray-700 shadow-lg">
            <span className="text-xs text-gray-400 self-center font-semibold">Type de fil :</span>
            <button
              onClick={() => setConnectionType('normal')}
              className={`px-3 py-1.5 text-xs rounded-md transition-all font-medium ${
                connectionType === 'normal'
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              title="Navigation directe (trait plein vert)"
            >
              ━━ Normal
            </button>
            <button
              onClick={() => setConnectionType('passive')}
              className={`px-3 py-1.5 text-xs rounded-md transition-all font-medium ${
                connectionType === 'passive'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              title="Observation passive (pointillés violet)"
            >
              ╌╌ Passif
            </button>
            <button
              onClick={() => setConnectionType('algorithm')}
              className={`px-3 py-1.5 text-xs rounded-md transition-all font-medium ${
                connectionType === 'algorithm'
                  ? 'bg-orange-600 text-white shadow-md'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              title="Algorithme actif (animé orange)"
            >
              →→ Algo
            </button>
          </div>
        </div>

        {/* Panneau de simulation guidée - SUPPRIMÉ, maintenant intégré dans le panneau de parcours */}

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
                  startSimulation(currentPath);
                  setIsCreatingPath(false);
                }}
                disabled={currentPath.length === 0}
                className="flex-1 px-3 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-xs rounded transition-colors font-bold"
              >
                🎬 Simuler
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
          onNodeDoubleClick={handleNodeDoubleClick}
          onEdgeClick={handleEdgeClick}
          onEdgesDelete={onEdgesDelete}
          onNodesDelete={onNodesDelete}
          onConnect={onConnect}
          fitView
          fitViewOptions={{
            padding: 0.2,
            minZoom: 0.6,
            maxZoom: 1.1
          }}
          attributionPosition="bottom-left"
          className="bg-gray-900"
          nodesDraggable={true}
          nodesConnectable={true}
          elementsSelectable={true}
          edgesFocusable={true}
          deleteKeyCode="Delete"
          minZoom={0.6}
          maxZoom={1.1}
          defaultViewport={{ x: 0, y: 0, zoom: 0.7 }}
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
              <li>✅ <strong>Double-clic nœud</strong> = ouvrir module 🚀</li>
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
              
              {/* Indicateur de navigation */}
              {nodeToViewMapping[selectedNode.id] && (
                <div className="mb-3 p-2 bg-green-500/20 border border-green-500/50 rounded-lg">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-green-400">🚀</span>
                    <span className="text-green-300 font-medium">
                      Double-clic → Ouvrir {nodeToViewMapping[selectedNode.id]}
                    </span>
                  </div>
                </div>
              )}
              
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
                    onClick={deleteSelectedNode}
                    className="w-full px-3 py-2 bg-red-600 hover:bg-red-500 text-white text-xs rounded transition-colors font-bold cursor-pointer"
                    type="button"
                  >
                    🗑️ Supprimer (1 clic)
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
                
                {/* Type de fil */}
                <div className="bg-gray-900/50 rounded p-2">
                  <div className="text-[10px] text-gray-400 mb-2">Type de fil</div>
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => {
                        setEdges((eds) => {
                          const updatedEdges = eds.map(e => {
                            if (e.id === selectedEdge.id) {
                              return {
                                ...e,
                                animated: false,
                                style: { stroke: '#6ccb5f', strokeWidth: 2 }
                              };
                            }
                            return e;
                          });
                          
                          setNodes((currentNodes) => {
                            saveToStorage(currentNodes, updatedEdges);
                            return currentNodes;
                          });
                          
                          // Mettre à jour selectedEdge
                          setSelectedEdge({
                            ...selectedEdge,
                            animated: false,
                            style: { stroke: '#6ccb5f', strokeWidth: 2 }
                          });
                          
                          return updatedEdges;
                        });
                      }}
                      className={`px-2 py-1.5 text-xs rounded transition-all ${
                        !selectedEdge.animated && selectedEdge.style?.stroke === '#6ccb5f'
                          ? 'bg-green-600 text-white font-bold'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      ━━ Normal (trait plein)
                    </button>
                    <button
                      onClick={() => {
                        setEdges((eds) => {
                          const updatedEdges = eds.map(e => {
                            if (e.id === selectedEdge.id) {
                              return {
                                ...e,
                                animated: false,
                                style: { stroke: '#b392f0', strokeDasharray: '5,5', strokeWidth: 1 }
                              };
                            }
                            return e;
                          });
                          
                          setNodes((currentNodes) => {
                            saveToStorage(currentNodes, updatedEdges);
                            return currentNodes;
                          });
                          
                          setSelectedEdge({
                            ...selectedEdge,
                            animated: false,
                            style: { stroke: '#b392f0', strokeDasharray: '5,5', strokeWidth: 1 }
                          });
                          
                          return updatedEdges;
                        });
                      }}
                      className={`px-2 py-1.5 text-xs rounded transition-all ${
                        !selectedEdge.animated && selectedEdge.style?.strokeDasharray
                          ? 'bg-purple-600 text-white font-bold'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      ╌╌ Passif (pointillés)
                    </button>
                    <button
                      onClick={() => {
                        setEdges((eds) => {
                          const updatedEdges = eds.map(e => {
                            if (e.id === selectedEdge.id) {
                              return {
                                ...e,
                                animated: true,
                                style: { stroke: '#ff9500', strokeWidth: 2 }
                              };
                            }
                            return e;
                          });
                          
                          setNodes((currentNodes) => {
                            saveToStorage(currentNodes, updatedEdges);
                            return currentNodes;
                          });
                          
                          setSelectedEdge({
                            ...selectedEdge,
                            animated: true,
                            style: { stroke: '#ff9500', strokeWidth: 2 }
                          });
                          
                          return updatedEdges;
                        });
                      }}
                      className={`px-2 py-1.5 text-xs rounded transition-all ${
                        selectedEdge.animated
                          ? 'bg-orange-600 text-white font-bold'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      →→ Algorithme (animé)
                    </button>
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


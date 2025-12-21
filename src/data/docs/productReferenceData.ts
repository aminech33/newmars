import { Node, Edge } from 'reactflow';

export interface Feature {
  name: string;
  status: 'implemented' | 'planned' | 'excluded';
  description: string;
}

export interface ModuleData {
  id: string;
  name: string;
  icon: string;
  role: string;
  status: 'complete' | 'partial' | 'planned';
  features: Feature[];
  flowNodes: Node[];
  flowEdges: Edge[];
}

export const modules: ModuleData[] = [
  {
    id: 'hub',
    name: 'Hub / Accueil',
    icon: '🏠',
    role: 'Point d\'entrée central de l\'application, permettant la navigation vers tous les modules.',
    status: 'complete',
    features: [
      { name: 'Affichage date et salutation', status: 'implemented', description: 'Bonjour/Bon après-midi/Bonsoir + nom utilisateur' },
      { name: 'Navigation vers modules', status: 'implemented', description: 'Liens vers 8 modules + paramètres' },
      { name: 'Nom utilisateur personnalisé', status: 'implemented', description: 'Configurable dans les paramètres' },
      { name: 'Design minimaliste', status: 'implemented', description: 'Interface épurée centrée, fond noir' },
      { name: 'Interconnexions intelligentes', status: 'planned', description: '7 liaisons logiques entre modules pour fluidifier l\'UX' },
      { name: 'Ma Journée ↔ Tâches', status: 'planned', description: 'Voir tâches accomplies dans le journal, corrélation mood/productivité' },
      { name: 'Bibliothèque ↔ Apprentissage', status: 'planned', description: 'Créer cours depuis livres techniques, ressources bibliographiques' },
      { name: 'Apprentissage → Habitudes', status: 'planned', description: 'Auto-toggle habitude "Apprentissage" après 30min de cours' },
      { name: 'Dashboard cliquable', status: 'planned', description: 'Cliquer métriques → Navigation contextuelle vers modules' },
    ],
    flowNodes: [
      // Point d'entrée
      { id: 'hub-start', type: 'input', data: { label: '🏠 Arrivée Hub' }, position: { x: 400, y: 0 }, style: { background: '#4a9eff', color: '#fff', border: '2px solid #0078d4', borderRadius: '10px', padding: '14px 28px', fontWeight: 700, fontSize: '16px' } },
      
      // Affichage initial
      { id: 'hub-date', data: { label: '📅 Date du jour' }, position: { x: 200, y: 100 }, style: { background: '#2d2d2d', color: '#999', border: '1px solid #444', borderRadius: '8px', padding: '10px 20px', fontSize: '13px' } },
      { id: 'hub-greeting', data: { label: '👋 Salutation\n(heure + nom)' }, position: { x: 400, y: 100 }, style: { background: '#2d2d2d', color: '#e8e8e8', border: '1px solid #4a9eff', borderRadius: '8px', padding: '10px 20px', fontSize: '14px' } },
      { id: 'hub-name', data: { label: '📝 Nom user' }, position: { x: 600, y: 100 }, style: { background: '#2d2d2d', color: '#999', border: '1px solid #444', borderRadius: '8px', padding: '10px 20px', fontSize: '13px' } },
      
      // Choix de navigation
      { id: 'hub-nav', data: { label: '🧭 Choisir destination' }, position: { x: 350, y: 230 }, style: { background: '#ffc83d', color: '#000', border: '2px solid #ffb900', borderRadius: '10px', padding: '12px 24px', fontWeight: 600, fontSize: '15px' } },
      
      // ========== PREMIÈRE RANGÉE - MODULES PRINCIPAUX ==========
      // Tâches
      { id: 'hub-tasks', data: { label: '✅ Tâches' }, position: { x: 0, y: 380 }, style: { background: '#6ccb5f', color: '#fff', border: '2px solid #107c10', borderRadius: '8px', padding: '10px 20px', fontWeight: 600 } },
      { id: 'tasks-sub1', data: { label: '4 colonnes\ntemporelles' }, position: { x: 0, y: 480 }, style: { background: '#2d2d2d', color: '#6ccb5f', border: '1px solid #6ccb5f', borderRadius: '6px', padding: '6px 12px', fontSize: '12px' } },
      { id: 'tasks-sub2', data: { label: 'Projets +\nIA générative' }, position: { x: 0, y: 560 }, style: { background: '#2d2d2d', color: '#b392f0', border: '1px solid #b392f0', borderRadius: '6px', padding: '6px 12px', fontSize: '12px' } },
      { id: 'tasks-sub3', data: { label: '🍅 Pomodoro\nintégré' }, position: { x: 0, y: 640 }, style: { background: '#f85149', color: '#fff', border: '1px solid #d13438', borderRadius: '6px', padding: '6px 12px', fontSize: '12px' } },
      
      // Ma Journée (Journal + Santé fusionnés)
      { id: 'hub-myday', data: { label: '📝 Ma Journée' }, position: { x: 150, y: 380 }, style: { background: '#6ccb5f', color: '#fff', border: '2px solid #107c10', borderRadius: '8px', padding: '10px 20px', fontWeight: 600 } },
      { id: 'myday-sub1', data: { label: '📓 Journal\n(Mood + Entrées)' }, position: { x: 120, y: 480 }, style: { background: '#2d2d2d', color: '#6ccb5f', border: '1px solid #6ccb5f', borderRadius: '6px', padding: '6px 12px', fontSize: '12px' } },
      { id: 'myday-sub2', data: { label: '🍽️ Nutrition\n(Repas + Macros)' }, position: { x: 120, y: 560 }, style: { background: '#2d2d2d', color: '#ff9500', border: '1px solid #ff9500', borderRadius: '6px', padding: '6px 12px', fontSize: '12px' } },
      { id: 'myday-sub3', data: { label: '⚖️ Poids\n(Chart + Liste)' }, position: { x: 120, y: 640 }, style: { background: '#2d2d2d', color: '#5ac8fa', border: '1px solid #5ac8fa', borderRadius: '6px', padding: '6px 12px', fontSize: '12px' } },
      { id: 'myday-sub4', data: { label: '✅ Habitudes' }, position: { x: 120, y: 720 }, style: { background: '#2d2d2d', color: '#6ccb5f', border: '1px solid #6ccb5f', borderRadius: '6px', padding: '6px 12px', fontSize: '12px' } },
      
      // Apprentissage
      { id: 'hub-learning', data: { label: '🎓 Apprentissage' }, position: { x: 310, y: 380 }, style: { background: '#6ccb5f', color: '#fff', border: '2px solid #107c10', borderRadius: '8px', padding: '10px 20px', fontWeight: 600 } },
      { id: 'learn-sub1', data: { label: '💬 Chat IA\n(GPT-4)' }, position: { x: 270, y: 480 }, style: { background: '#2d2d2d', color: '#b392f0', border: '1px solid #b392f0', borderRadius: '6px', padding: '6px 12px', fontSize: '12px' } },
      { id: 'learn-sub2', data: { label: '💻 Code Editor\n(Multi-langages)' }, position: { x: 270, y: 560 }, style: { background: '#2d2d2d', color: '#79c0ff', border: '1px solid #79c0ff', borderRadius: '6px', padding: '6px 12px', fontSize: '12px' } },
      { id: 'learn-sub3', data: { label: '⌨️ Terminal\némulé' }, position: { x: 270, y: 640 }, style: { background: '#2d2d2d', color: '#a5d6ff', border: '1px solid #a5d6ff', borderRadius: '6px', padding: '6px 12px', fontSize: '12px' } },
      { id: 'learn-sub4', data: { label: '🔗 Tâches liées' }, position: { x: 270, y: 720 }, style: { background: '#2d2d2d', color: '#6ccb5f', border: '1px solid #6ccb5f', borderRadius: '6px', padding: '6px 12px', fontSize: '12px' } },
      
      // Bibliothèque
      { id: 'hub-library', data: { label: '📚 Bibliothèque' }, position: { x: 490, y: 380 }, style: { background: '#6ccb5f', color: '#fff', border: '2px solid #107c10', borderRadius: '8px', padding: '10px 20px', fontWeight: 600 } },
      { id: 'lib-sub1', data: { label: '📖 Livres\n(Statut + Notes)' }, position: { x: 450, y: 480 }, style: { background: '#2d2d2d', color: '#6ccb5f', border: '1px solid #6ccb5f', borderRadius: '6px', padding: '6px 12px', fontSize: '12px' } },
      { id: 'lib-sub2', data: { label: '⏱️ Sessions\nlecture' }, position: { x: 450, y: 560 }, style: { background: '#2d2d2d', color: '#ff9500', border: '1px solid #ff9500', borderRadius: '6px', padding: '6px 12px', fontSize: '12px' } },
      { id: 'lib-sub3', data: { label: '💬 Citations &\nNotes' }, position: { x: 450, y: 640 }, style: { background: '#2d2d2d', color: '#ffd60a', border: '1px solid #ffd60a', borderRadius: '6px', padding: '6px 12px', fontSize: '12px' } },
      { id: 'lib-sub4', data: { label: '🎯 Objectif annuel' }, position: { x: 450, y: 720 }, style: { background: '#2d2d2d', color: '#64d2ff', border: '1px solid #64d2ff', borderRadius: '6px', padding: '6px 12px', fontSize: '12px' } },
      
      // ========== DEUXIÈME RANGÉE - MÉTA & UTILITAIRES ==========
      // Dashboard
      { id: 'hub-dashboard', data: { label: '📈 Dashboard' }, position: { x: 650, y: 380 }, style: { background: '#6ccb5f', color: '#fff', border: '2px solid #107c10', borderRadius: '8px', padding: '10px 20px', fontWeight: 600 } },
      { id: 'dash-sub1', data: { label: '🔥 Streaks &\nContinuité' }, position: { x: 620, y: 480 }, style: { background: '#2d2d2d', color: '#ff9500', border: '1px solid #ff9500', borderRadius: '6px', padding: '6px 12px', fontSize: '12px' } },
      { id: 'dash-sub2', data: { label: '📊 Corrélations\n(Mood/Habits)' }, position: { x: 620, y: 560 }, style: { background: '#2d2d2d', color: '#5ac8fa', border: '1px solid #5ac8fa', borderRadius: '6px', padding: '6px 12px', fontSize: '12px' } },
      { id: 'dash-sub3', data: { label: '📈 Métriques\ncliquables' }, position: { x: 620, y: 640 }, style: { background: '#2d2d2d', color: '#64d2ff', border: '1px solid #64d2ff', borderRadius: '6px', padding: '6px 12px', fontSize: '12px' } },
      
      // Documentation
      { id: 'hub-docs', data: { label: '📚 Documentation' }, position: { x: 820, y: 380 }, style: { background: '#6ccb5f', color: '#fff', border: '2px solid #107c10', borderRadius: '8px', padding: '10px 20px', fontWeight: 600 } },
      { id: 'docs-sub1', data: { label: '📋 Référence\nproduit' }, position: { x: 800, y: 480 }, style: { background: '#2d2d2d', color: '#6ccb5f', border: '1px solid #6ccb5f', borderRadius: '6px', padding: '6px 12px', fontSize: '12px' } },
      { id: 'docs-sub2', data: { label: '🔄 Flows React\ninteractifs' }, position: { x: 800, y: 560 }, style: { background: '#2d2d2d', color: '#4a9eff', border: '1px solid #4a9eff', borderRadius: '6px', padding: '6px 12px', fontSize: '12px' } },
      
      // Paramètres
      { id: 'hub-settings', data: { label: '⚙️ Paramètres' }, position: { x: 980, y: 380 }, style: { background: '#6ccb5f', color: '#fff', border: '2px solid #107c10', borderRadius: '8px', padding: '10px 20px', fontWeight: 600 } },
      { id: 'set-sub1', data: { label: '👤 Nom utilisateur' }, position: { x: 960, y: 480 }, style: { background: '#2d2d2d', color: '#6ccb5f', border: '1px solid #6ccb5f', borderRadius: '6px', padding: '6px 12px', fontSize: '12px' } },
      { id: 'set-sub2', data: { label: '💾 Export/Import\ndata' }, position: { x: 960, y: 560 }, style: { background: '#2d2d2d', color: '#ffd60a', border: '1px solid #ffd60a', borderRadius: '6px', padding: '6px 12px', fontSize: '12px' } },
      { id: 'set-sub3', data: { label: '🎛️ Préférences' }, position: { x: 960, y: 640 }, style: { background: '#2d2d2d', color: '#999', border: '1px solid #666', borderRadius: '6px', padding: '6px 12px', fontSize: '12px' } },
      
      // ========== INTERCONNEXIONS SPÉCIALES ==========
      // 1. Pomodoro ↔ Tâches (déjà intégré)
      { id: 'interco-1', data: { label: '🔗 Intégré' }, position: { x: 80, y: 700 }, style: { background: '#8764b8', color: '#fff', border: '1px solid #b392f0', borderRadius: '6px', padding: '4px 8px', fontSize: '11px', fontStyle: 'italic' } },
      
      // 2. Learning ↔ Tâches liées (déjà implémenté)
      { id: 'interco-2', data: { label: '🔗 Liaison' }, position: { x: 350, y: 780 }, style: { background: '#8764b8', color: '#fff', border: '1px solid #b392f0', borderRadius: '6px', padding: '4px 8px', fontSize: '11px', fontStyle: 'italic' } },
      
      // 3. Dashboard observe tout (déjà implémenté)
      { id: 'dash-observer', data: { label: '👁️ Observe tous\nles modules' }, position: { x: 700, y: 720 }, style: { background: '#8764b8', color: '#fff', border: '1px solid #b392f0', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontStyle: 'italic' } },
      
      // ========== NOUVELLES INTERCONNEXIONS LOGIQUES ==========
      // 4. Ma Journée ↔ Tâches (Mood + Productivité)
      { id: 'interco-myday-tasks', data: { label: '😊 Mood ↔\nTâches' }, position: { x: 75, y: 800 }, style: { background: '#ff9500', color: '#fff', border: '2px solid #ff6b00', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: 600 } },
      
      // 5. Bibliothèque ↔ Apprentissage (Livres → Cours)
      { id: 'interco-lib-learn', data: { label: '📚 Créer\ncours' }, position: { x: 380, y: 800 }, style: { background: '#ff9500', color: '#fff', border: '2px solid #ff6b00', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: 600 } },
      
      // 6. Apprentissage → Habitudes (Auto-toggle)
      { id: 'interco-learn-habits', data: { label: '🔥 Auto-toggle\n30min+' }, position: { x: 200, y: 800 }, style: { background: '#ff9500', color: '#fff', border: '2px solid #ff6b00', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: 600 } },
      
      // 7. Dashboard → Modules (Navigation cliquable)
      { id: 'interco-dash-nav', data: { label: '🔗 Métriques\ncliquables' }, position: { x: 780, y: 800 }, style: { background: '#ff9500', color: '#fff', border: '2px solid #ff6b00', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: 600 } },
    ],
    flowEdges: [
      // Flux principal d'entrée
      { id: 'e-start-date', source: 'hub-start', target: 'hub-date', animated: true, style: { stroke: '#4a9eff', strokeWidth: 2 } },
      { id: 'e-start-greet', source: 'hub-start', target: 'hub-greeting', animated: true, style: { stroke: '#4a9eff', strokeWidth: 2 } },
      { id: 'e-start-name', source: 'hub-start', target: 'hub-name', animated: true, style: { stroke: '#4a9eff', strokeWidth: 2 } },
      { id: 'e-greet-nav', source: 'hub-greeting', target: 'hub-nav', animated: true, style: { stroke: '#ffc83d', strokeWidth: 2 } },
      
      // Navigation vers modules principaux (première rangée)
      { id: 'e-nav-tasks', source: 'hub-nav', target: 'hub-tasks', style: { stroke: '#6ccb5f', strokeWidth: 2 } },
      { id: 'e-nav-myday', source: 'hub-nav', target: 'hub-myday', style: { stroke: '#6ccb5f', strokeWidth: 2 } },
      { id: 'e-nav-learn', source: 'hub-nav', target: 'hub-learning', style: { stroke: '#6ccb5f', strokeWidth: 2 } },
      { id: 'e-nav-lib', source: 'hub-nav', target: 'hub-library', style: { stroke: '#6ccb5f', strokeWidth: 2 } },
      
      // Navigation vers modules secondaires (deuxième rangée)
      { id: 'e-nav-dash', source: 'hub-nav', target: 'hub-dashboard', style: { stroke: '#6ccb5f', strokeWidth: 2 } },
      { id: 'e-nav-docs', source: 'hub-nav', target: 'hub-docs', style: { stroke: '#6ccb5f', strokeWidth: 2 } },
      { id: 'e-nav-settings', source: 'hub-nav', target: 'hub-settings', style: { stroke: '#6ccb5f', strokeWidth: 2 } },
      
      // Sous-fonctionnalités Tâches
      { id: 'e-tasks-1', source: 'hub-tasks', target: 'tasks-sub1', style: { stroke: '#6ccb5f' } },
      { id: 'e-tasks-2', source: 'hub-tasks', target: 'tasks-sub2', style: { stroke: '#b392f0' } },
      { id: 'e-tasks-3', source: 'hub-tasks', target: 'tasks-sub3', style: { stroke: '#f85149' } },
      
      // Sous-fonctionnalités Ma Journée
      { id: 'e-myday-1', source: 'hub-myday', target: 'myday-sub1', style: { stroke: '#6ccb5f' } },
      { id: 'e-myday-2', source: 'hub-myday', target: 'myday-sub2', style: { stroke: '#ff9500' } },
      { id: 'e-myday-3', source: 'hub-myday', target: 'myday-sub3', style: { stroke: '#5ac8fa' } },
      { id: 'e-myday-4', source: 'hub-myday', target: 'myday-sub4', style: { stroke: '#6ccb5f' } },
      
      // Sous-fonctionnalités Apprentissage
      { id: 'e-learn-1', source: 'hub-learning', target: 'learn-sub1', style: { stroke: '#b392f0' } },
      { id: 'e-learn-2', source: 'hub-learning', target: 'learn-sub2', style: { stroke: '#79c0ff' } },
      { id: 'e-learn-3', source: 'hub-learning', target: 'learn-sub3', style: { stroke: '#a5d6ff' } },
      { id: 'e-learn-4', source: 'hub-learning', target: 'learn-sub4', style: { stroke: '#6ccb5f' } },
      
      // Sous-fonctionnalités Bibliothèque
      { id: 'e-lib-1', source: 'hub-library', target: 'lib-sub1', style: { stroke: '#6ccb5f' } },
      { id: 'e-lib-2', source: 'hub-library', target: 'lib-sub2', style: { stroke: '#ff9500' } },
      { id: 'e-lib-3', source: 'hub-library', target: 'lib-sub3', style: { stroke: '#ffd60a' } },
      { id: 'e-lib-4', source: 'hub-library', target: 'lib-sub4', style: { stroke: '#64d2ff' } },
      
      // Sous-fonctionnalités Dashboard
      { id: 'e-dash-1', source: 'hub-dashboard', target: 'dash-sub1', style: { stroke: '#ff9500' } },
      { id: 'e-dash-2', source: 'hub-dashboard', target: 'dash-sub2', style: { stroke: '#5ac8fa' } },
      { id: 'e-dash-3', source: 'hub-dashboard', target: 'dash-sub3', style: { stroke: '#64d2ff' } },
      { id: 'e-dash-obs', source: 'hub-dashboard', target: 'dash-observer', style: { stroke: '#b392f0', strokeDasharray: '5,5' } },
      
      // Sous-fonctionnalités Documentation
      { id: 'e-docs-1', source: 'hub-docs', target: 'docs-sub1', style: { stroke: '#6ccb5f' } },
      { id: 'e-docs-2', source: 'hub-docs', target: 'docs-sub2', style: { stroke: '#4a9eff' } },
      
      // Sous-fonctionnalités Paramètres
      { id: 'e-set-1', source: 'hub-settings', target: 'set-sub1', style: { stroke: '#6ccb5f' } },
      { id: 'e-set-2', source: 'hub-settings', target: 'set-sub2', style: { stroke: '#ffd60a' } },
      { id: 'e-set-3', source: 'hub-settings', target: 'set-sub3', style: { stroke: '#999' } },
      
      // Interconnexions spéciales (existantes)
      { id: 'e-interco-pomo', source: 'tasks-sub3', target: 'interco-1', style: { stroke: '#b392f0', strokeDasharray: '3,3' } },
      { id: 'e-interco-learn', source: 'learn-sub4', target: 'interco-2', style: { stroke: '#b392f0', strokeDasharray: '3,3' } },
      { id: 'e-interco-learn-task', source: 'interco-2', target: 'hub-tasks', style: { stroke: '#b392f0', strokeDasharray: '3,3' } },
      
      // Dashboard observe les modules (lignes pointillées)
      { id: 'e-dash-watch-1', source: 'dash-observer', target: 'hub-tasks', style: { stroke: '#b392f0', strokeDasharray: '5,5', strokeWidth: 1 } },
      { id: 'e-dash-watch-2', source: 'dash-observer', target: 'hub-myday', style: { stroke: '#b392f0', strokeDasharray: '5,5', strokeWidth: 1 } },
      { id: 'e-dash-watch-3', source: 'dash-observer', target: 'hub-learning', style: { stroke: '#b392f0', strokeDasharray: '5,5', strokeWidth: 1 } },
      { id: 'e-dash-watch-4', source: 'dash-observer', target: 'hub-library', style: { stroke: '#b392f0', strokeDasharray: '5,5', strokeWidth: 1 } },
      
      // ========== NOUVELLES INTERCONNEXIONS LOGIQUES ==========
      // 4. Ma Journée ↔ Tâches (Mood + Productivité)
      { id: 'e-new-myday-tasks-1', source: 'myday-sub1', target: 'interco-myday-tasks', animated: true, style: { stroke: '#ff9500', strokeWidth: 2 }, label: 'Voir tâches' },
      { id: 'e-new-myday-tasks-2', source: 'interco-myday-tasks', target: 'hub-tasks', animated: true, style: { stroke: '#ff9500', strokeWidth: 2 } },
      { id: 'e-new-tasks-myday', source: 'hub-tasks', target: 'interco-myday-tasks', style: { stroke: '#ff9500', strokeWidth: 2, strokeDasharray: '5,5' }, label: 'Humeur' },
      
      // 5. Bibliothèque ↔ Apprentissage (Livres → Cours)
      { id: 'e-new-lib-learn-1', source: 'lib-sub1', target: 'interco-lib-learn', animated: true, style: { stroke: '#ff9500', strokeWidth: 2 }, label: 'Créer cours' },
      { id: 'e-new-lib-learn-2', source: 'interco-lib-learn', target: 'hub-learning', animated: true, style: { stroke: '#ff9500', strokeWidth: 2 } },
      { id: 'e-new-learn-lib', source: 'hub-learning', target: 'interco-lib-learn', style: { stroke: '#ff9500', strokeWidth: 2, strokeDasharray: '5,5' }, label: 'Ressources' },
      
      // 6. Apprentissage → Habitudes (Auto-toggle après 30min)
      { id: 'e-new-learn-habits-1', source: 'hub-learning', target: 'interco-learn-habits', animated: true, style: { stroke: '#ff9500', strokeWidth: 2 }, label: '30min+' },
      { id: 'e-new-learn-habits-2', source: 'interco-learn-habits', target: 'myday-sub4', animated: true, style: { stroke: '#ff9500', strokeWidth: 2 }, label: '✅ Auto' },
      
      // 7. Dashboard → Modules (Métriques cliquables)
      { id: 'e-new-dash-click-1', source: 'dash-sub3', target: 'interco-dash-nav', animated: true, style: { stroke: '#ff9500', strokeWidth: 2 }, label: 'Cliquer' },
      { id: 'e-new-dash-nav-tasks', source: 'interco-dash-nav', target: 'hub-tasks', style: { stroke: '#ff9500', strokeWidth: 2 } },
      { id: 'e-new-dash-nav-myday', source: 'interco-dash-nav', target: 'hub-myday', style: { stroke: '#ff9500', strokeWidth: 2 } },
      { id: 'e-new-dash-nav-learn', source: 'interco-dash-nav', target: 'hub-learning', style: { stroke: '#ff9500', strokeWidth: 2 } },
      { id: 'e-new-dash-nav-lib', source: 'interco-dash-nav', target: 'hub-library', style: { stroke: '#ff9500', strokeWidth: 2 } },
    ],
  },
  {
    id: 'tasks',
    name: 'Tâches',
    icon: '✅',
    role: 'Gestion des tâches avec organisation temporelle en colonnes (Aujourd\'hui, En cours, À venir, Lointain).',
    status: 'complete',
    features: [
      { name: 'Vue en 4 colonnes temporelles', status: 'implemented', description: 'Aujourd\'hui, En cours, À venir, Lointain' },
      { name: 'Création rapide (⌘N)', status: 'implemented', description: 'Raccourci clavier, saisie rapide' },
      { name: 'Complétion avec animation', status: 'implemented', description: 'Toggle avec confetti optionnel' },
      { name: 'Tâche prioritaire unique', status: 'implemented', description: 'Une seule tâche marquée prioritaire' },
      { name: 'Catégorisation automatique', status: 'implemented', description: 'Détection depuis le titre' },
      { name: 'Sous-tâches', status: 'implemented', description: 'Ajout/toggle/suppression' },
      { name: 'Projets', status: 'implemented', description: 'Regroupement avec couleur/icône' },
      { name: 'Génération projet IA', status: 'implemented', description: 'Analyse domaine → compétences → plan' },
      { name: 'Système de quota', status: 'implemented', description: 'Limite tâches visibles, déblocage auto' },
      { name: 'Pomodoro intégré', status: 'implemented', description: 'Onglet Focus avec timer' },
    ],
    flowNodes: [
      { id: 'task-1', type: 'input', data: { label: '⌘+N' }, position: { x: 250, y: 0 }, style: { background: '#4a9eff', color: '#fff', border: '2px solid #0078d4', borderRadius: '8px', padding: '10px 20px', fontWeight: 600 } },
      { id: 'task-2', data: { label: 'Saisir titre + emoji' }, position: { x: 200, y: 80 }, style: { background: '#2d2d2d', color: '#e8e8e8', border: '1px solid #4a9eff', borderRadius: '8px', padding: '8px 16px' } },
      { id: 'task-3', data: { label: '🤖 Auto-détection' }, position: { x: 200, y: 160 }, style: { background: '#b392f0', color: '#fff', border: '1px solid #8764b8', borderRadius: '8px', padding: '8px 16px' } },
      { id: 'task-4', data: { label: 'Catégorie + priorité' }, position: { x: 180, y: 240 }, style: { background: '#2d2d2d', color: '#e8e8e8', border: '1px solid #4a9eff', borderRadius: '8px', padding: '8px 16px' } },
      { id: 'task-5', data: { label: 'Ajouter au projet?' }, position: { x: 170, y: 320 }, style: { background: '#ffc83d', color: '#000', border: '2px solid #ffb900', borderRadius: '8px', padding: '8px 16px', fontWeight: 600 } },
      { id: 'task-6', data: { label: 'Sélectionner projet' }, position: { x: 50, y: 400 }, style: { background: '#2d2d2d', color: '#e8e8e8', border: '1px solid #4a9eff', borderRadius: '8px', padding: '8px 16px' } },
      { id: 'task-7', data: { label: 'Tâche seule' }, position: { x: 300, y: 400 }, style: { background: '#2d2d2d', color: '#e8e8e8', border: '1px solid #4a9eff', borderRadius: '8px', padding: '8px 16px' } },
      { id: 'task-8', data: { label: 'Suggérer colonne' }, position: { x: 160, y: 480 }, style: { background: '#2d2d2d', color: '#e8e8e8', border: '1px solid #4a9eff', borderRadius: '8px', padding: '8px 16px' } },
      { id: 'task-9', data: { label: 'Ajouter sous-tâches?' }, position: { x: 140, y: 560 }, style: { background: '#ffc83d', color: '#000', border: '2px solid #ffb900', borderRadius: '8px', padding: '8px 16px', fontWeight: 600 } },
      { id: 'task-10', data: { label: 'Créer sous-tâches' }, position: { x: 50, y: 640 }, style: { background: '#2d2d2d', color: '#e8e8e8', border: '1px solid #4a9eff', borderRadius: '8px', padding: '8px 16px' } },
      { id: 'task-11', type: 'output', data: { label: '✓ Tâche créée' }, position: { x: 180, y: 720 }, style: { background: '#6ccb5f', color: '#fff', border: '2px solid #107c10', borderRadius: '8px', padding: '10px 20px', fontWeight: 600 } },
      { id: 'task-12', data: { label: '⏱️ Lancer Pomodoro' }, position: { x: 350, y: 720 }, style: { background: '#f85149', color: '#fff', border: '1px solid #d13438', borderRadius: '8px', padding: '8px 16px' } },
    ],
    flowEdges: [
      { id: 'e-task-1-2', source: 'task-1', target: 'task-2', animated: true, style: { stroke: '#4a9eff' } },
      { id: 'e-task-2-3', source: 'task-2', target: 'task-3', animated: true, style: { stroke: '#4a9eff' } },
      { id: 'e-task-3-4', source: 'task-3', target: 'task-4', style: { stroke: '#9d9d9d' } },
      { id: 'e-task-4-5', source: 'task-4', target: 'task-5', style: { stroke: '#9d9d9d' } },
      { id: 'e-task-5-6', source: 'task-5', target: 'task-6', label: 'Oui', style: { stroke: '#9d9d9d' } },
      { id: 'e-task-5-7', source: 'task-5', target: 'task-7', label: 'Non', style: { stroke: '#9d9d9d' } },
      { id: 'e-task-6-8', source: 'task-6', target: 'task-8', style: { stroke: '#9d9d9d' } },
      { id: 'e-task-7-8', source: 'task-7', target: 'task-8', style: { stroke: '#9d9d9d' } },
      { id: 'e-task-8-9', source: 'task-8', target: 'task-9', style: { stroke: '#9d9d9d' } },
      { id: 'e-task-9-10', source: 'task-9', target: 'task-10', label: 'Oui', style: { stroke: '#9d9d9d' } },
      { id: 'e-task-9-11', source: 'task-9', target: 'task-11', label: 'Non', style: { stroke: '#9d9d9d' } },
      { id: 'e-task-10-11', source: 'task-10', target: 'task-11', style: { stroke: '#9d9d9d' } },
      { id: 'e-task-11-12', source: 'task-11', target: 'task-12', label: 'Optionnel', style: { stroke: '#9d9d9d', strokeDasharray: '5,5' } },
    ],
  },
  // ... autres modules seront ajoutés
];

export const appMetadata = {
  version: '1.0.0',
  title: 'NewMars — Document de Référence Produit',
  description: 'Document de référence produit officiel de NewMars v1 - Périmètre fonctionnel complet',
};


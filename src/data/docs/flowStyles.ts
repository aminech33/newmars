/**
 * 🎨 Configuration des Styles pour les Flow Diagrams
 * 
 * Ce fichier centralise tous les styles des connexions (edges) et nœuds (nodes)
 * pour faciliter la personnalisation sans toucher au code principal.
 */

// ═══════════════════════════════════════════════════════════════════════════════
// 🌈 PALETTE DE COULEURS
// ═══════════════════════════════════════════════════════════════════════════════

export const COLORS = {
  // Flux principal
  primary: '#4a9eff',           // Bleu vif
  primaryDark: '#0078d4',       // Bleu foncé (bordures)
  
  // Succès / Modules
  success: '#6ccb5f',           // Vert
  successDark: '#107c10',       // Vert foncé (bordures)
  
  // Décisions / Points clés
  warning: '#ffc83d',           // Jaune
  warningDark: '#ffb900',       // Jaune foncé (bordures)
  
  // IA / Intelligence
  ai: '#b392f0',                // Violet
  aiDark: '#8764b8',            // Violet foncé (bordures)
  
  // Focus / Temps / Urgent
  danger: '#f85149',            // Rouge
  dangerDark: '#d13438',        // Rouge foncé (bordures)
  
  // Nouvelles interconnexions ⭐
  interconnect: '#ff9500',      // Orange vif
  interconnectDark: '#ff6b00',  // Orange foncé (bordures)
  
  // Santé / Nutrition
  health: '#5ac8fa',            // Cyan
  healthAlt: '#64d2ff',         // Bleu clair
  
  // Citations / Notes
  highlight: '#ffd60a',         // Jaune doré
  
  // Secondaire
  secondary: '#2d2d2d',         // Gris foncé (fond)
  secondaryText: '#e8e8e8',     // Gris clair (texte)
  muted: '#999',                // Gris moyen
  mutedBorder: '#444',          // Gris bordure
  mutedDark: '#666',            // Gris foncé bordure
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎨 STYLES D'EDGES (Connexions)
// ═══════════════════════════════════════════════════════════════════════════════

export const EDGE_STYLES = {
  // Flux principal (Hub → Navigation)
  mainFlow: {
    stroke: COLORS.primary,
    strokeWidth: 2,
  },
  
  // Navigation vers modules
  moduleNav: {
    stroke: COLORS.success,
    strokeWidth: 2,
  },
  
  // Sous-fonctionnalités
  subFeature: {
    stroke: COLORS.success,
    strokeWidth: 1,
  },
  
  // Interconnexions nouvelles ⭐
  newInterconnection: {
    stroke: COLORS.interconnect,
    strokeWidth: 2,
  },
  
  // Interconnexions existantes
  existingInterconnection: {
    stroke: COLORS.ai,
    strokeWidth: 1,
    strokeDasharray: '3,3',
  },
  
  // Dashboard observateur (subtil)
  dashboardObserver: {
    stroke: COLORS.ai,
    strokeWidth: 0.5,
    strokeDasharray: '10,10',
    opacity: 0.3,
  },
  
  // Connexions IA
  aiConnection: {
    stroke: COLORS.ai,
    strokeWidth: 1,
  },
  
  // Connexions santé
  healthConnection: {
    stroke: COLORS.health,
    strokeWidth: 1,
  },
  
  // Connexions nutrition
  nutritionConnection: {
    stroke: COLORS.interconnect,
    strokeWidth: 1,
  },
  
  // Connexions focus/pomodoro
  focusConnection: {
    stroke: COLORS.danger,
    strokeWidth: 1,
  },
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🔧 TYPES D'EDGES
// ═══════════════════════════════════════════════════════════════════════════════

export const EDGE_TYPES = {
  default: undefined,           // Ligne par défaut (bézier)
  straight: 'straight',         // Ligne droite
  step: 'step',                 // Ligne en escalier
  smoothstep: 'smoothstep',     // Ligne en escalier arrondie
}

// ═══════════════════════════════════════════════════════════════════════════════
// ⚡ PRÉSETS D'ANIMATION
// ═══════════════════════════════════════════════════════════════════════════════

export const ANIMATION_PRESETS = {
  // Pas d'animation
  none: false,
  
  // Animation standard
  standard: true,
  
  // Avec style personnalisé (non utilisé directement dans les edges,
  // mais React Flow applique l'animation si animated: true)
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📐 CONFIGURATION DES TRAITS
// ═══════════════════════════════════════════════════════════════════════════════

export const LINE_CONFIGS = {
  // Trait plein standard
  solid: {
    strokeDasharray: undefined,
  },
  
  // Pointillés serrés
  dashedTight: {
    strokeDasharray: '3,3',
  },
  
  // Pointillés moyens
  dashed: {
    strokeDasharray: '5,5',
  },
  
  // Pointillés larges
  dashedWide: {
    strokeDasharray: '10,10',
  },
  
  // Pointillés très espacés (subtil)
  dashedSubtle: {
    strokeDasharray: '15,15',
  },
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 STYLES DE NODES (Nœuds)
// ═══════════════════════════════════════════════════════════════════════════════

export const NODE_STYLES = {
  // Point d'entrée
  input: {
    background: COLORS.primary,
    color: '#fff',
    border: `2px solid ${COLORS.primaryDark}`,
    borderRadius: '10px',
    padding: '14px 28px',
    fontWeight: 700,
    fontSize: '16px',
  },
  
  // Module principal
  module: {
    background: COLORS.success,
    color: '#fff',
    border: `2px solid ${COLORS.successDark}`,
    borderRadius: '8px',
    padding: '10px 20px',
    fontWeight: 600,
  },
  
  // Point de décision
  decision: {
    background: COLORS.warning,
    color: '#000',
    border: `2px solid ${COLORS.warningDark}`,
    borderRadius: '10px',
    padding: '12px 24px',
    fontWeight: 600,
    fontSize: '15px',
  },
  
  // Sous-fonctionnalité
  subFeature: {
    background: COLORS.secondary,
    color: COLORS.secondaryText,
    border: '1px solid #4a9eff',
    borderRadius: '6px',
    padding: '6px 12px',
    fontSize: '12px',
  },
  
  // Interconnexion
  interconnection: {
    background: COLORS.aiDark,
    color: '#fff',
    border: `1px solid ${COLORS.ai}`,
    borderRadius: '6px',
    padding: '4px 8px',
    fontSize: '11px',
    fontStyle: 'italic',
  },
  
  // Nouvelle interconnexion ⭐
  newInterconnection: {
    background: COLORS.interconnect,
    color: '#fff',
    border: `2px solid ${COLORS.interconnectDark}`,
    borderRadius: '6px',
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: 600,
  },
  
  // Point de sortie
  output: {
    background: COLORS.success,
    color: '#fff',
    border: `2px solid ${COLORS.successDark}`,
    borderRadius: '8px',
    padding: '10px 20px',
    fontWeight: 600,
  },
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🔨 HELPERS POUR CRÉER DES STYLES RAPIDEMENT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Crée un style d'edge avec options
 */
export function createEdgeStyle({
  color = COLORS.primary,
  width = 2,
  dashed = false,
  dashPattern = '5,5',
  opacity = 1,
  animated = false,
}: {
  color?: string
  width?: number
  dashed?: boolean
  dashPattern?: string
  opacity?: number
  animated?: boolean
}) {
  return {
    animated,
    style: {
      stroke: color,
      strokeWidth: width,
      strokeDasharray: dashed ? dashPattern : undefined,
      opacity,
    },
  }
}

/**
 * Crée un style de node avec options
 */
export function createNodeStyle({
  background = COLORS.secondary,
  color = COLORS.secondaryText,
  border = `1px solid ${COLORS.mutedBorder}`,
  borderRadius = '8px',
  padding = '10px 20px',
  fontWeight = 400,
  fontSize = '14px',
}: {
  background?: string
  color?: string
  border?: string
  borderRadius?: string
  padding?: string
  fontWeight?: number
  fontSize?: string
}) {
  return {
    background,
    color,
    border,
    borderRadius,
    padding,
    fontWeight,
    fontSize,
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎭 PRÉSETS PRÊTS À L'EMPLOI
// ═══════════════════════════════════════════════════════════════════════════════

export const PRESET_EDGES = {
  // Flux principal animé
  mainAnimated: createEdgeStyle({
    color: COLORS.primary,
    width: 3,
    animated: true,
  }),
  
  // Nouvelle interconnexion animée
  newInterconnectAnimated: createEdgeStyle({
    color: COLORS.interconnect,
    width: 2,
    animated: true,
  }),
  
  // Connexion secondaire pointillée
  secondaryDashed: createEdgeStyle({
    color: COLORS.muted,
    width: 1,
    dashed: true,
  }),
  
  // Observateur subtil
  observerSubtle: createEdgeStyle({
    color: COLORS.ai,
    width: 0.5,
    dashed: true,
    dashPattern: '10,10',
    opacity: 0.3,
  }),
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📦 EXPORT PAR DÉFAUT
// ═══════════════════════════════════════════════════════════════════════════════

export default {
  COLORS,
  EDGE_STYLES,
  EDGE_TYPES,
  ANIMATION_PRESETS,
  LINE_CONFIGS,
  NODE_STYLES,
  createEdgeStyle,
  createNodeStyle,
  PRESET_EDGES,
}



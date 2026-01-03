/**
 * Configuration des langages de programmation supportés
 * Centralise extensions, labels, icônes et métadonnées
 */

export interface LanguageInfo {
  id: string
  label: string
  ext: string
  icon: string
  monacoId: string // ID Monaco Editor (peut différer)
  commentPrefix?: string
}

export const LANGUAGE_CONFIG: Record<string, LanguageInfo> = {
  python: {
    id: 'python',
    label: 'Python',
    ext: 'py',
    icon: '🐍',
    monacoId: 'python',
    commentPrefix: '#'
  },
  javascript: {
    id: 'javascript',
    label: 'JavaScript',
    ext: 'js',
    icon: '📜',
    monacoId: 'javascript',
    commentPrefix: '//'
  },
  typescript: {
    id: 'typescript',
    label: 'TypeScript',
    ext: 'ts',
    icon: '💙',
    monacoId: 'typescript',
    commentPrefix: '//'
  },
  java: {
    id: 'java',
    label: 'Java',
    ext: 'java',
    icon: '☕',
    monacoId: 'java',
    commentPrefix: '//'
  },
  cpp: {
    id: 'cpp',
    label: 'C++',
    ext: 'cpp',
    icon: '⚡',
    monacoId: 'cpp',
    commentPrefix: '//'
  },
  csharp: {
    id: 'csharp',
    label: 'C#',
    ext: 'cs',
    icon: '🎯',
    monacoId: 'csharp',
    commentPrefix: '//'
  },
  rust: {
    id: 'rust',
    label: 'Rust',
    ext: 'rs',
    icon: '🦀',
    monacoId: 'rust',
    commentPrefix: '//'
  },
  go: {
    id: 'go',
    label: 'Go',
    ext: 'go',
    icon: '🔷',
    monacoId: 'go',
    commentPrefix: '//'
  },
  php: {
    id: 'php',
    label: 'PHP',
    ext: 'php',
    icon: '🐘',
    monacoId: 'php',
    commentPrefix: '//'
  },
  ruby: {
    id: 'ruby',
    label: 'Ruby',
    ext: 'rb',
    icon: '💎',
    monacoId: 'ruby',
    commentPrefix: '#'
  }
}

/**
 * Récupère les infos d'un langage par son ID
 */
export function getLanguageInfo(languageId: string): LanguageInfo {
  return LANGUAGE_CONFIG[languageId] || {
    id: languageId,
    label: languageId.charAt(0).toUpperCase() + languageId.slice(1),
    ext: 'txt',
    icon: '📄',
    monacoId: languageId,
    commentPrefix: '//'
  }
}

/**
 * Récupère l'extension de fichier pour un langage
 */
export function getFileExtension(languageId: string): string {
  return getLanguageInfo(languageId).ext
}

/**
 * Liste de tous les langages supportés (pour les dropdowns)
 */
export function getAllLanguages(): LanguageInfo[] {
  return Object.values(LANGUAGE_CONFIG)
}



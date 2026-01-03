/**
 * Composant UI pour afficher les stats d'archivage et permettre la consultation
 */

import { useState } from 'react'
import { Archive, Database, MessageSquare, Eye, X } from 'lucide-react'
import { useMessageArchiving } from '../../hooks/useMessageArchiving'
import { Message } from '../../types/learning'

interface ArchiveManagerProps {
  courseId: string
}

export function ArchiveManager({ courseId }: ArchiveManagerProps) {
  const {
    archiveOldMessages,
    loadArchivedMessages,
    getMessageStats,
    isArchiving,
    needsArchiving,
    stats
  } = useMessageArchiving(courseId)
  
  const [showArchived, setShowArchived] = useState(false)
  const [archivedMessages, setArchivedMessages] = useState<Message[]>([])
  const [isLoadingArchived, setIsLoadingArchived] = useState(false)
  
  const handleManualArchive = async () => {
    const count = await archiveOldMessages()
    if (count > 0) {
      await getMessageStats()
    }
  }
  
  const handleViewArchived = async () => {
    setIsLoadingArchived(true)
    const messages = await loadArchivedMessages(0, 50)
    setArchivedMessages(messages)
    setShowArchived(true)
    setIsLoadingArchived(false)
  }
  
  if (!stats) return null
  
  return (
    <div className="bg-gray-800/50 rounded-lg p-4 space-y-3">
      {/* Stats */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-blue-400" />
          <span className="text-sm text-gray-400">Stockage SQLite</span>
        </div>
        
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <MessageSquare className="w-3 h-3 text-green-400" />
            <span className="text-white font-medium">{stats.active}</span>
            <span className="text-gray-400">actifs</span>
          </div>
          
          <div className="flex items-center gap-1">
            <Archive className="w-3 h-3 text-yellow-400" />
            <span className="text-white font-medium">{stats.archived}</span>
            <span className="text-gray-400">archivés</span>
          </div>
          
          <div className="text-gray-400">
            Total: <span className="text-white font-medium">{stats.total}</span>
          </div>
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex items-center gap-2">
        {needsArchiving && (
          <button
            onClick={handleManualArchive}
            disabled={isArchiving}
            className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500/20 text-yellow-400 rounded-lg text-sm hover:bg-yellow-500/30 transition-colors disabled:opacity-50"
          >
            <Archive className="w-4 h-4" />
            {isArchiving ? 'Archivage...' : 'Archiver maintenant'}
          </button>
        )}
        
        {stats.archived > 0 && (
          <button
            onClick={handleViewArchived}
            disabled={isLoadingArchived}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 text-gray-300 rounded-lg text-sm hover:bg-gray-600 transition-colors"
          >
            <Eye className="w-4 h-4" />
            {isLoadingArchived ? 'Chargement...' : 'Voir archives'}
          </button>
        )}
      </div>
      
      {/* Modal archives */}
      {showArchived && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-xl max-w-3xl w-full max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <div className="flex items-center gap-2">
                <Archive className="w-5 h-5 text-yellow-400" />
                <h3 className="text-lg font-semibold text-white">
                  Messages archivés ({archivedMessages.length})
                </h3>
              </div>
              <button
                onClick={() => setShowArchived(false)}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {archivedMessages.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  Aucun message archivé
                </div>
              ) : (
                archivedMessages.map(msg => (
                  <div
                    key={msg.id}
                    className={`p-3 rounded-lg ${
                      msg.role === 'user' 
                        ? 'bg-blue-500/10 border-l-2 border-blue-400' 
                        : 'bg-gray-700/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-gray-400">
                        {msg.role === 'user' ? '👤 Vous' : '🤖 Assistant'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(msg.timestamp).toLocaleString('fr-FR')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300 whitespace-pre-wrap">
                      {msg.content}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


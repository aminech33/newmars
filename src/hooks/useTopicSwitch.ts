import { useEffect, useState } from 'react'
import { Message } from '../types/learning'

/**
 * Hook pour détecter les changements de topic (interleaving)
 * et notifier l'utilisateur
 */
export function useTopicSwitch(
  messages: Message[],
  onTopicSwitch: (from: string, to: string) => void
) {
  const [lastNotifiedTopic, setLastNotifiedTopic] = useState<string | null>(null)

  useEffect(() => {
    if (messages.length >= 2) {
      const lastMessage = messages[messages.length - 1]
      const prevMessage = messages[messages.length - 2]
      
      if (lastMessage.role === 'assistant' && prevMessage.role === 'assistant') {
        const topicPattern = /Topic (\w+)/i
        const lastMatch = lastMessage.content.match(topicPattern)
        const prevMatch = prevMessage.content.match(topicPattern)
        
        if (lastMatch && prevMatch && lastMatch[1] !== prevMatch[1]) {
          const newTopic = lastMatch[1]
          if (lastNotifiedTopic !== newTopic) {
            onTopicSwitch(prevMatch[1], newTopic)
            setLastNotifiedTopic(newTopic)
          }
        }
      }
    }
  }, [messages, onTopicSwitch, lastNotifiedTopic])
}


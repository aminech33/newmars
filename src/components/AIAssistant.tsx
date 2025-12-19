import { Sparkles, Send } from 'lucide-react'
import { useState } from 'react'
import { AppBar } from './AppBar'

export function AIAssistant() {
  const [message, setMessage] = useState('')

  return (
    <div className="h-full flex flex-col bg-black">
      <AppBar />
      
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-8 h-8 text-indigo-400" />
          </div>
          
          <h1 className="text-2xl font-semibold text-white mb-2">
            Assistant IA
          </h1>
          
          <p className="text-zinc-500 mb-8">
            Posez-moi n'importe quelle question.
          </p>
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-zinc-800/50 p-4">
        <div className="max-w-3xl mx-auto flex items-end gap-3">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Écrivez votre message..."
            rows={1}
            className="flex-1 resize-none bg-zinc-900 text-white placeholder:text-zinc-500 rounded-xl px-4 py-3 border border-zinc-700 focus:border-zinc-500 outline-none text-[15px]"
            style={{ minHeight: '48px', maxHeight: '200px' }}
          />
          
          <button
            disabled={!message.trim()}
            className={`flex-shrink-0 h-12 w-12 rounded-xl flex items-center justify-center transition-colors ${
              message.trim()
                ? 'bg-indigo-500 text-white hover:bg-indigo-400'
                : 'bg-zinc-800 text-zinc-500'
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}

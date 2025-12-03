// Composant de debug pour vérifier les variables d'environnement
export function DebugEnv() {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY
  const model = import.meta.env.VITE_GEMINI_MODEL

  return (
    <div className="fixed bottom-4 left-4 bg-zinc-900 border border-zinc-700 rounded-lg p-4 text-xs font-mono max-w-md z-50">
      <h3 className="text-zinc-400 font-bold mb-2">🔧 DEBUG ENV</h3>
      <div className="space-y-1">
        <div className="flex items-start gap-2">
          <span className="text-zinc-500">API Key:</span>
          <span className={apiKey ? "text-green-400" : "text-red-400"}>
            {apiKey ? `${apiKey.slice(0, 20)}...${apiKey.slice(-5)}` : '❌ UNDEFINED'}
          </span>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-zinc-500">Model:</span>
          <span className={model ? "text-green-400" : "text-red-400"}>
            {model || '❌ UNDEFINED'}
          </span>
        </div>
        <div className="mt-3 p-2 bg-zinc-800 rounded">
          {apiKey && model ? (
            <span className="text-green-400">✅ Variables chargées</span>
          ) : (
            <div>
              <span className="text-red-400">❌ Variables manquantes</span>
              <p className="text-zinc-500 mt-1">Redémarre le serveur :</p>
              <code className="text-cyan-400">Ctrl+C puis npm run dev</code>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


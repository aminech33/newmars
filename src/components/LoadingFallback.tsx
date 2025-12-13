export function LoadingFallback() {
  return (
    <div className="min-h-screen w-full bg-zinc-950 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-zinc-500 text-sm">Chargement...</p>
      </div>
    </div>
  )
}

export function WidgetLoadingFallback() {
  return (
    <div className="w-full h-full bg-zinc-900/50 rounded-2xl flex items-center justify-center">
      <div className="w-5 h-5 border-2 border-zinc-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}







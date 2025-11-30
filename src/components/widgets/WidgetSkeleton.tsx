export function WidgetSkeleton() {
  return (
    <div className="h-full w-full rounded-3xl p-5 bg-zinc-900/30 border border-zinc-800/50 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="h-4 w-24 bg-zinc-800 rounded" />
        <div className="h-4 w-4 bg-zinc-800 rounded" />
      </div>
      
      {/* Content */}
      <div className="space-y-3">
        <div className="h-8 w-16 bg-zinc-800 rounded mx-auto" />
        <div className="h-3 w-20 bg-zinc-800/50 rounded mx-auto" />
      </div>
    </div>
  )
}


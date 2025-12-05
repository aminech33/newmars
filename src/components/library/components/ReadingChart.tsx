import { useMemo } from 'react'
import { Book } from '../../../types/library'
import { Sparkline } from '../../ui/Sparkline'

interface ReadingChartProps {
  books: Book[]
  year?: number
}

export function ReadingChart({ books, year = new Date().getFullYear() }: ReadingChartProps) {
  const monthlyData = useMemo(() => {
    const months = Array(12).fill(0)
    
    books.forEach(book => {
      if (book.finishedAt && book.status === 'completed') {
        const date = new Date(book.finishedAt)
        if (date.getFullYear() === year) {
          months[date.getMonth()]++
        }
      }
    })
    
    return months
  }, [books, year])
  
  const totalYear = monthlyData.reduce((a, b) => a + b, 0)
  const avgPerMonth = totalYear > 0 ? (totalYear / 12).toFixed(1) : '0'
  const bestMonth = Math.max(...monthlyData)
  const bestMonthIndex = monthlyData.indexOf(bestMonth)
  const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc']
  
  return (
    <div className="p-6 bg-zinc-900/30 backdrop-blur-xl rounded-2xl border border-white/10">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-zinc-200">Lecture {year}</h3>
          <p className="text-xs text-zinc-600 mt-1">
            {avgPerMonth} livres/mois en moyenne
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-amber-400">{totalYear}</div>
          <div className="text-xs text-zinc-600">livres lus</div>
        </div>
      </div>
      
      <div className="h-32 mb-3">
        <Sparkline data={monthlyData} color="#f59e0b" />
      </div>
      
      <div className="flex justify-between text-[10px] text-zinc-600">
        {monthNames.map((m, i) => (
          <span 
            key={i}
            className={i === bestMonthIndex && bestMonth > 0 ? 'text-amber-400 font-semibold' : ''}
          >
            {m}
          </span>
        ))}
      </div>
      
      {bestMonth > 0 && (
        <div className="mt-3 pt-3 border-t border-white/10 text-center">
          <p className="text-xs text-zinc-500">
            Meilleur mois : <span className="text-amber-400 font-semibold">{monthNames[bestMonthIndex]}</span> ({bestMonth} livres)
          </p>
        </div>
      )}
    </div>
  )
}



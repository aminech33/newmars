import { RefreshCw } from 'lucide-react'
import { useState, useEffect } from 'react'
import { WidgetContainer } from './WidgetContainer'

interface QuoteWidgetProps {
  id: string
  size: 'small' | 'medium' | 'large'
}

const quotes = [
  { text: "Do less, better", author: "Tim Ferriss" },
  { text: "Focus is a matter of deciding what not to do", author: "Steve Jobs" },
  { text: "Simplicity is the ultimate sophistication", author: "Leonardo da Vinci" },
  { text: "Less, but better", author: "Dieter Rams" },
  { text: "Perfection is achieved when there is nothing left to take away", author: "Antoine de Saint-Exupéry" },
  { text: "The secret of getting ahead is getting started", author: "Mark Twain" },
  { text: "Done is better than perfect", author: "Sheryl Sandberg" },
  { text: "Start where you are. Use what you have. Do what you can", author: "Arthur Ashe" },
]

export function QuoteWidget({ id, size }: QuoteWidgetProps) {
  const [quoteIndex, setQuoteIndex] = useState(0)

  useEffect(() => {
    setQuoteIndex(Math.floor(Math.random() * quotes.length))
  }, [])

  const currentQuote = quotes[quoteIndex]

  const nextQuote = () => {
    setQuoteIndex((i) => (i + 1) % quotes.length)
  }

  if (size === 'small') {
    return (
      <WidgetContainer id={id} title="Citation" currentSize={size}>
        <div className="flex items-center justify-center h-full">
          <p className="text-6xl">💭</p>
        </div>
      </WidgetContainer>
    )
  }

  return (
    <WidgetContainer 
      id={id} 
      title="Citation du jour"
      currentSize={size}
      actions={
        <button
          onClick={nextQuote}
          className="text-zinc-700 hover:text-zinc-500 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      }
    >
      <div className="flex flex-col justify-center h-full text-center">
        <p className="text-zinc-300 text-sm italic mb-3">"{currentQuote.text}"</p>
        <p className="text-zinc-600 text-xs">— {currentQuote.author}</p>
      </div>
    </WidgetContainer>
  )
}

import { useState, useEffect } from 'react'
import { ArrowUp } from 'lucide-react'

export function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const toggleVisibility = () => {
      setIsVisible(window.scrollY > 500)
    }

    window.addEventListener('scroll', toggleVisibility)
    return () => window.removeEventListener('scroll', toggleVisibility)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  if (!isVisible) return null

  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-6 right-6 z-50 p-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110 motion-reduce:transition-none motion-reduce:hover:scale-100 animate-fade-in"
      aria-label="Retour en haut"
    >
      <ArrowUp className="w-5 h-5" />
    </button>
  )
}


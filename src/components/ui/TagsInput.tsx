import { useState, KeyboardEvent } from 'react'
import { X, Plus } from 'lucide-react'

interface TagsInputProps {
  tags: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
  maxTags?: number
  suggestedTags?: string[]
}

export function TagsInput({
  tags = [],
  onChange,
  placeholder = 'Ajouter un tag...',
  maxTags = 5,
  suggestedTags = []
}: TagsInputProps) {
  const [inputValue, setInputValue] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)

  // Protection contre tags undefined
  const safeTags = tags || []

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim().toLowerCase()
    if (trimmedTag && !safeTags.includes(trimmedTag) && safeTags.length < maxTags) {
      onChange([...safeTags, trimmedTag])
      setInputValue('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    onChange(safeTags.filter(tag => tag !== tagToRemove))
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(inputValue)
    } else if (e.key === 'Backspace' && inputValue === '' && safeTags.length > 0) {
      removeTag(safeTags[safeTags.length - 1])
    }
  }

  const filteredSuggestions = suggestedTags.filter(
    suggestion => !safeTags.includes(suggestion) && suggestion.includes(inputValue.toLowerCase())
  )

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 p-3 bg-zinc-900/50 border border-zinc-800 rounded-xl min-h-[48px]">
        {safeTags.map(tag => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg text-sm"
          >
            #{tag}
            <button
              onClick={() => removeTag(tag)}
              className="p-0.5 hover:bg-amber-500/20 rounded transition-colors"
              aria-label={`Supprimer le tag ${tag}`}
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        {safeTags.length < maxTags && (
          <div className="relative flex-1 min-w-[120px]">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value)
                setShowSuggestions(true)
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              onKeyDown={handleKeyDown}
              placeholder={safeTags.length === 0 ? placeholder : ''}
              className="w-full bg-transparent text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none"
              aria-label="Ajouter un tag"
            />

            {/* Suggestions */}
            {showSuggestions && filteredSuggestions.length > 0 && (
              <div className="absolute top-full left-0 mt-1 w-full bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg z-10 py-1">
                {filteredSuggestions.slice(0, 5).map(suggestion => (
                  <button
                    key={suggestion}
                    onClick={() => addTag(suggestion)}
                    className="w-full px-3 py-1.5 text-left text-sm text-zinc-300 hover:bg-zinc-700 hover:text-amber-400 transition-colors"
                  >
                    #{suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Suggestions rapides */}
      {suggestedTags.length > 0 && safeTags.length < maxTags && (
        <div className="flex flex-wrap gap-1.5">
          {suggestedTags
            .filter(s => !safeTags.includes(s))
            .slice(0, 6)
            .map(suggestion => (
              <button
                key={suggestion}
                onClick={() => addTag(suggestion)}
                className="inline-flex items-center gap-1 px-2 py-1 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700 hover:border-amber-500/30 text-zinc-500 hover:text-amber-400 rounded-lg text-xs transition-all"
              >
                <Plus className="w-3 h-3" />
                {suggestion}
              </button>
            ))}
        </div>
      )}

      <p className="text-xs text-zinc-600">
        {safeTags.length}/{maxTags} tags - Appuie Entrée ou , pour ajouter
      </p>
    </div>
  )
}

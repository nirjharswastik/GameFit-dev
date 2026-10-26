import React, { useEffect, useRef, useState } from 'react';
import { getSearchSuggestions, SearchResultItem } from '../../services/search';
import { Game } from '../../types';
import { IconClose, IconSearch } from '../common/Icons';

interface SearchAutocompleteProps {
  placeholder?: string;
  initialValue?: string;
  onSearchSubmit: (query: string) => void;
  onSelectGame?: (game: Game) => void;
  className?: string;
  autoFocus?: boolean;
}

export const SearchAutocomplete: React.FC<SearchAutocompleteProps> = ({
  placeholder = 'Search a game or describe what you want to play...',
  initialValue = '',
  onSearchSubmit,
  onSelectGame,
  className = '',
  autoFocus = false,
}) => {
  const [query, setQuery] = useState(initialValue);
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchResultItem[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Update suggestions on query change
  useEffect(() => {
    if (query.trim().length > 0) {
      const list = getSearchSuggestions(query, 6);
      setSuggestions(list);
      setIsOpen(list.length > 0);
      setHighlightedIndex(-1);
    } else {
      setSuggestions([]);
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  }, [query]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen && suggestions.length > 0) {
        setIsOpen(true);
        setHighlightedIndex(0);
      } else {
        setHighlightedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : 0));
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (isOpen && highlightedIndex >= 0 && suggestions[highlightedIndex]) {
        const selected = suggestions[highlightedIndex].game;
        setIsOpen(false);
        if (onSelectGame) {
          onSelectGame(selected);
        } else {
          onSearchSubmit(selected.title);
        }
      } else {
        setIsOpen(false);
        onSearchSubmit(query);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const renderHighlightedTitle = (title: string, range?: [number, number]) => {
    if (!range) return title;
    const [start, end] = range;
    return (
      <>
        {title.slice(0, start)}
        <span className="font-bold underline decoration-[#C85B38] underline-offset-2 text-[#20211F]">
          {title.slice(start, end)}
        </span>
        {title.slice(end)}
      </>
    );
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setIsOpen(false);
          onSearchSubmit(query);
        }}
        className="relative flex items-center"
      >
        <IconSearch className="w-4 h-4 text-[#85867F] absolute left-3.5 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="w-full pl-10 pr-10 py-3 text-sm bg-white border border-[#DCDCD4] rounded-[9px] text-[#20211F] placeholder-[#85867F] focus:outline-none focus:border-[#C85B38] focus:ring-1 focus:ring-[#C85B38] transition-colors"
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          aria-controls="search-suggestions-list"
        />

        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 p-1 text-[#85867F] hover:text-[#20211F] rounded-md transition-colors cursor-pointer"
            aria-label="Clear search"
          >
            <IconClose className="w-3.5 h-3.5" />
          </button>
        )}
      </form>

      {/* Autocomplete Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <ul
          id="search-suggestions-list"
          role="listbox"
          className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-[#DCDCD4] rounded-[10px] shadow-lg overflow-hidden py-1 divide-y divide-[#E8E7E0] text-left animate-in fade-in-50 duration-100"
        >
          {suggestions.map((item, index) => {
            const isHighlighted = index === highlightedIndex;
            return (
              <li
                key={item.game.id}
                role="option"
                aria-selected={isHighlighted}
                onMouseEnter={() => setHighlightedIndex(index)}
                onClick={() => {
                  setIsOpen(false);
                  if (onSelectGame) {
                    onSelectGame(item.game);
                  } else {
                    onSearchSubmit(item.game.title);
                  }
                }}
                className={`p-3 flex items-center gap-3 cursor-pointer transition-colors ${
                  isHighlighted ? 'bg-[#F6E8E1]/60 text-[#20211F]' : 'hover:bg-[#F6F5F1] text-[#20211F]'
                }`}
              >
                {/* Artwork thumbnail */}
                <div className="w-12 h-8 rounded-[6px] bg-slate-900 overflow-hidden shrink-0">
                  {item.game.images.cover && (
                    <img
                      src={item.game.images.cover}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate text-[#20211F]">
                    {renderHighlightedTitle(item.game.title, item.matchedHighlightRange)}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#686A64] truncate">
                    <span className="font-mono uppercase text-[11px]">{item.game.platforms.join('/')}</span>
                    <span>·</span>
                    <span>{item.game.genres[0]}</span>
                    <span>·</span>
                    <span className="text-[#85867F] truncate">{item.matchReason}</span>
                  </div>
                </div>

                <div className="shrink-0 text-xs text-[#85867F] font-mono">
                  {item.game.releaseYear}
                </div>
              </li>
            );
          })}

          <li className="p-2.5 bg-[#F6F5F1] text-center">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onSearchSubmit(query);
              }}
              className="text-xs font-semibold text-[#C85B38] hover:text-[#A9472B] cursor-pointer"
            >
              See all results for "{query}" →
            </button>
          </li>
        </ul>
      )}
    </div>
  );
};

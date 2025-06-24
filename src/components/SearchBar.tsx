import React, { useState, useRef, useEffect } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  searchHistory: string[];
  onClearHistory: () => void;
  isLoading: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  searchHistory,
  onClearHistory,
  isLoading
}) => {
  const [query, setQuery] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const historyRef = useRef<HTMLDivElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
      setShowHistory(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    onSearch(value);
  };

  const handleHistoryClick = (historyQuery: string) => {
    setQuery(historyQuery);
    onSearch(historyQuery);
    setShowHistory(false);
  };

  const handleFocus = () => {
    if (searchHistory.length > 0) {
      setShowHistory(true);
    }
  };

  // Close history when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        historyRef.current &&
        !historyRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowHistory(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const quickSearchTerms = ['Trending', 'Bollywood', 'English', 'Punjabi', 'Tamil', 'Telugu'];

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={handleFocus}
            placeholder="Search for songs, artists, albums..."
            className="w-full px-4 py-3 pl-12 pr-12 bg-card border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300"
          />
          
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
            <i className="fas fa-search text-gray-400"></i>
          </div>
          
          {isLoading && (
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
            </div>
          )}
          
          {query && !isLoading && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                onSearch('');
              }}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
            >
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>
      </form>

      {/* Search History Dropdown */}
      {showHistory && searchHistory.length > 0 && (
        <div
          ref={historyRef}
          className="absolute top-full left-0 right-0 mt-2 bg-card border border-gray-600 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto"
        >
          <div className="p-3 border-b border-gray-600 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-300">Recent Searches</span>
            <button
              onClick={onClearHistory}
              className="text-xs text-gray-400 hover:text-white transition-colors"
            >
              Clear All
            </button>
          </div>
          
          {searchHistory.map((historyQuery, index) => (
            <button
              key={index}
              onClick={() => handleHistoryClick(historyQuery)}
              className="w-full px-4 py-2 text-left text-white hover:bg-hover transition-colors flex items-center"
            >
              <i className="fas fa-history text-gray-400 mr-3"></i>
              {historyQuery}
            </button>
          ))}
        </div>
      )}

      {/* Quick Search Terms */}
      <div className="mt-4 flex flex-wrap gap-2 justify-center">
        {quickSearchTerms.map((term) => (
          <button
            key={term}
            onClick={() => {
              setQuery(term);
              onSearch(term);
            }}
            className="px-3 py-1 bg-card hover:bg-hover text-gray-300 hover:text-white text-sm rounded-full transition-all duration-300 border border-gray-600 hover:border-primary"
          >
            {term}
          </button>
        ))}
      </div>
    </div>
  );
};

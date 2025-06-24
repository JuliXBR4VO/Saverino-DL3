import { useState, useCallback, useEffect } from 'react';
import { Song, SearchState } from '../types';
import { ApiService } from '../utils/api';

export const useSearch = () => {
  const [searchState, setSearchState] = useState<SearchState>({
    query: '',
    results: [],
    isLoading: false,
    error: null,
    page: 1,
    hasMore: true,
    history: JSON.parse(localStorage.getItem('searchHistory') || '[]')
  });

  const debouncedSearch = useCallback(
    ApiService.debounce(async (query: string, page: number = 1, append: boolean = false) => {
      if (!query.trim()) {
        setSearchState(prev => ({ ...prev, results: [], error: null }));
        return;
      }

      setSearchState(prev => ({ ...prev, isLoading: true, error: null }));

      try {
        const response = await ApiService.searchSongs(query, page);
        
        if (response.success && response.data) {
          const newResults = response.data.results || [];
          
          setSearchState(prev => ({
            ...prev,
            results: append ? [...prev.results, ...newResults] : newResults,
            isLoading: false,
            hasMore: newResults.length > 0,
            page: page
          }));
        } else {
          throw new Error('No results found');
        }
      } catch (error) {
        setSearchState(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Search failed'
        }));
      }
    }, 300),
    []
  );

  const search = useCallback((query: string, page: number = 1, append: boolean = false) => {
    setSearchState(prev => ({ ...prev, query }));
    debouncedSearch(query, page, append);
    
    // Add to search history
    if (query.trim() && !append) {
      const newHistory = [query, ...searchState.history.filter(h => h !== query)].slice(0, 10);
      setSearchState(prev => ({ ...prev, history: newHistory }));
      localStorage.setItem('searchHistory', JSON.stringify(newHistory));
    }
  }, [debouncedSearch, searchState.history]);

  const loadMore = useCallback(() => {
    if (searchState.hasMore && !searchState.isLoading && searchState.query) {
      search(searchState.query, searchState.page + 1, true);
    }
  }, [search, searchState]);

  const clearHistory = useCallback(() => {
    setSearchState(prev => ({ ...prev, history: [] }));
    localStorage.removeItem('searchHistory');
  }, []);

  const getFeaturedSongs = useCallback(async () => {
    const featuredQueries = ['trending', 'bollywood', 'english', 'punjabi', 'tamil'];
    const randomQuery = featuredQueries[Math.floor(Math.random() * featuredQueries.length)];
    search(randomQuery);
  }, [search]);

  // Load featured songs on mount
  useEffect(() => {
    if (searchState.results.length === 0 && !searchState.query) {
      getFeaturedSongs();
    }
  }, []);

  return {
    searchState,
    search,
    loadMore,
    clearHistory,
    getFeaturedSongs
  };
};

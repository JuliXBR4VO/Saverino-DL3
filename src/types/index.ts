export interface Song {
  id: string;
  name: string;
  primaryArtists: string;
  album: {
    name: string;
  };
  image: Array<{
    quality: string;
    link: string;
  }>;
  downloadUrl: Array<{
    quality: string;
    link: string;
  }>;
  duration: number;
  year: string;
  language: string;
  hasLyrics: boolean;
  lyricsSnippet: string;
  url: string;
}

export interface SearchResponse {
  data: {
    results: Song[];
    total: number;
    start: number;
  };
  success: boolean;
}

export interface PlayerState {
  currentSong: Song | null;
  isPlaying: boolean;
  volume: number;
  currentTime: number;
  duration: number;
  isLoading: boolean;
  queue: Song[];
  currentIndex: number;
  isShuffled: boolean;
  repeatMode: 'none' | 'one' | 'all';
}

export interface SearchState {
  query: string;
  results: Song[];
  isLoading: boolean;
  error: string | null;
  page: number;
  hasMore: boolean;
  history: string[];
}

export interface AppTheme {
  isDark: boolean;
  primaryColor: string;
  accentColor: string;
}

import React, { useState } from 'react';
import { SongCard } from './components/SongCard';
import { SearchBar } from './components/SearchBar';
import { AudioPlayer } from './components/AudioPlayer';
import { FullscreenPlayer } from './components/FullscreenPlayer';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { useSearch } from './hooks/useSearch';
import { Song } from './types';


function App() {
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(true);
  
  const {
    audioRef,
    playerState,
    playSong,
    togglePlayPause,
    seekTo,
    setVolume,
    nextSong,
    previousSong,
    toggleShuffle,
    toggleRepeat
  } = useAudioPlayer();

  const {
    searchState,
    search,
    loadMore,
    clearHistory,
    getFeaturedSongs
  } = useSearch();

  const handlePlaySong = (song: Song) => {
    const queue = searchState.results;
    const index = queue.findIndex(s => s.id === song.id);
    playSong(song, queue, index);
  };

  const handleAddToQueue = (song: Song) => {
    // Add song to the end of current queue
    const newQueue = [...playerState.queue, song];
    // Update player state with new queue
    // This would need to be implemented in the useAudioPlayer hook
    console.log('Adding to queue:', song.name);
  };

  const toggleFullscreen = () => {
    setIsFullscreenOpen(!isFullscreenOpen);
  };

  const toggleTheme = () => {
    setIsDarkTheme(!isDarkTheme);
    // This could be expanded to actually change the theme
  };

  return (
    <div className={`min-h-screen ${isDarkTheme ? 'bg-dark' : 'bg-white'} transition-colors duration-300`}>
      {/* Header */}
      <header className="sticky top-0 z-30 bg-dark bg-opacity-95 backdrop-blur-md border-b border-gray-600">
        <div className="max-w-screen-xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-primary">
                <i className="fas fa-music mr-2"></i>
                Saverino
              </h1>
              <span className="text-xs bg-primary bg-opacity-20 text-primary px-2 py-1 rounded-full">
                v2.0
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleTheme}
                className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-hover"
                title="Toggle theme"
              >
                <i className={`fas ${isDarkTheme ? 'fa-sun' : 'fa-moon'}`}></i>
              </button>
              
              <button
                onClick={getFeaturedSongs}
                className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-hover"
                title="Refresh featured songs"
              >
                <i className="fas fa-sync-alt"></i>
              </button>
            </div>
          </div>
          
          <SearchBar
            onSearch={search}
            searchHistory={searchState.history}
            onClearHistory={clearHistory}
            isLoading={searchState.isLoading}
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-screen-xl mx-auto px-4 py-8 pb-32">
        {/* Search Results Header */}
        <div className="mb-6">
          {searchState.query ? (
            <h2 className="text-xl font-semibold text-white mb-2">
              Search results for "{searchState.query}"
            </h2>
          ) : (
            <h2 className="text-xl font-semibold text-white mb-2">
              Featured Songs
            </h2>
          )}
          
          {searchState.results.length > 0 && (
            <p className="text-gray-400 text-sm">
              {searchState.results.length} songs found
            </p>
          )}
        </div>

        {/* Error Message */}
        {searchState.error && (
          <div className="mb-6 p-4 bg-red-900 bg-opacity-50 border border-red-500 rounded-lg">
            <div className="flex items-center">
              <i className="fas fa-exclamation-triangle text-red-400 mr-2"></i>
              <span className="text-red-200">{searchState.error}</span>
            </div>
          </div>
        )}

        {/* Loading State */}
        {searchState.isLoading && searchState.results.length === 0 && (
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-400">Searching for music...</p>
            </div>
          </div>
        )}

        {/* No Results */}
        {!searchState.isLoading && searchState.results.length === 0 && searchState.query && (
          <div className="text-center py-12">
            <i className="fas fa-search text-6xl text-gray-600 mb-4"></i>
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No songs found</h3>
            <p className="text-gray-500">Try searching with different keywords</p>
          </div>
        )}

        {/* Songs Grid */}
        {searchState.results.length > 0 && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mb-8">
              {searchState.results.map((song) => (
                <SongCard
                  key={song.id}
                  song={song}
                  onPlay={handlePlaySong}
                  onAddToQueue={handleAddToQueue}
                  isPlaying={playerState.currentSong?.id === song.id && playerState.isPlaying}
                />
              ))}
            </div>

            {/* Load More Button */}
            {searchState.hasMore && (
              <div className="text-center">
                <button
                  onClick={loadMore}
                  disabled={searchState.isLoading}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {searchState.isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                      Loading...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-sync-alt mr-2"></i>
                      Load More
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Audio Element */}
      <audio ref={audioRef} preload="metadata" />

      {/* Audio Player */}
      <AudioPlayer
        playerState={playerState}
        onTogglePlayPause={togglePlayPause}
        onSeek={seekTo}
        onVolumeChange={setVolume}
        onNext={nextSong}
        onPrevious={previousSong}
        onToggleShuffle={toggleShuffle}
        onToggleRepeat={toggleRepeat}
        onToggleFullscreen={toggleFullscreen}
      />

      {/* Fullscreen Player */}
      <FullscreenPlayer
        isOpen={isFullscreenOpen}
        onClose={() => setIsFullscreenOpen(false)}
        playerState={playerState}
        onTogglePlayPause={togglePlayPause}
        onSeek={seekTo}
        onNext={nextSong}
        onPrevious={previousSong}
        onToggleShuffle={toggleShuffle}
        onToggleRepeat={toggleRepeat}
      />

      {/* Footer */}
      <footer className="bg-card border-t border-gray-600 py-8 mt-16">
        <div className="max-w-screen-xl mx-auto px-4 text-center">
          <p className="text-gray-400 text-sm mb-2">
            This content is not affiliated with, endorsed, sponsored, or specifically approved by any third party music provider.
            We don't serve any music on our servers.
          </p>
          <p className="text-gray-500 text-xs">
            Originally by wiz64 • Re-Designed by JuliXBR4VO • Upgraded with React & TypeScript
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;

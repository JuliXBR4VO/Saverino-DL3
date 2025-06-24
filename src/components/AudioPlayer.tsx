import React from 'react';
import { PlayerState } from '../types';
import { ApiService, formatArtists, sanitizeHtml } from '../utils/api';

interface AudioPlayerProps {
  playerState: PlayerState;
  onTogglePlayPause: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (volume: number) => void;
  onNext: () => void;
  onPrevious: () => void;
  onToggleShuffle: () => void;
  onToggleRepeat: () => void;
  onToggleFullscreen?: () => void;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  playerState,
  onTogglePlayPause,
  onSeek,
  onVolumeChange,
  onNext,
  onPrevious,
  onToggleShuffle,
  onToggleRepeat,
  onToggleFullscreen
}) => {
  const { currentSong, isPlaying, currentTime, duration, volume, isLoading, repeatMode, isShuffled } = playerState;

  if (!currentSong) {
    return null;
  }

  const imageUrl = ApiService.getHighQualityImage(currentSong);
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newTime = (clickX / rect.width) * duration;
    onSeek(newTime);
  };

  const formatTime = (time: number) => {
    return ApiService.formatDuration(time);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-gray-600 p-4 z-40">
      <div className="max-w-screen-xl mx-auto">
        <div className="flex items-center space-x-4">
          {/* Song Info */}
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            <div 
              className="relative cursor-pointer group"
              onClick={onToggleFullscreen}
            >
              <img
                src={imageUrl}
                alt={sanitizeHtml(currentSong.name)}
                className="w-14 h-14 rounded-lg object-cover"
              />
              {onToggleFullscreen && (
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 rounded-lg flex items-center justify-center transition-all duration-300">
                  <i className="fas fa-expand text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"></i>
                </div>
              )}
            </div>
            
            <div className="min-w-0 flex-1">
              <h4 className="text-white font-medium text-sm truncate">
                {sanitizeHtml(currentSong.name)}
              </h4>
              <p className="text-gray-400 text-xs truncate">
                {formatArtists(currentSong.primaryArtists)}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col items-center space-y-2 flex-1 max-w-md">
            <div className="flex items-center space-x-4">
              <button
                onClick={onToggleShuffle}
                className={`text-sm transition-colors ${
                  isShuffled ? 'text-primary' : 'text-gray-400 hover:text-white'
                }`}
                title="Shuffle"
              >
                <i className="fas fa-random"></i>
              </button>
              
              <button
                onClick={onPrevious}
                className="text-gray-400 hover:text-white transition-colors"
                title="Previous"
              >
                <i className="fas fa-step-backward"></i>
              </button>
              
              <button
                onClick={onTogglePlayPause}
                disabled={isLoading}
                className="w-10 h-10 bg-primary hover:bg-secondary rounded-full flex items-center justify-center text-white transition-all duration-300 hover:scale-105 disabled:opacity-50"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : isPlaying ? (
                  <i className="fas fa-pause"></i>
                ) : (
                  <i className="fas fa-play ml-1"></i>
                )}
              </button>
              
              <button
                onClick={onNext}
                className="text-gray-400 hover:text-white transition-colors"
                title="Next"
              >
                <i className="fas fa-step-forward"></i>
              </button>
              
              <button
                onClick={onToggleRepeat}
                className={`text-sm transition-colors ${
                  repeatMode !== 'none' ? 'text-primary' : 'text-gray-400 hover:text-white'
                }`}
                title={`Repeat: ${repeatMode}`}
              >
                <i className={`fas ${repeatMode === 'one' ? 'fa-redo' : 'fa-retweet'}`}></i>
                {repeatMode === 'one' && <span className="text-xs ml-1">1</span>}
              </button>
            </div>

            {/* Progress Bar */}
            <div className="flex items-center space-x-2 w-full">
              <span className="text-xs text-gray-400 min-w-[35px]">
                {formatTime(currentTime)}
              </span>
              
              <div
                className="flex-1 h-1 bg-gray-600 rounded-full cursor-pointer group"
                onClick={handleProgressClick}
              >
                <div
                  className="h-full bg-primary rounded-full relative transition-all duration-100"
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
              </div>
              
              <span className="text-xs text-gray-400 min-w-[35px]">
                {formatTime(duration)}
              </span>
            </div>
          </div>

          {/* Volume Control */}
          <div className="flex items-center space-x-2 min-w-[120px]">
            <button
              onClick={() => onVolumeChange(volume > 0 ? 0 : 1)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <i className={`fas ${volume === 0 ? 'fa-volume-mute' : volume < 0.5 ? 'fa-volume-down' : 'fa-volume-up'}`}></i>
            </button>
            
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              className="flex-1 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

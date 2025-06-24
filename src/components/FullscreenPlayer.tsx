import React, { useEffect, useState } from 'react';
import { PlayerState } from '../types';
import { ApiService, formatArtists, sanitizeHtml } from '../utils/api';

interface FullscreenPlayerProps {
  isOpen: boolean;
  onClose: () => void;
  playerState: PlayerState;
  onTogglePlayPause: () => void;
  onSeek: (time: number) => void;
  onNext: () => void;
  onPrevious: () => void;
  onToggleShuffle: () => void;
  onToggleRepeat: () => void;
}

export const FullscreenPlayer: React.FC<FullscreenPlayerProps> = ({
  isOpen,
  onClose,
  playerState,
  onTogglePlayPause,
  onSeek,
  onNext,
  onPrevious,
  onToggleShuffle,
  onToggleRepeat
}) => {
  const [backgroundImage, setBackgroundImage] = useState('');
  const { currentSong, isPlaying, currentTime, duration, isLoading, repeatMode, isShuffled } = playerState;

  useEffect(() => {
    if (currentSong) {
      const imageUrl = ApiService.getHighQualityImage(currentSong);
      setBackgroundImage(imageUrl);
    }
  }, [currentSong]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !currentSong) {
    return null;
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const imageUrl = ApiService.getHighQualityImage(currentSong);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Background with blur effect */}
      <div
        className="absolute inset-0 bg-cover bg-center filter blur-2xl scale-110"
        style={{
          backgroundImage: `url(${backgroundImage})`,
          backgroundColor: '#121212'
        }}
      />
      
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-60" />

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 w-12 h-12 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full flex items-center justify-center text-white transition-all duration-300 z-10"
      >
        <i className="fas fa-times text-lg"></i>
      </button>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-md mx-auto px-6">
        {/* Album Art with Vinyl Effect */}
        <div className="relative mb-8">
          <div className="w-80 h-80 relative">
            {/* Vinyl disc background */}
            <div className={`absolute inset-0 rounded-full bg-gradient-radial from-gray-800 via-gray-900 to-black ${isPlaying ? 'animate-spin-slow' : ''}`}>
              <div className="absolute inset-4 rounded-full bg-gradient-radial from-gray-700 via-gray-800 to-gray-900">
                <div className="absolute inset-8 rounded-full overflow-hidden">
                  <img
                    src={imageUrl}
                    alt={sanitizeHtml(currentSong.name)}
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
                {/* Center hole */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-gray-900 rounded-full border-2 border-gray-700"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Song Info */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2 text-shadow">
            {sanitizeHtml(currentSong.name)}
          </h1>
          <p className="text-xl text-gray-300 mb-1">
            {formatArtists(currentSong.primaryArtists)}
          </p>
          <p className="text-lg text-gray-400">
            {sanitizeHtml(currentSong.album.name)}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-full mb-6">
          <div
            className="w-full h-2 bg-gray-600 rounded-full cursor-pointer group mb-2"
            onClick={handleProgressClick}
          >
            <div
              className="h-full bg-primary rounded-full relative transition-all duration-100"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
          </div>
          
          <div className="flex justify-between text-sm text-gray-400">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-8">
          <button
            onClick={onToggleShuffle}
            className={`text-2xl transition-all duration-300 ${
              isShuffled ? 'text-primary scale-110' : 'text-gray-400 hover:text-white hover:scale-110'
            }`}
            title="Shuffle"
          >
            <i className="fas fa-random"></i>
          </button>
          
          <button
            onClick={onPrevious}
            className="text-3xl text-gray-400 hover:text-white transition-all duration-300 hover:scale-110"
            title="Previous"
          >
            <i className="fas fa-step-backward"></i>
          </button>
          
          <button
            onClick={onTogglePlayPause}
            disabled={isLoading}
            className="w-16 h-16 bg-primary hover:bg-secondary rounded-full flex items-center justify-center text-white text-2xl transition-all duration-300 hover:scale-110 disabled:opacity-50 shadow-lg"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            ) : isPlaying ? (
              <i className="fas fa-pause"></i>
            ) : (
              <i className="fas fa-play ml-1"></i>
            )}
          </button>
          
          <button
            onClick={onNext}
            className="text-3xl text-gray-400 hover:text-white transition-all duration-300 hover:scale-110"
            title="Next"
          >
            <i className="fas fa-step-forward"></i>
          </button>
          
          <button
            onClick={onToggleRepeat}
            className={`text-2xl transition-all duration-300 ${
              repeatMode !== 'none' ? 'text-primary scale-110' : 'text-gray-400 hover:text-white hover:scale-110'
            }`}
            title={`Repeat: ${repeatMode}`}
          >
            <i className={`fas ${repeatMode === 'one' ? 'fa-redo' : 'fa-retweet'}`}></i>
            {repeatMode === 'one' && <span className="text-sm ml-1">1</span>}
          </button>
        </div>
      </div>
    </div>
  );
};

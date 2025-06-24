import React from 'react';
import { Song } from '../types';
import { ApiService, formatArtists, sanitizeHtml } from '../utils/api';

interface SongCardProps {
  song: Song;
  onPlay: (song: Song) => void;
  onAddToQueue?: (song: Song) => void;
  isPlaying?: boolean;
}

export const SongCard: React.FC<SongCardProps> = ({ 
  song, 
  onPlay, 
  onAddToQueue, 
  isPlaying = false 
}) => {
  const imageUrl = ApiService.getHighQualityImage(song);
  const duration = ApiService.formatDuration(song.duration);

  const handlePlay = () => {
    onPlay(song);
  };

  const handleAddToQueue = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToQueue?.(song);
  };

  return (
    <div 
      className="card group cursor-pointer overflow-hidden relative"
      onClick={handlePlay}
    >
      <div className="relative overflow-hidden">
        <img
          src={imageUrl}
          alt={sanitizeHtml(song.name)}
          className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110"
          loading="lazy"
        />
        
        {/* Play overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-300 flex items-center justify-center">
          <div className="transform scale-0 group-hover:scale-100 transition-transform duration-300">
            {isPlaying ? (
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                <i className="fas fa-pause text-white text-lg"></i>
              </div>
            ) : (
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                <i className="fas fa-play text-white text-lg ml-1"></i>
              </div>
            )}
          </div>
        </div>

        {/* Duration badge */}
        <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
          {duration}
        </div>

        {/* Queue button */}
        {onAddToQueue && (
          <button
            onClick={handleAddToQueue}
            className="absolute top-2 left-2 w-8 h-8 bg-black bg-opacity-70 hover:bg-opacity-90 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            title="Add to queue"
          >
            <i className="fas fa-plus text-xs"></i>
          </button>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-white text-sm mb-1 line-clamp-2 leading-tight">
          {sanitizeHtml(song.name)}
        </h3>
        <p className="text-gray-400 text-xs mb-2 line-clamp-1">
          {formatArtists(song.primaryArtists)}
        </p>
        <p className="text-gray-500 text-xs line-clamp-1">
          {sanitizeHtml(song.album.name)} • {song.year}
        </p>
        
        {song.hasLyrics && (
          <div className="mt-2">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary bg-opacity-20 text-primary">
              <i className="fas fa-music mr-1"></i>
              Lyrics
            </span>
          </div>
        )}
      </div>

      {/* Playing indicator */}
      {isPlaying && (
        <div className="absolute bottom-4 right-4">
          <div className="flex space-x-1">
            <div className="w-1 h-4 bg-primary rounded-full animate-pulse"></div>
            <div className="w-1 h-3 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-1 h-5 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      )}
    </div>
  );
};

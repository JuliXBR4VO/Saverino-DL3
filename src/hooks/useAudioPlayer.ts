import { useState, useRef, useEffect, useCallback } from 'react';
import { Song, PlayerState } from '../types';
import { ApiService } from '../utils/api';

export const useAudioPlayer = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playerState, setPlayerState] = useState<PlayerState>({
    currentSong: null,
    isPlaying: false,
    volume: 1,
    currentTime: 0,
    duration: 0,
    isLoading: false,
    queue: [],
    currentIndex: -1,
    isShuffled: false,
    repeatMode: 'none'
  });

  const updateCurrentTime = useCallback(() => {
    if (audioRef.current) {
      setPlayerState(prev => ({
        ...prev,
        currentTime: audioRef.current!.currentTime,
        duration: audioRef.current!.duration || 0
      }));
    }
  }, []);

  const playSong = useCallback(async (song: Song, queue: Song[] = [], index: number = 0) => {
    setPlayerState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const downloadUrl = await ApiService.getDownloadUrl(song.id);
      
      if (audioRef.current) {
        audioRef.current.src = downloadUrl;
        audioRef.current.load();
        
        setPlayerState(prev => ({
          ...prev,
          currentSong: song,
          queue: queue.length > 0 ? queue : [song],
          currentIndex: index,
          isLoading: false
        }));
        
        await audioRef.current.play();
        setPlayerState(prev => ({ ...prev, isPlaying: true }));
      }
    } catch (error) {
      console.error('Error playing song:', error);
      setPlayerState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const togglePlayPause = useCallback(() => {
    if (audioRef.current) {
      if (playerState.isPlaying) {
        audioRef.current.pause();
        setPlayerState(prev => ({ ...prev, isPlaying: false }));
      } else {
        audioRef.current.play();
        setPlayerState(prev => ({ ...prev, isPlaying: true }));
      }
    }
  }, [playerState.isPlaying]);

  const seekTo = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      updateCurrentTime();
    }
  }, [updateCurrentTime]);

  const setVolume = useCallback((volume: number) => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      setPlayerState(prev => ({ ...prev, volume }));
    }
  }, []);

  const nextSong = useCallback(() => {
    const { queue, currentIndex, isShuffled, repeatMode } = playerState;
    
    if (queue.length === 0) return;
    
    let nextIndex = currentIndex;
    
    if (repeatMode === 'one') {
      // Replay current song
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
      }
      return;
    }
    
    if (isShuffled) {
      nextIndex = Math.floor(Math.random() * queue.length);
    } else {
      nextIndex = currentIndex + 1;
      if (nextIndex >= queue.length) {
        if (repeatMode === 'all') {
          nextIndex = 0;
        } else {
          return; // End of queue
        }
      }
    }
    
    playSong(queue[nextIndex], queue, nextIndex);
  }, [playerState, playSong]);

  const previousSong = useCallback(() => {
    const { queue, currentIndex } = playerState;
    
    if (queue.length === 0 || currentIndex <= 0) return;
    
    const prevIndex = currentIndex - 1;
    playSong(queue[prevIndex], queue, prevIndex);
  }, [playerState, playSong]);

  const toggleShuffle = useCallback(() => {
    setPlayerState(prev => ({ ...prev, isShuffled: !prev.isShuffled }));
  }, []);

  const toggleRepeat = useCallback(() => {
    setPlayerState(prev => ({
      ...prev,
      repeatMode: prev.repeatMode === 'none' ? 'all' : prev.repeatMode === 'all' ? 'one' : 'none'
    }));
  }, []);

  // Audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => updateCurrentTime();
    const handleEnded = () => nextSong();
    const handleLoadStart = () => setPlayerState(prev => ({ ...prev, isLoading: true }));
    const handleCanPlay = () => setPlayerState(prev => ({ ...prev, isLoading: false }));
    const handleError = () => {
      console.error('Audio playback error');
      setPlayerState(prev => ({ ...prev, isLoading: false, isPlaying: false }));
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleError);
    };
  }, [updateCurrentTime, nextSong]);

  return {
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
  };
};

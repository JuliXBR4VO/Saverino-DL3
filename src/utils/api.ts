import { Song, SearchResponse } from '../types';

const DOWNLOAD_API = 'https://openmp3compiler.astudy.org';
const SEARCH_API = 'https://jiosaavn-api-privatecvc2.vercel.app/search/songs?query=';

export class ApiService {
  private static cache = new Map<string, any>();
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  static async searchSongs(query: string, page: number = 1): Promise<SearchResponse> {
    const cacheKey = `search_${query}_${page}`;
    const cached = this.getFromCache(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const encodedQuery = encodeURIComponent(query);
      const response = await fetch(`${SEARCH_API}${encodedQuery}&page=${page}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: SearchResponse = await response.json();
      this.setCache(cacheKey, data);
      
      return data;
    } catch (error) {
      console.error('Search API error:', error);
      throw new Error('Failed to search songs. Please try again.');
    }
  }

  static async getDownloadUrl(songId: string, quality: string = '320kbps'): Promise<string> {
    const cacheKey = `download_${songId}_${quality}`;
    const cached = this.getFromCache(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const response = await fetch(`${DOWNLOAD_API}/download?id=${songId}&quality=${quality}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      const downloadUrl = data.downloadUrl || data.url;
      
      this.setCache(cacheKey, downloadUrl);
      return downloadUrl;
    } catch (error) {
      console.error('Download API error:', error);
      throw new Error('Failed to get download URL. Please try again.');
    }
  }

  static getHighQualityImage(song: Song): string {
    if (!song.image || song.image.length === 0) {
      return 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500&h=500&fit=crop';
    }
    
    // Find highest quality image
    const highQualityImage = song.image.find(img => img.quality === '500x500') || 
                            song.image.find(img => img.quality === '150x150') ||
                            song.image[0];
    
    return highQualityImage.link;
  }

  static formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  static debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }

  private static setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  private static getFromCache(key: string): any {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > this.CACHE_DURATION) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  static clearCache(): void {
    this.cache.clear();
  }
}

export const formatArtists = (artists: string): string => {
  return artists.replace(/&quot;/g, '"').replace(/&amp;/g, '&');
};

export const sanitizeHtml = (html: string): string => {
  return html.replace(/<[^>]*>/g, '').replace(/&quot;/g, '"').replace(/&amp;/g, '&');
};

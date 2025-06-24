// Saverino Music Player - Enhanced JavaScript
const API_BASE = "https://jiosaavn-api-privatecvc2.vercel.app";
const DOWNLOAD_API = "https://openmp3compiler.astudy.org";

// Global State
const state = {
  currentSong: null,
  isPlaying: false,
  searchResults: [],
  downloads: [],
  searchHistory: JSON.parse(localStorage.getItem('searchHistory') || '[]'),
  currentQuality: '3',
  page: 1,
  lastQuery: '',
  audioElement: null
};

// DOM Elements
let elements = {};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  initializeElements();
  setupEventListeners();
  loadInitialContent();
  restoreState();
  initializeDarkMode();
});

// Initialize DOM Elements
function initializeElements() {
  elements = {
    searchInput: document.getElementById('search-input'),
    searchBtn: document.getElementById('search-btn'),
    resultsGrid: document.getElementById('results-grid'),
    loadMoreBtn: document.getElementById('load-more-btn'),
    miniPlayer: document.getElementById('mini-player'),
    fullscreenPlayer: document.getElementById('fullscreen-player'),
    downloadPopup: document.getElementById('download-popup'),
    downloadList: document.getElementById('download-list'),
    downloadBadge: document.getElementById('download-badge'),
    qualityBtns: document.querySelectorAll('.quality-btn'),
    quickTags: document.querySelectorAll('.tag')
  };
  state.audioElement = document.getElementById('audio-player');
}

// Setup Event Listeners
function setupEventListeners() {
  // Search
  if (elements.searchBtn) {
    elements.searchBtn.addEventListener('click', handleSearch);
  }
  if (elements.searchInput) {
    elements.searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleSearch();
    });
  }

  // Quality Selection
  elements.qualityBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      elements.qualityBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.currentQuality = btn.dataset.quality;
    });
  });

  // Quick Tags
  elements.quickTags.forEach(tag => {
    tag.addEventListener('click', () => {
      elements.searchInput.value = tag.textContent.trim();
      handleSearch();
    });
  });

  // Load More
  if (elements.loadMoreBtn) {
    elements.loadMoreBtn.addEventListener('click', loadMore);
  }

  // Mini Player Controls
  const miniPlayerImage = document.getElementById('mini-player-image');
  const miniPlayBtn = document.getElementById('mini-play-btn');
  const miniPrevBtn = document.getElementById('mini-prev-btn');
  const miniNextBtn = document.getElementById('mini-next-btn');
  
  if (miniPlayerImage) miniPlayerImage.addEventListener('click', openFullscreenPlayer);
  if (miniPlayBtn) miniPlayBtn.addEventListener('click', togglePlay);
  if (miniPrevBtn) miniPrevBtn.addEventListener('click', playPrevious);
  if (miniNextBtn) miniNextBtn.addEventListener('click', playNext);

  // Fullscreen Player Controls
  const closeFullscreenBtn = document.getElementById('close-fullscreen');
  const fullscreenPlayBtn = document.getElementById('fullscreen-play-btn');
  const fullscreenPrevBtn = document.getElementById('fullscreen-prev-btn');
  const fullscreenNextBtn = document.getElementById('fullscreen-next-btn');
  
  if (closeFullscreenBtn) closeFullscreenBtn.addEventListener('click', closeFullscreenPlayer);
  if (fullscreenPlayBtn) fullscreenPlayBtn.addEventListener('click', togglePlay);
  if (fullscreenPrevBtn) fullscreenPrevBtn.addEventListener('click', playPrevious);
  if (fullscreenNextBtn) fullscreenNextBtn.addEventListener('click', playNext);

  // Progress Bars
  const miniProgressBar = document.getElementById('mini-progress-bar');
  const fullscreenProgressBar = document.getElementById('fullscreen-progress-bar');
  
  if (miniProgressBar) miniProgressBar.addEventListener('click', seekAudio);
  if (fullscreenProgressBar) fullscreenProgressBar.addEventListener('click', seekAudio);

  // Download Manager
  const downloadFab = document.getElementById('download-fab');
  const closeDownloadsBtn = document.getElementById('close-downloads');
  
  if (downloadFab) downloadFab.addEventListener('click', toggleDownloadPopup);
  if (closeDownloadsBtn) closeDownloadsBtn.addEventListener('click', toggleDownloadPopup);

  // Audio Element Events
  if (state.audioElement) {
    state.audioElement.addEventListener('timeupdate', updateProgress);
    state.audioElement.addEventListener('ended', playNext);
    state.audioElement.addEventListener('play', () => {
      state.isPlaying = true;
      updatePlayButtons();
    });
    state.audioElement.addEventListener('pause', () => {
      state.isPlaying = false;
      updatePlayButtons();
    });
  }
}

// Load initial content
function loadInitialContent() {
  performSearch('Top Hits');
}

// Restore state
function restoreState() {
  if (state.searchHistory.length > 0) {
    updateSearchHistoryUI();
  }
  // Set default quality button active
  elements.qualityBtns.forEach(btn => {
    if (btn.dataset.quality === state.currentQuality) {
      btn.classList.add('active');
    }
  });
}

// Handle Search
function handleSearch() {
  const query = elements.searchInput.value.trim();
  if (!query) return;
  state.page = 1;
  performSearch(query);
  saveToSearchHistory(query);
}

// Perform Search
async function performSearch(query) {
  state.lastQuery = query;
  elements.resultsGrid.innerHTML = '<div class="loader"><div class="loader-dots"><div class="loader-dot"></div><div class="loader-dot"></div><div class="loader-dot"></div></div></div>';
  
  try {
    const response = await fetch(`${API_BASE}/search/songs?query=${encodeURIComponent(query)}&limit=40&page=${state.page}`);
    if (!response.ok) throw new Error('Search failed');
    
    const data = await response.json();
    if (!data.data || !data.data.results || data.data.results.length === 0) {
      elements.resultsGrid.innerHTML = '<p class="error-message">No results found. Try another search term.</p>';
      return;
    }
    
    if (state.page === 1) {
      state.searchResults = data.data.results;
    } else {
      state.searchResults = state.searchResults.concat(data.data.results);
    }
    
    renderSearchResults();
  } catch (error) {
    elements.resultsGrid.innerHTML = '<p class="error-message">Failed to search. Please try again.</p>';
    console.error('Search error:', error);
  }
}

// Render search results
function renderSearchResults() {
  elements.resultsGrid.innerHTML = '';
  state.searchResults.forEach(track => {
    const card = createSongCard(track);
    elements.resultsGrid.appendChild(card);
  });
  
  if (elements.loadMoreBtn) {
    elements.loadMoreBtn.style.display = state.searchResults.length >= 40 ? 'inline-flex' : 'none';
  }
}

// Create song card
function createSongCard(track) {
  const card = document.createElement('div');
  card.className = 'song-card';
  
  const imageUrl = track.image && track.image[1] ? track.image[1].link : '';
  const downloadUrl = track.downloadUrl && track.downloadUrl[state.currentQuality] ? track.downloadUrl[state.currentQuality].link : '';
  
  card.innerHTML = `
    <div class="song-image-wrapper">
      <img src="${imageUrl}" alt="${track.name}" class="song-image" loading="lazy" />
      <div class="song-overlay">
        <button class="play-btn" aria-label="Play" data-url="${downloadUrl}" data-id="${track.id}">
          <i class="fas fa-play"></i>
        </button>
        <button class="download-btn" aria-label="Download" data-id="${track.id}">
          <i class="fas fa-download"></i>
        </button>
      </div>
    </div>
    <div class="song-info">
      <div class="song-title">${track.name || 'Unknown'}</div>
      <div class="song-artist">${track.primaryArtists || 'Unknown Artist'}</div>
      <div class="song-meta">
        <span>${track.year || ''}</span>
        <span>${formatDuration(track.duration)}</span>
      </div>
    </div>
  `;
  
  // Add event listeners
  const playBtn = card.querySelector('.play-btn');
  const downloadBtn = card.querySelector('.download-btn');
  
  playBtn.addEventListener('click', () => playSong(downloadUrl, track.id));
  downloadBtn.addEventListener('click', () => addToDownload(track.id));
  
  return card;
}

// Format duration
function formatDuration(seconds) {
  if (!seconds) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Play song
function playSong(url, id) {
  if (!url) return;
  
  state.currentSong = id;
  state.audioElement.src = url;
  state.audioElement.play();
  
  updateMiniPlayer();
  updateFullscreenPlayer();
  
  if (elements.miniPlayer) {
    elements.miniPlayer.classList.add('active');
  }
}

// Update mini player
function updateMiniPlayer() {
  if (!state.currentSong) return;
  
  const track = state.searchResults.find(t => t.id === state.currentSong);
  if (!track) return;
  
  const miniImage = document.getElementById('mini-player-image');
  const miniTitle = document.getElementById('mini-player-title');
  const miniArtist = document.getElementById('mini-player-artist');
  
  if (miniImage) miniImage.src = track.image[1].link;
  if (miniTitle) miniTitle.textContent = track.name;
  if (miniArtist) miniArtist.textContent = track.primaryArtists;
}

// Update fullscreen player
function updateFullscreenPlayer() {
  if (!state.currentSong) return;
  
  const track = state.searchResults.find(t => t.id === state.currentSong);
  if (!track) return;
  
  const fullscreenCover = document.getElementById('fullscreen-cover');
  const fullscreenTitle = document.getElementById('fullscreen-title');
  const fullscreenArtist = document.getElementById('fullscreen-artist');
  const fullscreenAlbum = document.getElementById('fullscreen-album');
  
  if (fullscreenCover) fullscreenCover.src = track.image[1].link;
  if (fullscreenTitle) fullscreenTitle.textContent = track.name;
  if (fullscreenArtist) fullscreenArtist.textContent = track.primaryArtists;
  if (fullscreenAlbum) fullscreenAlbum.textContent = track.album ? track.album.name : '';
}

// Toggle play/pause
function togglePlay() {
  if (!state.audioElement.src) return;
  
  if (state.audioElement.paused) {
    state.audioElement.play();
  } else {
    state.audioElement.pause();
  }
}

// Update play buttons
function updatePlayButtons() {
  const playIcon = state.isPlaying ? 'fa-pause' : 'fa-play';
  
  const miniPlayBtn = document.getElementById('mini-play-btn');
  const fullscreenPlayBtn = document.getElementById('fullscreen-play-btn');
  
  if (miniPlayBtn) miniPlayBtn.innerHTML = `<i class="fas ${playIcon}"></i>`;
  if (fullscreenPlayBtn) fullscreenPlayBtn.innerHTML = `<i class="fas ${playIcon}"></i>`;
  
  // Update fullscreen player state
  if (state.isPlaying) {
    elements.fullscreenPlayer.classList.add('playing');
  } else {
    elements.fullscreenPlayer.classList.remove('playing');
  }
}

// Play previous
function playPrevious() {
  if (!state.currentSong) return;
  
  const index = state.searchResults.findIndex(t => t.id === state.currentSong);
  if (index > 0) {
    const prevTrack = state.searchResults[index - 1];
    const url = prevTrack.downloadUrl[state.currentQuality].link;
    playSong(url, prevTrack.id);
  }
}

// Play next
function playNext() {
  if (!state.currentSong) return;
  
  const index = state.searchResults.findIndex(t => t.id === state.currentSong);
  if (index < state.searchResults.length - 1) {
    const nextTrack = state.searchResults[index + 1];
    const url = nextTrack.downloadUrl[state.currentQuality].link;
    playSong(url, nextTrack.id);
  }
}

// Update progress
function updateProgress() {
  const currentTime = state.audioElement.currentTime;
  const duration = state.audioElement.duration;
  
  if (!duration) return;
  
  const percent = (currentTime / duration) * 100;
  
  const miniProgressFill = document.getElementById('mini-progress-fill');
  const fullscreenProgressFill = document.getElementById('fullscreen-progress-fill');
  const miniCurrentTime = document.getElementById('mini-current-time');
  const miniTotalTime = document.getElementById('mini-total-time');
  const fullscreenCurrentTime = document.getElementById('fullscreen-current-time');
  const fullscreenTotalTime = document.getElementById('fullscreen-total-time');
  
  if (miniProgressFill) miniProgressFill.style.width = `${percent}%`;
  if (fullscreenProgressFill) fullscreenProgressFill.style.width = `${percent}%`;
  if (miniCurrentTime) miniCurrentTime.textContent = formatDuration(Math.floor(currentTime));
  if (miniTotalTime) miniTotalTime.textContent = formatDuration(Math.floor(duration));
  if (fullscreenCurrentTime) fullscreenCurrentTime.textContent = formatDuration(Math.floor(currentTime));
  if (fullscreenTotalTime) fullscreenTotalTime.textContent = formatDuration(Math.floor(duration));
}

// Seek audio
function seekAudio(event) {
  const progressBar = event.currentTarget;
  const rect = progressBar.getBoundingClientRect();
  const clickX = event.clientX - rect.left;
  const width = rect.width;
  const percent = clickX / width;
  
  if (state.audioElement.duration) {
    state.audioElement.currentTime = percent * state.audioElement.duration;
  }
}

// Open fullscreen player
function openFullscreenPlayer() {
  if (!state.currentSong) return;
  updateFullscreenPlayer();
  elements.fullscreenPlayer.classList.add('active');
}

// Close fullscreen player
function closeFullscreenPlayer() {
  elements.fullscreenPlayer.classList.remove('active');
}

// Add to download
function addToDownload(id) {
  const track = state.searchResults.find(t => t.id === id);
  if (!track) return;
  
  if (state.downloads.find(d => d.id === id)) {
    showMessage('Already in download list', 'error');
    return;
  }
  
  state.downloads.push({ id, status: 'Pending', track });
  updateDownloadBadge();
  renderDownloadList();
  startDownload(id);
  showMessage('Added to downloads', 'success');
}

// Update download badge
function updateDownloadBadge() {
  const count = state.downloads.length;
  const downloadManager = document.querySelector('.download-manager');
  
  // Show/hide download manager based on whether there are any downloads
  if (downloadManager) {
    if (count > 0) {
      downloadManager.classList.add('has-downloads');
    } else {
      downloadManager.classList.remove('has-downloads');
    }
  }
  
  // Update badge count
  if (elements.downloadBadge) {
    if (count > 0) {
      elements.downloadBadge.textContent = count;
      elements.downloadBadge.style.display = 'flex';
    } else {
      elements.downloadBadge.style.display = 'none';
    }
  }
}

// Render download list
function renderDownloadList() {
  if (!elements.downloadList) return;
  
  elements.downloadList.innerHTML = '';
  state.downloads.forEach(download => {
    const item = document.createElement('div');
    item.className = 'download-item';
    
    const imageUrl = download.track.image && download.track.image[1] ? download.track.image[1].link : '';
    
    item.innerHTML = `
      <img src="${imageUrl}" alt="${download.track.name}" class="download-item-image" />
      <div class="download-item-info">
        <div class="download-item-title">${download.track.name}</div>
        <div class="download-item-artist">${download.track.primaryArtists}</div>
      </div>
      <div class="download-status ${download.status.toLowerCase()}">${download.status}</div>
    `;
    
    elements.downloadList.appendChild(item);
  });
}

// Start download
async function startDownload(id) {
  try {
    const response = await fetch(`${DOWNLOAD_API}/add?id=${id}`);
    const data = await response.json();
    
    const download = state.downloads.find(d => d.id === id);
    if (!download) return;
    
    if (data.status === 'success') {
      download.status = 'Downloading';
      renderDownloadList();
      pollDownloadStatus(id);
    } else {
      download.status = 'Error';
      renderDownloadList();
    }
  } catch (error) {
    const download = state.downloads.find(d => d.id === id);
    if (download) {
      download.status = 'Error';
      renderDownloadList();
    }
  }
}

// Poll download status
function pollDownloadStatus(id) {
  const interval = setInterval(async () => {
    try {
      const response = await fetch(`${DOWNLOAD_API}/status?id=${id}`);
      const data = await response.json();
      
      const download = state.downloads.find(d => d.id === id);
      if (!download) {
        clearInterval(interval);
        return;
      }
      
      if (data.status) {
        download.status = data.status;
        renderDownloadList();
        
        if (data.status === 'Done') {
          clearInterval(interval);
          download.url = data.url;
          showMessage('Download completed!', 'success');
        }
      }
    } catch (error) {
      clearInterval(interval);
    }
  }, 3000);
}

// Toggle download popup
function toggleDownloadPopup() {
  if (elements.downloadPopup) {
    elements.downloadPopup.classList.toggle('active');
  }
}

// Load more
function loadMore() {
  state.page++;
  performSearch(state.lastQuery);
}

// Save to search history
function saveToSearchHistory(term) {
  if (!term || term.length < 2) return;
  
  state.searchHistory = state.searchHistory.filter(t => t.toLowerCase() !== term.toLowerCase());
  state.searchHistory.unshift(term);
  
  if (state.searchHistory.length > 10) {
    state.searchHistory = state.searchHistory.slice(0, 10);
  }
  
  localStorage.setItem('searchHistory', JSON.stringify(state.searchHistory));
  updateSearchHistoryUI();
}

// Update search history UI
function updateSearchHistoryUI() {
  // This can be implemented if you want to show search history in the UI
}

// Show message
function showMessage(message, type = 'info') {
  const messageEl = document.createElement('div');
  messageEl.className = `${type}-message slide-up`;
  messageEl.textContent = message;
  
  document.body.appendChild(messageEl);
  
  setTimeout(() => {
    messageEl.remove();
  }, 3000);
}

// Dark Mode Functions
function initializeDarkMode() {
  const themeToggle = document.getElementById('theme-toggle');
  const savedTheme = localStorage.getItem('theme') || 'light';
  
  // Apply saved theme
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);
  
  // Toggle theme on button click
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
      updateThemeIcon(newTheme);
    });
  }
}

function updateThemeIcon(theme) {
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    const icon = themeToggle.querySelector('i');
    if (icon) {
      icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
  }
}

// Improved mobile touch handling
function addMobileTouchHandlers() {
  // Add touch feedback to buttons
  const buttons = document.querySelectorAll('button');
  buttons.forEach(button => {
    button.addEventListener('touchstart', () => {
      button.style.transform = 'scale(0.95)';
    });
    button.addEventListener('touchend', () => {
      button.style.transform = '';
    });
  });
  
  // Improve swipe gestures for fullscreen player
  let touchStartX = 0;
  let touchStartY = 0;
  
  elements.fullscreenPlayer.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  });
  
  elements.fullscreenPlayer.addEventListener('touchend', (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const diffX = touchEndX - touchStartX;
    const diffY = touchEndY - touchStartY;
    
    // Swipe down to close fullscreen player
    if (Math.abs(diffY) > Math.abs(diffX) && diffY > 50) {
      closeFullscreenPlayer();
    }
  });
}

// Initialize mobile handlers
if ('ontouchstart' in window) {
  document.addEventListener('DOMContentLoaded', addMobileTouchHandlers);
}

// Make functions globally accessible for onclick handlers
window.playSong = playSong;
window.addToDownload = addToDownload;

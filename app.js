// ===== MODERN SAVERINO MUSIC PLAYER =====
// Vanilla JavaScript implementation without frameworks

class SaverinoPlayer {
    constructor() {
        // API Configuration
        this.API_BASE = "https://openmp3compiler.astudy.org";
        this.SEARCH_API = "https://jiosaavn-api-privatecvc2.vercel.app/search/songs?query=";
        
        // State Management
        this.state = {
            currentSong: null,
            playlist: [],
            currentIndex: 0,
            isPlaying: false,
            volume: 0.8,
            currentTime: 0,
            duration: 0,
            searchHistory: this.loadSearchHistory(),
            downloadQueue: [],
            theme: localStorage.getItem('theme') || 'dark'
        };
        
        // DOM Elements
        this.elements = {};
        this.initializeElements();
        
        // Initialize the application
        this.init();
    }
    
    // ===== INITIALIZATION =====
    init() {
        this.setupEventListeners();
        this.setupTheme();
        this.setupAudioPlayer();
        this.loadInitialContent();
        this.hideLoader();
    }
    
    initializeElements() {
        // Cache DOM elements for better performance
        this.elements = {
            // Loader
            loader: document.getElementById('loader'),
            
            // Search elements
            searchForm: document.getElementById('searchForm'),
            searchInput: document.getElementById('searchInput'),
            clearBtn: document.getElementById('clearBtn'),
            audioQuality: document.getElementById('audioQuality'),
            searchSuggestions: document.getElementById('searchSuggestions'),
            searchHistory: document.getElementById('searchHistory'),
            historyItems: document.getElementById('historyItems'),
            
            // Results
            resultsTitle: document.getElementById('resultsTitle'),
            resultsInfo: document.getElementById('resultsInfo'),
            songsGrid: document.getElementById('songsGrid'),
            loadMoreBtn: document.getElementById('loadMoreBtn'),
            
            // Audio Player
            audioPlayer: document.getElementById('audioPlayer'),
            audioElement: document.getElementById('audioElement'),
            audioSource: document.getElementById('audioSource'),
            playerImage: document.getElementById('playerImage'),
            playerTitle: document.getElementById('playerTitle'),
            playerArtist: document.getElementById('playerArtist'),
            playerAlbum: document.getElementById('playerAlbum'),
            
            // Player Controls
            playPauseBtn: document.getElementById('playPauseBtn'),
            prevBtn: document.getElementById('prevBtn'),
            nextBtn: document.getElementById('nextBtn'),
            progressBar: document.getElementById('progressBar'),
            progressFill: document.getElementById('progressFill'),
            progressHandle: document.getElementById('progressHandle'),
            currentTime: document.getElementById('currentTime'),
            totalTime: document.getElementById('totalTime'),
            volumeBtn: document.getElementById('volumeBtn'),
            volumeSlider: document.getElementById('volumeSlider'),
            
            // Fullscreen Player
            fullscreenBtn: document.getElementById('fullscreenBtn'),
            fullscreenPlayer: document.getElementById('fullscreenPlayer'),
            closeFullscreen: document.getElementById('closeFullscreen'),
            fullscreenBg: document.getElementById('fullscreenBg'),
            fullscreenImage: document.getElementById('fullscreenImage'),
            fullscreenTitle: document.getElementById('fullscreenTitle'),
            fullscreenArtist: document.getElementById('fullscreenArtist'),
            fullscreenAlbum: document.getElementById('fullscreenAlbum'),
            vinylDisc: document.getElementById('vinylDisc'),
            
            // Fullscreen Controls
            fullscreenPlayPauseBtn: document.getElementById('fullscreenPlayPauseBtn'),
            fullscreenPrevBtn: document.getElementById('fullscreenPrevBtn'),
            fullscreenNextBtn: document.getElementById('fullscreenNextBtn'),
            fullscreenProgressBar: document.getElementById('fullscreenProgressBar'),
            fullscreenProgressFill: document.getElementById('fullscreenProgressFill'),
            fullscreenProgressHandle: document.getElementById('fullscreenProgressHandle'),
            fullscreenCurrentTime: document.getElementById('fullscreenCurrentTime'),
            fullscreenTotalTime: document.getElementById('fullscreenTotalTime'),
            
            // Theme and Downloads
            themeToggle: document.getElementById('themeToggle'),
            downloadBtn: document.getElementById('downloadBtn'),
            downloadCount: document.getElementById('downloadCount'),
            downloadModal: document.getElementById('downloadModal'),
            modalClose: document.getElementById('modalClose'),
            downloadList: document.getElementById('downloadList'),
            
            // Toast Container
            toastContainer: document.getElementById('toastContainer')
        };
    }
    
    setupEventListeners() {
        // Search functionality
        this.elements.searchForm.addEventListener('submit', (e) => this.handleSearch(e));
        this.elements.searchInput.addEventListener('input', (e) => this.handleSearchInput(e));
        this.elements.clearBtn.addEventListener('click', () => this.clearSearch());
        this.elements.audioQuality.addEventListener('change', () => this.handleQualityChange());
        
        // Quick search tags
        document.querySelectorAll('.tag-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleQuickSearch(e));
        });
        
        // Load more
        this.elements.loadMoreBtn.addEventListener('click', () => this.loadMoreSongs());
        
        // Audio player controls
        this.elements.playPauseBtn.addEventListener('click', () => this.togglePlayPause());
        this.elements.prevBtn.addEventListener('click', () => this.previousSong());
        this.elements.nextBtn.addEventListener('click', () => this.nextSong());
        this.elements.volumeSlider.addEventListener('input', (e) => this.setVolume(e.target.value / 100));
        this.elements.volumeBtn.addEventListener('click', () => this.toggleMute());
        
        // Progress bar
        this.elements.progressBar.addEventListener('click', (e) => this.seekTo(e));
        this.elements.fullscreenProgressBar.addEventListener('click', (e) => this.seekTo(e));
        
        // Fullscreen player
        this.elements.fullscreenBtn.addEventListener('click', () => this.openFullscreen());
        this.elements.closeFullscreen.addEventListener('click', () => this.closeFullscreen());
        this.elements.fullscreenPlayPauseBtn.addEventListener('click', () => this.togglePlayPause());
        this.elements.fullscreenPrevBtn.addEventListener('click', () => this.previousSong());
        this.elements.fullscreenNextBtn.addEventListener('click', () => this.nextSong());
        
        // Audio element events
        this.elements.audioElement.addEventListener('loadedmetadata', () => this.updateDuration());
        this.elements.audioElement.addEventListener('timeupdate', () => this.updateProgress());
        this.elements.audioElement.addEventListener('ended', () => this.nextSong());
        this.elements.audioElement.addEventListener('error', () => this.handleAudioError());
        
        // Theme toggle
        this.elements.themeToggle.addEventListener('click', () => this.toggleTheme());
        
        // Download modal
        this.elements.downloadBtn.addEventListener('click', () => this.openDownloadModal());
        this.elements.modalClose.addEventListener('click', () => this.closeDownloadModal());
        this.elements.downloadModal.addEventListener('click', (e) => {
            if (e.target === this.elements.downloadModal) this.closeDownloadModal();
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
        
        // Window events
        window.addEventListener('beforeunload', () => this.saveState());
        window.addEventListener('hashchange', () => this.handleHashChange());
    }
    
    setupAudioPlayer() {
        this.elements.audioElement.volume = this.state.volume;
        this.elements.volumeSlider.value = this.state.volume * 100;
        this.updateVolumeIcon();
    }
    
    // ===== SEARCH FUNCTIONALITY =====
    async handleSearch(e) {
        e.preventDefault();
        const query = this.elements.searchInput.value.trim();
        if (!query) return;
        
        this.addToSearchHistory(query);
        await this.searchSongs(query);
    }
    
    handleSearchInput(e) {
        const value = e.target.value;
        this.elements.clearBtn.classList.toggle('visible', value.length > 0);
        
        // Debounced search suggestions
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            if (value.length > 2) {
                this.showSearchSuggestions(value);
            } else {
                this.hideSearchSuggestions();
            }
        }, 300);
    }
    
    clearSearch() {
        this.elements.searchInput.value = '';
        this.elements.clearBtn.classList.remove('visible');
        this.hideSearchSuggestions();
        this.elements.searchInput.focus();
    }
    
    async searchSongs(query, page = 1, append = false) {
        try {
            this.showLoader();
            this.updateResultsInfo('Suche läuft...');
            
            const response = await fetch(`${this.SEARCH_API}${encodeURIComponent(query)}&page=${page}`);
            const data = await response.json();
            
            if (data.success && data.data.results) {
                const songs = data.data.results;
                
                if (append) {
                    this.state.playlist = [...this.state.playlist, ...songs];
                } else {
                    this.state.playlist = songs;
                    this.elements.resultsTitle.textContent = `Suchergebnisse für "${query}"`;
                }
                
                this.renderSongs(songs, append);
                this.updateResultsInfo(`${this.state.playlist.length} Songs gefunden`);
                
                // Update URL hash
                if (!append) {
                    window.location.hash = query;
                }
            } else {
                this.showToast('Keine Ergebnisse gefunden', 'error');
                this.updateResultsInfo('Keine Ergebnisse');
            }
        } catch (error) {
            console.error('Search error:', error);
            this.showToast('Fehler bei der Suche', 'error');
            this.updateResultsInfo('Fehler bei der Suche');
        } finally {
            this.hideLoader();
        }
    }
    
    handleQuickSearch(e) {
        const query = e.target.dataset.query;
        this.elements.searchInput.value = query;
        this.searchSongs(query);
    }
    
    handleQualityChange() {
        // Re-search with new quality if there's a current search
        const currentQuery = this.elements.searchInput.value.trim();
        if (currentQuery) {
            this.searchSongs(currentQuery);
        }
    }
    
    showSearchSuggestions(query) {
        // Simple suggestions based on search history
        const suggestions = this.state.searchHistory.filter(item => 
            item.toLowerCase().includes(query.toLowerCase())
        );
        
        if (suggestions.length > 0) {
            this.elements.searchSuggestions.innerHTML = suggestions
                .slice(0, 5)
                .map(suggestion => `
                    <div class="suggestion-item" data-query="${suggestion}">
                        ${this.escapeHtml(suggestion)}
                    </div>
                `).join('');
            
            this.elements.searchSuggestions.classList.add('visible');
            
            // Add click listeners
            this.elements.searchSuggestions.querySelectorAll('.suggestion-item').forEach(item => {
                item.addEventListener('click', () => {
                    this.elements.searchInput.value = item.dataset.query;
                    this.searchSongs(item.dataset.query);
                    this.hideSearchSuggestions();
                });
            });
        }
    }
    
    hideSearchSuggestions() {
        this.elements.searchSuggestions.classList.remove('visible');
    }
    
    // ===== SONG RENDERING =====
    renderSongs(songs, append = false) {
        if (!append) {
            this.elements.songsGrid.innerHTML = '';
        }
        
        songs.forEach((song, index) => {
            const songCard = this.createSongCard(song, append ? this.state.playlist.length - songs.length + index : index);
            this.elements.songsGrid.appendChild(songCard);
        });
        
        // Animate new cards
        const newCards = this.elements.songsGrid.querySelectorAll('.song-card:not(.animated)');
        newCards.forEach((card, index) => {
            card.classList.add('animated');
            setTimeout(() => {
                card.classList.add('fade-in');
            }, index * 50);
        });
    }
    
    createSongCard(song, index) {
        const card = document.createElement('div');
        card.className = 'song-card';
        card.innerHTML = `
            <div class="song-artwork">
                <img src="${song.image?.[2]?.link || song.image || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" fill="%23333"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="%23666" font-size="40"%3E♪%3C/text%3E%3C/svg%3E'}" 
                     alt="${song.name}" 
                     loading="lazy"
                     onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"%3E%3Crect width=\"100\" height=\"100\" fill=\"%23333\"/%3E%3Ctext x=\"50\" y=\"50\" text-anchor=\"middle\" dy=\".3em\" fill=\"%23666\" font-size=\"40\"%3E♪%3C/text%3E%3C/svg%3E'">
                <div class="play-overlay">
                    <button class="play-btn" data-index="${index}" aria-label="Song abspielen">
                        <i class="fas fa-play"></i>
                    </button>
                </div>
            </div>
            <div class="song-info">
                <h3 class="song-title">${this.escapeHtml(song.name)}</h3>
                <p class="song-artist">${this.escapeHtml(song.primaryArtists || song.artists?.primary?.[0]?.name || 'Unbekannter Künstler')}</p>
                <p class="song-album">${this.escapeHtml(song.album?.name || song.album || 'Unbekanntes Album')}</p>
            </div>
            <div class="song-actions">
                <button class="action-btn play-action" data-index="${index}" aria-label="Abspielen">
                    <i class="fas fa-play"></i> Abspielen
                </button>
                <button class="action-btn download-action" data-song='${JSON.stringify(song).replace(/'/g, "&apos;")}' aria-label="Download">
                    <i class="fas fa-download"></i> Download
                </button>
            </div>
        `;
        
        // Add event listeners
        const playBtn = card.querySelector('.play-btn');
        const playAction = card.querySelector('.play-action');
        const downloadAction = card.querySelector('.download-action');
        
        playBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.playSong(index);
        });
        
        playAction.addEventListener('click', () => this.playSong(index));
        downloadAction.addEventListener('click', (e) => this.downloadSong(JSON.parse(e.target.dataset.song)));
        
        // Card click to play
        card.addEventListener('click', () => this.playSong(index));
        
        return card;
    }
    
    // ===== AUDIO PLAYER FUNCTIONALITY =====
    async playSong(index) {
        try {
            this.showLoader();
            const song = this.state.playlist[index];
            
            if (!song) {
                this.showToast('Song nicht gefunden', 'error');
                return;
            }
            
            // Get download URL
            const quality = this.elements.audioQuality.value;
            const downloadUrl = await this.getSongDownloadUrl(song.id, quality);
            
            if (!downloadUrl) {
                this.showToast('Song konnte nicht geladen werden', 'error');
                return;
            }
            
            // Update state
            this.state.currentSong = song;
            this.state.currentIndex = index;
            
            // Update UI
            this.updatePlayerUI(song);
            this.updateFullscreenUI(song);
            
            // Load and play audio
            this.elements.audioSource.src = downloadUrl;
            this.elements.audioElement.load();
            
            await this.elements.audioElement.play();
            this.state.isPlaying = true;
            this.updatePlayPauseButtons();
            
            this.showToast(`Spielt: ${song.name}`, 'success');
            
        } catch (error) {
            console.error('Play error:', error);
            this.showToast('Fehler beim Abspielen', 'error');
        } finally {
            this.hideLoader();
        }
    }
    
    async getSongDownloadUrl(songId, quality = '160') {
        try {
            const response = await fetch(`${this.API_BASE}/download?id=${songId}&quality=${quality}`);
            const data = await response.json();
            return data.downloadUrl || data.url;
        } catch (error) {
            console.error('Download URL error:', error);
            return null;
        }
    }
    
    togglePlayPause() {
        if (this.elements.audioElement.paused) {
            this.elements.audioElement.play();
            this.state.isPlaying = true;
        } else {
            this.elements.audioElement.pause();
            this.state.isPlaying = false;
        }
        this.updatePlayPauseButtons();
    }
    
    previousSong() {
        if (this.state.currentIndex > 0) {
            this.playSong(this.state.currentIndex - 1);
        }
    }
    
    nextSong() {
        if (this.state.currentIndex < this.state.playlist.length - 1) {
            this.playSong(this.state.currentIndex + 1);
        }
    }
    
    setVolume(volume) {
        this.state.volume = volume;
        this.elements.audioElement.volume = volume;
        this.updateVolumeIcon();
        localStorage.setItem('volume', volume);
    }
    
    toggleMute() {
        if (this.elements.audioElement.volume > 0) {
            this.elements.audioElement.volume = 0;
            this.elements.volumeSlider.value = 0;
        } else {
            this.elements.audioElement.volume = this.state.volume;
            this.elements.volumeSlider.value = this.state.volume * 100;
        }
        this.updateVolumeIcon();
    }
    
    seekTo(e) {
        const progressBar = e.currentTarget;
        const rect = progressBar.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        const seekTime = percent * this.elements.audioElement.duration;
        this.elements.audioElement.currentTime = seekTime;
    }
    
    // ===== SEARCH FUNCTIONALITY =====
    async handleSearch(e) {
        e.preventDefault();
        const query = this.elements.searchInput.value.trim();
        if (!query) return;
        
        this.addToSearchHistory(query);
        await this.searchSongs(query);
    }
    
    handleSearchInput(e) {
        const value = e.target.value;
        this.elements.clearBtn.classList.toggle('visible', value.length > 0);
        
        // Debounced search suggestions
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            if (value.length > 2) {
                this.showSearchSuggestions(value);
            } else {
                this.hideSearchSuggestions();
            }
        }, 300);
    }
    
    clearSearch() {
        this.elements.searchInput.value = '';
        this.elements.clearBtn.classList.remove('visible');
        this.hideSearchSuggestions();
        this.elements.searchInput.focus();
    }
    
    async searchSongs(query, page = 1, append = false) {
        try {
            this.showLoader();
            this.updateResultsInfo('Suche läuft...');
            
            const response = await fetch(`${this.SEARCH_API}${encodeURIComponent(query)}&page=${page}`);
            const data = await response.json();
            
            if (data.success && data.data.results) {
                const songs = data.data.results;
                
                if (append) {
                    this.state.playlist = [...this.state.playlist, ...songs];
                } else {
                    this.state.playlist = songs;
                    this.elements.resultsTitle.textContent = `Suchergebnisse für "${query}"`;
                }
                
                this.renderSongs(songs, append);
                this.updateResultsInfo(`${this.state.playlist.length} Songs gefunden`);
                
                // Update URL hash
                if (!append) {
                    window.location.hash = query;
                }
            } else {
                this.showToast('Keine Ergebnisse gefunden', 'error');
                this.updateResultsInfo('Keine Ergebnisse');
            }
        } catch (error) {
            console.error('Search error:', error);
            this.showToast('Fehler bei der Suche', 'error');
            this.updateResultsInfo('Fehler bei der Suche');
        } finally {
            this.hideLoader();
        }
    }
    
    handleQuickSearch(e) {
        const query = e.target.dataset.query;
        this.elements.searchInput.value = query;
        this.searchSongs(query);
    }
    
    handleQualityChange() {
        // Re-search with new quality if there's a current search
        const currentQuery = this.elements.searchInput.value.trim();
        if (currentQuery) {
            this.searchSongs(currentQuery);
        }
    }
    
    showSearchSuggestions(query) {
        // Simple suggestion implementation
        this.elements.searchSuggestions.innerHTML = '';
        this.elements.searchSuggestions.classList.add('visible');
    }
    
    hideSearchSuggestions() {
        this.elements.searchSuggestions.classList.remove('visible');
    }
    
    // ===== SONG RENDERING =====
    renderSongs(songs, append = false) {
        if (!append) {
            this.elements.songsGrid.innerHTML = '';
        }
        
        songs.forEach((song, index) => {
            const songCard = this.createSongCard(song, append ? this.state.playlist.length - songs.length + index : index);
            this.elements.songsGrid.appendChild(songCard);
        });
        
        // Animate new cards
        const newCards = this.elements.songsGrid.querySelectorAll('.song-card:not(.animated)');
        newCards.forEach((card, index) => {
            card.classList.add('animated');
            setTimeout(() => {
                card.classList.add('fade-in');
            }, index * 50);
        });
    }
    
    createSongCard(song, index) {
        const card = document.createElement('div');
        card.className = 'song-card';
        card.innerHTML = `
            <div class="song-artwork">
                <img src="${song.image?.[2]?.link || song.image || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" fill="%23333"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="%23666" font-size="40"%3E♪%3C/text%3E%3C/svg%3E'}" 
                     alt="${song.name}" 
                     loading="lazy"
                     onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"%3E%3Crect width=\"100\" height=\"100\" fill=\"%23333\"/%3E%3Ctext x=\"50\" y=\"50\" text-anchor=\"middle\" dy=\".3em\" fill=\"%23666\" font-size=\"40\"%3E♪%3C/text%3E%3C/svg%3E'">
                <div class="play-overlay">
                    <button class="play-btn" data-index="${index}" aria-label="Song abspielen">
                        <i class="fas fa-play"></i>
                    </button>
                </div>
            </div>
            <div class="song-info">
                <h3 class="song-title">${this.escapeHtml(song.name)}</h3>
                <p class="song-artist">${this.escapeHtml(song.primaryArtists || song.artists?.primary?.[0]?.name || 'Unbekannter Künstler')}</p>
                <p class="song-album">${this.escapeHtml(song.album?.name || song.album || 'Unbekanntes Album')}</p>
            </div>
            <div class="song-actions">
                <button class="action-btn play-action" data-index="${index}" aria-label="Abspielen">
                    <i class="fas fa-play"></i> Abspielen
                </button>
                <button class="action-btn download-action" data-song='${JSON.stringify(song).replace(/'/g, "&apos;")}' aria-label="Download">
                    <i class="fas fa-download"></i> Download
                </button>
            </div>
        `;
        
        // Add event listeners
        const playBtn = card.querySelector('.play-btn');
        const playAction = card.querySelector('.play-action');
        const downloadAction = card.querySelector('.download-action');
        
        playBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.playSong(index);
        });
        
        playAction.addEventListener('click', () => this.playSong(index));
        downloadAction.addEventListener('click', (e) => this.downloadSong(JSON.parse(e.target.dataset.song)));
        
        // Card click to play
        card.addEventListener('click', () => this.playSong(index));
        
        return card;
    }
    
    // ===== AUDIO PLAYER FUNCTIONALITY =====
    async playSong(index) {
        try {
            this.showLoader();
            const song = this.state.playlist[index];
            
            if (!song) {
                this.showToast('Song nicht gefunden', 'error');
                return;
            }
            
            // Get download URL
            const quality = this.elements.audioQuality.value;
            const downloadUrl = await this.getSongDownloadUrl(song.id, quality);
            
            if (!downloadUrl) {
                this.showToast('Song konnte nicht geladen werden', 'error');
                return;
            }
            
            // Update state
            this.state.currentSong = song;
            this.state.currentIndex = index;
            
            // Update UI
            this.updatePlayerUI(song);
            this.updateFullscreenUI(song);
            
            // Load and play audio
            this.elements.audioSource.src = downloadUrl;
            this.elements.audioElement.load();
            
            await this.elements.audioElement.play();
            this.state.isPlaying = true;
            this.updatePlayPauseButtons();
            
            this.showToast(`Spielt: ${song.name}`, 'success');
            
        } catch (error) {
            console.error('Play error:', error);
            this.showToast('Fehler beim Abspielen', 'error');
        } finally {
            this.hideLoader();
        }
    }
    
    async getSongDownloadUrl(songId, quality = '160') {
        try {
            const response = await fetch(`${this.API_BASE}/download?id=${songId}&quality=${quality}`);
            const data = await response.json();
            return data.downloadUrl || data.url;
        } catch (error) {
            console.error('Download URL error:', error);
            return null;
        }
    }
    
    togglePlayPause() {
        if (this.elements.audioElement.paused) {
            this.elements.audioElement.play();
            this.state.isPlaying = true;
        } else {
            this.elements.audioElement.pause();
            this.state.isPlaying = false;
        }
        this.updatePlayPauseButtons();
    }
    
    previousSong() {
        if (this.state.currentIndex > 0) {
            this.playSong(this.state.currentIndex - 1);
        }
    }
    
    nextSong() {
        if (this.state.currentIndex < this.state.playlist.length - 1) {
            this.playSong(this.state.currentIndex + 1);
        }
    }
    
    setVolume(volume) {
        this.state.volume = volume;
        this.elements.audioElement.volume = volume;
        this.updateVolumeIcon();
        localStorage.setItem('volume', volume);
    }
    
    toggleMute() {
        if (this.elements.audioElement.volume > 0) {
            this.elements.audioElement.volume = 0;
            this.elements.volumeSlider.value = 0;
        } else {
            this.elements.audioElement.volume = this.state.volume;
            this.elements.volumeSlider.value = this.state.volume * 100;
        }
        this.updateVolumeIcon();
    }
    
    seekTo(e) {
        const progressBar = e.currentTarget;
        const rect = progressBar.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        const seekTime = percent * this.elements.audioElement.duration;
        this.elements.audioElement.currentTime = seekTime;
    }
    
    // ===== UI UPDATES =====
    updatePlayerUI(song) {
        this.elements.playerImage.src = song.image?.[2]?.link || song.image || this.elements.playerImage.src;
        this.elements.playerTitle.textContent = song.name;
        this.elements.playerArtist.textContent = song.primaryArtists || song.artists?.primary?.[0]?.name || 'Unbekannter Künstler';
        this.elements.playerAlbum.textContent = song.album?.name || song.album || 'Unbekanntes Album';
    }
    
    updateFullscreenUI(song) {
        const imageUrl = song.image?.[2]?.link || song.image;
        this.elements.fullscreenImage.src = imageUrl || '';
        this.elements.fullscreenBg.style.backgroundImage = imageUrl ? `url(${imageUrl})` : '';
        this.elements.fullscreenTitle.textContent = song.name;
        this.elements.fullscreenArtist.textContent = song.primaryArtists || song.artists?.primary?.[0]?.name || 'Unbekannter Künstler';
        this.elements.fullscreenAlbum.textContent = song.album?.name || song.album || 'Unbekanntes Album';
    }
    
    updatePlayPauseButtons() {
        const icon = this.state.isPlaying ? 'fa-pause' : 'fa-play';
        this.elements.playPauseBtn.querySelector('i').className = `fas ${icon}`;
        this.elements.fullscreenPlayPauseBtn.querySelector('i').className = `fas ${icon}`;
        
        // Update vinyl animation
        this.elements.vinylDisc.classList.toggle('playing', this.state.isPlaying);
    }
    
    updateProgress() {
        const current = this.elements.audioElement.currentTime;
        const duration = this.elements.audioElement.duration;
        
        if (duration) {
            const percent = (current / duration) * 100;
            this.elements.progressFill.style.width = `${percent}%`;
            this.elements.fullscreenProgressFill.style.width = `${percent}%`;
            this.elements.progressHandle.style.left = `${percent}%`;
            this.elements.fullscreenProgressHandle.style.left = `${percent}%`;
        }
        
        this.elements.currentTime.textContent = this.formatTime(current);
        this.elements.fullscreenCurrentTime.textContent = this.formatTime(current);
    }
    
    updateDuration() {
        const duration = this.elements.audioElement.duration;
        this.elements.totalTime.textContent = this.formatTime(duration);
        this.elements.fullscreenTotalTime.textContent = this.formatTime(duration);
    }
    
    updateVolumeIcon() {
        const volume = this.elements.audioElement.volume;
        let icon = 'fa-volume-up';
        if (volume === 0) icon = 'fa-volume-mute';
        else if (volume < 0.5) icon = 'fa-volume-down';
        
        this.elements.volumeBtn.querySelector('i').className = `fas ${icon}`;
    }
    
    updateResultsInfo(text) {
        this.elements.resultsInfo.textContent = text;
    }
    
    // ===== FULLSCREEN PLAYER =====
    openFullscreen() {
        this.elements.fullscreenPlayer.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    closeFullscreen() {
        this.elements.fullscreenPlayer.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    // ===== DOWNLOAD FUNCTIONALITY =====
    async downloadSong(song) {
        try {
            this.showLoader();
            const quality = this.elements.audioQuality.value;
            const downloadUrl = await this.getSongDownloadUrl(song.id, quality);
            
            if (downloadUrl) {
                // Add to download queue
                this.state.downloadQueue.push({
                    song,
                    url: downloadUrl,
                    timestamp: Date.now()
                });
                
                this.updateDownloadCount();
                this.showToast(`Download gestartet: ${song.name}`, 'success');
                
                // Create download link
                const a = document.createElement('a');
                a.href = downloadUrl;
                a.download = `${song.name} - ${song.primaryArtists || 'Unknown'}.mp3`;
                a.click();
            } else {
                this.showToast('Download-Link konnte nicht erstellt werden', 'error');
            }
        } catch (error) {
            console.error('Download error:', error);
            this.showToast('Fehler beim Download', 'error');
        } finally {
            this.hideLoader();
        }
    }
    
    updateDownloadCount() {
        this.elements.downloadCount.textContent = this.state.downloadQueue.length;
        this.elements.downloadCount.style.display = this.state.downloadQueue.length > 0 ? 'flex' : 'none';
    }
    
    openDownloadModal() {
        this.renderDownloadList();
        this.elements.downloadModal.classList.add('active');
    }
    
    closeDownloadModal() {
        this.elements.downloadModal.classList.remove('active');
    }
    
    renderDownloadList() {
        this.elements.downloadList.innerHTML = '';
        
        if (this.state.downloadQueue.length === 0) {
            this.elements.downloadList.innerHTML = '<p class="text-center">Keine Downloads vorhanden</p>';
            return;
        }
        
        this.state.downloadQueue.forEach((item, index) => {
            const downloadItem = document.createElement('div');
            downloadItem.className = 'download-item';
            downloadItem.innerHTML = `
                <div class="download-info">
                    <h4>${this.escapeHtml(item.song.name)}</h4>
                    <p>${this.escapeHtml(item.song.primaryArtists || 'Unknown Artist')}</p>
                </div>
                <button class="action-btn" onclick="player.removeFromDownloadQueue(${index})">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            this.elements.downloadList.appendChild(downloadItem);
        });
    }
    
    removeFromDownloadQueue(index) {
        this.state.downloadQueue.splice(index, 1);
        this.updateDownloadCount();
        this.renderDownloadList();
    }
    
    // ===== SEARCH HISTORY =====
    addToSearchHistory(query) {
        const history = this.state.searchHistory.filter(item => item !== query);
        history.unshift(query);
        this.state.searchHistory = history.slice(0, 10); // Keep only last 10 searches
        this.saveSearchHistory();
        this.renderSearchHistory();
    }
    
    renderSearchHistory() {
        if (this.state.searchHistory.length === 0) {
            this.elements.searchHistory.classList.remove('visible');
            return;
        }
        
        this.elements.historyItems.innerHTML = '';
        this.state.searchHistory.forEach(query => {
            const item = document.createElement('button');
            item.className = 'history-item';
            item.textContent = query;
            item.addEventListener('click', () => {
                this.elements.searchInput.value = query;
                this.searchSongs(query);
            });
            this.elements.historyItems.appendChild(item);
        });
        
        this.elements.searchHistory.classList.add('visible');
    }
    
    loadSearchHistory() {
        try {
            return JSON.parse(localStorage.getItem('searchHistory')) || [];
        } catch {
            return [];
        }
    }
    
    saveSearchHistory() {
        localStorage.setItem('searchHistory', JSON.stringify(this.state.searchHistory));
    }
    
    // ===== THEME MANAGEMENT =====
    setupTheme() {
        document.documentElement.setAttribute('data-theme', this.state.theme);
        this.updateThemeIcon();
    }
    
    toggleTheme() {
        this.state.theme = this.state.theme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', this.state.theme);
        localStorage.setItem('theme', this.state.theme);
        this.updateThemeIcon();
        this.showToast(`${this.state.theme === 'dark' ? 'Dunkles' : 'Helles'} Theme aktiviert`, 'success');
    }
    
    updateThemeIcon() {
        const icon = this.state.theme === 'dark' ? 'fa-sun' : 'fa-moon';
        this.elements.themeToggle.querySelector('i').className = `fas ${icon}`;
    }
    
    // ===== UTILITY FUNCTIONS =====
    formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    showLoader() {
        this.elements.loader.classList.remove('hidden');
    }
    
    hideLoader() {
        this.elements.loader.classList.add('hidden');
    }
    
    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check' : type === 'error' ? 'fa-exclamation-triangle' : 'fa-info'}"></i>
            <span>${message}</span>
        `;
        
        this.elements.toastContainer.appendChild(toast);
        
        // Show toast
        setTimeout(() => toast.classList.add('show'), 100);
        
        // Remove toast
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
    
    // ===== KEYBOARD SHORTCUTS =====
    handleKeyboardShortcuts(e) {
        // Prevent shortcuts when typing in input fields
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        
        switch (e.code) {
            case 'Space':
                e.preventDefault();
                this.togglePlayPause();
                break;
            case 'ArrowLeft':
                e.preventDefault();
                this.previousSong();
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.nextSong();
                break;
            case 'Escape':
                if (this.elements.fullscreenPlayer.classList.contains('active')) {
                    this.closeFullscreen();
                }
                break;
            case 'KeyF':
                if (this.state.currentSong) {
                    this.openFullscreen();
                }
                break;
        }
    }
    
    // ===== LOAD MORE FUNCTIONALITY =====
    loadMoreSongs() {
        const currentQuery = this.elements.searchInput.value.trim();
        if (currentQuery) {
            const currentPage = Math.ceil(this.state.playlist.length / 20) + 1;
            this.searchSongs(currentQuery, currentPage, true);
        }
    }
    
    // ===== INITIAL CONTENT =====
    async loadInitialContent() {
        // Load trending songs or default content
        await this.searchSongs('trending');
        this.renderSearchHistory();
        
        // Restore volume
        const savedVolume = localStorage.getItem('volume');
        if (savedVolume) {
            this.setVolume(parseFloat(savedVolume));
            this.elements.volumeSlider.value = parseFloat(savedVolume) * 100;
        }
        
        // Handle URL hash
        if (window.location.hash) {
            const query = decodeURIComponent(window.location.hash.substring(1));
            this.elements.searchInput.value = query;
            await this.searchSongs(query);
        }
    }
    
    handleHashChange() {
        if (window.location.hash) {
            const query = decodeURIComponent(window.location.hash.substring(1));
            this.elements.searchInput.value = query;
            this.searchSongs(query);
        }
    }
    
    // ===== AUDIO ERROR HANDLING =====
    handleAudioError() {
        this.showToast('Fehler beim Laden des Songs', 'error');
        this.state.isPlaying = false;
        this.updatePlayPauseButtons();
    }
    
    // ===== STATE MANAGEMENT =====
    saveState() {
        const state = {
            volume: this.state.volume,
            theme: this.state.theme,
            searchHistory: this.state.searchHistory
        };
        localStorage.setItem('saverinoState', JSON.stringify(state));
    }
}

// ===== INITIALIZE APPLICATION =====
let player;

document.addEventListener('DOMContentLoaded', () => {
    player = new SaverinoPlayer();
});

// ===== GLOBAL FUNCTIONS FOR COMPATIBILITY =====
window.player = player;

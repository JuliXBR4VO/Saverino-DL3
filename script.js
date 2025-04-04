// Constants and Global Variables
const DOWNLOAD_API = "https://openmp3compiler.astudy.org";
const searchUrl = "https://jiosaavn-api-privatecvc2.vercel.app/search/songs?query=";
var results_container = document.querySelector("#saavn-results");
var results_objects = {};
var page_index = 1;
var lastSearch = '';  // Added lastSearch variable

// Audio Player Functions
function PlayAudio(audio_url, song_id) {
    var audio = document.getElementById('player');
    var source = document.getElementById('audioSource');
    source.src = audio_url;
    var name = document.getElementById(song_id+"-n").textContent;
    var album = document.getElementById(song_id+"-a").textContent;
    var artist = document.getElementById(song_id+"-ar").textContent;
    var image = document.getElementById(song_id+"-i").getAttribute("data-src") || document.getElementById(song_id+"-i").getAttribute("src");
    
    document.title = name+" - "+album;
    var bitrate = document.getElementById('saavn-bitrate');
    var bitrate_i = bitrate.options[bitrate.selectedIndex].value;
    var quality = bitrate_i == 4 ? 320 : 160;

    // Update mini player
    document.getElementById("player-name").innerHTML = name;
    document.getElementById("player-album").innerHTML = album + " - " + artist;
    
    // Handle player image with lazy loading
    var playerImage = document.getElementById("player-image");
    playerImage.setAttribute("data-src", image);
    playerImage.src = image;
    playerImage.classList.add("loaded");
    var placeholder = playerImage.parentNode.querySelector('.image-placeholder');
    if (placeholder) {
        placeholder.style.opacity = '0';
    }

    // Update fullscreen player
    var fullscreenCover = document.querySelector(".fullscreen-cover");
    var fullscreenTitle = document.querySelector(".fullscreen-title");
    var fullscreenArtist = document.querySelector(".fullscreen-artist");
    var fullscreenAlbum = document.querySelector(".fullscreen-album");
    var fullscreenBg = document.querySelector(".fullscreen-bg");
    
    if (fullscreenCover) {
        fullscreenCover.src = image;
        fullscreenTitle.textContent = name;
        fullscreenArtist.textContent = artist;
        fullscreenAlbum.textContent = album;
        fullscreenBg.style.backgroundImage = "url('" + image + "')";
    }

    var promise = audio.load();
    if (promise) {
        promise.catch(function(error) { console.error(error); });
    }
    audio.play();
}

// Search Functions
function SaavnSearch() {
    event.preventDefault();
    var query = document.querySelector("#saavn-search-box").value.trim();
    query = encodeURIComponent(query);

    if(query == lastSearch) {
        doSaavnSearch(query);
    }
    window.location.hash = query.length > 0 ? query : lastSearch;
}

function searchSong(search_term) {
    document.getElementById('search-box').value = search_term;
    document.getElementById("search-trigger").click();
}

async function doSaavnSearch(query, NotScroll, page) {
    window.location.hash = query;
    document.querySelector("#saavn-search-box").value = decodeURIComponent(query);
    if(!query) return 0;

    results_container.innerHTML = '<span class="loader">Searching</span>';
    query = query + "&limit=40";
    
    if(page) {
        page_index = page_index + 1;
        query = query + "&page=" + page_index;
    } else {
        query = query + "&page=1";
        page_index = 1;
    }
    
    try {
        var response = await fetch(searchUrl + query);
        var json = await response.json();
        
        if (response.status !== 200) {
            results_container.innerHTML = `<span class="error">Error: ${json.message}</span>`;
            console.log(response);
            return 0;
        }

        var json = json.data.results;
        if(!json) {
            results_container.innerHTML = "<p>No result found. Try other Library</p>";
            return;
        }

        lastSearch = decodeURI(window.location.hash.substring(1));
        var results = [];

        for(let track of json) {
            song_name = TextAbstract(track.name, 25);
            album_name = TextAbstract(track.album.name, 20);
            if (track.album.name == track.name) album_name = "";
            
            var measuredTime = new Date(null);
            measuredTime.setSeconds(track.duration);
            var play_time = measuredTime.toISOString().substr(11, 8);
            if (play_time.startsWith("00:0")) play_time = play_time.slice(4);
            if (play_time.startsWith("00:")) play_time = play_time.slice(3);
            
            var song_id = track.id;
            var year = track.year;
            var song_image = track.image[1].link;
            var song_artist = TextAbstract(track.primaryArtists, 30);
            var bitrate = document.getElementById('saavn-bitrate');
            var bitrate_i = bitrate.options[bitrate.selectedIndex].value;
            
            if(track.downloadUrl) {
                var download_url = track.downloadUrl[bitrate_i]['link'];
                results_objects[song_id] = { track: track };
                
                results.push(generateSongCard(song_id, song_name, song_artist, album_name, year, play_time, song_image, download_url));
            }
        }
        
        results_container.innerHTML = results.join(' ');
        
        // Force load all images after adding them to DOM
        const allImages = document.querySelectorAll('.lazy-image');
        allImages.forEach(img => {
            const src = img.getAttribute('data-src');
            if (src) {
                img.src = src;
                img.onload = function() {
                    img.classList.add('loaded');
                    const placeholder = img.parentNode.querySelector('.image-placeholder');
                    if (placeholder) {
                        placeholder.style.opacity = '0';
                    }
                };
            }
        });
        
        if(!NotScroll) {
            document.getElementById("saavn-results").scrollIntoView();
        }
    } catch(error) {
        results_container.innerHTML = `<span class="error">Error: ${error} <br> Check if API is down </span>`;
    }
}

// Download Functions
function AddDownload(id) {
    var bitrate = document.getElementById('saavn-bitrate');
    var bitrate_i = bitrate.options[bitrate.selectedIndex].value;
    var MP3DL = DOWNLOAD_API+"/add?id="+id;
    
    fetch(MP3DL)
        .then(response => response.json())
        .then(data => {
            if (data.status == "success") {
                addToDownloadList(id, data);
                updateDownloadStatus(id);
            }
        });
}

// Helper Functions
function TextAbstract(text, length) {
    if (!text) return "";
    if (text.length <= length) return text;
    
    text = text.substring(0, length);
    return text.substring(0, text.lastIndexOf(" ")) + "...";
}

function generateSongCard(id, name, artist, album, year, duration, image, downloadUrl) {
    return `
        <div class="song-card" data-song-id="${id}">
            <div class="song-image-container">
                <div class="image-placeholder">
                    <i class="fas fa-music"></i>
                </div>
                <img class="lazy-image song-cover" id="${id}-i" 
                     data-src="${image}" 
                     src="${image}"
                     alt="${name}">
                <div class="song-overlay">
                    <button class="play-btn" onclick='PlayAudio("${downloadUrl}","${id}")'>
                        <i class="fas fa-play"></i>
                    </button>
                    <button class="download-btn" onclick='AddDownload("${id}")'>
                        <i class="fas fa-download"></i>
                    </button>
                </div>
            </div>
            <div class="song-info">
                <h3 class="song-name" id="${id}-n">${name}</h3>
                <p class="song-artist" id="${id}-ar">${artist}</p>
                <p class="song-album" id="${id}-a">${album}</p>
                <div class="song-meta">
                    <span class="song-year">${year}</span>
                    <span class="song-duration">${duration}</span>
                </div>
            </div>
        </div>
    `;
}

function addToDownloadList(id, data) {
    var download_list = document.getElementById("download-list");
    var download_item = document.createElement("li");
    
    download_item.innerHTML = `
        <div class="col">
            <img class="track-img" src="${data.image}" width="50px">
            <div style="display: inline;">
                <span class="track-name">${results_objects[id].track.name}</span> - 
                <span class="track-album">${results_objects[id].track.album.name}</span>
                <br>
                <span class="track-size">Size: Null</span>
                <span class="track-status" style="color:green">${data.status}</span>
            </div>
        </div>
        <hr>
    `;
    
    download_item.setAttribute("track_tag", id);
    download_item.className = "no-bullets";
    download_list.appendChild(download_item);
    
    // Visual feedback on download button
    var float_tap = document.getElementById('mpopupLink');
    float_tap.style.backgroundColor = "green";
    float_tap.style.borderColor = "green";
    setTimeout(() => {
        float_tap.style.backgroundColor = "#007bff";
        float_tap.style.borderColor = "#007bff";
    }, 1000);
}

function updateDownloadStatus(id) {
    var STATUS_URL = DOWNLOAD_API+"/status?id="+id;
    var download_status_span = document.querySelector(`[track_tag="${id}"] .track-status`);
    var download_size = document.querySelector(`[track_tag="${id}"] .track-size`);
    
    var interval = setInterval(() => {
        fetch(STATUS_URL)
            .then(response => response.json())
            .then(data => {
                if (data.status) {
                    download_status_span.textContent = data.status;
                    if(data.size) {
                        download_size.textContent = "Size: "+data.size;
                    }
                    if (data.status == "Done") {
                        download_status_span.innerHTML = `<a href="${DOWNLOAD_API}${data.url}" target="_blank">Download MP3</a>`;
                        clearInterval(interval);
                    }
                }
            });
    }, 3000);
}

// Event Listeners
if(window.location.hash) {
    doSaavnSearch(window.location.hash.substring(1));
} else {
    doSaavnSearch('english', 1);
}

addEventListener('hashchange', () => {
    doSaavnSearch(window.location.hash.substring(1));
});

// Wrap jQuery dependent code in document.ready
$(document).ready(function() {
    $('#saavn-bitrate').on('change', () => {
        doSaavnSearch(lastSearch);
    });
});

document.getElementById("loadmore").addEventListener('click', () => {
    var query = document.querySelector("#saavn-search-box").value.trim();
    if (!query) query = lastSearch;
    query = encodeURIComponent(query);
    doSaavnSearch(query, 0, true);
});
// Import admin functions
import { isAdmin, getAdminSettings, setAdminPlaylist, setPlaylistEnforcement, getActiveAdminPlaylist } from './admin.js';

let startupValue = '';
let startupID = '';
let newPage = false; 
let chosen = false; 

// DOM element references
const button = document.getElementById('button');
const select = document.getElementById('select');
const textarea = document.querySelector('textarea');
const adminMessage = document.getElementById('admin-message');
const statusMessage = document.getElementById('status-message');
const userInfoElement = document.getElementById('user-info');
const adminPanelLink = document.getElementById('admin-panel-link');
const adminBanner = document.getElementById('admin-banner');
const adminSettings = document.getElementById('admin-settings');
const playlistInfo = document.getElementById('playlist-info');

// Initialize the app
function init() {
    setupEventListeners();
    setupUserInfo();
    checkAdminStatus();
    checkAdminPlaylist();
}

// Set up event listeners
function setupEventListeners() {
    button.addEventListener("click", handleButtonClick);
    select.addEventListener("change", handleSelectChange);
    textarea.addEventListener('keydown', handleTextareaKeydown);
    
    // Admin settings event listeners
    document.addEventListener('DOMContentLoaded', () => {
        const saveButton = document.getElementById('save-default-playlist');
        if (saveButton) {
            saveButton.addEventListener('click', saveDefaultPlaylist);
        }
    });
}

// Button click handler
function handleButtonClick() {
    if (newPage) return;
    
    startupValue = parseInt(select.value); 
    startupID = textarea.value; 

    if ((startupValue > 0 && startupID.length > 0) || startupValue == 6 || startupValue == 7) {
        newPage = true; 
        localStorage.setItem("value", startupValue);
        localStorage.setItem("id", startupID);
        window.location.href = "/views/index.html";
    }
}

// Select change handler
function handleSelectChange() {
    if (newPage) return;
    
    if (!chosen) {
        select.style.color = "#ddd";
        chosen = true;
    }

    textarea.value = "";
    textarea.disabled = false; 

    if (select.value == 1) {
        textarea.placeholder = "Enter artist by name";
    } else if (select.value == 2) {
        textarea.placeholder = "Enter artist by id"; 
    } else if (select.value == 3) {
        textarea.placeholder = "Enter the playlist id";
    } else if (select.value == 4) {
        textarea.placeholder = "Enter the album id";
    } else if (select.value == 5) {
        textarea.placeholder = "Enter the track id";
    } else {
        textarea.placeholder = "";
        textarea.disabled = true; 
    }
}

// Textarea keydown handler
function handleTextareaKeydown(e) {
    if (e.key == "Enter") {
        e.preventDefault();
        button.click();
    }
}

// Setup user information
function setupUserInfo() {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    
    if (userData.id) {
        userInfoElement.innerHTML = `
            <p>Logged in as: <strong>${userData.display_name || userData.id}</strong></p>
            <p>Account type: ${userData.product || 'unknown'}</p>
        `;
    } else {
        userInfoElement.innerHTML = `<p>Not logged in yet</p>`;
        adminPanelLink.style.display = 'none';
    }
}

// Check admin status and setup admin UI if needed
function checkAdminStatus() {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    
    if (!userData.id) return;
    
    const isUserAdmin = isAdmin(userData.id);
    
    if (isUserAdmin) {
        // Show admin panel link and banner
        adminPanelLink.style.display = 'block';
        adminBanner.style.display = 'block';
        
        // Show admin settings section
        setupAdminSettings(userData.id);
    } else {
        adminPanelLink.style.display = 'none';
        adminBanner.style.display = 'none';
        adminSettings.style.display = 'none';
    }
}

// Setup admin settings panel
function setupAdminSettings(userId) {
    adminSettings.style.display = 'block';
    
    const adminUserSettings = getAdminSettings(userId);
    const isEnforced = adminUserSettings.restricted;
    const currentPlaylistId = adminUserSettings.playlistId || '';
    
    // Set initial values
    document.getElementById('default-playlist-id').value = currentPlaylistId;
    document.getElementById('enforce-playlist').checked = isEnforced;
}

// Save default playlist settings
function saveDefaultPlaylist() {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    if (!userData.id || !isAdmin(userData.id)) return;
    
    const playlistId = document.getElementById('default-playlist-id').value.trim();
    const enforcePlaylist = document.getElementById('enforce-playlist').checked;
    const playlistStatusElem = document.getElementById('playlist-status');
    
    if (!playlistId) {
        playlistStatusElem.textContent = 'Please enter a valid playlist ID';
        playlistStatusElem.style.color = '#e84545';
        return;
    }
    
    // Save playlist ID
    setAdminPlaylist(userData.id, playlistId);
    
    // Set enforcement
    setPlaylistEnforcement(userData.id, enforcePlaylist);
    
    // Show confirmation
    playlistStatusElem.textContent = 'Default playlist saved! ' + 
        (enforcePlaylist ? 'It will be used for all non-admin users.' : 'Enforcement is disabled.');
    playlistStatusElem.style.color = '#1DB954';
    
    // Fetch playlist details to display the name
    fetchPlaylistDetails(playlistId, playlistStatusElem);
}

// Fetch playlist details from Spotify API
function fetchPlaylistDetails(playlistId, statusElement) {
    const token = localStorage.getItem('access_token');
    if (!token) return;
    
    fetch(`https://api.spotify.com/v1/playlists/${playlistId}`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        if (!response.ok) throw new Error('Failed to fetch playlist');
        return response.json();
    })
    .then(data => {
        if (statusElement) {
            statusElement.textContent += ` Playlist name: "${data.name}"`;
        }
        
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        if (userData.id) {
            setAdminPlaylist(userData.id, playlistId, data.name);
        }
        
        // Show playlist info
        displayPlaylistInfo(data);
    })
    .catch(error => {
        console.error('Error fetching playlist:', error);
        if (statusElement) {
            statusElement.textContent += ' (Could not fetch playlist name)';
        }
    });
}

// Display playlist information
function displayPlaylistInfo(playlistData) {
    if (!playlistData) return;
    
    playlistInfo.innerHTML = `
        <p style="margin: 0;">Playlist: <strong>${playlistData.name}</strong></p>
        <p style="margin: 5px 0 0 0; font-size: 12px;">By: ${playlistData.owner.display_name}</p>
    `;
    playlistInfo.style.display = 'block';
}

// Check for any admin-enforced playlist
function checkAdminPlaylist() {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    const adminSettings = JSON.parse(localStorage.getItem('adminSettings') || '{}');
    const isUserAdmin = userData.id && isAdmin(userData.id.toLowerCase());
    
    // Find if there's an admin with a restricted playlist
    let enforcedPlaylist = null;
    Object.keys(adminSettings).forEach(admin => {
        if (adminSettings[admin].restricted && adminSettings[admin].playlistId) {
            enforcedPlaylist = adminSettings[admin].playlistId;
        }
    });
    
    // Handle admin with enforced settings
    if (isUserAdmin) {
        const adminUserSettings = getAdminSettings(userData.id.toLowerCase());
        
        if (adminUserSettings && adminUserSettings.restricted && adminUserSettings.playlistId) {
            statusMessage.textContent = '⚠️ Your default playlist is currently enforced for all users';
            adminMessage.style.display = 'block';
            
            // Fetch and display the playlist details
            fetchPlaylistDetails(adminUserSettings.playlistId);
        }
    }
    
    // For non-admin users, handle enforced playlist
    if (enforcedPlaylist && !isUserAdmin) {
        // Handle enforced playlist for regular users
        // This would disable other options and automatically select the enforced playlist
    }
}

// Initialize the app
init();

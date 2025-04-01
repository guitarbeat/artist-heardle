/**
 * Admin configuration for Artist Heardle
 * 
 * This file contains settings for admin users and their restricted playlists.
 * Admin users can set playlists that will be used for all non-admin users.
 */

// Admin user configurations
const adminUsers = {
    'aaron': {
        playlistId: '', // Will be set by the admin through the UI
        restricted: true, // Whether the admin playlist should be enforced for all users
        playlistName: '' // Will store the playlist name for display
    }
    // Add more admin users as needed
};

// Function to check if a user is an admin
function isAdmin(username) {
    if (!username) return false;
    return adminUsers[username.toLowerCase()] !== undefined;
}

// Function to get admin settings for a user
function getAdminSettings(username) {
    if (!username) return { restricted: false };
    
    // First check localStorage for any saved settings
    const savedSettings = localStorage.getItem('adminSettings');
    if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        const userSettings = parsedSettings[username.toLowerCase()];
        if (userSettings) {
            return userSettings;
        }
    }
    
    // If no saved settings, return default settings
    return adminUsers[username.toLowerCase()] || { restricted: false };
}

// Function to set playlist ID for an admin
function setAdminPlaylist(username, playlistId, playlistName = '') {
    if (isAdmin(username)) {
        // Update in-memory settings
        adminUsers[username.toLowerCase()].playlistId = playlistId;
        adminUsers[username.toLowerCase()].playlistName = playlistName;
        
        // Save to localStorage for persistence
        const savedSettings = localStorage.getItem('adminSettings');
        const parsedSettings = savedSettings ? JSON.parse(savedSettings) : {};
        parsedSettings[username.toLowerCase()] = {
            ...adminUsers[username.toLowerCase()],
            playlistId,
            playlistName
        };
        localStorage.setItem('adminSettings', JSON.stringify(parsedSettings));
        
        return true;
    }
    return false;
}

// Set whether the playlist should be enforced for all users
function setPlaylistEnforcement(username, enforced) {
    if (isAdmin(username)) {
        // Update in-memory settings
        adminUsers[username.toLowerCase()].restricted = enforced;
        
        // Save to localStorage for persistence
        const savedSettings = localStorage.getItem('adminSettings');
        const parsedSettings = savedSettings ? JSON.parse(savedSettings) : {};
        parsedSettings[username.toLowerCase()] = {
            ...adminUsers[username.toLowerCase()],
            restricted: enforced
        };
        localStorage.setItem('adminSettings', JSON.stringify(parsedSettings));
        
        return true;
    }
    return false;
}

// Function to get the admin's playlist name
function getAdminPlaylistName(username) {
    if (isAdmin(username)) {
        return adminUsers[username.toLowerCase()].playlistName;
    }
    return '';
}

// Function to get the active admin playlist (for all users)
function getActiveAdminPlaylist() {
    // Check localStorage first
    const savedSettings = localStorage.getItem('adminSettings');
    if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        const aaronSettings = parsedSettings['aaron'];
        if (aaronSettings && aaronSettings.restricted && aaronSettings.playlistId) {
            return {
                id: aaronSettings.playlistId,
                name: aaronSettings.playlistName,
                admin: 'aaron'
            };
        }
    }
    
    // Fallback to in-memory settings
    if (adminUsers['aaron'].restricted && adminUsers['aaron'].playlistId) {
        return {
            id: adminUsers['aaron'].playlistId,
            name: adminUsers['aaron'].playlistName,
            admin: 'aaron'
        };
    }
    
    return null;
}

// Function to update the playlist name when it's fetched
function updatePlaylistName(playlistId, playlistName) {
    // Update in-memory settings
    Object.keys(adminUsers).forEach(admin => {
        if (adminUsers[admin].playlistId === playlistId) {
            adminUsers[admin].playlistName = playlistName;
        }
    });
    
    // Update localStorage
    const savedSettings = localStorage.getItem('adminSettings');
    if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        Object.keys(parsedSettings).forEach(admin => {
            if (parsedSettings[admin].playlistId === playlistId) {
                parsedSettings[admin].playlistName = playlistName;
            }
        });
        localStorage.setItem('adminSettings', JSON.stringify(parsedSettings));
    }
}

// Load admin settings from localStorage if available
function loadAdminSettings() {
    const savedSettings = localStorage.getItem('adminSettings');
    if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        // Merge with default settings
        Object.keys(parsedSettings).forEach(user => {
            if (adminUsers[user]) {
                adminUsers[user] = {
                    ...adminUsers[user],
                    ...parsedSettings[user]
                };
            } else {
                // Add new admin if they exist in saved settings
                adminUsers[user] = parsedSettings[user];
            }
        });
    }
}

// Initialize admin settings on load
loadAdminSettings();

export { 
    isAdmin, 
    getAdminSettings, 
    setAdminPlaylist,
    setPlaylistEnforcement, 
    getAdminPlaylistName,
    getActiveAdminPlaylist,
    updatePlaylistName
}; 
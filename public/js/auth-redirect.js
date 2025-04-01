/**
 * Authentication and redirection handler
 * This file checks if the current user is Aaron (admin) and handles admin visibility
 */

import { isAdmin, getAdminSettings } from './admin.js';

document.addEventListener('DOMContentLoaded', function() {
    // Get user data and access token
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    const accessToken = localStorage.getItem('access_token');
    
    // Check if we have valid user data and access token
    if (userData.id && accessToken) {
        // User is logged in
        if (document.querySelector('#login-button')) {
            document.querySelector('#login-button').style.display = 'none';
        }
        
        // Update user info display if it exists
        const userInfoElement = document.getElementById('user-info');
        if (userInfoElement) {
            userInfoElement.innerHTML = `
                <p>Logged in as: <strong>${userData.display_name || userData.id}</strong></p>
                <p>Account type: ${userData.product || 'unknown'}</p>
            `;
        }
        
        // Check if we're on the main game page
        if (window.location.pathname === '/views/index.html') {
            // If we have user data and the user is not an admin, check for enforced playlist
            if (!isAdmin(userData.id)) {
                const adminSettings = getAdminSettings(userData.id);
                
                if (adminSettings.restricted && adminSettings.playlistId) {
                    // Set the necessary localStorage items for the game
                    localStorage.setItem("value", "3"); // 3 = By Playlist
                    localStorage.setItem("id", adminSettings.playlistId);
                    localStorage.setItem("adminPlaylistActive", "true");
                }
            }
        }
        
        // Check if we're on the startup page
        if (window.location.pathname === '/' || window.location.pathname === '/views/startup.html') {
            // If user is not an admin, check for enforced playlist
            if (!isAdmin(userData.id)) {
                const adminSettings = getAdminSettings(userData.id);
                
                if (adminSettings.restricted && adminSettings.playlistId) {
                    // Set the necessary localStorage items for the game
                    localStorage.setItem("value", "3"); // 3 = By Playlist
                    localStorage.setItem("id", adminSettings.playlistId);
                    localStorage.setItem("adminPlaylistActive", "true");
                    
                    // Redirect to game
                    window.location.href = "/views/index.html";
                }
            }
        }
    } else {
        // No valid login found
        if (window.location.pathname !== '/login') {
            // Show login button if it exists
            const loginPrompt = document.createElement('div');
            loginPrompt.innerHTML = `
                <div style="text-align: center; margin-top: 20px;">
                    <p>Please log in to continue:</p>
                    <button id="login-button" style="width: 100%; max-width: 200px;">Login with Spotify</button>
                </div>
            `;
            
            const contentElement = document.querySelector('#content');
            if (contentElement && !document.querySelector('#login-button')) {
                contentElement.appendChild(loginPrompt);
                
                document.getElementById('login-button').addEventListener('click', function() {
                    window.location.href = "/login";
                });
            }
        }
    }
}); 
import { listened } from './script.js';

var play = false; 
var tempPlay = false; 
var hasRestarted = false; 
var playerDeviceId = null;

/**
 * timezone: 4Tbuh5q66Ygubei5Xru4jB
 * beggin: 3Wrjm47oTz2sjIgck11l5e
 * vibes playlist: 6noCZtPPWYRlAfYZTZL5p3
 */

const token = accessToken;

window.onSpotifyWebPlaybackSDKReady = () => {
    const player = new Spotify.Player({
        name: 'Web Playback SDK Quick Start Player',
        getOAuthToken: cb => { cb(token); },
        volume: 0.5
    })

    // Ready
    player.addListener('ready', ({ device_id }) => {
        console.log('Ready with Device ID', device_id);
        playerDeviceId = device_id;
        
        // Transfer playback to this device
        transferPlayback(device_id);
        
        fetch('https://api.spotify.com/v1/me/player', {
            headers: {
                'Authorization': 'Bearer ' + token
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch data from API');
            }
            return response.json();
        })
        .then(data => {
            if (data.is_playing) {
                pauseSong();
            }
        })
        .catch(error => console.error("An error occurred while checking if the player is playing music:", error));
        printState();
    });
    
    // Not Ready
    player.addListener('not_ready', ({ device_id }) => {
        console.log('Device ID has gone offline', device_id);
    });

    player.addListener('initialization_error', ({ message }) => {
        console.error(message);
        alert("Spotify Player Error: " + message);
    });

    player.addListener('authentication_error', ({ message }) => {
        console.error(message);
        alert("Spotify Authentication Error: " + message);
    });

    player.addListener('account_error', ({ message }) => {
        console.error(message);
        alert("Spotify Account Error: " + message + " - Make sure you have Spotify Premium");
    });

    // player.addListener('player_state_changed', ( state => {
    //     if (!state) {
    //         return;
    //     }
    
    //     setTrack(state.track_window.current_track);
    //     setPaused(state.paused);
    
    
    //     player.getCurrentState().then( state => { 
    //         (!state)? setActive(false) : setActive(true) 
    //     });
    // }));
    

    player.connect().then(success => {
        if (success) {
        console.log('The Web Playback SDK successfully connected to Spotify!');
        } else {
            console.log('The Web Playback SDK couldnt connect to Spotify');
            alert("Could not connect to Spotify. Please make sure you have the Spotify app open and try again.");
        }
    })
    .catch(error => {
        console.error('Failed to connect to Spotify:', error);
        alert("Failed to connect to Spotify: " + error.message);
    });

    setInterval(run, 10);

    function run() {
        if(play && !tempPlay) {
            restart();
            player.togglePlay();
        } else if(!play && tempPlay) {
            pauseSong();
        }

        if(listened > 6 && !hasRestarted) {
            restart();
            play = true; 
            hasRestarted = true; 
        }

        tempPlay = play;
    }

    function printState() {
        player.getCurrentState().then(state => {
            if (!state) {
              console.error('User is not playing music through the Web Playback SDK');
              return;
            }
          
            var current_track = state.track_window.current_track;
            var next_track = state.track_window.next_tracks[0];
          
            console.log('Currently Playing', current_track);
            console.log('Playing Next', next_track);
        });
    }
    
    const restart = async () => {
        fetch('https://api.spotify.com/v1/me/player/seek?position_ms=0', {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`
        }
        })
        .then(response => {
            if (!response.ok) {
            throw new Error('Failed to restart song');
            }
            // console.log('Song restarted successfully');
        })
        .catch(error => {
            console.error(error);
        });
    }
}; 

// Function to transfer playback to our device
function transferPlayback(deviceId) {
    console.log("Attempting to transfer playback to device: " + deviceId);
    
    fetch('https://api.spotify.com/v1/me/player', {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            device_ids: [deviceId],
            play: false
        })
    })
    .then(response => {
        if (!response.ok) {
            if (response.status === 403) {
                console.error("Premium required for device transfer");
                alert("Spotify Premium is required to use the web player");
                return;
            }
            throw new Error('Failed to transfer playback');
        }
        console.log("Playback successfully transferred to web player");
    })
    .catch(error => {
        console.error("Error transferring playback:", error);
    });
}

function toggle(on) {
    play = on; 
}


const playSong = async (uri) => {
    // Ensure we're using the web player device
    if (playerDeviceId) {
        fetch(`https://api.spotify.com/v1/me/player/play?device_id=${playerDeviceId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                uris: [uri],
                position_ms: 0
            })
        })
        .then(response => {
            if (!response.ok) {
                // Handle specific error codes
                if (response.status === 403) {
                    alert("Spotify Premium is required to play music");
                } else if (response.status === 404) {
                    alert("No active device found. Please open Spotify desktop or mobile app and try again.");
                } else {
                    console.error("Error playing song:", response.status);
                }
                throw new Error(`Failed to play song: ${response.status}`);
            }
            console.log("Song playing successfully");
        })
        .catch(error => console.error(error));
    } else {
        console.error("No device ID available for playback");
        alert("No Spotify device available. Please refresh the page and make sure Spotify is open.");
    }
}

const pauseSong = async (uri) => {
    fetch('https://api.spotify.com/v1/me/player/pause', {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`
        }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to pause song');
            }
        })
        .catch(error => {
            console.error(error);
    });
}

const nextSong = async () => {
    fetch('https://api.spotify.com/v1/me/player/next', {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${token}`
    }
    })
    .then(response => {
        if (!response.ok) {
        throw new Error('Failed to skip to next song');
        }
        console.log('Skipped to next song');
    })
    .catch(error => {
        console.error(error);
    });
}

export { toggle, playSong, nextSong };
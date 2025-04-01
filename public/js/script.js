import {toggle, playSong } from './player.js';

var recent = [];

const startupValue = parseInt(localStorage.getItem('value'));
const startupID = localStorage.getItem('id');

const access_token = accessToken; 
const headers = { Authorization: `Bearer ${access_token}` };

var artistName = ''; 
var searchType = '';
var limit = 20; 
var endpoint = '';

var data = [];
var index = -1; 

var specificSong = false; 

const whileMargin = 50; 
const probabilityLimit = 20; 

// Function to fetch and display playlist information
function displayPlaylistInfo() {
    const playlistNameElement = document.getElementById('current-playlist-name');
    
    // Check if this is an admin-enforced playlist
    const adminPlaylistActive = localStorage.getItem('adminPlaylistActive') === 'true';
    const adminBadge = adminPlaylistActive ? ' 👑' : '';
    
    if (startupValue === 3 && startupID) {
        // If it's a playlist, fetch its details
        fetch(`https://api.spotify.com/v1/playlists/${startupID}`, {
            headers: { 'Authorization': `Bearer ${access_token}` }
        })
        .then(response => {
            if (!response.ok) throw new Error('Failed to fetch playlist');
            return response.json();
        })
        .then(playlist => {
            playlistNameElement.textContent = playlist.name + adminBadge;
            playlistNameElement.title = `By ${playlist.owner.display_name}${adminPlaylistActive ? ' (Selected by admin)' : ''}`;
            
            // Store the playlist name for reference
            localStorage.setItem('currentPlaylistName', playlist.name);
            
            // If this is an admin-enforced playlist, add a note
            if (adminPlaylistActive) {
                const playlistNote = document.createElement('div');
                playlistNote.className = 'admin-playlist-note';
                playlistNote.innerHTML = `<p style="margin: 5px 0 0 0; font-size: 12px; color: var(--color-positive);">This playlist was selected by Aaron</p>`;
                playlistNameElement.parentNode.appendChild(playlistNote);
            }
        })
        .catch(error => {
            console.error('Error fetching playlist:', error);
            playlistNameElement.textContent = 'Unknown playlist' + adminBadge;
        });
    } else if (startupValue === 1) {
        playlistNameElement.textContent = `Songs by ${startupID}` + adminBadge;
    } else if (startupValue === 6) {
        playlistNameElement.textContent = 'Your Top 50 Songs' + adminBadge;
    } else if (startupValue === 7) {
        playlistNameElement.textContent = 'Your Liked Songs' + adminBadge;
    } else {
        playlistNameElement.textContent = 'Unknown source' + adminBadge;
    }
}

// Create admin playlist indicator
function createAdminIndicator() {
    const adminPlaylistActive = localStorage.getItem('adminPlaylistActive') === 'true';
    
    if (adminPlaylistActive) {
        // Create indicator
        const adminIndicator = document.createElement('div');
        adminIndicator.id = 'admin-indicator';
        adminIndicator.style.position = 'absolute';
        adminIndicator.style.top = '10px';
        adminIndicator.style.right = '10px';
        adminIndicator.style.backgroundColor = 'rgba(225, 115, 211, 0.2)';
        adminIndicator.style.color = '#e173d3';
        adminIndicator.style.padding = '8px 12px';
        adminIndicator.style.borderRadius = '4px';
        adminIndicator.style.fontSize = '12px';
        adminIndicator.style.fontWeight = 'bold';
        adminIndicator.innerHTML = '👑 Playing Aaron\'s Playlist';
        
        // Add to page
        document.querySelector('main').appendChild(adminIndicator);
        
        // Fetch and display playlist info
        if (startupValue === 3 && startupID) {
            fetch(`https://api.spotify.com/v1/playlists/${startupID}`, {
                headers: { Authorization: `Bearer ${access_token}` }
            })
            .then(response => {
                if (!response.ok) throw new Error('Failed to fetch playlist');
                return response.json();
            })
            .then(playlist => {
                const playlistInfo = document.createElement('div');
                playlistInfo.style.marginTop = '5px';
                playlistInfo.style.fontSize = '10px';
                playlistInfo.textContent = `Playing from: ${playlist.name}`;
                adminIndicator.appendChild(playlistInfo);
            })
            .catch(error => console.error('Error fetching playlist:', error));
        }
    }
}

// Call these functions when the page loads
window.addEventListener('DOMContentLoaded', () => {
    displayPlaylistInfo();
    createAdminIndicator();
});

function newSong() {

    specificSong = false;

    artistName = ''; 
    searchType = '';
    limit = 20; 
    endpoint = '';

    data = [];
    index = -1; 

    switch(startupValue) {
        case 1: // By Artist (Name)
            artistName = startupID;
            searchType = "track";
            limit = 50;
            endpoint = `https://api.spotify.com/v1/search?q=artist:${artistName}&type=${searchType}&limit=${limit}`;
    
            fetch(endpoint, { headers })
            .then((response) => response.json())
            .then((responseData) => {
                const tracks = responseData.tracks.items;
                tracks.forEach((track) => {
                    const trackItem = { titel:track.name, artist:track.artists[0].name, uri:track.uri, duration:track.duration_ms };
                    if(!data.some(trackItem2 => trackItem2.titel == trackItem.titel)) {
                        data.push(trackItem);
                    }
                });
                
                const lastItems = recent.length > probabilityLimit ? recent.slice(-probabilityLimit) : recent;
                var k = whileMargin; 

                do {
                    index = Math.floor(Math.random() * data.length);
                    const song = data[index].titel + " - " + data[index].artist;
        
                    document.getElementById('song').innerHTML = song;
        
                    localStorage.setItem('uri', data[index].uri);
                    localStorage.setItem('song', song);
                    
                    k++;
                } while(!lastItems.some(item => item.titel == data[index].titel) && k < whileMargin)

                recent.push(data[index]);

            })
            .catch((error) => console.error(error));
            break; 
        case 2: // By Artist (ID)
            endpoint = `https://api.spotify.com/v1/artists/${startupID}/albums?market=US&limit=50`;
            
            fetch(endpoint, { headers })
                .then((response) => response.json())
                .then((responseData) => {
                    const albums = responseData.items;
                    const promises = [];

                    albums.forEach((album) => {
                        if(album.album_group != "appears_on") {
                            const endpoint2 = `https://api.spotify.com/v1/albums/${album.id}/tracks`;

                            localStorage.setItem('tracks',  JSON.stringify([]));

                            const promise = fetch(endpoint2, { headers })
                                .then((response2) => response2.json())
                                .then((responseData2) => {
                                const tracks = responseData2.items;
                                const temp = JSON.parse(localStorage.getItem('tracks'));
                                tracks.forEach((track) => {
                                    const trackItem = { titel:track.name, artist:track.artists[0].name, uri:track.uri, duration:track.duration_ms };
                                    if(!temp.some(trackItem2 => trackItem2.titel == trackItem.titel)) {
                                        temp.push(trackItem);
                                    }
                                });
                                localStorage.setItem('tracks', JSON.stringify(temp));
                                })
                                .catch((error2) => console.error(error2));

                            promises.push(promise);
                        }
                    });

                    Promise.all(promises)
                        .then(() => {
                            const tracks = JSON.parse(localStorage.getItem('tracks'));
                            tracks.forEach((track) => {
                            data.push(track);
                            });

                            const lastItems = recent.length > probabilityLimit ? recent.slice(-probabilityLimit) : recent;
                            var k = whileMargin; 

                            do {
                                index = Math.floor(Math.random() * data.length);
                                const song = data[index].titel + " - " + data[index].artist;
                    
                                document.getElementById('song').innerHTML = song;
                    
                                localStorage.setItem('uri', data[index].uri);
                                localStorage.setItem('song', song);
                                
                                k++;
                            } while(!lastItems.some(item => item.titel == data[index].titel) && k < whileMargin)

                            recent.push(data[index]);
                        })
                        .catch((error) => console.error(error));
                })
                .catch((error) => console.error(error));

            break; 
        case 3: //By Playlist
            limit = 100;
            endpoint = `https://api.spotify.com/v1/playlists/${startupID}/tracks?limit=${limit}`;
    
            fetch(endpoint, { headers })
            .then((response) => response.json())
            .then((responseData) => {
                const tracks = responseData.items;
                tracks.forEach((track) => {
                    const trackItem = { titel:track.track.name, artist:track.track.artists[0].name, uri:track.track.uri, duration:track.track.duration_ms };
                    if(!data.some(trackItem2 => trackItem2.titel == trackItem.titel)) {
                        data.push(trackItem);
                    }
                });
    
                const lastItems = recent.length > probabilityLimit ? recent.slice(-probabilityLimit) : recent;
                var k = whileMargin; 

                do {
                    index = Math.floor(Math.random() * data.length);
                    const song = data[index].titel + " - " + data[index].artist;
        
                    document.getElementById('song').innerHTML = song;
        
                    localStorage.setItem('uri', data[index].uri);
                    localStorage.setItem('song', song);
                    
                    k++;
                } while(!lastItems.some(item => item.titel == data[index].titel) && k < whileMargin)

                recent.push(data[index]);
            })
            .catch((error) => console.error(error));
            break; 
        case 4: //By Album 
            endpoint = `https://api.spotify.com/v1/albums/${startupID}/tracks`;

            fetch(endpoint, { headers })
            .then((response) => response.json())
            .then((responseData) => {
                const tracks = responseData.items;
                tracks.forEach((track) => {
                    const trackItem = { titel:track.name, artist:track.artists[0].name, uri:track.uri, duration:track.duration_ms };
                    if(!data.some(trackItem2 => trackItem2.titel == trackItem.titel)) {
                        data.push(trackItem);
                    }
                });
                
                const albumProbabilityLimit = 3; 
                const lastItems = recent.length > albumProbabilityLimit ? recent.slice(-albumProbabilityLimit) : recent;
                var k = whileMargin; 

                do {
                    index = Math.floor(Math.random() * data.length);
                    const song = data[index].titel + " - " + data[index].artist;
        
                    document.getElementById('song').innerHTML = song;
        
                    localStorage.setItem('uri', data[index].uri);
                    localStorage.setItem('song', song);
                    
                    k++;
                } while(!lastItems.some(item => item.titel == data[index].titel) && k < whileMargin)

                recent.push(data[index]);

            })
            .catch((error) => console.error(error));
            break; 
        case 5: //Specific song

            specificSong = true; 

            endpoint = `https://api.spotify.com/v1/tracks/${startupID}`;
    
            fetch(endpoint, { headers })
            .then((response) => response.json())
            .then((responseData) => {
                const song = responseData.name + " - " + responseData.artists[0].name;
                document.getElementById('song').innerHTML = song;
    
                localStorage.setItem('uri', 'spotify:track:' + startupID);
                localStorage.setItem('song', song);
                localStorage.setItem('duration', responseData.duration_ms);
            })
            .catch((error) => console.error(error));
            break; 
        case 6: 
            limit = 50;
            endpoint = `https://api.spotify.com/v1/me/top/tracks?limit=${limit}`;
    
            fetch(endpoint, { headers })
            .then((response) => response.json())
            .then((responseData) => {
                const tracks = responseData.items;
                tracks.forEach((track) => {
                    const trackItem = { titel:track.name, artist:track.artists[0].name, uri:track.uri, duration:track.duration_ms };
                    if(!data.some(trackItem2 => trackItem2.titel == trackItem.titel)) {
                        data.push(trackItem);
                    }
                });
    
                const lastItems = recent.length > probabilityLimit ? recent.slice(-probabilityLimit) : recent;
                var k = whileMargin; 

                do {
                    index = Math.floor(Math.random() * data.length);
                    const song = data[index].titel + " - " + data[index].artist;
        
                    document.getElementById('song').innerHTML = song;
        
                    localStorage.setItem('uri', data[index].uri);
                    localStorage.setItem('song', song);
                    
                    k++;
                } while(!lastItems.some(item => item.titel == data[index].titel) && k < whileMargin)

                recent.push(data[index]);
            })
            .catch((error) => console.error(error));
            break; 
        case 7: //My liked songs
            limit = 50;
            endpoint = `https://api.spotify.com/v1/me/tracks?limit=${limit}`;
    
            fetch(endpoint, { headers })
            .then((response) => response.json())
            .then((responseData) => {
                const tracks = responseData.items;
                tracks.forEach((track) => {
                    const trackItem = { titel:track.track.name, artist:track.track.artists[0].name, uri:track.track.uri, duration:track.track.duration_ms };
                    if(!data.some(trackItem2 => trackItem2.titel == trackItem.titel)) {
                        data.push(trackItem);
                    }
                });
    
                const lastItems = recent.length > probabilityLimit ? recent.slice(-probabilityLimit) : recent;
                var k = whileMargin; 

                do {
                    index = Math.floor(Math.random() * data.length);
                    const song = data[index].titel + " - " + data[index].artist;
        
                    document.getElementById('song').innerHTML = song;
        
                    localStorage.setItem('uri', data[index].uri);
                    localStorage.setItem('song', song);
                    
                    k++;
                } while(!lastItems.some(item => item.titel == data[index].titel) && k < whileMargin)

                recent.push(data[index]);
            })
            .catch((error) => console.error(error));
            break; 
        default: 
            break; 
    }
}

newSong();

// #region LOGIN USER  ---------------------------------

var userImg = document.querySelector('#user img');
var userText = document.querySelector('#user p:last-child');
    
fetch(`https://api.spotify.com/v1/me/`, { headers })
.then((response) => response.json())
.then((responseData) => {
    userImg.src = responseData.images[0].url;
    userText.innerHTML = responseData.display_name; 
})
.catch((error) => console.error(error));

// #endregion ------------------------------------------

var listened = 1;

var time = 0; 

var isPlaying = false; 
var gameOver = false; 

const lightColor = "#eee";
const darkColor = "#666";
const redColor = "red";
const greenColor = "green";
const bgColor = "#111";
const darkerColor = "#222";

const timeWidth = 700; 
var endTime = 16; 

var clearButton = document.querySelector('#textfield i:last-child');
var playButton = document.querySelector('#play i');
var skipButton = document.getElementById('skip');
var submitButton = document.getElementById('submit');
var giveUpButton = document.getElementById('give-up');
var backToMenuButton = document.getElementById('back-to-menu');

var playAgainButton = document.getElementById('playAgain');

var textDiv = document.getElementById('textfield');
var textfield = document.querySelector("#textfield textarea");

var timeObject = document.getElementById('currentTime');

setInterval(run, 10);
setInterval(timerUntilMidnight, 1000);
document.querySelector("#play p:last-child").innerHTML = "0:" + endTime;

var streak = 0; 

function run() {
    if(isPlaying) {
        var maxWidth = 0;

        var k = listened;
        if(listened > 6)
            k = 6;

        for(let i = 2; i <= k + 1; i++) {
            var part = document.querySelector("#time-parts div:nth-child(" + i + ")");
            var width = part.offsetWidth;
            maxWidth += width;
        }

        if(time < endTime * 100 && timeObject.offsetWidth < maxWidth) {
            time += 1; 
            var newWidth = (time / (endTime * 100)) * 100;
            timeObject.style.width = newWidth + "%";

            const totalSeconds = parseInt(time / 100);
            const minutes = parseInt(totalSeconds / 60);
            const seconds = totalSeconds - (minutes * 60);

            var secondsString = seconds + "";
            if(seconds < 10)
                secondsString = "0" + seconds;

            document.querySelector("#play p:first-child").innerHTML = minutes + ":" + secondsString;
        } else {
            pause();
        }
    }
}
function timerUntilMidnight() {
    if(gameOver) { // The timer on the winning/losing page
        var hours = "00"; 
        var minutes = "00"; 
        var seconds = "00"; 

        var now = new Date();
        
        var i = 23 - now.getHours(); 
        hours = i.toString();
        if(i < 10)
            hours = "0" + i.toString();

        i = 59 - now.getMinutes();
        minutes = i.toString();
        if(i < 10)
            minutes = "0" + i.toString();

        i = 59 - now.getSeconds();
        seconds = i.toString();
        if(i < 10)
            seconds = "0" + i.toString();

        var timer = document.querySelector("#timeDiv p:last-child");
        timer.innerHTML = hours + ":" + minutes + ":" + seconds;
    }
}

// Search functionality
const textfield = document.querySelector('#textfield textarea');
const alternatives = document.querySelector('#alternatives div');
const submitButton = document.querySelector('#submit');

// Clear alternatives when clicking outside
document.addEventListener('click', function(e) {
    if (!textfield.contains(e.target) && !alternatives.contains(e.target)) {
        clearAlternatives();
    }
});

// Handle search input
textfield.addEventListener('input', function() {
    clearAlternatives();

    if (textfield.value.length > 0) {
        const searchTerm = textfield.value.toLowerCase();
        let count = 0;
        
        // Filter and display matching songs
        data.forEach(function(song) {
            if ((song.titel.toLowerCase().includes(searchTerm) || 
                 song.artist.toLowerCase().includes(searchTerm)) && 
                count < 7) {
                const div = document.createElement("div");
                div.innerHTML = `${song.titel} - ${song.artist}`;
                div.addEventListener('click', function() {
                    textfield.value = this.innerHTML;
                    clearAlternatives();
                    submitButton.click();
                });
                alternatives.appendChild(div);
                count++;
            }
        });
    }
});

// Handle keyboard navigation
document.addEventListener('keydown', function(e) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const down = e.key === "ArrowDown";
        const chosen = document.querySelector(".chosenAlternative");
        
        if (!chosen) {
            const firstOption = alternatives.firstElementChild;
            if (firstOption) {
                firstOption.classList.add("chosenAlternative");
                textfield.value = firstOption.innerHTML;
            }
        } else {
            const next = down ? chosen.nextElementSibling : chosen.previousElementSibling;
            if (next) {
                chosen.classList.remove("chosenAlternative");
                next.classList.add("chosenAlternative");
                textfield.value = next.innerHTML;
            } else if (down) {
                // Wrap to first option
                const firstOption = alternatives.firstElementChild;
                if (firstOption) {
                    chosen.classList.remove("chosenAlternative");
                    firstOption.classList.add("chosenAlternative");
                    textfield.value = firstOption.innerHTML;
                }
            } else {
                // Wrap to last option
                const lastOption = alternatives.lastElementChild;
                if (lastOption) {
                    chosen.classList.remove("chosenAlternative");
                    lastOption.classList.add("chosenAlternative");
                    textfield.value = lastOption.innerHTML;
                }
            }
        }
    } else if (e.key === "Enter") {
        const chosen = document.querySelector(".chosenAlternative");
        if (chosen) {
            textfield.value = chosen.innerHTML;
            clearAlternatives();
            submitButton.click();
        }
    }
});

// Clear alternatives function
function clearAlternatives() {
    while (alternatives.firstChild) {
        alternatives.removeChild(alternatives.firstChild);
    }
}

textfield.addEventListener('focus', function() {
    textDiv.style.borderColor = greenColor;
});
textfield.addEventListener('blur', function() {
    textDiv.style.borderColor = lightColor;
    clearAlternatives();
});

document.addEventListener('click', function(e) {
    const timer = document.getElementById('time-parts');
    var rect = timer.getBoundingClientRect();

    const startX = rect.left + window.pageXOffset; 
    const startY = rect.top + window.pageYOffset; 

    var timerWidth = 0; 
    if(!gameOver) {
        for(let i = 1; i <= listened; i++) {
            timerWidth += document.querySelector(`#time-parts div:nth-child(${i + 1})`).offsetWidth;
        }
    } else timerWidth = timer.offsetWidth;

    const endX = startX + timerWidth;
    const endY = startY + timer.offsetHeight; 
    
    const inTimer = e.clientX >= startX && e.clientX <= endX && e.clientY >= startY && e.clientY <= endY;

    if(inTimer) {
        var partOfTimer = (e.clientX - startX)/(timer.offsetWidth);
        var inMilliSeconds = parseInt(endTime * partOfTimer * 1000); 

        if(!isPlaying) 
            play();

        time = inMilliSeconds / 10;

        fetch(`https://api.spotify.com/v1/me/player/seek?position_ms=${inMilliSeconds}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${access_token}`
            }
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to change song position');
                }

            })
            .catch(error => {
                console.error(error);
        });
    }

    // console.log(`startX: ${startX}, startY: ${startY}, endX: ${endX}, endY: ${endY}`);
});

clearButton.addEventListener('click', clear);

playButton.addEventListener('click', function() {
    if(playButton.classList.contains("fa-play"))
        play();
    else 
        pause()
});

skipButton.addEventListener('click', function() {
    var icon = document.querySelector("#guesses div:nth-child(" + listened + ") i");
    icon.className = "";
    icon.classList.add("fa-regular");
    icon.classList.add("fa-square");
    icon.style.visibility = "visible";

    var p = document.querySelector("#guesses div:nth-child(" + listened + ") p");
    p.innerHTML = "SKIPPED";
    p.style.visibility = "visible";

    if(listened < 6)
        revealMore();
    else 
        youLost();
});

submitButton.addEventListener('click', function() {
    var song = textfield.value; 
    clearAlternatives();
    submit(song);
});

giveUpButton.addEventListener('click', function() {
    youLost();
});

backToMenuButton.addEventListener('click', function() {
    pause();
    window.location.href = "/";
});


function submit(choice) {
    var songString = JSON.stringify(choice);
    songString = songString.substring(1, songString.length - 1);

    var song = localStorage.getItem('song');

    if(specificSong) {
        songString = songString.toLowerCase();
        song = song.toLowerCase();
    }

    if(songString != song) {
        if(songString != "") {
            var icon = document.querySelector("#guesses div:nth-child(" + listened + ") i");
            icon.className = "";
            icon.classList.add("fa-solid");
            icon.classList.add("fa-xmark");
            icon.style.visibility = "visible";

            var p = document.querySelector("#guesses div:nth-child(" + listened + ") p");
            p.innerHTML = songString;
            p.style.visibility = "visible";

            clear();
            
            if(listened < 6)
                revealMore();
            else   
                youLost();
        }
    }
    else {
        var icon = document.querySelector("#guesses div:nth-child(" + listened + ") i");
        icon.className = "";
        icon.classList.add("fa-solid");
        icon.classList.add("fa-check");
        icon.style.visibility = "visible";

        var p = document.querySelector("#guesses div:nth-child(" + listened + ") p");
        p.innerHTML = songString;
        p.style.visibility = "visible";
        
        clear();
        youWon();
    }
}

function play() {
    playButton.classList.remove("fa-play");
    playButton.classList.add("fa-pause");
    time = 0; 

    isPlaying = true;
    playSong(localStorage.getItem('uri')); 
    toggle(true);
}
function pause() {
    playButton.classList.remove("fa-pause");
    playButton.classList.add("fa-play");
    timeObject.style.width = "0";

    document.querySelector("#play p:first-child").innerHTML = "0:00";

    isPlaying = false; 
    toggle(false);
}

function revealMore() {
    if(listened < 6) {
        listened += 1;

        var part = document.querySelector("#time-parts div:nth-child(" + (listened + 1) + ")");
        part.style.backgroundColor = darkColor;

        var prePart = document.querySelector("#time-parts div:nth-child(" + listened + ")");
        prePart.style.borderColor = bgColor; 

        if(listened < 6)
            skipButton.innerHTML = `SKIP (+${listened}s)`;
        else 
            skipButton.innerHTML = "SKIP";
    }
}

function clear() {
    textfield.value = "";
}

function youWon() {
    document.querySelector("#statsDiv p:first-child").innerHTML = "Congrats! You won!";

    streak++;
    var streakElement = document.getElementById('streak');
    streakElement.innerHTML = "STREAK: " + streak;

    showSong();
}
function youLost() {
    document.querySelector("#statsDiv p:first-child").innerHTML = "Better luck next time!";

    streak = 0; 
    var streakElement = document.getElementById('streak');
    streakElement.innerHTML = "STREAK: " + streak;

    showSong();
}

function showSong() {
    listened++;

    gameOver = true; 
    giveUpButton.style.visibility = "hidden";

    for(let i = 3; i <= 7; i++) {
        var part = document.querySelector("#time-parts div:nth-child(" + i + ")");
        part.style.width = "0%";
    }
    document.querySelector("#time-parts div:nth-child(2)").style.width = "100%";

    textDiv.style.visibility = "hidden";
    textDiv.style.height = "0";

    var buttons = document.getElementById("buttons");

    buttons.style.visibility = "hidden";
    buttons.style.height = "0";

    var guesses = document.getElementById("guesses");
    guesses.style.visibility = "hidden";
    guesses.style.height = "0";
    for(let i = 1; i <= 6; i++) {
        var icon = document.querySelector("#guesses div:nth-child(" + i + ") i");
        icon.style.visibility = "hidden";

        var p = document.querySelector("#guesses div:nth-child(" + i + ") p");
        p.style.visibility = "hidden";
    }

    var reveal = document.getElementById("reveal");
    reveal.style.visibility = "visible";
    reveal.style.height = "auto";

    for(let i = 1; i <= 6; i++) {
        var part = document.querySelector("#stats div:nth-child(" + i + ")");
        var icon = document.querySelector("#guesses div:nth-child(" + i + ") i");
        if(icon.classList.contains("fa-check"))
            part.style.backgroundColor = greenColor;
        else if(icon.classList.contains("fa-xmark"))
            part.style.backgroundColor = redColor;
        else if(icon.classList.contains("fa-square"))
            part.style.backgroundColor = darkColor;
        else 
            part.style.backgroundColor = darkerColor; 
    }
    
    playButton.className = "";
    playButton.classList.add("fa-solid");

    var duration = 0; 
    
    if(!specificSong)
        duration = data[index].duration;
    else    
        duration = parseInt(localStorage.getItem('duration'));

    const secondsTotal = parseInt(duration / 1000);
    const minutes = parseInt(secondsTotal / 60);
    const seconds = parseInt(secondsTotal - (minutes * 60));

    var timeP = document.querySelector('#play p:last-child');

    var secondsString = seconds + "";
    if(seconds < 10)
        secondsString = "0" + seconds;

    timeP.innerHTML = minutes + ":" + secondsString;
    endTime = secondsTotal; 

    play();

    timerUntilMidnight();
}

playAgainButton.addEventListener('click', restart);

function restart() {
    listened = 1; 
    time = 0; 
    gameOver = false; 
    giveUpButton.style.visibility = "visible";
    
    endTime = 16;
    var timeP = document.querySelector('#play p:last-child');
    timeP.innerHTML = "0:16";

    skipButton.innerHTML = "SKIP (+1s)";
    
    document.querySelector("#time-parts div:nth-child(2)").style.width = "6.25%";
    document.querySelector("#time-parts div:nth-child(3)").style.width = "6.25%";
    document.querySelector("#time-parts div:nth-child(4)").style.width = "12.5%";
    document.querySelector("#time-parts div:nth-child(5)").style.width = "18.75%";
    document.querySelector("#time-parts div:nth-child(6)").style.width = "25%";
    document.querySelector("#time-parts div:nth-child(7)").style.width = "31.25%";

    for(let i = 3; i <= 7; i++) {
        var part = document.querySelector("#time-parts div:nth-child(" + i + ")");
        part.style.backgroundColor = bgColor; 
        part.style.borderColor = darkColor;
    }

    textDiv.style.visibility = "visible";
    textDiv.style.height = "30px";

    var buttons = document.getElementById("buttons");

    buttons.style.visibility = "visible";
    buttons.style.height = "50px";

    var guesses = document.getElementById("guesses");
    guesses.style.visibility = "visible";
    guesses.style.height = "auto";
    for(let i = 1; i <= 6; i++) {
        var icon = document.querySelector("#guesses div:nth-child(" + i + ") i");
        icon.style.visibility = "hidden";

        var p = document.querySelector("#guesses div:nth-child(" + i + ") p");
        p.style.visibility = "hidden";
    }

    var reveal = document.getElementById("reveal");
    reveal.style.visibility = "hidden";
    reveal.style.height = "0";

    for(let i = 1; i <= 6; i++) {
        var part = document.querySelector("#stats div:nth-child(" + i + ")");
        var icon = document.querySelector("#guesses div:nth-child(" + i + ") i");

        icon.classList = "";
        part.style.backgroundColor = darkerColor; 
    }

    playButton.className = "";
    playButton.classList.add("fa-solid");

    pause();
    newSong();
}

export { listened };

// Function to update game stats
function updateStats(isWin, guessCount) {
    // Get current stats
    const statsJson = localStorage.getItem('heardleStats');
    let stats = statsJson ? JSON.parse(statsJson) : {
        gamesPlayed: 0,
        gamesWon: 0,
        currentStreak: 0,
        maxStreak: 0,
        guessDistribution: [0, 0, 0, 0, 0, 0],
        lastPlayed: null
    };
    
    // Update stats
    stats.gamesPlayed++;
    
    if (isWin) {
        stats.gamesWon++;
        stats.currentStreak++;
        
        // Update max streak if current streak is higher
        if (stats.currentStreak > stats.maxStreak) {
            stats.maxStreak = stats.currentStreak;
        }
        
        // Update guess distribution (0-indexed array, but 1-indexed guesses)
        stats.guessDistribution[guessCount - 1]++;
    } else {
        // Reset streak on loss
        stats.currentStreak = 0;
    }
    
    // Update last played timestamp
    stats.lastPlayed = new Date().toISOString();
    
    // Save updated stats
    localStorage.setItem('heardleStats', JSON.stringify(stats));
    
    // Update streak display
    document.getElementById('streak').innerHTML = 'STREAK: ' + stats.currentStreak;
}
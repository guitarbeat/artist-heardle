const express = require('express'); // Express web server framework
const request = require('request'); // "Request" library
const querystring = require('querystring');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');
const cheerio = require('cheerio');

require('dotenv').config();

const client_id = process.env.CLIENT_ID; // Your client id
const client_secret = process.env.CLIENT_SECRET; // Your secret
const redirect_uri = 'http://localhost:8888/callback'; // Your redirect uri
const stateKey = 'spotify_auth_state';

/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
var generateRandomString = function(length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

var app = express();

app.use(express.static(__dirname))
  .use(cookieParser());

app.get('/', function(req, res) {
    // Redirect to startup page for now, we'll handle admin check after authentication
    res.sendFile(path.join(__dirname + '/views/startup.html'));
});

app.get('/play', function(req, res) {
    res.sendFile(path.join(__dirname + '/views/index.html'));
});

app.get('/login', function(req, res) {
  var state = generateRandomString(16);
  res.cookie(stateKey, state);

  // Add device-related scopes to ensure we can control playback
  var scope = 'user-read-playback-state user-modify-playback-state user-read-currently-playing streaming user-top-read user-read-private user-read-email app-remote-control user-library-read user-library-modify';
  
  console.log('Redirecting to Spotify authorization with scopes:', scope);
  
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    }));
});

app.get('/callback', function(req, res) {
  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.redirect('/#' +
      querystring.stringify({
        error: 'state_mismatch'
      }));
  } else {
    res.clearCookie(stateKey);
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
      },
      json: true
    };

    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {
        console.log('Successfully obtained access token');
        
        var access_token = body.access_token,
            refresh_token = body.refresh_token;

        // Save tokens to cookies for easier refreshing
        res.cookie('refresh_token', refresh_token, { maxAge: 30 * 24 * 60 * 60 * 1000 }); // 30 days
            
        const htmlFilePath = path.join(__dirname + '/views/index.html');
        const htmlContent = fs.readFileSync(htmlFilePath, 'utf8');  

        const $ = cheerio.load(htmlContent);
        
        // Add access token script
        const scriptTag = $('script#access-token');
        scriptTag.html(`
          var accessToken = "${access_token}";
          localStorage.setItem('access_token', "${access_token}");
        `);
        
        // Add refresh token script
        const refreshScriptTag = $('script#refresh-token') || $('<script id="refresh-token"></script>');
        refreshScriptTag.html(`
          var refreshToken = "${refresh_token}";
          localStorage.setItem('refresh_token', "${refresh_token}");
        `);
        
        if (!$('script#refresh-token').length) {
          $('head').append(refreshScriptTag);
        }
        
        var options = {
          url: 'https://api.spotify.com/v1/me',
          headers: { 'Authorization': 'Bearer ' + access_token },
          json: true
        };

        // use the access token to access the Spotify Web API
        request.get(options, function(error, response, body) {
          console.log('User profile retrieved');
          console.log('User product type:', body.product);
          
          if (body.product !== 'premium') {
            console.warn('Warning: User does not have Spotify Premium. Some features may not work properly.');
          }
          
          // Store user data in localStorage script
          const userScriptTag = $('script#user-data') || $('<script id="user-data"></script>');
          userScriptTag.html(`
            var userData = {
              id: "${body.id}",
              display_name: "${body.display_name || ''}",
              email: "${body.email || ''}",
              product: "${body.product || 'free'}"
            };
            localStorage.setItem('userData', JSON.stringify(userData));
            
            // Redirect after setting up all data
            window.location.href = '/';
          `);
          
          if (!$('script#user-data').length) {
            $('head').append(userScriptTag);
          }
          
          fs.writeFileSync(htmlFilePath, $.html(), 'utf8');
          
          // Redirect to home page after setting up all data
          res.redirect('/');
        });
      } else {
        console.error('Error obtaining access token:', error || response.statusCode);
        res.redirect('/#' +
          querystring.stringify({
            error: 'invalid_token'
          }));
      }
    });
  }
});

// Add admin panel route
app.get('/admin', function(req, res) {
  res.sendFile(path.join(__dirname + '/views/admin.html'));
});

// Add diagnostics route to help debug
app.get('/diagnostics', function(req, res) {
  res.sendFile(path.join(__dirname + '/views/diagnostics.html'));
});

app.get('/api/diagnostics', function(req, res) {
  const diagnosticInfo = {
    node_version: process.version,
    env_vars_set: {
      client_id: !!process.env.CLIENT_ID,
      client_secret: !!process.env.CLIENT_SECRET
    },
    time: new Date().toISOString()
  };
  
  res.json(diagnosticInfo);
});

app.get('/refresh_token', function(req, res) {
  // requesting access token from refresh token
  var refresh_token = req.query.refresh_token;
  
  if (!refresh_token) {
    refresh_token = req.cookies.refresh_token;
    if (!refresh_token) {
      return res.status(400).json({ error: 'No refresh token provided' });
    }
  }
  
  console.log('Attempting to refresh access token');
  
  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    json: true
  };

  request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      console.log('Successfully refreshed access token');
      var access_token = body.access_token;
      
      // Update token in index.html
      try {
        const htmlFilePath = path.join(__dirname + '/views/index.html');
        const htmlContent = fs.readFileSync(htmlFilePath, 'utf8');  
        const $ = cheerio.load(htmlContent);
        const scriptTag = $('script#access-token');
        scriptTag.html('var accessToken = "' + access_token + '";');
        fs.writeFileSync(htmlFilePath, $.html(), 'utf8');
      } catch (e) {
        console.error('Error updating token in HTML:', e);
      }
      
      res.send({
        'access_token': access_token
      });
    } else {
      console.error('Error refreshing token:', error || response.statusCode);
      res.status(response.statusCode || 500).send({
        error: error || 'Failed to refresh token'
      });
    }
  });
});

console.log('Listening on 8888');
app.listen(8888);


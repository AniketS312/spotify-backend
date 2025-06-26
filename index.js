const express = require('express');
const app = express();  
const cookieParser = require('cookie-parser');
const querystring = require('querystring');
const PORT = process.env.PORT || 5000;
require('dotenv').config()

app.use(cookieParser());

const cors = require('cors')
const corsOptions = {
  origin: 'http://localhost:5173/', 
  optionsSuccessStatus: 200
}

const SpotifyStrategy = require('passport-spotify').Strategy;
const passport = require('passport');


passport.use(
  new SpotifyStrategy(
    {
      clientID: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
      callbackURL:  process.env.SPOTIFY_CALLBACK_URL ,
    },
    function (accessToken, refreshToken, expires_in, profile, done) {
      User.findOrCreate({spotifyId: profile.id}, function (err, user) {
        return done(err, user);
      });
    }
  )
);


app.get('/', (req, res) => {
    res.send('Welcome to the home page!');

});

app.get('/login', 
    cors(corsOptions),
    passport.authenticate('spotify', {
        scope: ['playlist-read-private', 'user-library-modify', 'user-library-read'],
        failureRedirect: '/error',
        showDialog: true
    })
);

app.get('/callback', cors(corsOptions), function (req, res) {
    const code = req.query.code || null;
    const error = req.query.error || null;

    if(error !== null) {
      res.status(400).redirect(`${process.env.SPOTIFY_CALLBACK_URL_FRONTEND}/?error=${error}`);
    } 
    if(code === null) {
      res.status(400).send('No code provided');
    }

    if(code !== null) {
      const params = new URLSearchParams();
      params.append('code', code);
      params.append('redirect_uri', process.env.SPOTIFY_CALLBACK_URL);
      params.append('grant_type', 'authorization_code');
      

      fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + Buffer.from(
            process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET).toString('base64')
        },
        json: true,
        body:  params.toString(),
      })
      .then(response => response.json())
      .then((data) =>{
        const expiresIn = data.expires_in; 
        const expiresAt = Date.now() + expiresIn * 1000; 

        res.cookie('access_token', data.access_token, { httpOnly: true, secure: false }); 
        res.cookie('expires_in', expiresAt, { httpOnly: true, secure: false }); 
        res.cookie('refresh_token', data.refresh_token, { httpOnly: true, secure: false }); 
        res.redirect(`${process.env.SPOTIFY_CALLBACK_URL_FRONTEND}/dashboard?`)});

    }
  
})


app.get('/error', (req, res) => {
    res.status(500).redirect('This is the error page!');
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

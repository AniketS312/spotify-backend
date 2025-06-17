const express = require('express');
const app = express();  
const PORT = process.env.PORT || 5000;
require('dotenv').config()

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
      callbackURL: process.env.SPOTIFY_CALLBACK_URL,
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

app.get('/test', 
    cors(corsOptions),
    passport.authenticate('spotify', {
        scope: ['playlist-read-private', 'user-library-modify', 'user-library-read'],
        failureRedirect: '/error',
        showDialog: true
    }),
    function (req, res) {
        // Successful authentication, redirect home.
        res.redirect('http://localhost:5173//home');
    }
);
app.get('/home', (req, res) => {
    res.send('This is the home page after successful authentication!');
});

app.get('/error', (req, res) => {
    res.send('This is the error page!');
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

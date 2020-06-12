import express from 'express';
import DeezerController from './controllers/DeezerController';
import SpotifyController from './controllers/SpotifyController';
import ProfileController from './controllers/ProfileController';
import TracklistController from './controllers/TracklistController';

const routes = express.Router();

const deezerController = new DeezerController();
const spotifyController = new SpotifyController();
const profileController = new ProfileController();
const tracklistController = new TracklistController();

routes.get('/profile',profileController.get);
routes.get('/tracklist',tracklistController.get);

// routes.get('/deezer/auth',deezerController.getAuth);
routes.get('/deezer/authcode',deezerController.checkCode);
// routes.get('/deezer/tracklist',deezerController.getTrackList);
// routes.post('/deezer/find',deezerController.findTrack);

// routes.get('/spotify/auth',spotifyController.getAuth);
routes.get('/spotify/authcode',spotifyController.checkCode);
routes.post('/spotify/findtrack',spotifyController.findTrack);
// routes.get('/spotify/tracklist',spotifyController.getTrackList);

export default routes; 
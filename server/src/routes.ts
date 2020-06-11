import express from 'express';
import DeezerController from './controllers/DeezerController';
import SpotifyController from './controllers/SpotifyController';

const routes = express.Router();

const deezerController = new DeezerController();
const spotifyController = new SpotifyController();

routes.get('/deezer/auth',deezerController.getAuth);
routes.get('/deezer/authcode',deezerController.checkCode);
routes.get('/deezer/tracklist',deezerController.getTrackList);
routes.post('/deezer/find',deezerController.findTrack);

routes.get('/spotify/auth',spotifyController.getAuth);
routes.get('/spotify/authcode',spotifyController.checkCode);
routes.get('/spotify/tracklist',spotifyController.getTrackList);
routes.post('/spotify/find',spotifyController.findTrack);

export default routes; 
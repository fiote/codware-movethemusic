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
routes.post('/deezer/findtrack',deezerController.findTrack);
routes.post('/deezer/logout',deezerController.logout);
// routes.get('/deezer/tracklist',deezerController.getTrackList);
// routes.post('/deezer/find',deezerController.findTrack);

// routes.get('/spotify/auth',spotifyController.getAuth);
routes.get('/spotify/authcode',spotifyController.checkCode);
routes.post('/spotify/findtrack',spotifyController.findTrack);
routes.post('/spotify/logout',spotifyController.logout);
// routes.get('/spotify/tracklist',spotifyController.getTrackList);

routes.post('/dosomething',(request: Request, response: Response) => {
	setTimeout(ev => {
		response.json({status:true});
	},1000);
});

export default routes; 
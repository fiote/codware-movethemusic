import express from 'express';
import DeezerController from './controllers/DeezerController';
import SpotifyController from './controllers/SpotifyController';
import ProfileController from './controllers/ProfileController';

const routes = express.Router();

const deezerController = new DeezerController();
const spotifyController = new SpotifyController();
const profileController = new ProfileController();

routes.get('/profile',profileController.get);
routes.get('/trackslist',profileController.tracklist);
routes.get('/albumslist',profileController.albumlist);
routes.get('/artistslist',profileController.artistlist);

routes.get('/deezer/authcode',deezerController.checkCode);
routes.get('/deezer/tracks/:page?/:lastid?',deezerController.loadTracks);
routes.get('/deezer/artists/:page?/:lastid?',deezerController.loadArtists);
routes.post('/deezer/find/tracks',deezerController.findTrack);
routes.post('/deezer/find/artists',deezerController.findArtist);
routes.post('/deezer/logout',deezerController.logout);

routes.get('/spotify/authcode',spotifyController.checkCode);
routes.get('/spotify/tracks/:page?/:lastid?',spotifyController.loadTracks);
routes.get('/spotify/artists/:page?/:lastid?',spotifyController.loadArtists); 
routes.post('/spotify/find/tracks',spotifyController.findTrack);
routes.post('/spotify/find/artists',spotifyController.findArtist);
routes.post('/spotify/logout',spotifyController.logout);

routes.post('/dosomething',(request: Request, response: Response) => {
	setTimeout(ev => {
		response.json({status:true});
	},1000);
});

export default routes; 
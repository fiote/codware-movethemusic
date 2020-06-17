import express, { Request, Response, NextFunction} from 'express';
import DeezerController from './controllers/DeezerController';
import SpotifyController from './controllers/SpotifyController';
import ProfileController from './controllers/ProfileController';


const routes = express.Router();

const deezerController = new DeezerController();
const spotifyController = new SpotifyController();
const profileController = new ProfileController();

routes.use((request:Request, response:Response, next:NextFunction) => {

	request.getData = function(key:string, defvalue:any | undefined) {
		return request.session[key] || defvalue;
	}

	request.clearData = function(keys:string[]) {
		return new Promise(resolve => {
			for (var key of keys) {
				request.session[key] = null;
			}
			request.session.save(resolve);
		});
	}

	request.setData = function(key:string, newvalue:any) {
		return new Promise(resolve => {
			request.session[key] = newvalue;
			request.session.save(resolve);
		});
	}

	next();
});

routes.get('/profile',profileController.get);
routes.get('/trackslist',profileController.tracklist);
routes.get('/albumslist',profileController.albumlist);
routes.get('/artistslist',profileController.artistlist);

routes.get('/deezer/authcode',deezerController.checkCode);
routes.get('/deezer/tracks/:page?/:lastid?',deezerController.loadTracks);
routes.get('/deezer/albums/:page?/:lastid?',deezerController.loadAlbums);
routes.get('/deezer/artists/:page?/:lastid?',deezerController.loadArtists);
routes.post('/deezer/find/tracks',deezerController.findTrack);
routes.post('/deezer/find/albums',deezerController.findAlbum);
routes.post('/deezer/find/artists',deezerController.findArtist);
routes.post('/deezer/logout',deezerController.logout);

routes.get('/spotify/authcode',spotifyController.checkCode);
routes.get('/spotify/tracks/:page?/:lastid?',spotifyController.loadTracks);
routes.get('/spotify/albums/:page?/:lastid?',spotifyController.loadAlbums);
routes.get('/spotify/artists/:page?/:lastid?',spotifyController.loadArtists);
routes.post('/spotify/find/tracks',spotifyController.findTrack);
routes.post('/spotify/find/albums',spotifyController.findAlbum);
routes.post('/spotify/find/artists',spotifyController.findArtist);
routes.post('/spotify/logout',spotifyController.logout);

routes.post('/dosomething',(request: Request, response: Response) => {
	setTimeout(ev => {
		response.json({status:true});
	},1000);
});

export default routes;
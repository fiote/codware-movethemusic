import { Request, Response } from 'express';
import DeezerController from './DeezerController';
import SpotifyController from './SpotifyController';
import Compare from '../classes/Compare'; 
import Cache from '../classes/Cache';

class ProfileController {
	async get(request: Request, response: Response) {
		const data = {
			deezer: DeezerController.getLogged(request),
			spotify: SpotifyController.getLogged(request),
		};
		
		response.json(data);
	}

	async tracklist(request: Request, response: Response) {		
		const dztracks = DeezerController.getTracks(request);
		const sptracks =  SpotifyController.getTracks(request);
		const tracks = Compare.mergeTracks('deezer', dztracks || [], 'spotify', sptracks || []);
	 	response.json({status: (sptracks || dztracks) ? true : false, list: tracks});
	}

	async artistlist(request: Request, response: Response) {	
		const dz = DeezerController.getArtists(request);
		const sp =  SpotifyController.getArtists(request);
		const artists = Compare.mergeArtists('deezer', dz, 'spotify', sp);
	 	response.json({status: (sp || dz) ? true : false, list: artists});
	}

	async albumlist(request: Request, response: Response) {	
		const sp = Cache.sessionGet(request,'spotify-artists-list') || [];
		const dz = Cache.sessionGet(request,'deezer-artists-list') || [];
		// const tracks = Compare.mergeLists('deezer', dztracks || [], 'spotify', sptracks || []);
	 	response.json({status: (sp || dz) ? true : false, sp, dz});
	}
}

export default ProfileController;
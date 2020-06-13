import { Request, Response } from 'express';
import DeezerController from './DeezerController';
import SpotifyController from './SpotifyController';
import Compare from '../classes/Compare'; 

class TracklistController {
	async get(request: Request, response: Response) {		
		const sptracks = await SpotifyController.getTracks(request);
		const dztracks = await DeezerController.getTracks(request);

		const tracks = Compare.mergeLists('deezer', dztracks.tracks || [], 'spotify', sptracks.tracks || []);
	 	response.json({status: sptracks.status || dztracks.status, tracks});
	}
}

export default TracklistController;
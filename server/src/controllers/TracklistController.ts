import { Request, Response } from 'express';
import DeezerController from './DeezerController';
import SpotifyController from './SpotifyController';
import Compare from '../classes/Compare'; 

class TracklistController {
	async get(request: Request, response: Response) {		
		const sptracks = SpotifyController.getTracklist(request);
		const dztracks = DeezerController.getTracklist(request);
		const tracks = Compare.mergeLists('deezer', dztracks || [], 'spotify', sptracks || []);
	 	response.json({status: sptracks || dztracks, tracks, sptracks, dztracks});
	}
	
	async load(request: Request, response: Response) {		
		const { params, query, body} = request;
		
		const platform = request.params.platform;

		const info = (platform == 'deezer') ? await DeezerController.getTracksInfo(request) : null;

		response.json({info});

	}
}

export default TracklistController;
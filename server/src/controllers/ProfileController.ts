import { Request, Response } from 'express';
import DeezerController from './DeezerController';
import SpotifyController from './SpotifyController';

class ProfileController {
	async get(request: Request, response: Response) {
		const data = {
			deezer: DeezerController.getLogged(request),
			spotify: SpotifyController.getLogged(request),
		};
		
		response.json(data);
	}
}

export default ProfileController;
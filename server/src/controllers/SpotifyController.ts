import { Request, Response } from 'express';
import axios from 'axios';

const client_id = process.env.SPOTIFY_CLIENTID;

const redirect_uri = encodeURIComponent(process.env.REDIRECT_URL+'/spotify/callback');
const authUrl = 'https://accounts.spotify.com/authorize?response_type=token&client_id='+client_id+'&scope='+encodeURIComponent('user-library-read')+'&redirect_uri='+redirect_uri;

const SpotifyDefault = null;

function getSpotifyData(request: Request) {
	const data = request.session?.spotifyData || SpotifyDefault;
	return data as {
		auth: string,
		userId: string,
		playlistId: number
	}
}

class SpotifyController {
	async getAuth(request: Request, response: Response) {
		var spotifyData = getSpotifyData(request);				
		return response.json({logged: spotifyData ? true : false, authUrl});
	}
	
	async checkCode(request: Request, response: Response) {
		const accessToken = request.query.access_token;
		console.log('accessToken',accessToken);

		function failure(msg: string) { response.json({status:false,error:msg}) }
		function success() { response.json({status:true}) }

		if (accessToken) {
			const spotifyData = {auth:accessToken, userId:null};	
			
			const result = await axios.get('https://api.spotify.com/v1/me',{headers:{'Authorization':'Bearer '+accessToken}});
			spotifyData.userId = result?.data?.id;
			if (!spotifyData.userId) return failure('no_user_id');

			if (request.session) {				
				request.session.spotifyData = spotifyData;
				request.session.save(() => { success(); });
				return;
			} else {
				return failure('no_session');
			}
		}		
		return failure('no_code');
	}
	
	async getTrackList(request: Request, response: Response) {
		var spotifyData = getSpotifyData(request);
		if (!spotifyData) return response.json({status:false, error:'no_data'});

		var page = Number(request.params.page) || 1;
		var limit = 20;
		var offset = (page-1)*limit;
			
		const result = await axios.get('https://api.spotify.com/v1/me/tracks?offset=0&limit=20',{headers:{'Authorization':'Bearer '+spotifyData.auth}})
		const tracks = result.data.items.map((item:any) => {
			const track = item.track;

			let data = {
				id: track.id,
				title: track.name,
				artist: track.artists[0].name,
				album: track.album.name,
				ctitle: '', cartist: '', calbum:''
			};
			data.ctitle = data.title.toLowerCase();
			data.cartist = data.artist.toLowerCase();
			data.calbum = data.album.toLowerCase();

			return data;
		});

		return response.json(tracks);

			
	}
}

export default SpotifyController;
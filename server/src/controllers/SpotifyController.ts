import { Request, Response } from 'express';
import Cache from '../classes/Cache';
import Compare from '../classes/Compare'; 
import axios from 'axios';

const client_id = process.env.SPOTIFY_CLIENTID;

const redirect_uri = encodeURIComponent(process.env.REDIRECT_URL+'/spotify/callback');
const authUrl = 'https://accounts.spotify.com/authorize?response_type=token&client_id='+client_id+'&scope='+encodeURIComponent('user-library-read user-library-modify')+'&redirect_uri='+redirect_uri;

function getSpotifyData(request: Request) {
	console.log('getSpotifyData');
	const data = request?.session?.spotifyData || Cache.get('spotifyData');
	console.log(data);
	return data as {auth: string, userId: string, playlistId: number}
}

class SP {
	static headers() {
		const data = getSpotifyData();
		return {'Authorization':'Bearer '+data?.auth};
	}

	static get(endpoint: string, authed: boolean) {
		const options = {};
		if (authed) options.headers = SP.headers();
		return axios.get('https://api.spotify.com/v1'+endpoint,options).catch(ev => {});
	}

	static post(endpoint: string, data: any) {
		const options = {};
		options.headers = SP.headers();
		return axios.post('https://api.spotify.com/v1'+endpoint,data,options).catch(ev => {});
	}

	static put(endpoint: string, data: any) {
		const options = {};
		options.headers = SP.headers();
		return axios.put('https://api.spotify.com/v1'+endpoint,data,options);
	}
}

async function spotify(endpoint: string, authed: boolean) {
	const options = {};
	if (authed) {
		const data = getSpotifyData();
		options.headers = {headers:{'Authorization':'Bearer '+data.auth}};
	}
	return await axios.get('https://api.spotify.com/v1'+endpoint,options);
}

class SpotifyController {
	async getAuth(request: Request, response: Response) {
		var spotifyData = getSpotifyData(request);
		return response.json({logged: spotifyData ? true : false, authUrl});
	}
	
	async checkCode(request: Request, response: Response) {
		const accessToken = request.query.access_token;

		function failure(msg: string) { response.json({status:false,error:msg}) }
		function success() { response.json({status:true}) }

		if (accessToken) {
			const spotifyData = {auth:accessToken};				
			if (request.session) {		
				Cache.set('spotifyData',spotifyData);
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
			
		SP.get('/me/tracks?offset=0&limit=20',true).then(result => {
			const resultlist = result?.data?.items;
			if (!resultlist) {
				console.log('getTrackList no result');
				Cache.remove('spotifyData',request);
				response.json({status:false});
			}
			const tracks = resultlist.map((item:any) => getSpotifyTrackData(item.track));
			return response.json({status:true,tracks});
		}).catch(feed => {
			const {status, statusText} = feed.response;
			response.json({status:false, message:status+' - '+statusText});
		});
	}

	async findTrack(request: Request, response: Response) {
		var spotifyData = getSpotifyData(request);
		if (!spotifyData) return response.json({status:false});

		const track = request.body;
		const data = Compare.getData(track);
		
		const q = ['track:'+data.title,'album:'+data.album,'artist:'+data.artist];
		const result = await SP.get('/search?q='+encodeURIComponent(q.join(' '))+'&type=track',true);
		const resultlist = result?.data?.tracks;

		if (!resultlist) {
			console.log('findTrack no result');
			Cache.remove('spotifyData',request);
			return response.json({status:false});
		}
		
		const tracklist = resultlist.items.map(getSpotifyTrackData);
		const match = Compare.matchInList(track, tracklist);

		if (!match) return response.json({status:false, data, tracklist});

		SP.put('/me/tracks?ids='+match.track.id).then(feed => {
			response.json({status:true, code:'sptrack'});
		}).catch(feed => {
			const {status, statusText} = feed.response;
			response.json({status:false, message:status+' - '+statusText});
		})
		
	}
}

function getSpotifyTrackData(track: any) {
	let data = {
		id: track.id,
		title: track.name,
		artist: track.artists[0].name,
		album: track.album.name,
		url: track.external_urls.spotify,
		ctitle: '', cartist: '', calbum:''
	};

	data.ctitle = data.title.replace(/\s*\(.*?\)\s*/g, "").toLowerCase();
	data.cartist = data.artist.toLowerCase();
	data.calbum = data.album.toLowerCase();

	return data;
}

export default SpotifyController;
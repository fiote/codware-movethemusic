import { Request, Response } from 'express';
import Cache from '../classes/Cache';
import axios from 'axios';
import Compare from '../classes/Compare'; 
import Pager from '../classes/Pager'; 
import { TrackListData, TrackData, MergedTrack, MergedArtist } from '../types';

const client_id = process.env.SPOTIFY_CLIENTID;

const redirect_uri = encodeURIComponent(process.env.REDIRECT_URL+'/spotify/callback');
const authUrl = 'https://accounts.spotify.com/authorize?response_type=token&client_id='+client_id+'&scope='+encodeURIComponent('user-library-read user-library-modify user-follow-read user-follow-modify')+'&redirect_uri='+redirect_uri;

class SP {
	static data(request: Request) {
		const data = Cache.sessionGet(request, 'spotifyData');
		return data as {auth: string, userId: string, playlistId: number};
	}

	static base(request: Request, type: string, options: any) {
		if (type == 'tracks') {
			return '/me/tracks?limit='+options.ilimit+'&offset='+options.ioffset;
		}
		if (type == 'artists') {
			return '/me/following?type=artist'+(options.lastid ? ('&after='+options.lastid) : '');
		}
	}

	async static logout(request: Request) {
		await Cache.remove('spotifyData',request);	
		await Cache.remove('spotify-tracks-list',request);
		await Cache.remove('spotify-artists-list',request);
	}

	static headers(request: Request) {
		const data = SP.data(request);
		return {'Authorization':'Bearer '+data?.auth};
	}

	static get(request: Request, endpoint: string, authed: boolean) {
		const options = {};
		if (authed) options.headers = SP.headers(request);
		if (!endpoint.includes('http')) endpoint = 'https://api.spotify.com/v1'+endpoint;
		return axios.get(endpoint,options);
	}

	static post(request: Request, endpoint: string, data: any) {
		const options = {};
		options.headers = SP.headers(request);
		return axios.post('https://api.spotify.com/v1'+endpoint,data,options);
	}

	static put(request: Request, endpoint: string, data: any) {
		const options = {};
		options.headers = SP.headers(request);
		return axios.put('https://api.spotify.com/v1'+endpoint,data,options);
	}

	static new(data) : TrackData {
		return SP.addc(data);
	}

	static addc(track: any) {
		track.ctitle = track.title?.replace(/\s*\(.*?\)\s*/g, "").toLowerCase();
		track.cartist = track.artist?.toLowerCase();
		track.calbum = track.album?.toLowerCase();
		return track;
	}

	static getResultList(type:string, data:any) {
		if (type == 'tracks') {
			return data.items;
		}
		if (type == 'artists') {
			return data.items;
		}
	}

	static parsePage(type:string, data:any) {
		if (type == 'tracks') {
			return {
				entries: data.items,
				next: data.next,
				total: data.total
			}
		}
		if (type == 'artists') {
			return {
				entries: data.artists.items,
				next: data.artists.next,
				total: data.artists.total
			}
		}
	}

	static parseEntity(type: string, entry:any) {
		if (type == 'tracks') {
			if (entry.track) entry = entry.track;
			const data = {
				id: entry.id,
				title: entry.name,
				artist: entry.artists[0].name,
				album: entry.album.name,
				image_url: entry.album.images.find(image => image.width <= 400)?.url
			};
			return SP.addc(data);
		}
		if (type == 'artists') {
			const data = {
				id: entry.id,
				artist: entry.name,
				image_url: entry.images.find(image => image.width <= 400)?.url
			}	
			return SP.addc(data);
		}
	}
}

const pager = new Pager('spotify', SP, {
	keylimit: 'limit',
	keyoffset: 'offset'
});

class SpotifyController {
	
	// ============= AUTH ================================================================

	static getLogged(request: Request) {
		const data = SP.data(request);
		return {logged: data?.auth ? true : false, authUrl};
	}
	
	async checkCode(request: Request, response: Response) {
		const accessToken = request.query.access_token;
		if (!accessToken) return response.json({status:false, error:'no_acess_token'});

		await SP.logout(request);

		const spotifyData = {auth:accessToken};				
		await Cache.sessionSet(request, 'spotifyData', spotifyData);

		const saved = Cache.sessionGet(request, 'spotifyData');
		return response.json({status:true});
	}

	async logout(request: Request, response: Response) {
		await SP.logout(request);		
		response.json({status:true});
	}
	
	// ============= DATA ================================================================

	
	// ============= TRACKS ==============================================================

	async loadTracks(request: Request, response: Response) {
		pager.loadEntities(request, response, 'tracks');
	}
	
	async findTrack(request: Request, response: Response) {
		const body = request.body as MergedTrack;
		const data = Compare.getDataTrack(body);
		const q = ['track:'+data.title,'album:'+data.album,'artist:'+data.artist];

		SP.get(request, '/search?q='+encodeURIComponent(q.join(' '))+'&type=track',true).then(result => {
			const resultlist = result?.data?.tracks;
			if (!resultlist) return response.json({status:false, q, error:'no_resultlist', result});

			const parsedlist = resultlist.items.map(item => SP.parseEntity('tracks',item));
			const match = Compare.matchTrackInList(body, parsedlist);			
			if (!match) return response.json({status:false, error:'no_match', data, parsedlist});
			const found_id = match.found.id;

			SP.put(request, '/me/tracks?ids='+found_id).then(async feed => {
				const {title, artist, album} = body;
				const newentry = SP.new({id: found_id, title, artist, album});
				await SpotifyController.pushTrack(request, newentry);
				response.json({status:true, newentry});
			}).catch(feed => {
				response.json({status:false, error:'failed_to_add', feed});
			})
		}).catch(async feed => {
			await SP.logout(request);
			response.json({status:false, error:'failed_to_search', logout:true, feed});
		})	
	}

	static getTracks(request: Request) {
		return Cache.sessionGet(request,'spotify-tracks-list') || [];
	}

	async static setTracks(request: Request, fulllist:any[]) {		
		await Cache.sessionSet(request,'spotify-tracks-list',fulllist);
	}

	async static pushTrack(request: Request, newentry: any) {		
		const fulllist = SpotifyController.getTracks(request);
		fulllist.push(newentry);
		await SpotifyController.setTracks(request,fulllist);
	}
	
	// ============= ARTISTS =============================================================

	async loadArtists(request: Request, response: Response) {
		pager.loadEntities(request, response, 'artists');
	}

	async findArtist(request: Request, response: Response) {
		const body = request.body as MergedArtist;
		const data = Compare.getDataArtist(body);		
		const q = [data.artist];
		console.log(q);

		
		SP.get(request, '/search?q='+encodeURIComponent(q.join(' '))+'&type=artist',true).then(result => {
			const resultlist = result?.data?.artists;
			if (!resultlist) return response.json({status:false, q, error:'no_resultlist', result});
			
			const parsedlist = resultlist.items.map(item => SP.parseEntity('artists',item));
			const match = Compare.matchArtistInList(body, parsedlist);			
			if (!match) return response.json({status:false, error:'no_match', data, parsedlist});

			const found_id = match.found.id;
			
			SP.put(request, '/me/following?type=artist&ids='+found_id).then(async feed => {
				const { artist } = body;
				const newentry = SP.new({id:found_id, artist});
				await SpotifyController.pushArtist(request, newentry);
				response.json({status:true, newentry, mtype:match.mtype});
			}).catch(feed => {
				response.json({status:false, error:'failed_to_add', feed});
			})
		}).catch(async feed => {
			await SP.logout(request);
			response.json({status:false, error:'failed_to_search', logout:true, feed});
		});
	}

	static getArtists(request: Request) {
		return Cache.sessionGet(request,'spotify-artists-list') || [];
	}

	async static setArtists(request: Request, fulllist:any[]) {		
		await Cache.sessionSet(request,'spotify-artists-list',fulllist);
	}

	async static pushArtist(request: Request, newentry: any) {		
		const fulllist = SpotifyController.getArtists(request);
		fulllist.push(newentry);
		await SpotifyController.setArtists(request, fulllist);
	}
}


export default SpotifyController;
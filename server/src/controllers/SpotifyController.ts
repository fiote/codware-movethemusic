import { Request, Response } from 'express';
import Cache from '../classes/Cache';
import axios from 'axios';
import Compare from '../classes/Compare'; 
import { TrackListData, TrackData, MergedData } from '../types';

const client_id = process.env.SPOTIFY_CLIENTID;

const redirect_uri = encodeURIComponent(process.env.REDIRECT_URL+'/spotify/callback');
const authUrl = 'https://accounts.spotify.com/authorize?response_type=token&client_id='+client_id+'&scope='+encodeURIComponent('user-library-read user-library-modify')+'&redirect_uri='+redirect_uri;

class SP {
	static data(request: Request) {
		const data = Cache.sessionGet(request, 'spotifyData');
		return data as {auth: string, userId: string, playlistId: number};
	}

	async static logout(request: Request) {
		await Cache.remove('spotifyData',request);	
		await Cache.remove('spotifyTracklist',request);	
	}

	static headers(request: Request) {
		const data = SP.data(request);
		return {'Authorization':'Bearer '+data?.auth};
	}

	static get(request: Request, endpoint: string, authed: boolean) {
		const options = {};
		if (authed) options.headers = SP.headers(request);
		return axios.get('https://api.spotify.com/v1'+endpoint,options);
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

	static new(id, title, artist, album) : TrackData {
		const data = {id, title, artist, album};
		return SP.addc(data);
	}

	static addc(track: TrackData) : TrackData{
		track.ctitle = track.title.replace(/\s*\(.*?\)\s*/g, "").toLowerCase();
		track.cartist = track.artist.toLowerCase();
		track.calbum = track.album.toLowerCase();
		return track;
	}

	static parse(track: any) : TrackData {
		const data: TrackData = {
			id: track.id,
			title: track.name,
			artist: track.artists[0].name,
			album: track.album.name,
			image_url: track.album.images.find(image => image.width <= 300).url
		};
		return SP.addc(data);
	}
}

class SpotifyController {
	static getLogged(request: Request) {
		const data = SP.data(request);
		return {logged: data?.auth ? true : false, authUrl};
	}

	static getTracklist(request: Request) {
		return Cache.sessionGet(request,'spotifyTracklist') || [];
	}

	static setTracklist(request: Request, tracks: any[]) {
		return Cache.sessionSet(request,'spotifyTracklist',tracks);
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

	async loadTracks(request: Request, response: Response) {
		const data = SP.data(request);
		if (!data) return response.json({status:false, error:'no_session_data'});

		const ipage = Number(request.params.page) || 1;		
		const tracks = SpotifyController.getTracklist(request);
		const pagedata = await SpotifyController.getTracksPage(request, ipage);

		pagedata.tracks.forEach(track => {
			var exists = tracks.find(saved => saved.id == track.id);
			if (!exists) tracks.push(track);
		});
		
		await SpotifyController.setTracklist(request,tracks);

		const loaded = tracks.length;
		const total = pagedata.total;
		const next = (loaded < total && pagedata.next) ? ipage+1 : null;	
		response.json({status:true, next, loaded, total, done:loaded >= total});
	}
	
	async static getTracksPage(request: Request, ipage: number) {
		const data = SP.data(request);

		const ilimit = 50;
		let ioffset = (ipage-1)*ilimit;		

		return new Promise(resolve => {
			SP.get(request, '/me/tracks?offset='+ioffset+'&limit='+ilimit, true).then(async result => {
				const resultlist = result?.data?.items;
				if (!resultlist) {
					await SP.logout(request);
					return resolve({status:false, logout:true});
				}
				const tracks = resultlist.map((item:any) => SP.parse(item.track));
				const next = result?.data?.next;
				const total = result.data.total;
				return resolve({status:true, next, tracks, total});
			}).catch(async result => {
				await SP.logout(request);
				const feed = result.toJSON();
				resolve({status:false, error:feed, logout:true});
			});
		});	

	}
	
	async findTrack(request: Request, response: Response) {
		const track = request.body as MergedData;
		const data = Compare.getData(track);

		const q = ['track:'+data.title,'album:'+data.album,'artist:'+data.artist];

		SP.get(request, '/search?q='+encodeURIComponent(q.join(' '))+'&type=track',true).then(result => {
			const resultlist = result?.data?.tracks;

			if (!resultlist) {
				// SP.logout(request);
				return response.json({status:false, q, error:'no_resultlist', result});
			}
			
			const tracklist = resultlist.items.map(item => SP.parse(item));
			const match = Compare.matchInList(track, tracklist);
			
			if (!match) return response.json({status:false, error:'no_match', data, tracklist});
			const track_id = match.track.id;

			SP.put(request, '/me/tracks?ids='+track_id).then(async feed => {
				const {title, artist, album} = track;
				const newtrack = SP.new(track_id, title, artist, album);

				const tracklist = SpotifyController.getTracklist(request);
				tracklist.push(newtrack);
				await SpotifyController.setTracklist(request,tracklist);
				
				response.json({status:true, newtrack});
			}).catch(feed => {
				// SP.logout(request);
				response.json({status:false, error:'failed_to_add', feed});
			})
		}).catch(async feed => {
			await SP.logout(request);
			response.json({status:false, error:'failed_to_search', logout:true, feed});
		})	
	}

	async logout(request: Request, response: Response) {
		await SP.logout(request);		
		response.json({status:true});
	}
}


export default SpotifyController;
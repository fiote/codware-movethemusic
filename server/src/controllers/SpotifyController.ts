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
	
	async checkCode(request: Request, response: Response) {
		const accessToken = request.query.access_token;
		if (!accessToken) return response.json({status:false, error:'no_acess_token'});

		await SP.logout(request);

		const spotifyData = {auth:accessToken};				
		await Cache.sessionSet(request, 'spotifyData', spotifyData);

		const saved = Cache.sessionGet(request, 'spotifyData');
		return response.json({status:true});
	}

	async static getTracks(request: Request, forceRefresh: bool) : TrackListData {		
		if (!forceRefresh) {
			const savedTracks = Cache.sessionGet(request,'spotifyTracklist');		
			if (savedTracks) return {status:true, tracks:savedTracks};
		}		

		let tracks = [];
		const ilimit = 20;
		let fetching = true;
		let ipage = 1;

		while (fetching) {
			fetching = false;
			let ioffset = (ipage-1)*ilimit;		
			const result = await SpotifyController.getTracksPage(request, '/me/tracks?offset='+ioffset+'&limit='+ilimit);
			if (result.status) {
				tracks.push(...result.tracks);
				if (result.next) {
					fetching = true;
					ipage++;
				}
			} else {
				return {status:true};
			}
		} 

		await Cache.sessionSet(request,'spotifyTracklist',tracks);
		return {status:true,tracks} as TrackListData;
	}
	
	async static getTracksPage(request: Request, pageurl: string) {
		return new Promise(resolve => {
			SP.get(request, pageurl, true).then(async result => {
				const resultlist = result?.data?.items;
				if (!resultlist) {
					await SP.logout(request);
					return resolve({status:false, logout:true});
				}
				const tracks = resultlist.map((item:any) => SP.parse(item.track));
				const next = result?.data?.next;
				return resolve({status:true, next, tracks});
			}).catch(async result => {
				await SP.logout(request);
				return resolve({status:false, logout:true});
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
				await Cache.sessionPush(request, 'spotifyTracklist', newtrack);
				response.json({status:true, newtrack});
			}).catch(feed => {
				// SP.logout(request);
				response.json({status:false, error:'failed_to_add', feed});
			})
		}).catch(feed => {
			SP.logout(request);
			response.json({status:false, error:'failed_to_search', logout:true, feed});
		})	
	}

	async logout(request: Request, response: Response) {
		await SP.logout(request);		
		response.json({status:true});
	}
}


export default SpotifyController;
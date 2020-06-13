import { Request, Response } from 'express';
import Cache from '../classes/Cache';
import axios from 'axios';
import Compare from '../classes/Compare'; 
import { TrackListData, TrackData, MergedData } from '../types';
  
const app_id = process.env.DEEZER_APPID;
const secret_key = process.env.DEEZER_SECRETKEY;

const redirect_uri = encodeURIComponent(process.env.REDIRECT_URL+'/deezer/callback');
const authUrl = 'https://connect.deezer.com/oauth/auth.php?app_id='+app_id+'&redirect_uri='+redirect_uri+'&perms=basic_access,email,manage_library';		

interface DzTrackData {
	id: number,
	title: string,
	artist: {
		name: string
	},
	album: {
		title: string,
	}
}

class DZ {
	static data(request: Request) {
		const data = Cache.sessionGet(request, 'deezerData');
		return data as {auth: string, userId: string, playlistId: number};
	}

	async static logout(request: Request) {
		await Cache.remove('deezerData',request);	
		await Cache.remove('deezerTracklist',request);	
	}

	static get(request: Request, endpoint: string, authed: boolean) {
		if (endpoint.indexOf('?') < 0) endpoint += '?foo';
		if (authed) endpoint += '&' + DZ.data(request).auth;
		return axios.get('https://api.deezer.com'+endpoint);
	}

	static post(request: Request, endpoint: string, authed: boolean) {
		if (endpoint.indexOf('?') < 0) endpoint += '?foo';
		if (authed) endpoint += '&' + DZ.data(request).auth;
		return axios.post('https://api.deezer.com'+endpoint);
	}

	static new(id, title, artist, album) : TrackData {
		const data = {id, title, artist, album};
		return DZ.addc(data);
	}

	static addc(track: TrackData) : TrackData{
		track.ctitle = track.title.replace(/\s*\(.*?\)\s*/g, "").toLowerCase();
		track.cartist = track.artist.toLowerCase();
		track.calbum = track.album.toLowerCase();
		return track;
	}

	static parse(track: DzTrackData) : TrackData {
		const data : TrackData = {
			id: track.id,
			title: track.title,
			artist: track.artist.name,
			album: track.album.title,
			image_url: track.album.cover_medium,
			ctitle: '', cartist: '', calbum:''
		};
		return DZ.addc(data);
	}
}

class DeezerController {
	static getLogged(request: Request) {
		const data = DZ.data(request);
		return {logged: data?.auth ? true : false, authUrl};
	}
	
	static async getUserId(request: Request) {
		return new Promise(resolve => {
			DZ.get(request, '/user/me', true).then(result => {
				resolve(result?.data?.id);
			}).catch(result => {
				resolve(null);
			});
		});
	}
	
	static async getPlaylistId(request: Request) {
		const deezerData = Cache.sessionGet(request, 'deezerData');

		return new Promise(resolve => {
			DZ.get(request, '/user/'+deezerData.userId+'/playlists', true).then(result => {
				const playlistId = result?.data?.data?.find(playlist => playlist.is_loved_track)?.id;
				resolve(playlistId);
			}).catch(result => {
				resolve(null);
			});
		});
	}

	async checkCode(request: Request, response: Response) {
		const authCode = request.query.code;
		if (!authCode) return response.json({status:false, error:'no_auth_code'});
		
		await DZ.logout(request);

		const result = await axios.get('https://connect.deezer.com/oauth/access_token.php?app_id='+app_id+'&secret='+secret_key+'&code='+authCode);
		const authData = result?.data;
		if (!authData || authData == 'wrong code') return response.json({status:false, error:'bad_auth_code'})
		
		const deezerData = {auth:authData, userId:null, playlistId:null};	
		await Cache.sessionSet(request, 'deezerData', deezerData);

		deezerData.userId = await DeezerController.getUserId(request);
		if (!deezerData.userId) {
			await DZ.logout(request);
			return response.json({status:false, error:'no_user_id', logout:true});
		}
		await Cache.sessionSet(request, 'deezerData', deezerData);

		deezerData.playlistId = await DeezerController.getPlaylistId(request);
		if (!deezerData.playlistId) {
			await DZ.logout(request);
			return response.json({status:false, error:'no_playlist_id', logout:true});
		}
		await Cache.sessionSet(request, 'deezerData', deezerData);

		response.json({status:true});
	}

	async static getTracks(request: Request, forceRefresh: bool) : TrackListData {
		const data = DZ.data(request);
		if (!data) return {status:false};

		if (!forceRefresh) {
			const savedTracks = Cache.sessionGet(request,'deezerTracklist');		
			if (savedTracks) return {statust:true, tracks:savedTracks};
		}

		let tracks = [];
		const ilimit = 100;
		let fetching = true;
		let ipage = 1;

		while (fetching) {
			fetching = false;
			let ioffset = (ipage-1)*ilimit;		
			const result = await DeezerController.getTracksPage(request, '/playlist/'+data.playlistId+'/tracks?limit='+ilimit+'&index='+ioffset);
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

		await Cache.sessionSet(request,'deezerTracklist',tracks);
		return {status:true, tracks};
	}

	async static getTracksPage(request: Request, pageurl: string) {
		return new Promise(resolve => {
			DZ.get(request, pageurl, true).then(async result => {
				const resultlist = result?.data?.data;
				if (!resultlist) {
					await DZ.logout(request);
					return resolve({status:false, logout:true});
				}
				const tracks = resultlist.map(item => DZ.parse(item));
				const next = result?.data?.next;
				return resolve({status:true, next, tracks});
			}).catch(result => {
				return resolve({status:false});
			});
		});	
	}

	async findTrack(request: Request, response: Response) {
		const track = request.body as MergedData;
		const data = Compare.getData(track);

		const q = [data.title,data.artist,data.album]; // ,'album:'+data.album,'artist:'+data.artist];

		DZ.get(request, '/search/track?q='+encodeURIComponent(q.join(' ')),true).then(async result => {
			const resultlist = result?.data?.data;
			if (!resultlist) {
				await DZ.logout(request);
				return resolve({status:false, logout:true});
			}
			const tracklist = resultlist.map(item => DZ.parse(item));
			const match = Compare.matchInList(track, tracklist);
			
			if (!match) return response.json({status:false, error:'no_match', data, tracklist});
			const track_id = match.track.id;

			DZ.post(request, '/user/me/tracks?track_id='+track_id, true).then(async feed => {
				const {title, artist, album} = track;
				const newtrack = DZ.new(track_id, title, artist, album);
				await Cache.sessionPush(request, 'deezerTracklist', newtrack);
				response.json({status:true, newtrack});
			}).catch(feed => {
				response.json({status:false, error:'failed_to_add', feed});
			})
		});
	}
}

export default DeezerController;
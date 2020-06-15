import { Request, Response } from 'express';
import Cache from '../classes/Cache';
import axios from 'axios';
import Compare from '../classes/Compare'; 
import Pager from '../classes/Pager'; 

import { TrackListData, TrackData, MergedTrack } from '../types';
  
const app_id = process.env.DEEZER_APPID;
const secret_key = process.env.DEEZER_SECRETKEY;

const redirect_uri = encodeURIComponent(process.env.REDIRECT_URL+'/deezer/callback');
const authUrl = 'https://connect.deezer.com/oauth/auth.php?app_id='+app_id+'&redirect_uri='+redirect_uri+'&perms=offline_access,manage_library';

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

	static base(request:Request, type:string, options:any) {
		if (type == 'tracks') {
			const data = DZ.data(request);
			return '/playlist/'+data.playlistId+'/tracks?limit='+options.ilimit+'&index='+options.ioffset;
		}
		if (type == 'artists') {
			return '/user/me/artists&limit='+options.ilimit+'&index='+options.ioffset;
		}
		if (type == 'albums') {
			return '/user/me/albums&limit='+options.ilimit+'&index='+options.ioffset;
		}
	}

	async static logout(request: Request) {
		await Cache.remove('deezerData',request);	
		await Cache.remove('deezerTracklist',request);	
		await Cache.remove('deezer-tracks-list',request);	
		await Cache.remove('deezer-artists-list',request);	
	}

	static get(request: Request, endpoint: string, authed: boolean) {
		if (!endpoint.includes('http')) {
			if (endpoint.indexOf('?') < 0) endpoint += '?foo';
			if (authed) {
				const data = DZ.data(request);
				if (data) endpoint += '&' + data.auth;
			}
			endpoint = 'https://api.deezer.com'+endpoint;
		}
		return axios.get(endpoint);
	}

	static post(request: Request, endpoint: string, authed: boolean) {
		if (endpoint.indexOf('?') < 0) endpoint += '?foo';
		if (authed) endpoint += '&' + DZ.data(request).auth;
		return axios.post('https://api.deezer.com'+endpoint);
	}

	static new(data) : TrackData {
		return DZ.addc(data);
	}

	static addc(track: any) {
		track.ctitle = track.title?.replace(/\s*\(.*?\)\s*/g, "").toLowerCase();
		track.cartist = track.artist?.toLowerCase();
		track.calbum = track.album?.toLowerCase();
		return track;
	}

	static getResultList(type:string, data:any) {
		if (type == 'tracks') {
			return data.data;
		}
		if (type == 'albums') {
			return data.data;
		}
		if (type == 'artists') {
			return data.data;
		}
	}

	static parsePage(type:string, data:any) {
		if (type == 'tracks') {
			return {
				entries: data.data,
				next: data.next,
				total: data.total
			}
		}
		if (type == 'albums') {
			return {
				entries: data.data,
				next: data.next,
				total: data.total
			}
		}
		if (type == 'artists') {
			return {
				entries: data.data,
				next: data.next,
				total: data.total
			}
		}
	}

	static parseEntity(type:string, entry:any) {
		if (type == 'tracks') {
			const data:TrackData = {
				id: entry.id,
				title: entry.title,
				album: entry.album.title,
				artist: entry.artist.name,
				image_url: entry.album.cover_medium,
				ctitle: '', cartist: '', calbum:''
			};			
			return DZ.addc(data);
		}	
		if (type == 'albums') {
			const data = {
				id: entry.id,
				album: entry.title,
				artist: entry.artist.name,
				image_url: entry.cover_medium,
				ctitle: '', cartist: '', calbum:''
			}
			return DZ.addc(data);
		}	
		if (type == 'artists') {
			const data = {
				id: entry.id,
				artist: entry.name,
				image_url: entry.picture_medium
			}
			return DZ.addc(data);
		}
	}
}

const pager = new Pager('deezer', DZ, {
	keylimit: 'limit',
	keyoffset: 'index'
});


class DeezerController {

	// ============= AUTH ================================================================

	static getLogged(request: Request) {
		const data = DZ.data(request);
		return {logged: data?.auth ? true : false, authUrl};
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

	async logout(request: Request, response: Response) {
		await DZ.logout(request);		
		response.json({status:true});
	}

	// ============= DATA ================================================================
	
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

	// ============= TRACKS ==============================================================

	async loadTracks(request: Request, response: Response) {
		pager.loadEntities(request, response, 'tracks');
	}

	static getTracks(request: Request) {
		return Cache.sessionGet(request,'deezer-tracks-list') || [];
	}

	async static setTracks(request: Request, fulllist:any[]) {
		await Cache.sessionSet(request,'deezer-tracks-list',fulllist);
	}

	async static pushTrack(request: Request, newentry: any) {
		const fulllist = DeezerController.getTracks(request);
		fulllist.push(newentry);
		await DeezerController.setTracks(request,fulllist);
	}

	async findTrack(request: Request, response: Response) {
		const body = request.body;
		const data = Compare.getDataTrack(body);

		const q = [data.title,data.artist,data.album]; 

		DZ.get(request, '/search/track?q='+encodeURIComponent(q.join(' ')),true).then(async result => {
			const resultlist = result?.data?.data;
			if (!resultlist) {
				await DZ.logout(request);
				return resolve({status:false, logout:true});
			}
			const parsedlist = resultlist.map(item => DZ.parseEntity('tracks',item));		
			
			const match = Compare.matchTrackInList(body, parsedlist);
			if (!match) return response.json({status:false, error:'no_match', data, parsedlist});
			const track_id = match.found.id;

			DZ.post(request, '/user/me/tracks?track_id='+track_id, true).then(async feed => {
				const {title, artist, album} = body;
				const newentry = DZ.new({id: track_id, title, artist, album});
				await DeezerController.pushTrack(request,newentry);
				response.json({status:true, newentry});
			}).catch(feed => {
				response.json({status:false, error:'failed_to_add', feed});
			})
		}).catch(async feed => {
			// await DZ.logout(request);
			response.json({status:false, error:'failed_to_search', logout:false, feed});
		});
	}

	// ============= ALBUMS ==============================================================

	async loadAlbums(request: Request, response: Response) {
		pager.loadEntities(request, response, 'albums');
	}

	static getAlbums(request: Request) {
		return pager.get(request, 'albums');
	}

	async static setAlbums(request: Request, fulllist:any[]) {
		await pager.set(request, 'albums', fulllist);
	}

	async static pushAlbum(request: Request, newentry: any) {
		await pager.push(request, 'albums', newentry);
	}
	
	async findAlbum(request: Request, response: Response) {
		const body = request.body;
		const data = Compare.getDataAlbum(body);
		const q = ['album:"'+data.album+'"'];
	
		DZ.get(request, '/search?q='+encodeURIComponent(q.join(' ')),true).then(result => {
			const resultlist = result?.data?.data;
			if (!resultlist) return response.json({status:false, q, error:'no_resultlist', result});
			
			const parsedlist = resultlist.map(item => DZ.parseEntity('albums',{...item.album, artist:item.artist}));
			
			const uniquelist = [];
			parsedlist.forEach(entry => {
				if (uniquelist.find(other => other.id == entry.id)) return;
				uniquelist.push(entry);
			});

			const match = Compare.matchAlbumInList(body, uniquelist);
			if (!match) return response.json({status:false, error:'no_match', data, uniquelist});

			const found_id = match.found.id;

			DZ.post(request, '/user/me/albums?album_id='+found_id, true).then(async feed => {
				const { artist } = body;
				const newentry = DZ.new({id:found_id, album, artist});	
				await DeezerController.pushAlbum(request,newentry);
				response.json({status:true, newentry});
			}).catch(feed => {
				response.json({status:false, error:'failed_to_add', feed});
			})
		}).catch(async feed => {
			await DZ.logout(request);
			response.json({status:false, error:'failed_to_search', logout:true, feed});
		});
	}
	
	// ============= ARTISTS =============================================================

	async loadArtists(request: Request, response: Response) {
		pager.loadEntities(request, response, 'artists');
	}

	static getArtists(request: Request) {
		return Cache.sessionGet(request,'deezer-artists-list') || [];
	}

	async static setArtists(request: Request, fulllist:any[]) {
		await Cache.sessionSet(request,'deezer-artists-list',fulllist);
	}

	async static pushArtist(request: Request, newentry: any) {
		const fulllist = DeezerController.getArtists(request);
		fulllist.push(newentry);
		await DeezerController.setArtists(request, fulllist);
	}

	async findArtist(request: Request, response: Response) {
		const body = request.body;
		const data = Compare.getDataArtist(body);
		const q = ['artist:"'+data.artist+'"'];
	
		DZ.get(request, '/search?q='+encodeURIComponent(q.join(' ')),true).then(result => {
			const resultlist = result?.data?.data;
			if (!resultlist) return response.json({status:false, q, error:'no_resultlist', result});
			
			const parsedlist = resultlist.map(item => DZ.parseEntity('artists',item.artist));
			
			const uniquelist = [];
			parsedlist.forEach(entry => {
				if (uniquelist.find(other => other.id == entry.id)) return;
				uniquelist.push(entry);
			});

			const match = Compare.matchArtistInList(body, uniquelist);
			if (!match) return response.json({status:false, error:'no_match', data, uniquelist});

			const found_id = match.found.id;

			DZ.post(request, '/user/me/artists?artist_id='+found_id, true).then(async feed => {
				const { artist } = body;
				const newentry = DZ.new({id:found_id, artist});	
				await DeezerController.pushArtist(request,newentry);
				response.json({status:true, newentry});
			}).catch(feed => {
				response.json({status:false, error:'failed_to_add', feed});
			})
		}).catch(async feed => {
			await DZ.logout(request);
			response.json({status:false, error:'failed_to_search', logout:true, feed});
		});
	}
	
}

export default DeezerController;
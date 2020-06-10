import { Request, Response } from 'express';
import axios from 'axios';

const app_id = process.env.DEEZER_APPID;
const secret_key = process.env.DEEZER_SECRETKEY;

const redirect_uri = encodeURIComponent(process.env.REDIRECT_URL+'/deezer/callback');
const authUrl = 'https://connect.deezer.com/oauth/auth.php?app_id='+app_id+'&redirect_uri='+redirect_uri+'&perms=basic_access,email';		

const deezerDefault = null;

function getDeezerData(request: Request) {
	const data = request.session?.deezerData || deezerDefault;
	return data as {
		auth: string,
		userId: string,
		playlistId: number
	}
}

class DeezerController {
	getAuth(request: Request, response: Response) {
		var deezerData = getDeezerData(request);		
		return response.json({logged: deezerData ? true : false, authUrl});
	}

	async checkCode(request: Request, response: Response) {
		const authCode = request.query.code;

		function failure(msg: string) { response.json({status:false,error:msg}) }
		function success() { response.json({status:true}) }

		if (authCode) {
			const result = await axios.get('https://connect.deezer.com/oauth/access_token.php?app_id='+app_id+'&secret='+secret_key+'&code='+authCode);
			const authData = result.data;			
			if (authData) {
				if (authData == 'wrong code') {
					return failure('bad_code');
				}
				if (request.session) {				
					const deezerData = {auth:authData, userId:null, playlistId:null};					
						
					var dzUserMe = await axios.get('https://api.deezer.com/user/me?output=json&'+deezerData.auth);
					deezerData.userId = dzUserMe?.data?.id;
					if (!deezerData.userId) return failure('no_user_id');

					var dzUserPlaylists = await axios.get('https://api.deezer.com/user/'+deezerData.userId+'/playlists?output=json&'+deezerData.auth);

					deezerData.playlistId = dzUserPlaylists?.data?.data?.find((playlist:any) => playlist.is_loved_track)?.id;
					if (!deezerData.playlistId) return failure('no_playist_id');

					request.session.deezerData = deezerData;
					request.session.save(() => { success(); });
					return;
				} else {			
					return failure('no_session');
				}
			}
			return failure('empty_result');
		}		
		return failure('no_code');
	}

	async getTrackList(request: Request, response: Response) {
		var deezerData = getDeezerData(request);
		if (!deezerData) return response.json({status:false, error:'no_data'});

		var page = Number(request.params.page) || 1;
		var limit = 100;
		var offset = (page-1)*limit;
			
		var result = await axios.get('https://api.deezer.com/playlist/'+deezerData.playlistId+'/tracks?limit='+limit+'&offset='+offset+'&output=json&'+deezerData.auth);
		
		var tracks = result.data.data.map((track:any) => {
			let data = {
				id: track.id,
				title: track.title,
				artist: track.artist.name,
				album: track.album.title,
				ctitle: '', cartist: '', calbum:''
			};
			data.ctitle = data.title?.toLowerCase();
			data.cartist = data.artist?.toLowerCase();
			data.calbum = data.album?.toLowerCase();
			return data;
		});


		return response.json(tracks);
	}
}

export default DeezerController;
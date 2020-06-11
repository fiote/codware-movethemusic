import React, { useEffect, useState } from 'react';
import Container from '../../components/Container';
import SocialButton from '../../components/SocialButton';
import MatchRow from '../../components/MatchRow';
import api from '../../services/api';

import './styles.scss';

interface AuthResponse {
	logged: boolean,
	authUrl: string,
	authData: string
} 

export interface TrackList extends Array<TrackData> { }

export interface TrackListResponse {
	status: boolean,
	tracks: TrackList
}

interface TrackData {
	id: number,
	title: string,
	artist: string,
	album: string,
	ctitle: string,
	cartist: string,
	calbum: string
}

interface TrackMatch {
	id: any,
	title: string,
	artist: string,
	album: string,
	ctitle: string,
	cartist: string,
	calbum: string,
	[key: string]: any
}

const Home = () => {
	const [dzData,setDzData] = useState<AuthResponse>();
	const [spData,setSpData] = useState<AuthResponse>();
	const [dzTracks,setDzTracks] = useState<TrackList>();
	const [spTracks,setSpTracks] = useState<TrackList>();

	const [tracks,setTracks] = useState<TrackMatch[]>([]);

	function deezerAuth() {
		console.log('deezerAuth','...');
		api.get<AuthResponse>('/deezer/auth').then(feed => {
			console.log('deezerAuth',feed.data);
			setDzData(feed.data);
		});
	}

	function spotifyAuth() {
		console.log('spotifyAuth','...');
		api.get<AuthResponse>('/spotify/auth').then(feed => {
			console.log('spotifyAuth',feed.data);
			setSpData(feed.data);
		});
	}

	function deezerTracklist() {
		if (!dzData?.logged) return;
		console.log('deezerTracklist','...');
		api.get<TrackListResponse>('/deezer/tracklist').then(feed => {
			console.log('deezerTracklist',feed.data);
			if (feed.data.status) {
				setDzTracks(feed.data.tracks);
			} else {
				deezerAuth();
			}
		});
	}

	function spotifyTracklist() {	
		if (!spData?.logged) return;
		console.log('spotifyTracklist','...');	
		api.get<TrackListResponse>('/spotify/tracklist').then(feed => {
			console.log('spotifyTracklist',feed.data);
			if (feed.data.status) {
				setSpTracks(feed.data.tracks);
			} else {
				spotifyAuth();
			}
		}).catch(feed => {
			console.error('spotifyTracklist',feed);
		});
	}

	useEffect(deezerAuth,[]);
	useEffect(spotifyAuth,[]);
	useEffect(deezerTracklist,[dzData]);
	useEffect(spotifyTracklist,[spData]);

	function compareTracks(alltracks: TrackMatch[], listA: TrackList, listB: TrackList, fieldA: string, fieldB: string) {
		listA.forEach(atrack => {
			var similar = listB.map(btrack => {
				return {
					title: (atrack.ctitle === btrack.ctitle || atrack.ctitle.indexOf(btrack.ctitle) >= 0 ||  btrack.ctitle.indexOf(atrack.ctitle) >= 0),
					artist: atrack.cartist === btrack.cartist,
					album: atrack.calbum === btrack.calbum,
					other: btrack
				};
			}).filter(match => match.title || match.artist || match.album);

			var exactmatch = similar.find(match => match.title && match.artist && match.album);

			var basedata = {
				...atrack,
				[fieldA]: true
			};
			
			if (exactmatch) {
				alltracks.push({...basedata, [fieldB]: true});
				const index = listB.indexOf(exactmatch.other);
				listB.splice(index,1);
			} else {
				if (similar.length) {
					console.log(atrack);
					console.log(similar);
				}
				alltracks.push({...basedata});
			}
		});
		
		while (listA.length) listA.shift();

	}

	useEffect(() => {
		var alltracks = [] as TrackMatch[];
		if (!spTracks) return;
		if (!dzTracks) return;

		var sp = JSON.parse(JSON.stringify(spTracks));
		var dz = JSON.parse(JSON.stringify(dzTracks));

		compareTracks(alltracks, sp, dz, 'sptrack', 'dztrack');
		compareTracks(alltracks, dz, sp, 'dztrack', 'sptrack');

		alltracks.sort((a,b) => {
			if (a.artist < b.artist) return -1;
			if (a.artist > b.artist) return +1;
			if (a.album < b.album) return -1;
			if (a.album > b.album) return +1;
			if (a.title < b.title) return -1;
			if (a.title > b.title) return +1;
			return 0;
		});

		setTracks(alltracks);

	},[dzTracks,spTracks]);


	let btnDeezer = <SocialButton data={dzData} platform='Deezer' />;	
	let btnSpotify = <SocialButton data={spData} platform='Spotify' />;	
	
	return (
		<Container title="deezer2spotify">

			<div className="ui grid">
				<div className="four column row">
					<div className="left floated column">
						{btnDeezer}
					</div>
					<div className="right floated column text-right">{btnSpotify}</div>
				</div>
			</div>			

			<div className="pt-4">
				<table className='ui very basic table'>
					<thead>
						<tr>
							<th>Track</th>
							<th className='thText'>Artist</th>
							<th className='thText'>Album</th>
							<th className="thBtn text-center">Deezer</th>
							<th className="thBtn text-center">Spotify</th>
						</tr>
					</thead>
					<tbody>
						{tracks && tracks.map(match => <MatchRow key={match.id} match={match}/>)}
					</tbody>
				</table>				
			</div>
		</Container>
	)
};

export default Home;
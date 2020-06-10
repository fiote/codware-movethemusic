import React, { useEffect, useState } from 'react';
import Container from '../../components/Container';
import api from '../../services/api';

interface AuthData {
	logged: boolean,
	authUrl: string,
	authData: string
}

export interface TrackList extends Array<TrackData> { }

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
	[key: string]: any
}

const Home = () => {
	const [dzData,setDzData] = useState<AuthData>();
	const [spData,setSpData] = useState<AuthData>();
	const [dzTracks,setDzTracks] = useState<TrackList>([]);
	const [spTracks,setSpTracks] = useState<TrackList>([]);

	const [tracks,setTracks] = useState<TrackMatch[]>([]);

	useEffect(() => {
		api.get<AuthData>('/deezer/auth').then(feed => {
			setDzData(feed.data);
		});
	},[]);

	useEffect(() => {
		api.get<AuthData>('/spotify/auth').then(feed => {
			setSpData(feed.data);
		});
	},[]);

	useEffect(() => {
		if (dzData?.logged) {
			api.get<TrackList>('/deezer/tracklist').then(feed => {
				setDzTracks(feed.data);
			});
		}
	},[dzData]);

	useEffect(() => {
		if (spData?.logged) {
			api.get<TrackList>('/spotify/tracklist').then(feed => {
				setSpTracks(feed.data);
			});
		}
	},[spData]);

	function compareTracks(alltracks: TrackMatch[], listA: TrackList, listB: TrackList, fieldA: string, fieldB: string) {
		listA.forEach(atrack => {
			var similar = listB.map(btrack => {
				return {
					title: (atrack.ctitle == btrack.ctitle || atrack.ctitle.indexOf(btrack.ctitle) >= 0 ||  btrack.ctitle.indexOf(atrack.ctitle) >= 0),
					artist: atrack.cartist == btrack.cartist,
					album: atrack.calbum == btrack.calbum,
					other: btrack
				};
			}).filter(match => match.title || match.artist || match.album);

			var exactmatch = similar.find(match => match.title && match.artist && match.album);

			var basedata = {
				id: atrack.id,
				title: atrack.title, 
				artist: atrack.artist,
				album: atrack.album,
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
		console.log('spTracks',spTracks.length, 'dzTracks',dzTracks.length);	
		var alltracks = [] as TrackMatch[];

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

	let btnDeezer = null;

	if (dzData) {
		if (dzData.logged) {
			btnDeezer = <a className="ui active green button" href={dzData.authUrl} >Connected to Deezer</a>;
		} else {
			btnDeezer = <a className="ui active button" href={dzData.authUrl} >Connect to Deezer</a>;
		}
	} else {
		btnDeezer = <a className="ui active button disabled">Cheching data...</a>;
	}

	let btnSpotify = null;

	if (spData) {
		if (spData.logged) {
			btnSpotify = <a className="ui active green button" href={spData.authUrl} >Connected to Spotify</a>;
		} else {
			btnSpotify = <a className="ui active button" href={spData.authUrl} >Connect to Spotify</a>;
		}
	} else {
		btnSpotify = <a className="ui active button disabled">Cheching data...</a>;
	}

	return (
		<Container title="deezer2spotify">
			<div className="ui grid">
				<div className="four column row">
					<div className="left floated column">{btnDeezer}</div>
					<div className="right floated column text-right">{btnSpotify}</div>
				</div>
			</div>
			

			<div className="pt-4">
				<table className='ui very basic table'>
					<thead>
						<tr>
							<th>Track</th>
							<th>Artist</th>
							<th>Album</th>
							<th className="text-center">Deezer</th>
							<th className="text-center">Spotify</th>
						</tr>
					</thead>
					<tbody>
						{tracks && tracks.map(match => (
							<tr key={match.id}>
								<td>{match.title}</td>
								<td>{match.artist}</td>
								<td>{match.album}</td>
								<td className="text-center">{match.dztrack ? 'Yes' : '---'}</td>
								<td className="text-center">{match.sptrack ? 'Yes' : '---'}</td>
							</tr>			
						))}
					</tbody>
				</table>				
			</div>
		</Container>
	)
};

export default Home;
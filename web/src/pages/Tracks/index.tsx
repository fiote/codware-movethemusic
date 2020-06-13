import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';

import MainView from '../../components/MainView';
import ContentPanel from '../../components/ContentPanel';
import api from '../../services/api';
import Swal from 'sweetalert2'; 

import './index.scss';
import imgMusic from '../../images/music.png';

interface TrackListStatus {
	status: boolean,
	done?: boolean,
	next?: number,
	loaded?: number,
	total?: number
}

const Tracks = () => {
	const history = useHistory();
	const ls_side = localStorage.getItem('tracks-filter-side') || '';
	const ls_search = localStorage.getItem('tracks-filter-search') || '';

	const [side,setSide] = useState<string>(ls_side);
	const [search,setSearch] = useState<string>(ls_search);

	const [counter,setCounter] = useState<TrackCounter>({});
	const [missing,setMissing] = useState<MissingData>({deezer:[], spotify:[]});

	const [loading,setLoading] = useState<boolean>(true);
	const [sideFilters,setSideFilters] = useState<any[]>([]);
	const [tracks,setTracks] = useState<MergedData[]>();
	const [filteredTracks,setFilteredTracks] = useState<MergedData[]>([]);

	let timeoutSearch:any = null;
	
	const [dzStatus,setDzStatus] = useState<TrackListStatus>();
	const [spStatus,setSpStatus] = useState<TrackListStatus>();

	const [profile,setProfile] = useState<Profile>();

	useEffect(() => {
		api.get<Profile>('/profile').then(feed => {
			setProfile(feed.data);
		});
	},[]);


	function loadTracks(platform: string, currentStatus: TrackListStatus, setStatus: Function) {
		if (!currentStatus?.next || currentStatus?.done) return;
		api.get('/'+platform+'/loadtracks/'+currentStatus.next).then(feed => {
			console.log(platform, feed.data);	
			if (feed.data.status) return setStatus(feed.data);
			setStatus((st:TrackListStatus) => ({...st, done:true}));
		}).catch(feed => {
			console.error(platform,'/loadtracks/','ERROR',feed);
		});
	}

	useEffect(() => { dzStatus && loadTracks('deezer', dzStatus, setDzStatus); },[dzStatus]);
	useEffect(() => { spStatus && loadTracks('spotify', spStatus, setSpStatus); },[spStatus]);

	useEffect(() => {
		setDzStatus({status:true, next:1});
		setSpStatus({status:true, next:1});
	},[]);

	useEffect(() => {
		if (!dzStatus?.done) return;
		if (!spStatus?.done) return;	
		api.get<TrackListResponse>('/tracklist').then(feed => {			
			console.log(feed);
			if (feed.data.status) {
				setTracks(feed.data.tracks);
				setLoading(false);
			} else {
				console.error(feed);
			}
		});
	},[dzStatus,spStatus]);

	useEffect(() => {
		let newCounts = {total:0, both:0, deezer:0, spotify:0};
		tracks && tracks.forEach(merged => {
			const plats = Object.keys(merged.platforms);
			newCounts.total++;
			if (plats.length === 2) newCounts.both++;
			if (!plats.includes('deezer')) newCounts.spotify++;
			if (!plats.includes('spotify')) newCounts.deezer++;
		});
		setCounter(newCounts);
	}, [tracks])

	useEffect(() => {
		setSideFilters([
			{code: '', label:'Any Side', qty:counter['total']},
			{code: 'both', label:'Both Sides', qty:counter['both']},
			{code: 'deezer', label:'Only at Deezer', qty:counter['deezer']},
			{code: 'spotify', label:'Only at Spotify', qty:counter['spotify']}
		]);
	},[counter]);

	useEffect(() => {
		let newMissing = {deezer:[], spotify:[]} as MissingData;

		const filtered = tracks?.filter(merged => {
			const plats = Object.keys(merged.platforms);

			if (side) {
				if (side === 'both' && plats.length === 1) return false;
				if (side === 'deezer' && plats.includes('spotify')) return false;
				if (side === 'spotify' && plats.includes('deezer')) return false;
			}
			if (search) {
				let any = false;
				if (!any && merged?.ctitle?.includes(search)) any = true;
				if (!any && merged?.cartist?.includes(search)) any = true;
				if (!any && merged?.calbum?.includes(search)) any = true;
				if (!any) return false;
			}

			if (!plats.includes('deezer')) newMissing.deezer.push(merged);
			if (!plats.includes('spotify')) newMissing.spotify.push(merged);
			return true;
		}) || [];
		setFilteredTracks(filtered);
		setMissing(newMissing);		
	}, [tracks, side, search]);

	function handleChangeTrack(merged: MergedData, platform: string, newtrack: TrackData) {
		if (!tracks) return;
		var index = tracks.indexOf(merged);
		var clone = Array.from(tracks);
		merged.platforms[platform] = newtrack;
		clone[index] = merged;
		setTracks(clone);
	}

	function handleSearchChange(event: any) {
		clearTimeout(timeoutSearch);
		const value =event.target.value;
		timeoutSearch = setTimeout(ev => {
			setSearch(value);
			localStorage.setItem('tracks-filter-search',value);
		},100);
	}

	function handleClickCopy(source: string, target: string) {
		const sourcex = source.toUpperCase();
		const targetx = target.toUpperCase();
		const newlist = missing[target];
		const qty = newlist.length;
		const extraText = (qty > 50) ? ' This can take a while.' : '';
		
		Swal.fire({
			title: sourcex+' to '+targetx,
			html: 'Are you sure you want to try to copy <b>'+qty+'</b> track'+(qty === 1 ? '' : 's')+' to your '+targetx+' account?'+extraText,
			icon: 'question',
			showCancelButton: true,
			confirmButtonColor: '#3085d6',
			cancelButtonColor: '#d33',
			confirmButtonText: 'Yes, copy '+(qty === 1 ? 'it' : 'them')+'!',
			cancelButtonText: 'No, nevermind'
		}).then(result => {
			if (result.value) history.push('/tracks-copy', { source, target, tracks: newlist });
		});
	}

	function handleSideFilterClick(newSide: string) {
		setSide(newSide);
		localStorage.setItem('tracks-filter-side',newSide);
	}

	if (loading) {
		return (
			<MainView>
				<ContentPanel icon={imgMusic}>
					<div className="text-main">fetching tracks</div>
					<div className="text-aux">Deezer: {dzStatus?.loaded || 0}/{dzStatus?.total || '?'}</div>
					<div className="text-aux">Spotify: {spStatus?.loaded || 0}/{spStatus?.total || '?'}</div>
				</ContentPanel>
			</MainView>
		)
	}

	return (
		<MainView>
			<div id="tracks-header" className="p-1 mb-2">

				<div id="tracks-search" className="">
					<div className="ui icon input">
						<i className="search icon"></i>
						<input type="text" placeholder="Search..." defaultValue={ls_search} onChange={handleSearchChange}/>
					</div>
				</div>

				<div id="tracks-filters" className="ui buttons">
					{sideFilters && sideFilters.map(sidef => {
						return (
							<button key={sidef.code} className={['ui','button',sidef.code === side ? 'active' : ''].join(' ')} onClick={() => handleSideFilterClick(sidef.code)} >{sidef.label} ({sidef.qty})</button>
						)
					})}
				</div>
				<div id="tracks-actions" className="">
					<button className="ui right labeled icon teal button btn-sync btn-sp" disabled={missing.spotify.length === 0} onClick={() => handleClickCopy('deezer','spotify')} >
						<i className="upload icon"></i>
						Deezer to Spotify ({missing.spotify.length})
					</button>
					<button className="ui right labeled icon teal button btn-sync btn-dz" disabled={missing.deezer.length === 0} onClick={() => handleClickCopy('spotify','deezer')} >
						<i className="upload icon"></i>
						Spotify to Deezer ({missing.deezer.length})
					</button>
				</div>
			</div>

			<div className='table-head'>
				<div className="table-row">
					<div className="cell-track">Track</div>
					<div className="cell-artist">Artist</div>
					<div className="cell-album">Album</div>
					<div className="text-center cell-platform">Deezer</div>
					<div className="text-center cell-platform">Spotify</div> 
				</div>	
			</div>
			<div className='table-body'>
				{filteredTracks ? filteredTracks.map(merged => <TrackRow key={merged.id} profile={profile} merged={merged} onChanged={handleChangeTrack} />) : null}
				{filteredTracks && filteredTracks.length === 0 && (					
					<div className='table-row row-empty'>
						<div className='cell-full'>Ops, nothing to show here!</div>
					</div>
				)}
			</div>
		</MainView>
	)
}

interface TrackRowProps {
	merged: MergedData,
	profile?: Profile,
	onChanged: Function
}


const TrackRow = (props: TrackRowProps) => {
	const merged = props.merged;
	const [busy,setBusy] = useState<boolean>(false);
	
	function handleClickRow(platform: string) {
		setBusy(true);
		api.post('/'+platform+'/findtrack',merged).then(async feed => {
			if (feed.data.status) {
				await props.onChanged(props.merged, platform, feed.data.newtrack);
			}
			setBusy(false);
		}).catch(feed => {
			setBusy(false);
		});
	}

	let classrow = ['table-row',busy ? 'row-busy' : ''].join(' ');

	return (
		<div className={classrow}>
			<div className="cell-track">{props.merged.title}</div>
			<div className="cell-artist">{props.merged.artist}</div>
			<div className="cell-album">{props.merged.album}</div>
			<div className="cell-platform text-center">
				<MatchButton merged={props.merged} platform='deezer' profile={props.profile} busy={busy} clickHandler={handleClickRow} />
			</div>
			<div className="cell-platform text-center">
				<MatchButton merged={props.merged} platform='spotify' profile={props.profile} busy={busy} clickHandler={handleClickRow} />
			</div> 
		</div>		
	)
}

interface MatchButtonProps {
	merged: MergedData,
	platform: string,
	busy: boolean,
	profile?: Profile,
	clickHandler: Function
}

const MatchButton = (props: MatchButtonProps) => {
	if (props.merged.platforms[props.platform]) return <i className='check green icon'></i>;

	if (!props.profile || !props.profile[props.platform].logged) return <i className='question inverted grey icon'></i>;

	function handleClickMatch() {
		props.clickHandler(props.platform);
	}

	return (
		<button className='mini ui icon button' disabled={props.busy} onClick={handleClickMatch} >
			<i className='plus icon'></i>
		</button>
	)
}


interface TrackData {
	id: number | string,
	title?: string,
	artist?: string,
	album?: string,
	ctitle?: string,
	cartist?: string,
	calbum?: string
}

interface MergedData {
	id: string,
	title: string,
	artist: string,
	album: string,
	ctitle?: string,
	cartist?: string,
	calbum?: string,
	mtype: Object,
	platforms: {
		[key: string]: TrackData
	}
}

interface TrackListResponse {
	status: boolean,
	tracks: MergedData[]
}

interface TrackCounter {
	[key: string]: number
}

interface MissingData {
	spotify: MergedData[],
	deezer: MergedData[],
	[key: string]: MergedData[]
}

interface SocialStatus {
	logged: boolean,
	authUrl: string
}

interface Profile {
	deezer: SocialStatus,
	spotify: SocialStatus,
	[key: string]: SocialStatus
}

export default Tracks;
import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import MainView from '../../components/MainView';
import ContentPanel from '../../components/ContentPanel';
import ContentTitle from '../../components/ContentTitle';

import './index.scss';

import api from '../../services/api';
import Swal from 'sweetalert2'; 

interface TracksCopyProps {
	location: {
		state: {
			source: string,
			target: string,
			tracks: any[]
		}
	}
}

const TracksCopy = (props: TracksCopyProps) => {
	const history = useHistory();
	
	const [tracklist,setTracklist] = useState<any[]>();
	const [qtDone,setQtDone] = useState<number>(0);
	const [qtSuccess,setQtSuccess] = useState<number>(0);
	const [qtFailed,setQtFailed] = useState<number>(0);
	const [qtTotal,setQtTotal] = useState<number>(0);
	const [currentTrack,setCurrentTrack] = useState<any>();
	
	const { source, target, tracks } = props.location.state;

	useEffect(() => {
		function goNext() {
			setQtDone(q => q+1);
			
			setTracklist(t => {
				var newlist = Array.from(t || []);
				newlist.shift();
				return newlist;
			});
		}

		function execLogout() {
			Swal.fire({title:'Ops!', html:'Looks like your '+target.toUpperCase()+' session expired. Please log in again and retry this!',icon:'warning'}).then(ev => {
				history.push('/tracks');
			});
		}

		api.post('/'+target+'/findtrack',currentTrack).then(response => {
			const feed = response.data;
			feed.status ? setQtSuccess(q => q+1) : setQtFailed(q => q+1);
			feed.logout ? execLogout() : goNext();
		}).catch(feed => {
			setQtFailed(q => q+1);
			console.error(feed);
		});
	},[currentTrack,target,history]);

	useEffect(() => {	
		if (!tracklist) return;
		let track = tracklist[0];
		if (track) {
			setCurrentTrack(track);
		} else {
			const extra = qtFailed ? '<br/>(but we couldn\'t find a suitable match for <b>'+qtFailed+'</b> of them)' : '';
			Swal.fire({title:'Done!', html:'We finished moving your '+source.toUpperCase()+' tracks to '+target.toUpperCase()+'.'+extra,icon:'success'}).then(ev => {
				history.push('/tracks');
			});
		}
	},[tracklist]);

	useEffect(() => {
		setQtTotal(tracks.length);
		setTracklist(tracks);
	},[]);

	const title = (
		<ContentTitle>Copying tracks from {source.toUpperCase()} to {target.toUpperCase()}, please standby...</ContentTitle>
	)

	if (!currentTrack) return <MainView title={title} loading='preparing list'/>;

	const ptext = (
		<div>
			Tracks moved: {qtSuccess}<br/>
			No match found: {qtFailed}
		</div>
	)

	return (
		<MainView progressbar={qtTotal ? qtDone*100/qtTotal : 0} progresstext={ptext} title={title} >
			<ContentPanel>
				<div id="copy">
					<div className="copy-number">{qtDone+1}/{qtTotal}</div>
					<img className="copy-cover" src={currentTrack.image_url} />
					<div className="copy-title">{currentTrack.title}</div>
					<div className="copy-details">{currentTrack.artist}</div>
				</div>
			</ContentPanel>
		</MainView>
	)
}

export default TracksCopy;
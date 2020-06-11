import React, { useState } from 'react';
import api from '../../services/api';

interface MatchRowProps {
	match: TrackMatch
}

interface TrackMatch {
	id: any,
	title: string,
	artist: string,
	album: string,
	[key: string]: any
}

interface MatchButtonProps {
	match: TrackMatch,
	busy: boolean,
	code: string,
	platform: string,
	clickHandler: Function
}

const MatchButton = (props: MatchButtonProps) => {
	/*
	return (props.match[props.code]) ? (
		<button className="ui icon green button" disabled={props.busy}>
			<i className="check icon"></i>
		</button> 
	) : (
		<button className="ui icon button" onClick={() => props.clickHandler(props.platform,props.match)} disabled={props.busy}>
			<i className="add icon"></i>
		</button> 
	);
	*/
	if (props.match[props.code]) {
		return <i className='check green icon'></i>;
	}
	
	return (
		<button className='mini ui icon button' disabled={props.busy} onClick={() => props.clickHandler(props.platform,props.match)} >
			<i className='plus icon'></i>
		</button>
	)
}

const MatchRow = (props: MatchRowProps) => {
	const [busy,setBusy] = useState<boolean>(false);
		
	let match = props.match;
	if (!match) return null;
	
	function handleClickAdd(platform: string,match: TrackMatch) {
		setBusy(true);
		console.log(platform,'find','...');
		api.post('/'+platform+'/find',match).then(feed => {
		console.log(platform,'find',feed.data);
			if (feed.data.status) {
				match[feed.data.code] = true;
			} else {
			}
			setBusy(false);
		});
	}

	const btnDz = <MatchButton match={match} busy={busy} code='dztrack' platform='deezer' clickHandler={handleClickAdd} />;
	const btnSp = <MatchButton match={match} busy={busy} code='sptrack' platform='spotify' clickHandler={handleClickAdd} />;

	// let btnDz = <i className='check icon'></i>;
	// let btnSp = <div></div>;
	
	return (
		<div className="table-row">
			<div className="cell-track">{match.title}</div>
			<div className="cell-artist">{match.artist}</div>
			<div className="cell-album">{match.album}</div>
			<div className="cell-platform text-center">{btnDz}</div>
			<div className="cell-platform text-center">{btnSp}</div> 
		</div>	
	)
}

export default MatchRow;
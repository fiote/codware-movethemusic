import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import api from '../../services/api';

import SocialButton from '../../components/SocialButton';
import TopAuthor from '../../components/TopAuthor';
import ContentPanel from '../../components/ContentPanel';

interface Profile {
	deezer: {
		logged: boolean,
		authUrl: string
	},
	spotify: {
		logged: boolean,
		authUrl: string
	}
}

interface MainViewProps { 
	sidemenu?: boolean,
	loading?: string | null,
	children?: React.ReactNode
}

const MainView = (props: MainViewProps) => {	
	const [profile,setProfile] = useState<Profile>();

	function getProfile() {
		api.get<Profile>('/profile').then(feed => {
			setProfile(feed.data);
		});
	}

	useEffect(getProfile,[]);

	let params = {...props};
	let sidemenu = null;
	let content_top = null;
	let content_body = null;

	if (profile) {
		params.sidemenu = true;
		content_body = props.children;
	} else {
		params.sidemenu = false;
		params.loading = 'Loading profile...';
	}

	sidemenu = (params.sidemenu) ? (
		<div className="menu">
			<Link to="/tracks" className="link">
				<i className="music icon"></i> <label>Tracks</label>
			</Link>
			<Link to="/artists" className="link">
				<i className="microphone alternate icon"></i> <label>Artists</label>
			</Link>
			<Link to="/albums" className="link">
				<i className="compact disc icon"></i> <label>Albums</label>
			</Link>
		</div>
	) : null;

	content_top = (profile) ? (		
		<>
			<div id="platforms">
				<SocialButton data={profile?.deezer} platform='Deezer' />
				<SocialButton data={profile?.spotify} platform='Spotify' />
			</div>
			<TopAuthor/>
		</>
	) : null;

	if (params.loading) {
		content_body = <ContentPanel type="timer">{params.loading}</ContentPanel>;
	}

	if (profile) {
		if (!profile?.deezer.logged && !profile?.spotify.logged) {
			content_body = <ContentPanel>You need to connect to a platform first.</ContentPanel>;
		}
	}

	const gridclass = ['grid',!sidemenu && 'menuless'].join(' ');

	return (
		<div id='grid' className={gridclass}>
			<div id='sidebar'>
				<div className="top">
					<h1>Move<br/>TheMusic</h1>
				</div>
				<div className="body">
					{sidemenu}
				</div>
			</div>
			<div id='content'>
				<div className="top">
					{content_top}
				</div>
				<div className="body">
					{content_body}
				</div>
			</div>
		</div>
	)
}
 
export default MainView; 
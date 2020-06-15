import React, { useEffect, useState } from 'react';
import './styles.scss';

import api from '../../services/api';

import SocialButton from '../../components/SocialButton';
import SideMenu from '../../components/SideMenu';
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
	profile?: Profile,
	title?: React.ReactNode,
	loading?: string | null,
	guest?: boolean | null,
	progressbar?: number | null,
	progresstext?: React.ReactNode | null,
	children?: React.ReactNode
}

const MainView = (props: MainViewProps) => {	
	const [profile,setProfile] = useState<Profile>();

	function getProfile() {
		if (props.profile) {
			setProfile(props.profile);
			return;
		}
		api.get<Profile>('/profile').then(feed => {
			setProfile(feed.data);
		});
	}

	useEffect(getProfile,[props.profile]);

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

	sidemenu = (params.sidemenu) ? <SideMenu/> : null;

	content_top = (profile) ? (props.title || (		
		<div id="platforms">
			<SocialButton data={profile?.deezer} platform='Deezer' />
			<SocialButton data={profile?.spotify} platform='Spotify' />
		</div>
	)) : null;

	if (params.loading) {
		content_body = <ContentPanel type="timer"><div className="text-main">{params.loading}</div></ContentPanel>;
	}

	if (profile) {
		if (!profile?.deezer.logged && !profile?.spotify.logged && !props.guest) {
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
					<TopAuthor/>
				</div>
				<div className="body">
					{content_body}
					{props.progressbar ? (<div className="progress-bar" style={{width: props.progressbar+'%'}}><div className='progress-text'>{props.progresstext || null}</div></div>) : null}
				</div>
			</div>
		</div>
	)
}
 
export default MainView; 
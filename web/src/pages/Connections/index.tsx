import React, { useEffect, useState } from 'react';
import MainView from '../../components/MainView';

import './index.scss';

import api from '../../services/api';

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

interface LoginData {
	logged: boolean,
	authUrl: string
}

interface SocialCardProps {
	name: string,
	perms: string[],
	clickHandler: Function,
	login?: LoginData
}

const Connections = () => {

	const [profile,setProfile] = useState<Profile>();

	function getProfile() {
		api.get<Profile>('/profile').then(feed => {
			setProfile(feed.data);
		});
	}

	function handleClickDisconnect(platform: string) {
		api.post('/'+platform+'/logout').then(feed => {
			getProfile();
		});
	}

	useEffect(getProfile,[]);

	return (
		<MainView guest={true} title='Connections' profile={profile}>
			<div className='connections'>
				<div className='ui cards'>
					<SocialCard name='Deezer' login={profile?.deezer} clickHandler={handleClickDisconnect} perms={['Basic-Access','Manage-Library']} />
					<SocialCard name='Spotify' login={profile?.spotify} clickHandler={handleClickDisconnect} perms={['User-Library-Read','User-Library-Manage','User-Follow-Read','User-Follow-Modify']} />
				</div>
			</div>
		</MainView>
	)
}


const SocialCard = (props: SocialCardProps) => {
	const platform = props.name.toLowerCase();
	const image = require('../../images/'+platform.toLowerCase()+'.png');

	const [busy,setBusy] = useState<boolean>(false);

	function handleClickConnect() {
		if (!props?.login?.authUrl) return;
		setBusy(true);
		localStorage.setItem('redirect-after-login',window.location.pathname);
		window.location.href = props.login.authUrl;

	}

	function handleClickDisconnect() {
		setBusy(true);
		props.clickHandler(platform);
		setBusy(false);
	}

	return (
		<div className='card'>
			<div className='content'>
				<img className='right floated mini ui image' src={image} alt={props.name} />
				<div className='header'>
					{props.name}
				</div>
				<div className='meta'>
					{props.login ? (props.login.logged ? 'Online' : 'Offline') : 'Checking...'}
				</div>
				<div className='description'>
					{props.perms.map(text => <div key={text}>{text}</div>)}
				</div>
			</div>
			<div className='extra content right aligned'>
				{props?.login?.logged ? (
					<button className='ui inverted red button' disabled={busy} onClick={handleClickDisconnect} >Disconnect</button>
				) : (
					<button className='ui inverted green button' disabled={busy} onClick={handleClickConnect} >Connect</button>
				)}
			</div>
		</div>
	)
}

export default Connections;
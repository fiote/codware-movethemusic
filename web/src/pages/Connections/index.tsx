import React, { useEffect, useState } from 'react';
import MainView from '../../components/MainView';
import ContentPanel from '../../components/ContentPanel';
import ContentTitle from '../../components/ContentTitle';

import './index.scss';

import api from '../../services/api';

import imgDeezer from '../../images/deezer.png';
import imgSpotify from '../../images/spotify.png';

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
	login?: LoginData
}


const SocialCard = (props: SocialCardProps) => {
	const platform = props.name.toLowerCase();
	const login = props.login;
	const image = require('../../images/'+platform.toLowerCase()+'.png');
	
	const [busy,setBusy] = useState<boolean>(false);
	// const [login,setLogin] = useState<LoginData>();
	
	function handleClickDisconnect() {
		setBusy(true);
		api.get('/'+platform+'/disconnect').then(feed => {

		});
	}

	return (
		<div className='card'>
			<div className='content'>
				<img className='right floated mini ui image' src={image} />
				<div className='header'>
					{props.name}
				</div>
				<div className='meta'>
					{props.login ? (props.login.logged ? 'Online' : 'Offline') : 'Checking...'}
				</div>
				<div className='description'>
					{props.perms.map(text => <div>{text}</div>)}
				</div>
			</div>
			<div className='extra content right aligned'>				
				{props?.login?.logged ? (
					<button className='ui inverted red button' disabled={busy} onClick={handleClickDisconnect} >Disconnect</button>
				) : (
					<a className='ui inverted green button' href={props.login?.authUrl || '#'} >Connect</a>
				)}
			</div>
		</div>
	)
}

const Connections = () => {
	
	const [profile,setProfile] = useState<Profile>();

	function getProfile() {
		api.get<Profile>('/profile').then(feed => {
			setProfile(feed.data);
		});
	}
	
	useEffect(getProfile,[]);

	return (
		<MainView guest={true}>
			<div className='ui cards'>
				<SocialCard name='Deezer' login={profile?.deezer}  perms={['Basic-Access','Manage-Library']} />
				<SocialCard name='Spotify' login={profile?.spotify}  perms={['User-Library-Read','User-Library-Manage']} />
			</div>
		</MainView>
	)
}

export default Connections;
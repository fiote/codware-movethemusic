import React, { useState, useEffect } from 'react';
import ContentPanel from '../../components/ContentPanel';
import SocialButton from '../../components/SocialButton';
import MainView from '../../components/MainView';
import api from '../../services/api';

import { Profile } from '../../types';

import './index.scss';

const Home = () => {
	const [profile, setProfile] = useState<Profile>();
	useEffect(() => {
		api.get<Profile>('/profile').then(feed => {
			setProfile(feed.data);
		})
	}, []);


	const platforms = profile ? (
		<div className="platforms">
			<SocialButton data={profile?.deezer} platform='Deezer' />
			<SocialButton data={profile?.spotify} platform='Spotify' />
		</div>
	) : null;

	return (
		<MainView guest={true} >
			<ContentPanel>
				<div className="home">
					<div className="text-main">
						Welcome to <b>MoveTheMusic</b>
					</div>
					<div className="text-normal">
						This website allow you to copy your tracks, albums and artists between music streaming services. Right now we support <b>Deezer</b> and <b>Spotify</b>.
					</div>
					<div className="text-normal">
						Use the icons <b><span className="text-above">above</span><span className="text-below">below</span></b> to connect to the services, and then the side menu to access their content.
					</div>
					<div className="platforms">
						{platforms}
					</div>
					<div className="text-normal">
						The merging and matching is based on the entries' titles and although we're constantly improving this proccess, some false positives may occur. We apologize for that.
					</div>
				</div>
			</ContentPanel>
		</MainView>
	)
};

export default Home;
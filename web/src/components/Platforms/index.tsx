import React, { useState, useEffect } from 'react';
import SocialButton from '../../components/SocialButton';
import api from '../../services/api';
import { Profile } from '../../types';

const Platforms = () => {
	const [profile, setProfile] = useState<Profile>();

	useEffect(() => {
		api.get<Profile>('/profile').then(feed => {
			setProfile(feed.data);
		})
	}, []);

	return profile ? (
		<div className="platforms">
			<SocialButton data={profile?.deezer} platform='Deezer' />
			<SocialButton data={profile?.spotify} platform='Spotify' />
		</div>
	) : null;
}

export default Platforms;
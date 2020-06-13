import React from 'react';

interface SocialButtonProps {
	data: {
		logged: boolean,
		authUrl: string
	},
	platform: string
}


const SocialButton = (props: SocialButtonProps) => {
	const btnIcon = require('../../images/'+props.platform.toLowerCase()+'.png');
	const btnClass = ['platform',props?.data?.logged ? 'logged' : ''].join(' ');

	function handleClickPlatform() {
		localStorage.setItem('redirect-after-login',window.location.pathname);
		window.location.href = props.data.authUrl;
	}

	return (
		<div className={btnClass} onClick={handleClickPlatform}>
			<img src={btnIcon} alt={props.platform} /> 
			<span>{props.platform}</span>
		</div>
	)
}

export default SocialButton;
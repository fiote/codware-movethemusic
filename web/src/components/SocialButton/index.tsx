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

	/*
	if (props.data) {
		if (props.data.logged) {
			return <a className="ui active green button" href={props.data.authUrl} >Connected to {props.platform}</a>;
		}		
		// return <a className="ui active button" href={props.data.authUrl} >Connect to {props.platform}</a>;
	} 
	return <a className="ui active button disabled">Cheching {props.platform} data...</a>;
	*/

	function handleClickPlatform() {
		const authUrl = props.data.authUrl;
		window.location.href = authUrl;
	}
	
	return (
		<div className={btnClass} onClick={handleClickPlatform}>
			<img src={btnIcon} alt={props.platform} /> 
			<span>{props.platform}</span>
		</div>
	)
}

export default SocialButton;
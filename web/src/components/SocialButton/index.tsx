import React from 'react';

interface SocialButtonProps {
	data?: {
		logged: boolean,
		authUrl: string
	},
	platform: string
}

const SocialButton = (props: SocialButtonProps) => {
	if (props.data) {
		if (props.data.logged) {
			return <a className="ui active green button" href={props.data.authUrl} >Connected to {props.platform}</a>;
		}		
		return <a className="ui active button" href={props.data.authUrl} >Connect to {props.platform}</a>;
	} 
	return <a className="ui active button disabled">Cheching {props.platform} data...</a>;
}

export default SocialButton;
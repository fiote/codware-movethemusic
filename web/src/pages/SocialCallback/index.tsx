import React, { useEffect, useState } from 'react';
import Container from '../../components/Container';
import api from '../../services/api';
import Swal from 'sweetalert2'; 
import { useHistory, useParams } from 'react-router-dom';

interface Authcode {
	status: boolean,
	error?: string
}

const SocialCallback = () => {
  	let { plaform } = useParams();
	console.log('plaform',plaform);
	const history = useHistory();

	
	let search = '';
	let field = '';

	if (plaform == 'deezer') {
		search = window.location.search;
		field = 'code';
	} else {
		search = window.location.hash.substr(1);
		field = 'access_token';
	}

	const params = new URLSearchParams(search);
	const value = String(params.get(field));

	useEffect(() => {
		api.get<Authcode>('/'+plaform+'/authcode?'+field+'='+value).then(feed => {
			console.log(feed);
			if (feed.data.status) {
				Swal.fire({title:'Nice!', html:'We\'re now connected to your '+plaform.toUpperCase()+' account.' ,icon:'success'});
				history.push('/');
			} else {
				Swal.fire({title:'Ops!', html:feed.data.error, icon:'error'});
				history.push('/');
			}
		});
	},[]);

	return (
		<Container title="deezer2spotify">
			<div className="ui segment" style={{"height":200}}>
				<div className="ui active inverted dimmer">
					<div className="ui small text loader">Checking authentication code...</div>
				</div>
				<p></p>
			</div>
		</Container>
	)
}

export default SocialCallback;
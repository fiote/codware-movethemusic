import React, { useEffect } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import MainView from '../../components/MainView';

import api from '../../services/api';
import Swal from 'sweetalert2';

interface Authcode {
	status: boolean,
	error?: string
}

const SocialCallback = () => {
  	let { plaform } = useParams();
	const history = useHistory();

	let search = '';
	let field = '';

	if (plaform === 'deezer') {
		search = window.location.search;
		field = 'code';
	} else {
		search = window.location.hash.substr(1);
		field = 'access_token';
	}

	const params = new URLSearchParams(search);
	const value = String(params.get(field));

	useEffect(() => {
		let redirect:string = localStorage.getItem('redirect-after-login') || '/tracks';
		if (redirect.includes('callback')) redirect = '/';
		api.get<Authcode>('/'+plaform+'/authcode?'+field+'='+value).then(async feed => {
			if (feed.data.status) {
				// await Swal.fire({title:'Nice!', html:'We\'re now connected to your '+plaform.toUpperCase()+' account.' ,icon:'success'});
				history.push(redirect);
			} else {
				await Swal.fire({title:'Ops!', html:feed.data.error, icon:'error'});
				history.push(redirect);
			}
		});
	});

	return <MainView loading='authenticating' guest={true} />
}

export default SocialCallback;
import React from 'react';
import { Route, BrowserRouter } from 'react-router-dom';

import Home from './pages/Home';
import SocialCallback from './pages/SocialCallback';

const Routes = () => {
	return (
		<BrowserRouter>
			<Route component={Home} path="/" exact />
			<Route component={SocialCallback} path="/:plaform/callback" />
		</BrowserRouter>
	)
};

export default Routes;




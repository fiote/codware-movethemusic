import React from 'react';
import { Route, BrowserRouter } from 'react-router-dom';

import Home from './pages/Home';
import Tracks from './pages/Tracks';
import CopyFlow from './pages/CopyFlow';  
import Artists from './pages/Artists';
import Albums from './pages/Albums';
import Connections from './pages/Connections';

import SocialCallback from './pages/SocialCallback'; 

const Routes = () => {
	return (
		<BrowserRouter>
			<Route component={Home} path="/" exact />
			<Route component={Tracks} path="/tracks" exact />
			<Route component={CopyFlow} path="/copy-:mergetype" exact />
			<Route component={Artists} path="/artists" exact />
			<Route component={Albums} path="/albums" exact />
			<Route component={Connections} path="/connections" exact />
			<Route component={SocialCallback} path="/:plaform/callback" />
		</BrowserRouter>
	)
};

export default Routes;




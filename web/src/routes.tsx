import React from 'react';
import { Route, BrowserRouter } from 'react-router-dom';

import Home from './pages/Home';
import Tracks from './pages/Tracks';
import MoveFlow from './pages/MoveFlow';
import Artists from './pages/Artists';
import Albums from './pages/Albums';
import Credits from './pages/Credits';
import Connections from './pages/Connections';

import SocialCallback from './pages/SocialCallback';

const Routes = () => {
	return (
		<BrowserRouter>
			<Route component={Home} path="/" exact />
			<Route component={Tracks} path="/tracks" exact />
			<Route component={MoveFlow} path="/copy-:mergetype" exact />
			<Route component={Artists} path="/artists" exact />
			<Route component={Albums} path="/albums" exact />
			<Route component={Connections} path="/connections" exact />
			<Route component={Credits} path="/credits" exact />

			<Route component={SocialCallback} path="/:plaform/callback" />
		</BrowserRouter>
	)
};

export default Routes;




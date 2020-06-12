import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ContentPanel from '../../components/ContentPanel';
import MainView from '../../components/MainView';

import './styles.scss';

const Home = () => {
	return (
		<MainView>
			<ContentPanel>Welcome!</ContentPanel>
		</MainView>
	)
};

export default Home;
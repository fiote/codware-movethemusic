import React from 'react';
import { Link } from 'react-router-dom';

const SideMenu = (props: any) => {
	return (		
		<div className="menu">
			<Link to="/tracks" className="link">
				<i className="music icon"></i> <label>Tracks</label>
			</Link>
			<Link to="/artists" className="link">
				<i className="microphone alternate icon"></i> <label>Artists</label>
			</Link>
			<Link to="/albums" className="link">
				<i className="compact disc icon"></i> <label>Albums</label>
			</Link>
			<hr/>
			<Link to="/connections" className="link">
				<i className="wifi icon"></i> <label>Connections</label>
			</Link>
			<div className="bottom-menu">
				<hr/>
				<Link to="/credits" className="link">
					<i className="user friends icon"></i> <label>Credits</label>
				</Link>
			</div>
		</div>
	)
}

export default SideMenu;
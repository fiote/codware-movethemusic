import React from 'react';
import { Link } from 'react-router-dom';
import './index.scss';

const SideMenu = (props: any) => {
	const onClick = props.onClick;

	return (
		<div className="side-menu">
			<Link to="/tracks" className="link" onClick={onClick}>
				<i className="music icon"></i> <label>Tracks</label>
			</Link>
			<Link to="/albums" className="link" onClick={onClick}>
				<i className="compact disc icon"></i> <label>Albums</label>
			</Link>
			<Link to="/artists" className="link" onClick={onClick}>
				<i className="microphone alternate icon"></i> <label>Artists</label>
			</Link>
			<hr/>
			<Link to="/connections" className="link" onClick={onClick}>
				<i className="wifi icon"></i> <label>Connections</label>
			</Link>
			<div className="bottom-menu">
				<hr/>
				<Link to="/credits" className="link" onClick={onClick}>
					<i className="user friends icon"></i> <label>Credits</label>
				</Link>
			</div>
		</div>
	)
}

export default SideMenu;
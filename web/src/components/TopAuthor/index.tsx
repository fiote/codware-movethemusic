import React from 'react';
import './index.scss';

const TopAuthor = () => {
	return (
		<div className="top-author">
			<a className="gitlink" target='_blank' href='https://www.linkedin.com/in/murilomielke/' rel='noopener noreferrer'>
				<div className="author">
					<div className="name">
						Made by<br/>
						<span>Murilo Mielke</span>
					</div>
					<div className="name-mini">
						made<br/>
						<b>by</b>
					</div>
					<div className="avatarCircle" style={{backgroundImage:'url(https://avatars3.githubusercontent.com/u/1704338?s=400&u=13f3f82a3ac0b65f31eb1e2a98c116d4d4f2e162&v=40)'}}></div>
				</div>
			</a>
		</div>
	)
}

export default TopAuthor;
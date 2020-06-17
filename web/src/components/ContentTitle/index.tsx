import React from 'react';
import './index.scss';

interface ContentTitleProps {
	children?: React.ReactNode
}

const ContentTitle = (props: ContentTitleProps) => {

	return (
		<div className='content-title'>
			{props.children}
		</div>
	)
}

export default ContentTitle;
import React from 'react';
import './styles.scss';

import imgWarning from '../../images/warning.png';
import imgTimer from '../../images/timer.png';
import imgCrane from '../../images/crane.png';

interface ContentPanelProps { 
	type?: string,
	children?: React.ReactNode
}

const ContentPanel = (props: ContentPanelProps) => {

	let iconType = props.type;

	let subTypeOptions = {
		construction: ['crane']
	} as {
		[key: string]: string[]
	};

	if (props.type) {
		let subTypes = iconType ? subTypeOptions[props.type] : null;
		if (subTypes) iconType = subTypes[0];
	}

	let typeIcons = {
		warning: imgWarning,
		timer: imgTimer,
		crane: imgCrane
	} as {
		[key: string]: string
	};

	let iconSrc = iconType ? typeIcons[iconType] : null;
	let icon = (iconSrc) ? <img className='panel-icon' alt={props.type?.toUpperCase()} src={iconSrc} /> : null;

	return (
		<div className='panel-container'>
			<div className='panel-box'>
				{icon}
				<div className="panel-body">{props.children}</div>				
			</div>
		</div>
	)
}
 
export default ContentPanel; 
import React from 'react';
import MergedTable from '../../components/MergedTable';

import imgMic from '../../images/microphone.png';

const Artists = () => {

	const fields = {
		artist: 'Artist'
	}

	return (
		<MergedTable title='Artists' type='artists' fields={fields} icon={imgMic} />
	)
}

export default Artists;
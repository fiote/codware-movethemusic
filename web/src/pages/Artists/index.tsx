import React from 'react';
import MergedTable from '../../components/MergedTable';
import { MergedData } from '../../types';

import imgMic from '../../images/microphone.png';

const Artists = () => {

	const fields = {
		artist: 'Artist'
	}

	return (
		<MergedTable type='artists' fields={fields} icon={imgMic} />
	)
}

export default Artists;
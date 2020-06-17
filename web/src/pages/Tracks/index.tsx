import React from 'react';
import MergedTable from '../../components/MergedTable';

import imgMusic from '../../images/music.png';

const Tracks = () => {

	const fields = {
		title: 'Track',
		artist: 'Artist',
		album: 'Album'
	};

	return (
		<MergedTable title='Tracks' type='tracks' fields={fields} icon={imgMusic} />
	)
}

export default Tracks;
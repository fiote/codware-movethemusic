import React from 'react';
import MergedTable from '../../components/MergedTable';

import imgSong from '../../images/song.png';

const Albums = () => {

	const fields = {
		album: 'Album',
		artist: 'Artist',
	}

	return (
		<MergedTable title='Albums' type='albums' fields={fields} icon={imgSong} />
	)
}

export default Albums;
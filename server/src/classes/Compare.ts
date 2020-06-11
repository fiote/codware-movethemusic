class Compare {
	
	static matchTypes = [
		{},
		{containsTitle:true},
		{removeExtra:true},
		{ignoreAlbum:true},
		{containsTitle:true, ignoreAlbum:true},
		{removeExtra:true, ignoreAlbum:true},
		{removeExtra:true, containsTitle:true},
		{removeExtra:true, ignoreAlbum:true, containsTitle:true},
	];

	static getData(track: any) {		
		const albumparts = Compare.clearValue(track.calbum).split(' ');
		albumparts.sort((a,b) => a.length > b.length ? -1 : +1);
		
		const artistparts = Compare.clearValue(track.cartist).split(' ');
		artistparts.sort((a,b) => a.length > b.length ? -1 : +1);

		return {
			title: Compare.clearValue(track.ctitle),
			album: albumparts[0],
			artist: artistparts[0]
		}
	}

	static clearValue(value: string, pristine: bool = false) {
		let clear = value.replace(/\s*\(.*?\)\s*/g,'');
		if (pristine) clear = value.replace(/[^a-z0-9]/gi,'');
		return clear;
	}

	static matchInList(atrack: any, list: any[]) {
		for (var matchType of Compare.matchTypes) {
			
			const a = {title: atrack.ctitle, artist: atrack.cartist, album: atrack.calbum};
			if (matchType.removeExtra) {
				a.title = Compare.clearValue(a.title,true);
				a.album = Compare.clearValue(a.album,true);
				a.artist = Compare.clearValue(a.artist,true);
			}

			var similar = list.map(btrack => {
				const b = {title: btrack.ctitle, artist: btrack.cartist, album: btrack.calbum};			
				
				if (matchType.removeExtra) {
					b.title = Compare.clearValue(b.title,true);
					b.album = Compare.clearValue(b.album,true);
					b.artist = Compare.clearValue(b.artist,true);
				}

				return {
					title: (a.title === b.title || (matchType.containsTitle && (a.title.indexOf(b.title) >= 0 || b.title.indexOf(a.title) >= 0))),
					artist: a.artist === b.artist,
					album: a.album === b.album,
					track: btrack,
					mtype: matchType
				};
			}).filter(match => match.title || match.artist || match.album);

			var found = similar.find(match => match.title && match.artist && (match.album || matchType.ignoreAlbum));
			if (found) return {mtype:found.mtype, track:found.track};
		}
	}
}

export default Compare;
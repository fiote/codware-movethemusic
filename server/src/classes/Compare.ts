import { TrackData } from '../types';

interface MergedData {
	id: string,
	
	title: string,
	artist: string,
	album: string,
	
	ctitle: string,
	cartist: string,
	calbum: string,

	mtype: Object,
	platforms: {
		[key: string]: TrackData
	}
}

interface MatchData {
	mtype: Object,
	track: TrackData
}

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
		let clear = value;
		let clear = clear.replace(/\s*\(.*?\)\s*/g,'');
		let clear = clear.replace(/\s*\[.*?\]\s*/g,'');
		if (pristine) clear = clear.replace(/[^a-z0-9]/gi,'');
		return clear;
	}

	static matchInList(atrack: TrackData, list: TrackData[]) : MatchData {
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

	static createMerge(platform: string, track: TrackData) : MergedData {
		const { id, title, artist, album, ctitle, cartist, calbum, image_url } = track;
		const entry = { id:platform+'-'+id, title, artist, album, image_url, ctitle, cartist, calbum, platforms:{} };
		entry.platforms[platform] = track;
		return entry;
	}

	static mergeLists(akey: string, alist: TrackData[], bkey: string, blist: TrackData[]) {		
		const merged = [] as MergedData[];

		alist = Array.from(alist);
		blist = Array.from(blist);

		const matched:MergedData[] = [];
		
		while (alist.length) {
			const atrack = alist.shift() as TrackData;
			const entry = Compare.createMerge(akey, atrack);
			const match = Compare.matchInList(atrack, blist);
			if (match) {
				entry.mtype = match.mtype
				entry.platforms[bkey] = match.track;
				matched.push(match.track);
				match.track.merged = true;
			}
			merged.push(entry);
		}

		while (matched.length) {
			const track = matched.shift();
			const index = blist.indexOf(track);
			if (index >= 0) blist.splice(index,1);
		}

		while (blist.length) {
			const btrack:TrackData = blist.shift();
			const entry = Compare.createMerge(bkey, btrack);
			merged.push(entry);
		}

		return merged;
	}
}

export default Compare;
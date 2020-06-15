import { TrackData } from '../types';

interface MergedTrack {
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


interface MergedArtist {
	id: string,
	artist: string,
	cartist: string,
	image_url: string,
	mtype: Object,
	platforms: {
		[key: string]: ArtistData
	}
}

interface MatchArtist {
	mtype: Object,
	found: ArtistData
}

interface ArtistData {
	id: string,
	artist: string,
	cartist: string,
	image_url: string
}

class Compare {
	
	// ============= BASE ================================================================

	static clearValue(value: string, pristine: bool = false) {
		if (!value) return value;

		let clear = value;
		clear = clear.replace(/\s*\(.*?\)\s*/g,'');
		clear = clear.replace(/\s*\[.*?\]\s*/g,'');
		if (pristine) clear = clear.replace(/[^a-z0-9 ]/gi,'');
		clear = clear.replace(/\s+/g, " ");
		return clear;
	}

	static getKeyword(value: string, clearFirst: bool) {
		if (clearFirst) value = Compare.clearValue(value);
		const parts = value.split(' ');
		parts.sort((a,b) => a.length > b.length ? -1 : +1);
		return parts[0];
	}

	static mergeThings(akey: string, alist: any[], bkey: string, blist: any[], merger: Function, matcher: Function) {
		const merged = [];

		alist = Array.from(alist);
		blist = Array.from(blist);

		const matched = [];
		
		while (alist.length) {
			const atrack = alist.shift();
			const entry = merger(akey, atrack);
			const match = matcher(atrack, blist);
			if (match) {
				entry.mtype = match.mtype
				entry.platforms[bkey] = match.found;
				matched.push(match.found);
				match.found.merged = true;
			}
			merged.push(entry);
		}

		while (matched.length) {
			const track = matched.shift();
			const index = blist.indexOf(track);
			if (index >= 0) blist.splice(index,1);
		}

		while (blist.length) {
			const btrack = blist.shift();
			const entry = merger(bkey, btrack);
			merged.push(entry);
		}

		return merged;
	}

	// ============= TRACKS ==============================================================

	static matchTypesTracks = [
		{},
		{containsTitle:true},
		{removeExtra:true},
		{ignoreAlbum:true},
		{containsTitle:true, ignoreAlbum:true},
		{removeExtra:true, ignoreAlbum:true},
		{removeExtra:true, containsTitle:true},
		{removeExtra:true, ignoreAlbum:true, containsTitle:true},
		{removeExtra:true, ignoreAlbum:true, containsTitle:true, keyWords:true},
	];

	static mergeTracks(akey: string, alist: TrackData[], bkey: string, blist: TrackData[]) {
		const merged = [] as MergedTrack[];

		alist = Array.from(alist);
		blist = Array.from(blist);

		const matched:MergedTrack[] = [];
		
		while (alist.length) {
			const atrack = alist.shift() as TrackData;
			const entry = Compare.createMergeTrack(akey, atrack);
			const match = Compare.matchTrackInList(atrack, blist);
			if (match) {
				entry.mtype = match.mtype
				entry.platforms[bkey] = match.found;
				matched.push(match.found);
				match.found.merged = true;
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
			const entry = Compare.createMergeTrack(bkey, btrack);
			merged.push(entry);
		}

		return merged;
	}

	static createMergeTrack(platform: string, track: TrackData) : MergedTrack {
		const { id, title, artist, album, ctitle, cartist, calbum, image_url } = track;
		const entry = { id:platform+'-'+id, title, artist, album, image_url, ctitle, cartist, calbum, platforms:{} };
		entry.platforms[platform] = track;
		return entry;
	}

	static matchTrackInList(atrack: TrackData, list: TrackData[]) : MatchData {
		for (var matchType of Compare.matchTypesTracks) {
			
			const a = {title: atrack.ctitle, artist: atrack.cartist, album: atrack.calbum};

			if (matchType.removeExtra) {
				a.title = Compare.clearValue(a.title,true);
				a.album = Compare.clearValue(a.album,true);
				a.artist = Compare.clearValue(a.artist,true);
			}

			if (matchType.keyWords) {
				a.artist = Compare.getKeyword(a.artist);
			}

			var similar = list.map(btrack => {
				const b = {title: btrack.ctitle, artist: btrack.cartist, album: btrack.calbum};			
				
				if (matchType.removeExtra) {
					b.title = Compare.clearValue(b.title,true);
					b.album = Compare.clearValue(b.album,true);
					b.artist = Compare.clearValue(b.artist,true);
				}

				if (matchType.keyWords) {
					b.artist = Compare.getKeyword(a.artist);
				}

				return {
					title: (a.title === b.title || (matchType.containsTitle && (a.title.indexOf(b.title) >= 0 || b.title.indexOf(a.title) >= 0))),
					artist: a.artist === b.artist,
					album: a.album === b.album,
					found: btrack,
					mtype: matchType
				};
			}).filter(match => match.title || match.artist || match.album);

			var match = similar.find(match => match.title && match.artist && (match.album || matchType.ignoreAlbum));
			if (match) return {mtype:match.mtype, found:match.found};
		}
	}

	static getDataTrack(track: any) {
		return {
			title: Compare.clearValue(track.ctitle),
			album: Compare.getKeyword(track.calbum,true),
			artist: Compare.getKeyword(track.cartist,true)
		}
	}

	// ============= ALBUMS ==============================================================

	static matchTypesAlbums = [
		{},
		{removeExtra:true},
	];
	

	static mergeAlbums(akey: string, alist: any[], bkey: string, blist: any[]) {
		const merger = Compare.createMergeAlbum.bind(Compare);
		const matcher = Compare.matchAlbumInList.bind(Compare);
		return this.mergeThings(akey, alist, bkey, blist, merger, matcher);
	}
	
	static createMergeAlbum(platform: string, data: any) {
		const { id, album, calbum, artist, cartist, image_url } = data;
		const entry = { id:platform+'-'+id, album, calbum, artist, cartist, image_url, platforms:{} };
		entry.platforms[platform] = data;
		return entry;
	}

	static matchAlbumInList(dataA: any, list: any[]) {
		for (var matchType of Compare.matchTypesAlbums) {
			
			const a = { artist: dataA.cartist, album: dataA.calbum };

			if (matchType.removeExtra) {
				a.album = Compare.clearValue(a.album,true);
				a.artist = Compare.clearValue(a.artist,true);
			}

			var similar = list.map(dataB => {
				const b = {artist: dataB.cartist, album: dataB.calbum};	
				
				if (matchType.removeExtra) {
					b.album = Compare.clearValue(b.album,true);
					b.artist = Compare.clearValue(b.artist,true);
				}

				return {
					artist: a.artist === b.artist,
					album: a.album === b.album,
					found: dataB,
					mtype: matchType
				};
			}).filter(match => match.artist || match.album);

			var match = similar.find(match => match.album && match.artist);
			if (match) return {mtype:match.mtype, found:match.found};
		}
	}

	static getDataAlbum(item: any) {
		return {
			album: Compare.clearValue(item.calbum,true),
			artist: Compare.clearValue(item.cartist,true)
		}
	}

	// ============= ARTISTS =============================================================
	
	static matchTypesArtists = [
		{},
		{removeExtra:true},
	];

	static mergeArtists(akey: string, alist: ArtistData[], bkey: string, blist: ArtistData[]) {
		const merged = [];

		alist = Array.from(alist);
		blist = Array.from(blist);

		const matched:MergedArtist[] = [];
		
		while (alist.length) {
			const a:ArtistData = alist.shift();
			const entry = Compare.createMergeArtist(akey, a);
			const match = Compare.matchArtistInList(a, blist);
			if (match) {
				entry.mtype = match.mtype;
				entry.platforms[bkey] = match.found;
				matched.push(match.found);
				match.found.merged = true;
			}
			merged.push(entry);
		}

		while (matched.length) {
			const found = matched.shift();
			const index = blist.indexOf(found);
			if (index >= 0) blist.splice(index,1);
		}

		while (blist.length) {
			const b:ArtistData = blist.shift();
			const entry = Compare.createMergeArtist(bkey, b);
			merged.push(entry);
		}

		return merged;
	}
	
	static createMergeArtist(platform: string, data: ArtistData) : MergedArtist {
		const { id, artist, cartist, image_url } = data;
		const entry = { id:platform+'-'+id, artist, cartist, image_url, platforms:{} };
		entry.platforms[platform] = data;
		return entry;
	}

	static matchArtistInList(dataA: ArtistData, list: ArtistData[]) : MatchArtist {
		for (var matchType of Compare.matchTypesTracks) {				
			const a = {artist: dataA.cartist};
			if (matchType.removeExtra) a.artist = Compare.clearValue(a.artist,true);

			var found = list.find(dataB => {
				const b = {artist: dataB.cartist};					
				if (matchType.removeExtra) b.artist = Compare.clearValue(b.artist,true);

				if (a.artist == b.artist) return b;
			});

			if (found) return {mtype:matchType, found};
		}
	}

	static getDataArtist(item: any) {
		return {
			artist: Compare.clearValue(item.cartist,true)
		}
	}
}

export default Compare;
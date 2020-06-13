interface TrackData {
	id: number | string,
	title: string,
	artist: string,
	album: string,
	url: string,
	image_url: string,
	ctitle: string,
	cartist: string,
	calbum: string
}

export interface TrackList extends Array<TrackData> { }

interface MergedData {
	id: string,
	title: string,
	artist: string,
	album: string,
	image_url: string,
	mtype: Object,
	platforms: {
		[key: string]: TrackData
	}
}

interface MatchData {
	mtype: Object,
	track: TrackData
}

interface TrackListData {
	status: boolean,
	tracks: TrackData[]
}

export {
	TrackData,
	TrackList,
	TrackListData,
	MergedData,
	MatchData
}
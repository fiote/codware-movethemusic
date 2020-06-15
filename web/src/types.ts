export interface SocialStatus {
	logged: boolean,
	authUrl: string
}

export interface Profile {
	deezer: SocialStatus,
	spotify: SocialStatus,
	[key: string]: SocialStatus
}

export interface PagingStatus { 
	status: boolean,
	done?: boolean,
	next?: number,
	lastid?: string,
	loaded?: number,
	total?: number
}

export interface ArtistData {
	id: string,
	artist: string,
	cartist: string,
	image_url: string
}

export interface MergedArtist {
	id: string,
	artist: string,
	cartist: string,
	image_url: string,
	mtype: Object,
	platforms: {
		[key: string]: ArtistData
	}
}

export interface ItemData {
	id: number | string,
	title?: string,
	artist?: string,
	album?: string,
	ctitle?: string,
	cartist?: string,
	calbum?: string,
	image_url: string
}
 
export interface MergedData {
	id: string,
	title?: string,
	artist?: string,
	album?: string,
	ctitle?: string,
	cartist?: string,
	calbum?: string,
	image_url: string,
	platforms: {
		[key: string]: ItemData
	}
	[key: string]: string | any
}
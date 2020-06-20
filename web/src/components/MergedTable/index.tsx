import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';

import MainView from '../../components/MainView';
import ContentPanel from '../../components/ContentPanel';
import api from '../../services/api';
import Swal from 'sweetalert2';

import './index.scss';

import { Profile, PagingStatus, MergedData, ItemData } from '../../types';

interface MergedTableProps {
	type: string,
	title: string,
	icon: string,
	fields: {
		[key: string]: string
	}
}

const MergedTable = (props: MergedTableProps) => {
	const mergetype = props.type;

	const history = useHistory();
	const ls_side = localStorage.getItem(mergetype+'-filter-side') || '';
	const ls_search = localStorage.getItem(mergetype+'-filter-search') || '';

	const [side,setSide] = useState<string>(ls_side);
	const [search,setSearch] = useState<string>(ls_search);

	const [counter,setCounter] = useState<MergeCounter>({});
	const [missing,setMissing] = useState<MissingData>({deezer:[], spotify:[]});

	const [loading,setLoading] = useState<boolean>(true);
	const [merging,setMerging] = useState<boolean>(false);
	const [sideFilters,setSideFilters] = useState<any[]>([]);
	const [fullList,setFullList] = useState<MergedData[]>();
	const [filteredList,setFilteredList] = useState<MergedData[]>([]);

	let timeoutSearch:any = null;

	const [dzStatus,setDzStatus] = useState<PagingStatus>();
	const [spStatus,setSpStatus] = useState<PagingStatus>();

	const [profile,setProfile] = useState<Profile>();

	useEffect(() => {
		api.get<Profile>('/profile').then(feed => {
			setProfile(feed.data);
		});
	},[]);


	function loadItems(platform: string, currentStatus: PagingStatus, setStatus: Function) {
		if (!currentStatus?.next || currentStatus?.done) return;
		const fullget = '/'+platform+'/'+mergetype+'/'+currentStatus.next+'/'+(currentStatus.lastid || '');
		api.get(fullget).then(feed => {
			if (feed.data.status) return setStatus(feed.data);
			setStatus((st:PagingStatus) => ({...st, done:true}));
		}).catch(feed => {
			console.error(platform,'/'+mergetype+'/','ERROR',feed);
		});
	}

	useEffect(() => { dzStatus && loadItems('deezer', dzStatus, setDzStatus); },[dzStatus]);
	useEffect(() => { spStatus && loadItems('spotify', spStatus, setSpStatus); },[spStatus]);

	useEffect(() => {
		setDzStatus({status:true, next:1});
		setSpStatus({status:true, next:1});
	},[]);

	useEffect(() => {
		if (!dzStatus?.done) return;
		if (!spStatus?.done) return;
		setMerging(true);
		setLoading(false);
		api.get<ListResponse>('/'+mergetype+'list').then(feed => {
			if (feed.data.status) {
				setFullList(feed.data.list);
				setMerging(false);
			} else {
				console.error(feed);
			}
		}).catch(feed => {
			console.error(feed);
		});
	},[dzStatus,spStatus]);

	useEffect(() => {
		let newCounts = {total:0, both:0, deezer:0, spotify:0};
		fullList && fullList.forEach(merged => {
			const plats = Object.keys(merged.platforms);
			newCounts.total++;
			if (plats.length === 2) newCounts.both++;
			if (!plats.includes('deezer')) newCounts.spotify++;
			if (!plats.includes('spotify')) newCounts.deezer++;
		});
		setCounter(newCounts);
	}, [fullList])

	useEffect(() => {
		setSideFilters([
			{code: '', label:'Any Side', mobile:'Any', qty:counter['total']},
			{code: 'both', label:'Both Sides', mobile:'Both', qty:counter['both']},
			{code: 'deezer', label:'Only at Deezer', mobile:'Dz', qty:counter['deezer']},
			{code: 'spotify', label:'Only at Spotify', mobile:'Sp', qty:counter['spotify']}
		]);
	},[counter]);

	useEffect(() => {
		let newMissing = {deezer:[], spotify:[]} as MissingData;

		const filtered = fullList?.filter(merged => {
			const plats = Object.keys(merged.platforms);

			if (side) {
				if (side === 'both' && plats.length === 1) return false;
				if (side === 'deezer' && plats.includes('spotify')) return false;
				if (side === 'spotify' && plats.includes('deezer')) return false;
			}
			if (search) {
				let any = false;
				if (!any && merged?.ctitle?.includes(search)) any = true;
				if (!any && merged?.cartist?.includes(search)) any = true;
				if (!any && merged?.calbum?.includes(search)) any = true;
				if (!any) return false;
			}

			if (!plats.includes('deezer')) newMissing.deezer.push(merged);
			if (!plats.includes('spotify')) newMissing.spotify.push(merged);
			return true;
		}) || [];
		setFilteredList(filtered);
		setMissing(newMissing);
	}, [fullList, side, search]);

	function handleChangeItem(merged: MergedData, platform: string, newitem: ItemData) {
		if (!fullList) return;
		var index = fullList.indexOf(merged);
		var clone = Array.from(fullList);
		merged.platforms[platform] = newitem;
		clone[index] = merged;
		setFullList(clone);
	}

	function handleSearchChange(event: any) {
		clearTimeout(timeoutSearch);
		const value =event.target.value;
		timeoutSearch = setTimeout(ev => {
			setSearch(value);
			localStorage.setItem(mergetype+'-filter-search',value);
		},100);
	}

	function handleClickMove(source: string, target: string) {
		const sourcex = source.toUpperCase();
		const targetx = target.toUpperCase();
		const newlist = missing[target];
		const qty = newlist.length;
		const extraText = (qty > 50) ? ' This can take a while.' : '';

		Swal.fire({
			title: sourcex+' to '+targetx,
			html: 'Are you sure you want to try to move <b>'+qty+'</b> '+mergetype+' to your '+targetx+' account?'+extraText,
			icon: 'question',
			showCancelButton: true,
			confirmButtonColor: '#3085d6',
			cancelButtonColor: '#d33',
			confirmButtonText: 'Yes, move '+(qty === 1 ? 'it' : 'them')+'!',
			cancelButtonText: 'No, nevermind'
		}).then(result => {
			if (result.value) history.push('/copy-'+mergetype, { source, target, items: newlist });
		});
	}

	function handleSideFilterClick(newSide: string) {
		setSide(newSide);
		localStorage.setItem(mergetype+'-filter-side',newSide);
	}

	if (merging) {
		return (
			<MainView title={props.title}>
				<ContentPanel icon={props.icon}>
					<div className="text-main">merging {mergetype}</div>
					<div className="text-aux">(this can take a while)</div>
				</ContentPanel>
			</MainView>
		)
	}

	if (loading) {
		return (
			<MainView title={props.title}>
				<ContentPanel icon={props.icon}>
					<div className="text-main">fetching {mergetype}</div>
					<div className="text-aux">Deezer: {dzStatus?.loaded || '0'}/{dzStatus?.total || '0'}</div>
					<div className="text-aux">Spotify: {spStatus?.loaded || '0'}/{spStatus?.total || '0'}</div>
				</ContentPanel>
			</MainView>
		)
	}

	return (
		<MainView title={props.title}>
			<div className="p-1 mb-2 merged-table">
				<div className="merged-header">
					<div className="merged-search">
						<div className="ui icon input">
							<i className="search icon"></i>
							<input type="text" placeholder="Search..." defaultValue={ls_search} onChange={handleSearchChange}/>
						</div>
					</div>

					<div className="ui buttons merged-filters">
						{sideFilters && sideFilters.map(sidef => {
							return (
								<button key={sidef.code} className={['ui','button',sidef.code === side ? 'active' : ''].join(' ')} onClick={() => handleSideFilterClick(sidef.code)} >
									<span className='big-text'>{sidef.label} ({sidef.qty})</span>
									<span className='small-text'>{sidef.mobile} ({sidef.qty})</span>
								</button>
							)
						})}
					</div>
					<div className="merged-actions">
						<button className="ui right labeled icon teal button btn-sync btn-sp" disabled={missing.spotify.length === 0} onClick={() => handleClickMove('deezer','spotify')} >
							<i className="upload icon"></i>
							<div className='big-text'>Deezer to Spotify ({missing.spotify.length})</div>
							<div className='small-text'>Dz to Sp ({missing.spotify.length})</div>
						</button>
						<button className="ui right labeled icon teal button btn-sync btn-dz" disabled={missing.deezer.length === 0} onClick={() => handleClickMove('spotify','deezer')} >
							<i className="upload icon"></i>
							<div className='big-text'>Spotify to Deezer ({missing.deezer.length})</div>
							<div className='small-text'>Sp to Dz ({missing.deezer.length})</div>
						</button>
					</div>
				</div>

				<div className="merged-content">
					<MergedHead fields={props.fields} />
					<MergedBody fields={props.fields} list={filteredList} type={mergetype} profile={profile} onChanged={handleChangeItem} />
				</div>
			</div>
		</MainView>
	)
}

interface MergedBodyProps {
	fields: { [key: string]: string },
	list: MergedData[],
	type: string,
	profile: Profile | undefined,
	onChanged: Function
}

const MergedBody = (props: MergedBodyProps) => {

	let content = null;

	if (props.list) {
		if (props.list.length)  {
			content = props.list.map(merged => {
				return (
					 <MergedRow key={merged.id} type={props.type} fields={props.fields} profile={props.profile} merged={merged} onChanged={props.onChanged} />
				)
			});
		} else {
			content = (
				<div className='merged-row row-empty'>
					<div className='cell-full'>Ops, nothing to show here!</div>
				</div>
			);
		}
	}
	return (
		<div className='merged-body'>
			{content}
		</div>
	)
}

interface MergedHeadProps {
	fields: { [key: string]: string }
}

const MergedHead = (props: MergedHeadProps) => {
	const keys = Object.keys(props.fields);
	const classRow = ['merged-row','cols-'+keys.length].join(' ');

	const divs = keys.map(field => {
		const classDiv = 'cell-'+field;
		const label = props.fields[field];
		return (
			<div key={field} className={classDiv}>{label}</div>
		)
	});

	return (
		<div className='merged-head'>
			<div className={classRow}>
				{divs}
				<div className="text-center cell-platform">
					<span className='big-text'>Deezer</span>
					<span className='small-text'>Dz</span>
				</div>
				<div className="text-center cell-platform">
					<span className='big-text'>Spotify</span>
					<span className='small-text'>Sp</span>
				</div>
			</div>
		</div>
	)
}

interface MergedRowProps {
	type: string,
	fields: { [key: string]: string },
	merged: MergedData,
	profile?: Profile,
	onChanged: Function
}

const MergedRow = (props: MergedRowProps) => {
	const merged = props.merged;
	const [busy,setBusy] = useState<boolean>(false);

	function handleClickRow(platform: string) {
		setBusy(true);
		api.post('/'+platform+'/find/'+props.type,merged).then(async feed => {
			if (feed.data.status) {
				await props.onChanged(props.merged, platform, feed.data.newentry);
			}
			setBusy(false);
		}).catch(feed => {
			setBusy(false);
		});
	}

	const keys = Object.keys(props.fields);
	const classRow = ['merged-row',busy ? 'row-busy' : '','cols-'+keys.length].join(' ');

	const divs = keys.map(field => {
		const classDiv = 'cell-'+field;
		const value = props.merged[field];
		return (
			<div key={field} className={classDiv}>{value}</div>
		)
	});

	return (
		<div className={classRow}>
			{divs}
			<div className="cell-platform text-center">
				<MatchButton merged={props.merged} platform='deezer' profile={props.profile} busy={busy} clickHandler={handleClickRow} />
			</div>
			<div className="cell-platform text-center">
				<MatchButton merged={props.merged} platform='spotify' profile={props.profile} busy={busy} clickHandler={handleClickRow} />
			</div>
		</div>
	)
}

interface MatchButtonProps {
	merged: MergedData,
	platform: string,
	busy: boolean,
	profile?: Profile,
	clickHandler: Function
}

const MatchButton = (props: MatchButtonProps) => {
	if (props.merged.platforms[props.platform]) return <i className='check green icon'></i>;

	if (!props.profile || !props.profile[props.platform].logged) return <i className='question inverted grey icon'></i>;

	function handleClickMatch() {
		props.clickHandler(props.platform);
	}

	return (
		<button className='mini ui icon button' disabled={props.busy} onClick={handleClickMatch} >
			<i className='plus icon'></i>
		</button>
	)
}


interface ListResponse {
	status: boolean,
	list: MergedData[]
}

interface MergeCounter {
	[key: string]: number
}

interface MissingData {
	spotify: MergedData[],
	deezer: MergedData[],
	[key: string]: MergedData[]
}

export default MergedTable;
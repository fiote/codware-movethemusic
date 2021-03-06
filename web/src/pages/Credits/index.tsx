import React from 'react';
import MainView from '../../components/MainView';

import './index.scss';

import imgDeezer from '../../images/deezer.png';
import imgSpotify from '../../images/spotify.png';
import imgCrane from '../../images/crane.png';
import imgMic from '../../images/microphone.png';
import imgMusic from '../../images/music.png';
import imgSong from '../../images/song.png';
import imgTimer from '../../images/timer.png';
import imgWarning from '../../images/warning.png';

const Credits = () => {

	const iconScout = {name:'IconScout', link:'www.iconscout.com'};
	const freepik = {name:'Freepik', link:'www.flaticon.com/authors/freepik'};
	const flaticon = {name:'Flaticon', link:'www.flaticon.com'};

	const listing = [
		{
			img: imgDeezer,
			name: 'Deezer',
			link: 'https://iconscout.com/icons/deezer',
			made: {name:'Luc Chaffard', link:'https://iconscout.com/contributors/luc-chaffard'},
			from: iconScout
		},
		{
			img: imgSpotify,
			name: 'Spotify',
			link: 'https://iconscout.com/icons/spotify',
			made: {name:'Bakul Studio', link:'https://iconscout.com/contributors/naufal-thufail'},
			from: iconScout
		},
		{
			img: imgCrane,
			name: 'Crane',
			link: 'https://www.flaticon.com/free-icon/crane_619028',
			made: freepik,
			from: flaticon
		},
		{
			img: imgMic,
			name: 'Microphone',
			link: 'https://www.flaticon.com/free-icon/microphone_2983859',
			made: freepik,
			from: flaticon
		},
		{
			img: imgMusic,
			name: 'Music',
			link: 'https://www.flaticon.com/free-icon/music_2912120',
			made: freepik,
			from: flaticon
		},
		{
			img: imgSong,
			name: 'Song',
			link: 'https://www.flaticon.com/free-icon/vinyl_2950754',
			made: freepik,
			from: flaticon
		},
		{
			img: imgTimer,
			name: 'Sand Clock',
			link: 'https://www.flaticon.com/free-icon/sand-clock_535177',
			made: freepik,
			from: flaticon
		},
		{
			img: imgWarning,
			name: 'Warning',
			link: 'https://www.flaticon.com/free-icon/warning_595067',
			made: freepik,
			from: flaticon
		},
		{
			img: null,
			name: 'Spotify Splash',
			link: 'https://unsplash.com/photos/6k4HkET8dPM',
			made: {name: 'Charles Deluvio', link: 'unsplash.com/@charlesdeluvio'},
			from: {name: 'Unsplash', link:'unsplash.com'}
		}

	];

	// <span>Photo by <a href="https://unsplash.com/s/photos/spotify/@charlesdeluvio?utm_source=unsplash&amp;utm_medium=referral&amp;utm_content=creditCopyText">Charles Deluvio</a> on <a href="/s/photos/spotify?utm_source=unsplash&amp;utm_medium=referral&amp;utm_content=creditCopyText">Unsplash</a></span>

	return (
		<MainView title='Credits' guest={true}>
			<div style={{padding: 10}}>
				<div className='ui list'>
					{listing.map(data => {
						const madelink = 'https://'+data.made.link;
						const fromlink = 'https://'+data.from.link;
						return (
							<div key={data.link} className='item'>
								{data.img && <img className='ui square image' src={data.img} alt='' />}
								<div className='content'>
									<a className='header' href={data.link} target='_blank' rel='noopener noreferrer'>{data.name}</a>
									<div className='description'>
										made by <a href={madelink} target="_blank" rel='noopener noreferrer'>{data.made.name}</a> from <a href={fromlink} target='_blank' rel='noopener noreferrer' title={data.from.name}> {data.from.link}</a>
									</div>
								</div>
							</div>
						)
					})}
				</div>
			</div>
		</MainView>
	)
}

export default Credits;
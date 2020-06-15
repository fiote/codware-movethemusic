import React from 'react';
import MainView from '../../components/MainView';
import ContentPanel from '../../components/ContentPanel';
import ContentTitle from '../../components/ContentTitle';

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
		}
	];


	const title = (
		<ContentTitle>Credits</ContentTitle>
	)

	return (
		<MainView title={title}>
			<div style={{padding: 10}}>
				<div className='ui list'>
					{listing.map(data => {
						const datalink = 'https://'+data.link;
						const madelink = 'https://'+data.made.link;
						const fromlink = 'https://'+data.from.link;
						return (
							<div key={data.link} className='item'>
								<img className='ui square image' src={data.img} />
								<div className='content'>
									<a className='header' href={datalink} target='_blank'>{data.name}</a>
									<div className='description'>
										made by <a href={madelink} target="_blank">{data.made.name}</a> from <a href={fromlink} title={data.from.name}> {data.from.link}</a>
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
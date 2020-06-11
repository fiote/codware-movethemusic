require('dotenv').config();

import express from 'express';
import cors from 'cors';
import axios from 'axios';
import session from 'express-session';
import { v4 as uuid } from 'uuid';
import routes from './routes';

const app = express(); 


app.use(session({
	secret: 'deezer2session2spotify', 
	resave: false, 
	saveUninitialized: true, 
	// cookie: { secure: true },	
  	genid: (req) => {
    	console.log('Inside the session middleware');
    	console.log(req.sessionID);
    	return uuid(); // use UUIDs for session IDs
  	},
}));

app.use(cors({
	credentials: true,
	origin: 'http://localhost:3000'
}));
app.use(express.json());
app.use(routes);

async function loader() {

	const SpotifyDefault = {
		auth: 'AQAgqbAFQu8ZZmL6Bd3CZFB63Q4R_Waxk0VBPTDrUPVWTUi1FAXVz-2ChwuOjJ5bDJ6g71eJPBHMQAIWFa_CpAjtkKATNwHkTKn6ae_O-wkznB5z4fBa5mtf5ugVw842UYxUsH1VYuGM_f80mYZ5Jo9kBco5Ks4JKjcgTwbDOUHaeagHYIqj9PYR',
		userId: null,
		playlistId: null
	};
		
	axios.get('https://api.spotify.com/v1/me/tracks',{headers: { Authorization: 'Bearer '+SpotifyDefault.auth}}).then(feed => {
		console.log("WORKED");
	}).catch(feed => {
		console.log('FAILED',feed.toJSON().message);
	});
}


app.listen(3333);
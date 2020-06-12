require('dotenv').config();

///<reference path="../types.d.ts" />
  
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
  	genid: (req) => { return uuid(); },
}));

app.use(cors({
	credentials: true,
	origin: 'http://localhost:3000'
}));
app.use(express.json());
app.use(routes);

app.listen(3333);
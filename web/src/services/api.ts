import axios from 'axios';

let baseURL = 'http://movethemusic-api.codware.com';
// baseURL = 'http://localhost:3333';

const api = axios.create({
	baseURL,
	withCredentials: true
});

export default api;
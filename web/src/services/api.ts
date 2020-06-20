import axios from 'axios';

console.log('process.env.REACT_APP_APIURL',process.env.REACT_APP_APIURL);

const api = axios.create({
	baseURL: process.env.REACT_APP_APIURL,
	withCredentials: true
});

export default api;
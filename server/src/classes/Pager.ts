import { Request, Response } from 'express';
import Cache from '../classes/Cache';

class Pager {
	constructor(platform: string, parser: any, options: any) {
		this.platform = platform;
		this.parser = parser;
		this.options = options;
	}

	async loadEntities(request: Request, response: Response, type: string) {
		const data = this.parser.data(request);
		const keylist = this.platform+'-'+type+'-list';
		if (!data) return response.json({status:false, error:'no_session_data'});

		const ipage = Number(request.params.page) || 1;
		const slast = request.params.lastid || '';
		const list = request.getData(keylist,[]);

		const pagedata = await this.getEntityPage(request, type, ipage, slast);
		if (!pagedata.status) return response.json(pagedata);

		let lastid = '';

		pagedata.entries.forEach(entry => {
			var exists = list.find(saved => saved.id == entry.id);
			if (!exists) list.push(entry);
			lastid = entry.id;
		});

		await request.setData(keylist,list);

		const loaded = list.length;
		const total = pagedata.total;
		const next = (loaded < total && pagedata.next) ? ipage+1 : null;
		response.json({status:true, next, loaded, total, lastid, done:loaded >= total, pagedata});
	}

	async getEntityPage(request: Request, type: string, ipage: number, lastid: string) {
		const ilimit = 50;
		const ioffset = (ipage-1)*ilimit;

		const baseurl:string = this.parser.base(request, type, {ipage, ilimit, ioffset, lastid});

		return new Promise(resolve => {
			this.parser.get(request, baseurl, true).then(async result => {
				const pagedata = this.parser.parsePage(type,result?.data);
				if (!pagedata.entries) {
					// await this.parser.logout(request);
					return resolve({status:false, error:'no_list', data:result.data, logout:true});
				}
				pagedata.entries = pagedata.entries.map(item => this.parser.parseEntity(type,item));
				return resolve({status:true, ...pagedata});
			}).catch(async result => {
				// await this.parser.logout(request);
				return resolve({status:false, error:'catch', details:result, logout:true});
			});
		});
	}

	keylist(type:string) {
		return this.platform+'-'+type+'-list';
	}

	get(request: Request, type: string) {
		const keylist = this.keylist(type);
		return request.getData(keylist,[]);
	}

	async set(request: Request, type: string, fulllist: any[]) {
		const keylist = this.keylist(type);
		await request.setData(keylist,fulllist);
	}

	async push(request: Request, type: string, newentry: any) {
		const fulllist = this.get(request, type);
		fulllist.push(newentry);
		await this.set(request, type, fulllist);
	}

	async empty(request: Request, types:string[]) {
		const keys = types.map(type => this.keylist(type));
		await request.clearData(keys);
	}
}

export default Pager;
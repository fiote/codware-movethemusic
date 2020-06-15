import { Request } from 'express';
import fs from 'fs';
import path from 'path';

class Cache {
	static path(filename: string) {
		return path.resolve(__dirname,'..','cache',filename+'.json');
	}

	static get(filename: string) {
		const path = Cache.path(filename);
		const exists = fs.existsSync(path);
		if (!exists) return null;		
		const content = fs.readFileSync(path);
		try {
			const value = content ? JSON.parse(content) : null;
		} catch(e) {
			const value = '';
		}
		return value;
	}

	static set(filename: string, value: any) {
		const path = Cache.path(filename);
		const content = value ? JSON.stringify(value) : '';
		fs.writeFileSync(path, content);
	}

	static remove(filename: string, request: any) {
		return new Promise(resolve => {
			const path = Cache.path(filename);
			const exists = fs.existsSync(path);
			if (exists) fs.unlinkSync(path);
			request.session[filename] = null;
			request.session.save(resolve);
		});
	}

	static sessionGet(request: Request, field: string) {
		return request.session?.[field] || Cache.get(field);
	}

	static sessionPush(request: Request, field: string, item: any) {
		const value = Cache.sessionGet(request, field) as any[];
		value.push(item);
		return Cache.sessionSet(request, field, value);
	}

	static sessionSet(request: Request, field: string, value: any) {
		return new Promise(resolve => {
			if (request.session) {
				request.session[field] = value;
				Cache.set(field, value);
				request.session?.save(resolve);
			} else {
				resolve();
			}
		});
	}
}

export default Cache;
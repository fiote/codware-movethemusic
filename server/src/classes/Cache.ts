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
		const value = JSON.parse(content);
		return value;
	}

	static set(filename: string, value: any) {
		const path = Cache.path(filename);
		const content = JSON.stringify(value);
		fs.writeFileSync(path, content);
	}

	static remove(filename: string, request: any) {
		const path = Cache.path(filename);
		const exists = fs.existsSync(path);
		if (exists) fs.unlinkSync(path);
		request.session[filename] = null;
		request.session.save();
	}
}

export default Cache;
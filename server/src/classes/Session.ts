import { Request } from 'express';

const memory = {};

class Session {

	static memory = {};

	static set(request: Request, key: string, value: any) {
		const sid = request.session.id;
		if (!sid) return;
		if (!this.memory[sid]) this.memory[sid] = {};
		this.memory[sid][key] = value;
	}

	static get(request: Request, key: string, defvalue: any) {
		const sid = request.session.id;
		if (!sid) return null;
		if (!this.memory[sid]) this.memory[sid] = {};
		const value = this.memory[sid][key] || defvalue;
		return JSON.parse(JSON.stringify(value || null));
	}
}

export default Session;
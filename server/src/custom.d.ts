declare namespace Express {
   	export interface Request {
    	setData(key: string, value: any | undefined): Promise<void>,
		clearData(keys: string[]): Promise<void>,
		getData(key: string, defvalue?: any): any
   	}
}
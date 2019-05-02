"use strict";
let request_ID = 0;
const UTILS = new (require("./utils.js"))();
module.exports = class WSMessageManager {
	constructor() {
		this.collector = {};
	}
	get() {
		if (request_ID % 50 === 0) this.clean();
		this.collector["" + request_ID] = {
			timestamp: new Date().getTime()
		};
		let request_promise = new Promise((resolve, reject) => {
			this.collector["" + request_ID].resolve = resolve;
			this.collector["" + request_ID].reject = reject;
			//send ws message via wsapi
		});
		return {
			promise: request_promise,
			request_ID: "" + (request_ID++)
		};
	}
	wsMessageCallback(raw_message) {
		if (UTILS.exists(this.collector[raw_message.wsm_ID])) {
			if (raw_message.code != 500) {
				this.collector[raw_message.wsm_ID].resolve(raw_message.response);
			}
			else {
				this.collector[raw_message.wsm_ID].reject(raw_message.response);
			}
			delete this.collector[raw_message.wsmID];
		}
	}
	clear() {//rejects all in-progress, clears collector
		let num_deleted = 0;
		for (let i in this.collector) {
			this.collector[i].reject(new Error("wsmm requests cleared"));
			++num_deleted;
		}
		this.collector = {};
		return num_deleted;
	}
	clean(timeout = 600000) {//removes old requests, timeout in ms, default 10 mins
		let num_deleted = 0;
		const threshold = new Date().getTime() - timeout;
		for (let i in this.collector) {
			if (this.collector[i].timestamp < threshold) {
				this.collector[i].reject(new Error("wsmm request timeout"));
				delete this.collector[i];
				++num_deleted;
			}
		}
		return num_deleted;
	}
}

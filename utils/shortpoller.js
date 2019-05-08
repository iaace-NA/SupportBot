"use strict";
let UTILS = new (require("./utils.js"))();
module.exports = class ShortPoller {
	constructor(poll_rate, timeout, update_function) {//times in ms
		this.update = update_function;
		this.expiry = UTILS.now() + timeout;
		this.poll_rate = poll_rate;
	}
	start() {
		if (!UTILS.exists(this.interval)) {
			if (UTILS.now() > this.expiry) return false;
			this.update();
			this.interval = setInterval(() => {
				if (UTILS.now() > this.expiry) {
					clearInterval(this.interval);
					this.interval = undefined;
				}
				else {
					this.update();
				}
			}, this.poll_rate);
			return true;
		}
	}
	stop() {
		clearInterval(this.interval);
		this.interval = undefined;
	}
}
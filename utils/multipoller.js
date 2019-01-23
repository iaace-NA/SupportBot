"use strict";
/*
meant for use with database systems
*/
let UTILS = require("./utils.js");
module.exports = class MultiPoller {
	constructor (name, updatesDueFunction, checkForUpdatesFunction, checkReadyForUpdateFunction, justUpdatedFunction, stalledFunction, options) {
		/*
		this.updatesDue() is called when a new list of retrievables is needed. returns an in-order array of updatable { id, options }
		this.checkForUpdates(id, options) is called on an id and state information. returns a promise with most recent information.
		this.checkReadyForUpdates(id) verifies that something can be updated. returns boolean.
		this.justUpdated(id, results, error) is called when a job finishes in the queue.

		options {
			min_queue_length: 0,
			max_queue_length: 100,
			slow_update_interval: 2000,
			fast_update_interval: 100,
			status_check_interval: 10000
		}
		*/
		this.name = name;
		UTILS.assert(typeof(updatesDueFunction) === "function");
		this.updatesDue = updatesDueFunction;
		UTILS.assert(typeof(checkForUpdatesFunction) === "function");
		this.checkForUpdates = checkForUpdatesFunction;
		UTILS.assert(typeof(checkReadyForUpdateFunction) === "function");
		this.checkReadyForUpdate = checkReadyForUpdateFunction;
		UTILS.assert(typeof(justUpdatedFunction) === "function");
		this.justUpdated = justUpdatedFunction;
		UTILS.assert(typeof(stalledFunction) === "function");
		this.stalled = stalledFunction;
		UTILS.assert(typeof(options) === "object");
		this.options = options;
		this.update_queue = [];
		this.last_job_time = new Date().getTime();
		this.update_interval_mode = 0;//0 for auto, -1 for fast, -2 for slow, -3 for stop, any other value is update interval in ms
		setInterval(() => {
			if (new Date().getTime() - this.last_job_time > (this.options.slow_update_interval * 3)) {
				this.stalled(new Error("MultiPoller: " + this.name + " recursive update checker stalled"));
			}
		}, this.options.status_check_interval);
		this.recursiveStartNext();
	}
	setUpdateIntervalAuto() {
		this.update_interval_mode = 0;
	}
	setUpdateIntervalFast() {
		this.update_interval_mode = -1;
	}
	setUpdateIntervalSlow() {
		this.update_interval_mode = -2;
	}
	setUpdateIntervalCustom(x) {
		this.update_interval_mode = x;
	}
	setUpdateIntervalStop() {
		this.update_interval_mode = -3;
	}
	checkUpdate(id, options) {//check conditions are right for updating
		return this.checkReadyForUpdate(id, options);
	}
	checkUpdatesDue() {
		let ud = this.updatesDue();//updates due
		for (let i = 0; i < ud.length; ++i) {
			this.add(ud[i].id, ud[i].options);
		}
		return ud.length;
	}
	add(id, options) {//force update in next update cycle. returns 0-indexed place in queue
		const iiq = this.update_queue.findIndex(e => e.id === id);
		if (iiq !== -1) {
			this.update_queue[iiq].options = options;
			return iiq;
		}
		else {
			this.update_queue.push({ id, options });
			return this.update_queue.length - 1;
		}
	}
	forceUpdateNow(id, options) {//force no matter what, right now
		this.update_queue.unshift({ id, options });//adds to front of queue
	}
	remove(id) {//remove from polling queue if it is in the queue. returns true if in queue, returns false if not in queue.
		const iiq = this.update_queue.findIndex(e => e.id === id);//index in question
		if (iiq !== -1) {
			this.update_queue.splice(iiq, 1);
			return true;
		}
		else return false;
	}
	queueLength() {
		return this.update_queue.length;
	}
	getQueue() {
		return UTILS.copy(this.update_queue);
	}
	getUpdateInterval() {//returns the live update interval in ms
		switch (this.update_interval_mode) {
			case 0:
				return UTILS.constrain(UTILS.map(this.update_queue.length, this.options.min_queue_length, this.options.max_queue_length, this.options.slow_update_interval, this.options.fast_update_interval), this.options.slow_update_interval, this.options.fast_update_interval);
			case -1:
				return this.options.fast_update_interval;
			case -2:
				return this.options.slow_update_interval;
			case -3:
				return this.options.slow_update_interval;
			default:
				return this.update_interval_mode;
		}
	}
	recursiveStartNext() {
		this.last_job_time = new Date().getTime();
		try {
			let uqo = this.update_queue[0];//update queue object
			if (this.update_queue.length <= 1) this.checkUpdatesDue();//update list of things needed to be updated soon
			if (this.update_interval_mode !== -3 && UTILS.exists(uqo) && this.checkUpdate(uqo.id, uqo.options)) {
				this.update_queue.shift();
				this.forceUpdateNow(uqo.id, uqo.options).then(data => this.justUpdated(uqo.id, data, null)).catch(e => this.justUpdated(uqo.id, null, e));
			}
		}
		catch (e) { console.error(e); }
		setTimeout(this.recursiveStartNext, this.getUpdateInterval());//does not wait for update to complete before starting the next job
	}
}

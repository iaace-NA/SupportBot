"use strict";
/*
meant for use with database systems
*/
let UTILS = new (require("./utils.js"))();
module.exports = class MultiPoller {
	constructor (name, updatesDueFunction, checkForUpdatesFunction, checkReadyForUpdateFunction, justUpdatedFunction, stalledFunction, options) {
		/*
		this.updatesDue() is called when a new list of retrievables is needed. returns a promise that resolves an in-order array of updatable { id, options }
		this.checkForUpdates(id, options) is called on an id and state information. returns a promise with most recent information.
		this.checkReadyForUpdate(id) verifies that something can be updated. returns a promise that resolves a boolean.
		this.justUpdated(id, results, error) is called when a job finishes in the queue.

		options {
			min_queue_length: 0,
			max_queue_length: 100,//not a hard maximum. used to determine update interval
			slow_update_interval: 2000,
			fast_update_interval: 100,
			status_check_interval: 10000,
			soft_update_interval: 10
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
		UTILS.assert(typeof (stalledFunction) === "function");
		this.stalled = stalledFunction;
		UTILS.assert(typeof(options) === "object");
		this.options = options;
		this.update_queue = [];
		this.last_job_time = new Date().getTime();
		this.soft_update_counter = 0;
		this.update_interval_mode = 0;//0 for auto, -1 for fast, -2 for slow, -3 for stop, any other value is update interval in ms
		setInterval(() => {
			if (new Date().getTime() - this.last_job_time > (this.options.slow_update_interval * 3)) {
				this.stalled(new Error("MultiPoller: " + this.name + " recursive update checker stalled"));
			}
		}, this.options.status_check_interval);
		this.recursiveStartNext();
		//setTimeout(this.recursiveStartNext, 0);
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
		return new Promise((resolve, reject) => {
			this.updatesDue().then(ud => {
				for (let i = 0; i < ud.length; ++i) {
					this.add(ud[i].id, ud[i].options);
				}
				resolve(ud.length);
			});//updates due
		});
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
	forceUpdateASAP(id, options) {//add to front of queue. public access
		this.update_queue.unshift({ id, options });//adds to front of queue
	}
	updateNow(id, options) {//force no matter what, right now.
		return this.checkForUpdates(id, options);
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
		let that = this;
		function internal() {
			switch (that.update_interval_mode) {
				case 0:
					return UTILS.constrain(UTILS.map(that.update_queue.length, that.options.min_queue_length, that.options.max_queue_length, that.options.slow_update_interval, that.options.fast_update_interval), that.options.fast_update_interval, that.options.slow_update_interval);
				case -1:
					return that.options.fast_update_interval;
				case -2:
					return that.options.slow_update_interval;
				case -3:
					return that.options.slow_update_interval;//not defined yet; should be stop mode
				default:
					return that.update_interval_mode;
			}
		}
		const ans = internal();
		UTILS.debug("Update Interval: " + ans);
		return ans;
	}
	softUpdate() {//internal function that checks if conditions are right for updating
		++this.soft_update_counter;
		if (this.soft_update_counter % this.options.soft_update_interval === 0) {
			this.checkUpdatesDue().then(() => { });
		}
	}
	recursiveStartNext(that = this) {
		//let that = this;
		that.last_job_time = new Date().getTime();
		try {
			//UTILS.debug("update queue length: " + that.update_queue.length);
			UTILS.debug("update queue contents1: " + JSON.stringify(that.update_queue));
			if (UTILS.exists(that.update_queue[0])) {
				let uqo = UTILS.copy(that.update_queue[0]);//update queue object
				if (that.update_interval_mode !== -3 && UTILS.exists(uqo)) {
					that.checkUpdate(uqo.id, uqo.options).then(cu => {
						that.update_queue.shift();
						if (cu) {
							UTILS.debug("update queue contents2: " + JSON.stringify(that.update_queue));
							that.updateNow(uqo.id, uqo.options).then(data => {
								that.justUpdated(uqo.id, data, null).then(() => {
									that.softUpdate();//update list of things needed to be updated soon
								});
							}).catch(e => {
								that.justUpdated(uqo.id, null, e).then(() => {
									that.softUpdate();//update list of things needed to be updated soon
								});
							});
						}
						else {
							console.error("cu returned false");
						}
					}).catch(e => that.justUpdated(uqo.id, null, e));
				}
			}
			else that.softUpdate();//update list of things needed to be updated soon
		}
		catch (e) { console.error(e); }
		//UTILS.assert(UTILS.exists(that.getUpdateInterval()));
		//UTILS.assert(typeof(that.getUpdateInterval()) == "number");
		setTimeout(that.recursiveStartNext, that.getUpdateInterval(), that);//does not wait for update to complete before starting the next job
	}
}

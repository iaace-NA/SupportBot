"use strict";
module.exports = class RateLimiter {
	constructor(x, y) {//x events per y seconds
		this.eventTimes = [];
		this.warned = false;
		this.setMode(x, y);
	}
	setMode(x, y) {
		this.timePeriod = y * 1000;
		this.timeFrequency = x;
	}
	testAdd() {
		return this.check();
	}
	add(cost = 1) {
		const ct = new Date().getTime();
		if (this.check(ct)) {
			for (let i = 0; i < cost; ++i) this.eventTimes.push(ct);
			this.warned = false;
			return true;
		}
		else return false;
	}
	check(ct = new Date().getTime()) {//checks to see if another event can occur
		for (let i in this.eventTimes) {//clean
			if (this.eventTimes[i] < new Date().getTime() - this.timePeriod) {
				this.eventTimes.shift();
				i--;
			}
		}
		return this.eventTimes.length < this.timeFrequency;
	}
	clear() {
		this.eventTimes = [];
		this.warned = false;
	}
	remainingEvents() {//remaining commands to use within the time period
		this.check();
		return this.timeFrequency - this.eventTimes.length - 1 >= 0 ? this.timeFrequency - this.eventTimes.length - 1 : 0;
	}
	remainingTime() {//time in seconds before next available command
		const ct = new Date().getTime();
		return this.check(ct) ? 0 : ((this.eventTimes[0] + this.timePeriod) - ct) / 1000;
	}
	warn() {
		this.warned = true;
	}
}

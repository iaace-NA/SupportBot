"use strict";
module.exports = class RateLimiter {
	constructor(x, y) {//x events per y seconds
		this.eventTimes = [];
		this.setMode(x, y);
	}
	setMode(x, y) {
		this.timePeriod = y * 1000;
		this.timeFrequency = x;
	}
	testAdd() {
		return this.check();
	}
	add() {
		const ct = new Date().getTime();
		if (this.check(ct)) {
			this.eventTimes.push(ct);
			return true;
		}
		else return false;
	}
	check(ct = new Date().getTime()) {
		for (let i in this.eventTimes) {//clean
			if (this.eventTimes[i] < ct - this.timePeriod) {
				this.eventTimes.shift();
				i--;
			}
		}
		return this.eventTimes.length - 1 < this.timeFrequency;
	}
	clear() {
		this.eventTimes = [];
	}
	remainingEvents() {//remaining commands to use within the time period
		return this.timeFrequency - this.eventTimes.length - 1 >= 0 ? this.timeFrequency - this.eventTimes.length - 1 : 0;
	}
	remainingTime() {//time before next available command
		const ct = new Date().getTime();
		return this.check(ct) ? 0 : ((this.eventTimes[0] + this.timePeriod) - ct) / 1000;
	}
}
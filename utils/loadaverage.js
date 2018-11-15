"use strict";
module.exports = class LoadAverage {
	constructor(maxMinutes = 60) {
		this.recent = {};
		this.maxMinutes = maxMinutes;
		this.total = 0;
		this.startTime = new Date().getTime();
	}
	add(cost = 1) {
		const now = new Date().getTime();
		if (this.recent[now] != undefined) this.recent[now] += cost;
		else this.recent[now] = cost;
		this.cleanup();
	}
	min1() {
		return this.minx(1);
	}
	min5() {
		return this.minx(5);
	}
	min15() {
		return this.minx(15);
	}
	min30() {
		return this.minx(30);
	}
	min60() {
		return this.minx(60);
	}
	minx(minutes) {//rate by minute
		if (minutes > this.maxMinutes) throw new Error("Cannot request data beyond " + this.maxMinutes + " old.");
		this.cleanup();
		const prev = new Date().getTime() - (minutes * 60000);
		let ans = 0;
		for (let i in this.recent) {
			if (i >= prev) {
				ans += this.recent[i];
			}
		}
		return ans / minutes;
	}
	minx_count(minutes) {//count by minute
		if (minutes > this.maxMinutes) throw new Error("Cannot request data beyond " + this.maxMinutes + " old.");
		this.cleanup();
		const prev = new Date().getTime() - (minutes * 60000);
		let ans = 0;
		for (let i in this.recent) {
			if (i >= prev && i < prev + 60000) {
				ans += this.recent[i];
			}
		}
		return ans / minutes;
	}
	total_rate() {//rate by minute
		this.cleanup();
		return this.total_count() / ((new Date().getTime() - this.startTime) / 60000);
	}
	total_count() {
		this.cleanup();
		let ans = this.total;
		for (let i in this.recent) ans += this.recent[i];
		return ans;
	}
	cleanup() {
		const prev = new Date().getTime() - (this.maxMinutes * 60000);
		for (let i in this.recent) {
			if (i < prev) {
				this.total += this.recent[i];
				delete this.recent[i];
			}
		}
	}
	reset() {
		this.recent = {};
		this.total = 0;
	}
}
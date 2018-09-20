"use strict";
module.exports = class Profiler {
	constructor(name) {
		this.name = name;
		this.events = [];
		this.creation_time = process.hrtime();
	}
	mark(event_name) {
		this.events.push({ type: 0, time: process.hrtime(), name: event_name });
	}
	begin(event_name) {
		this.events.push({ type: 1, time: process.hrtime(), name: event_name });
	}
	end(event_name) {
		this.events.push({ type: 2, time: process.hrtime(), name: event_name });
	}
	endAll() {
		const now = process.hrtime();
		let answer = this.name + " profile completed in " + this.ms(this.diff(now, this.creation_time)) + "ms.\n";
		for (let b = 0; b < this.events.length; ++b) {
			answer += this.ms(this.diff(this.events[b].time, this.creation_time)) + "ms: ";
			if (b > 0) answer += "last: " + this.ms(this.diff(this.events[b].time, this.events[b - 1].time)) + "ms ago ";
			if (this.events[b].type === 0) answer += this.events[b].name + " marked ";
			else if (this.events[b].type === 1) answer += this.events[b].name + " started ";
			else if (this.events[b].type === 2) answer += "duration: " + this.ms(this.diff(this.events[b].time, this.events.find(e => { return e.name == this.events[b].name; }).time)) + "ms " + this.events[b].name + " completed";
			answer += "\n";
		}
		this.events = [];
		return answer + this.name + " profiling complete.";
	}
	endAllCtable() {
		const now = process.hrtime();
		let answer = [];
		answer.push({ name: this.name, last: "0 ms", at: "0 ms", duration: this.ms(this.diff(now, this.creation_time)) + " ms", end: this.ms(this.diff(now, this.creation_time)) + " ms" });
		for (let b = 0; b < this.events.length; ++b) {
			let temp = {
				name: this.events[b].name,
				at: this.ms(this.diff(this.events[b].time, this.creation_time)) + " ms",
			};
			if (b > 0) temp.last = this.ms(this.diff(this.events[b].time, this.events[b - 1].time)) + " ms ago";
			if (this.events[b].type === 0);
			else if (this.events[b].type === 1) {
				temp.duration = this.ms(this.diff(this.events.find(e => e.name == this.events[b].name && e.type == 2).time, this.events[b].time)) + " ms";
				temp.end = this.ms(this.diff(this.events.find(e => e.name == this.events[b].name && e.type == 2).time, this.creation_time)) + " ms";
			}
			if (this.events[b].type !== 2) answer.push(temp);
		}
		this.events = [];
		return answer;
	}
	diff(now, prev) {//returns ns (now - prev) (a - b)
		return ((now[0] - prev[0]) * 1e9) + (now[1] - prev[1]);
	}
	ms(nsn) {//returns ms.ns
		return (nsn / 1000000).toFixed(3);
	}
}

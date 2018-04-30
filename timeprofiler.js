"use strict";
module.exports = class Profiler {
	constructor(name) {
		this.name = name;
		this.events = [];
		this.creation_time = new Date().getTime();
	}
	mark(event_name) {
		this.events.push({ type: 0, start: new Date().getTime() });
	}
	begin(event_name) {
		this.events.push({ type: 1, start: new Date().getTime() });
	}
	end(event_name) {
		
	}
	endAll() {
		const now = new Date().getTime();
		let answer = this.name + " profile completed in " + (now - this.creation_time) + "ms.";
	}
}

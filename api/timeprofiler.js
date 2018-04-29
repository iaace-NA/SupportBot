"use strict";
module.exports = class Profiler {
	constructor(name) {
		this.name = name;
		this.events = [];
		this.creation_time = new Date().getTime();
	}
	begin(event_name) {

	}
	end(event_name) {
		
	}
	endAll() {
		let answer = this.name + " profile completed in ";
	}
}

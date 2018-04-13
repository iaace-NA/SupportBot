"use strict";
const UTILS = new (require("../utils.js"))();
module.exports = class TextGenerator {
	constructor() { }
	ping_callback(msg, nMsg) {
		nMsg.edit(nMsg.content + " " + (nMsg.createdTimestamp - msg.createdTimestamp) + "ms");
	}
	internal_ping(times) {
		return "Time to internal api: " + (times.received - times.started) + " ms. Time to return: " + (times.ended - times.received) + " ms.";
	}
	shortcuts(obj) {
		if (!UTILS.exists(obj.shortcuts) || Object.keys(obj.shortcuts).length == 0) return "";
		let answer = "```";
		for (let b in obj.shortcuts) answer += "\n$" + b + " -> " + obj.shortcuts[b];
		return answer + "```";
	}
}

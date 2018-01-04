"use strict";
const UTILS = new (require("../utils.js"))();
module.exports = class TextGenerator {
	constructor() { }
	ping_callback(msg, nMsg) {
		nMsg.edit(nMsg.content + " " + (nMsg.createdTimestamp - msg.createdTimestamp) + "ms");
	}
}

"use strict";
const UTILS = new (require("../utils.js"))();
const REQUEST = require("request");
const fs = require("fs");
const agentOptions = { ca: fs.readFileSync("../data/keys/ca.crt") };
let cache = {};
module.exports = class Preferences {
	constructor(INIT_CONFIG, lolapi, sid) {
		this.CONFIG = INIT_CONFIG;
		this.lolapi = lolapi;
		if (!UTILS.exists(this.CONFIG)) throw new Error("config.json required.");
		this.request = REQUEST;
		this.address = "https://" + this.CONFIG.API_ADDRESS;
		this.port = this.CONFIG.API_PORT;
		if (!UTILS.exists(cache[sid])) {
			//check if db entry exists
			//otherwise make a new one
		}
	}
	resetToDefault() {
		;
	}
	get(prop) {
		return this.raw[prop];
	}
	set(prop, val) {
		this.raw[prop] = val;
	}
	clearAllCache() {
		cache = {};
	}
}

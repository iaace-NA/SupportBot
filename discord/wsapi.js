"use strict";
const UTILS = new (require("../utils.js"))();
const REQUEST = require("request");
const ws = require("ws");
const fs = require("fs");
const agentOptions = { ca: fs.readFileSync("../data/keys/ca.crt") };
module.exports = class WSAPI {
	constructor(id) {
		this.CONFIG = JSON.parse(fs.readFileSync("../config.json", "utf-8"));;
		if (!UTILS.exists(this.CONFIG)) {
			throw new Error("config.json required.");
		}
		this.request = REQUEST;
		this.cache = {};
		if (process.env.NODE_ENV !== "production") {
			this.address = "wss://" + this.CONFIG.API_ADDRESS_DEVELOPMENT;
			this.port = this.CONFIG.API_PORT_DEVELOPMENT;
		}
		else {
			this.address = "wss://" + this.CONFIG.API_ADDRESS_PRODUCTION;
			this.port = this.CONFIG.API_PORT_PRODUCTION;
		}
		this.connection = new ws(this.address + ":" + this.port + "/shard?k=" + encodeURIComponent(this.CONFIG.API_KEY) + "&id=" + id);
		this.connection.on("open", () => {
			UTILS.output("ws connected");
		});
		this.connection.on("close", (code, reason) => {
			UTILS.output("ws closed: " + code + ", " + reason);
		});
	}
}

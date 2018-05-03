"use strict";
const UTILS = new (require("../utils.js"))();
const REQUEST = require("request");
const ws = require("ws");
const agentOptions = { ca: fs.readFileSync("../data/keys/ca.crt") };
module.exports = class WSAPI {
	constructor(INIT_CONFIG, id) {
		this.CONFIG = INIT_CONFIG;
		if (!UTILS.exists(this.CONFIG)) {
			throw new Error("config.json required to access riot api.");
		}
		else if (!UTILS.exists(this.CONFIG.RIOT_API_KEY) || this.CONFIG.RIOT_API_KEY === "") {
			throw new Error("config.json RIOT_API_KEY required to access riot api.");
		}
		this.request = REQUEST;
		this.cache = {};
		if (process.env.NODE_ENV !== "production") {
			this.address = "wss://" + this.CONFIG.API_ADDRESS_DEVELOPMENT;
			this.port = "wss://" + this.CONFIG.API_PORT_DEVELOPMENT;
		}
		else {
			this.address = "wss://" + this.CONFIG.API_ADDRESS_PRODUCTION;
			this.port = "wss://" + this.CONFIG.API_PORT_PRODUCTION;
		}
		this.connection = new ws(this.address + ":" + this.port + "/shard?k=" + encodeURIComponent(this.CONFIG.API_KEY) + "&id=" + id);
		this.connection.on("open", () => {
			UTILS.output("ws connected")
		});
	}
}

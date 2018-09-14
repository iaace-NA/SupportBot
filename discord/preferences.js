"use strict";
const UTILS = new (require("../utils.js"))();
const REQUEST = require("request");
const fs = require("fs");
const agentOptions = { ca: fs.readFileSync("../data/keys/ca.crt") };
let cache = {};
let CONFIG;
try {
	CONFIG = JSON.parse(fs.readFileSync("../" + argv_options.config, "utf-8"));
}
catch (e) {
	UTILS.output("something's wrong with config.json");
	console.error(e);
	process.exit(1);
}
const newPreferences = {
	id: "",//id of server
	prefix: CONFIG.DISCORD_COMMAND_PREFIX,//default bot prefix
	enabled: true,//whether or not the bot is enabled on the server
	slow: 0,//self slow mode
	auto_opgg: true //automatically embed respond to op.gg links
};
const preferencesFormat = {
	id: "string",//id of server
	prefix: "string",//default bot prefix
	enabled: "boolean",//whether or not the bot is enabled on the server
	slow: "number",//self slow mode
	auto_opgg: "boolean"//automatically embed respond to op.gg links
};
module.exports = class Preferences {
	constructor(lolapi, guild, callback) {
		this.lolapi = lolapi;
		if (!UTILS.exists(CONFIG)) throw new Error("config.json required.");
		this.request = REQUEST;
		this.address = "https://" + CONFIG.API_ADDRESS;
		this.port = CONFIG.API_PORT;
		this.sid = UTILS.exists(guild) ? guild.id : undefined;
		if (UTILS.exists(this.sid)) {//server id exists
			this.server_message = true;
			if (!UTILS.exists(cache[this.sid])) {//doesn't exist in cache
				UTILS.debug(this.sid + "preferences: cache miss");
				lolapi.getPreferences(this.sid).then(preference_data => {//it will always exist because IAPI will create a new one if it doesn't
					cache[this.sid] = preference_data;
					callback(this);
				}).catch(e => {
					console.error(e);
				});
			}
			else callback(this);//exists in cache
		}
		else {
			this.server_message = false;
			callback(this);
		}
	}
	resetToDefault() {
		;
	}
	get(prop) {
		return this.server_message ? cache[this.sid][prop] : newPreferences[prop];
	}
	set(prop, val) {
		return new Promise((resolve, reject) => {
			UTILS.debug("Attempting to set preferences[\"" + this.sid + "\"][\"" + prop + "\" = " + val + ";");
			if (!this.server_message) return reject(":x: Cannot set preferences for DM channel.");
			else if (!UTILS.exists(preferencesFormat[prop])) return reject(":x: Setting " + prop + " does not exist.");
			else if (typeof(val) !== preferencesFormat[prop]) return reject(":x: Setting " + prop + " as " + val + " is invalid.");
			cache[this.sid][prop] = val;
			lolapi.setPreferences(this.sid, prop, val, preferencesFormat[prop]).then(() => resolve()).catch(e => reject(":x: Database operation failed."));//db write
		});
	}
	clearAllCache() {
		cache = {};
	}
}

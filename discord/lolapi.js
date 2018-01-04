"use strict";
const UTILS = new (require("../utils.js"))();
module.exports = class LOLAPI {
	constructor(INIT_CONFIG) {
		this.CONFIG = INIT_CONFIG;
		if (!UTILS.exists(this.CONFIG)) {
			throw new Error("config.json required to access riot api.");
		}
		else if (!UTILS.exists(this.CONFIG.RIOT_API_KEY) || this.CONFIG.RIOT_API_KEY === "") {
			throw new Error("config.json RIOT_API_KEY required to access riot api.");
		}
		this.request = require("request");
	}
	get(region, path, options) {
		return new Promise((resolve, reject) => {
			region = {
				"BR": "br1",
				"EUNE": "eun1",
				"EUW": "euw1",
				"JP": "jp1",
				"KR": "kr",
				"LAN": "la1",
				"LAS": "la2",
				"NA": "na1",
				"OCE": "oc1",
				"tr": "tr1",
				"ru": "ru",
				"pbe": "pbe1"
			}[region.toUpperCase()];
			UTILS.assert(UTILS.exists(region));
			let url = "https://" + region + ".api.riotgames.com/lol/" + path + "?api_key=" + this.CONFIG.RIOT_API_KEY;
			for (let i in options) {
				url += "&" + i + "=" + encodeURIComponent(options[i]);
			}
			this.request(url, function (error, response, body) {
				if (error != undefined && error != null) {
					reject(error);
				}
				else {
					try {
						const answer = JSON.parse(body);
						resolve(answer);
					}
					catch (e) {
						reject(e);
					}
				}
			});
		});
	}
}
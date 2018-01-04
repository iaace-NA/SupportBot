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
						UTILS.output(body);
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
	//get(path, options) {}
	getSummonerIDFromName(region, username) {
		return this.get(region, "summoner/v3/summoners/by-name/" + encodeURIComponent(username), {});
	}
	getRanks(region, summonerID) {
		return this.get(region, "league/v3/positions/by-summoner/" + summonerID, {});
	}
}
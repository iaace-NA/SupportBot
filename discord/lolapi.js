"use strict";
const UTILS = new (require("../utils.js"))();
const fs = require("fs");
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
						const answer = JSON.parse(body);
						if (UTILS.exists(answer.status)) UTILS.output(url + " : " + body);
						else UTILS.output(url);
						resolve(answer);
					}
					catch (e) {
						reject(e);
					}
				}
			});
		});
	}
	getStatic(path) {//data dragon
		return new Promise((resolve, reject) => {
			let url = "https://ddragon.leagueoflegends.com/" + path;
			this.request(url, function (error, response, body) {
				if (error != undefined && error != null) {
					reject(error);
				}
				else {
					try {
						UTILS.output(url + " : " + body);
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
	getRanks(region, summonerID) {
		return this.get(region, "champion-mastery/v3/champion-masteries/by-summoner/" + summonerID, {});
	}
	getStaticChampions(region) {
		return new Promise((resolve, reject) => {
			const path = "./data/static-api-cache/champions" + region + ".json";
			const exists = fs.existsSync(path);
			if ((exists && fs.statSync(path).mtime.getTime() < new Date().getTime() - (12 * 3600 * 1000)) ||
				!exists) {//expired
				this.get(region, "static-data/v3/champions", { locale: "en_US", dataById: true, tags: "all" }).then((result) => {
					fs.writeFile(path, JSON.stringify(result), err => {
						UTILS.output("Cached version of " + region + " champions.json is expired or non-existant.");
						if (err) throw err;
						resolve(result);
					});
				}).catch(e => { reject(e); });
			}
			else {//cached
				fs.readFile(path, "utf-8", (err, data) => {
					UTILS.output("Cached version of " + region + " champions.json loaded.");
					resolve(JSON.parse(data));
				});
			}
		});
	}
}
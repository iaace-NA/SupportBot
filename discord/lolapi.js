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
		this.cache = {};
	}
	addCache(url, data) {//add data to api cache
		this.cache[url] = {
			data: data,
			expiration: new Date().getTime() + 120000 //2 min cache expiration time (based on API key limit)
		}
		this.maintainCache();
	}
	checkCache(url) {//return the data if it exists, otherwise return false
		this.maintainCache();
		if (!UTILS.exists(this.cache[url])) {//cache miss
			return false;
		}
		else {
			return this.cache[url].data;
		}
	}
	maintainCache() {//prune old values
		const now = new Date().getTime();
		for (let b in this.cache) {
			if (this.cache[b].expiration < now) {
				delete this.cache[b];
			}
		}
	}
	cacheSize() {//check size of cache
		let size = 0;
		for (let b in this.cache) ++size;
		return size;
	}
	get(region, path, options) {
		let that = this;
		return new Promise((resolve, reject) => {
			UTILS.assert(UTILS.exists(region));
			let url = "https://" + region + ".api.riotgames.com/lol/" + path + "?api_key=" + this.CONFIG.RIOT_API_KEY;
			for (let i in options) {
				url += "&" + i + "=" + encodeURIComponent(options[i]);
			}
			let cache_answer = this.checkCache(url);//access cache
			if (cache_answer === false) {
				this.request(url, function (error, response, body) {
					if (error != undefined && error != null) {
						reject(error);
					}
					else {
						try {
							const answer = JSON.parse(body);
							if (UTILS.exists(answer.status)) UTILS.output(url + " : " + body);
							else UTILS.output("cache miss: " + url);
							that.addCache(url, answer);
							resolve(answer);
						}
						catch (e) {
							reject(e);
						}
					}
				});
			}
			else {
				UTILS.output("cache hit: " + url);
				resolve(cache_answer);
			}
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
	//get(path, options) {}
	getSummonerIDFromName(region, username) {
		return this.get(region, "summoner/v3/summoners/by-name/" + encodeURIComponent(username), {});
	}
	getRanks(region, summonerID) {
		return this.get(region, "league/v3/positions/by-summoner/" + summonerID, {});
	}
	getChampionMastery(region, summonerID) {
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
"use strict";
const UTILS = new (require("../utils.js"))();
const fs = require("fs");
module.exports = class LOLAPI {
	constructor(INIT_CONFIG, MODE) {
		this.CONFIG = INIT_CONFIG;
		if (!UTILS.exists(this.CONFIG)) {
			throw new Error("config.json required to access riot api.");
		}
		else if (!UTILS.exists(this.CONFIG.RIOT_API_KEY) || this.CONFIG.RIOT_API_KEY === "") {
			throw new Error("config.json RIOT_API_KEY required to access riot api.");
		}
		this.request = require("request");
		this.cache = {};
		if (MODE == "DEVELOPMENT") {
			this.address = this.CONFIG.API_ADDRESS_DEVELOPMENT;
			this.port = this.CONFIG.API_PORT_DEVELOPMENT;
		}
		else {
			this.address = this.CONFIG.API_ADDRESS_PRODUCTION;
			this.port = this.CONFIG.API_PORT_PRODUCTION;
		}
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
							else UTILS.output("cache miss: " + url.replace(that.CONFIG.RIOT_API_KEY, ""));
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
				UTILS.output("cache hit: " + url.replace(that.CONFIG.RIOT_API_KEY, ""));
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
		let that = this;
		return new Promise((resolve, reject) => {
			const path = "../data/static-api-cache/champions" + region + ".json";
			const exists = fs.existsSync(path);
			if ((exists && fs.statSync(path).mtime.getTime() < new Date().getTime() - (6 * 3600 * 1000)) ||
				!exists) {//expired
				refresh();
			}
			else {//cached
				fs.readFile(path, "utf-8", (err, data) => {
					UTILS.output("Cached version of " + region + " champions.json loaded.");
					try {
						data = JSON.parse(data)
						resolve(data);
					}
					catch (e) {
						UTILS.output(e);
						refresh();
					}
				});
			}
			function refresh() {
				that.get(region, "static-data/v3/champions", { locale: "en_US", dataById: true, tags: "all" }).then((result) => {
					fs.writeFile(path, JSON.stringify(result), err => {
						UTILS.output("Cached version of " + region + " champions.json is expired or non-existant.");
						if (err) throw err;
						resolve(result);
					});
				}).catch(e => { reject(e); });
			}
		});
	}
	getStaticSummonerSpells(region) {
		let that = this;
		return new Promise((resolve, reject) => {
			const path = "../data/static-api-cache/spells" + region + ".json";
			const exists = fs.existsSync(path);
			if ((exists && fs.statSync(path).mtime.getTime() < new Date().getTime() - (6 * 3600 * 1000)) ||
				!exists) {//expired
				refresh();
			}
			else {//cached
				fs.readFile(path, "utf-8", (err, data) => {
					UTILS.output("Cached version of " + region + " spells.json loaded.");
					try {
						data = JSON.parse(data)
						resolve(data);
					}
					catch (e) {
						UTILS.output(e);
						refresh();
					}
				});
			}
			function refresh() {
				that.get(region, "static-data/v3/summoner-spells", { locale: "en_US", dataById: true, spellListData: "all", tags: "all" }).then((result) => {
					fs.writeFile(path, JSON.stringify(result), err => {
						UTILS.output("Cached version of " + region + " spells.json is expired or non-existant.");
						if (err) throw err;
						resolve(result);
					});
				}).catch(e => { reject(e); });
			}
		});
	}
	getRecentGames(region, accountID) {
		return this.get(region, "match/v3/matchlists/by-account/" + accountID + "/recent", {});
	}
	getMatchInformation(region, gameID) {
		return this.get(region, "match/v3/matches/" + gameID, {});
	}
	getMultipleMatchInformation(region, gameIDs) {
		let requests = [];
		for (let i in gameIDs) requests.push(this.getMatchInformation(region, gameIDs[i]));
		return Promise.all(requests);
	}
	getLiveMatch(region, summonerID) {
		return this.get(region, "spectator/v3/active-games/by-summoner/" + summonerID, {});
	}
	getMMR(region, summonerID) {
		return this.get(region, "league/v3/mmr-af/by-summoner/" + summonerID, {});
	}
	getStatus(region) {
		return this.get(region, "status/v3/shard-data", {});
	}
	clearCache() {
		const filenames = fs.readdirSync("./data/static-api-cache/");
		for (let b in filenames) {
			fs.unlinkSync("./data/static-api-cache/" + filenames[b]);
		}
	}
}
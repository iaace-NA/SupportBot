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
	ping() {
		return new Promise((resolve, reject) => {
			const now = new Date().getTime();
			let url = this.address + ":" + this.port + "/ping";
			this.request(url, function (error, response, body) {
				if (UTILS.exists(error)) {
					reject(error);
				}
				else {
					try {
						const answer = JSON.parse(body);
						UTILS.output("cache miss: " + url);
						answer.started = now;
						answer.ended = new Date().getTime();
						resolve(answer);
					}
					catch (e) {
						reject(e);
					}
				}
			});
		});
	}
	get(region, path, options, cachetime, maxage) {
		let that = this;
		return new Promise((resolve, reject) => {
			UTILS.assert(UTILS.exists(region));
			UTILS.assert(UTILS.exists(cachetime));
			UTILS.assert(UTILS.exists(maxage));
			let url = "https://" + region + ".api.riotgames.com/lol/" + path + "?api_key=" + this.CONFIG.RIOT_API_KEY;
			for (let i in options) {
				url += "&" + i + "=" + encodeURIComponent(options[i]);
			}
			this.request(this.address + ":" + this.port + "/lol/" + cachetime + "/" + maxage + "/?url=" + encodeURIComponent(url), (error, response, body) => {
				if (UTILS.exists(error)) {
					reject(error);
				}
				else {
					try {
						const answer = JSON.parse(body);
						if (UTILS.exists(answer.status)) UTILS.output(url + " : " + body);
						else UTILS.output("IAPI req: " + url.replace(that.CONFIG.RIOT_API_KEY, ""));
						resolve(answer);
					}
					catch (e) {
						reject(e);
					}
				}
			});
		});
	}
	getIAPI(path, options) {//get internal API
		let that = this;
		return new Promise((resolve, reject) => {
			let url = this.address + ":" + this.port + "/" + path;
			let paramcount = 0;
			for (let i in options) {
				if (paramcount == 0) url += "?" + i + "=" + encodeURIComponent(options[i]);
				else url += "&" + i + "=" + encodeURIComponent(options[i]);
				++paramcount;
			}
			this.request(url, (error, response, body) => {
				if (UTILS.exists(error)) {
					reject(error);
				}
				else if (response.statusCode !== 200) {
					reject(response.statusCode);
				}
				else {
					try {
						const answer = JSON.parse(body);
						UTILS.output("IAPI req: " + url);
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
	getSummonerIDFromName(region, username, maxage) {
		return this.get(region, "summoner/v3/summoners/by-name/" + encodeURIComponent(username), {}, 86400, maxage);
	}
	getSummonerFromSummonerID(region, id, maxage) {
		return this.get(region, "summoner/v3/summoners/" + id, {}, 86400, maxage);
	}
	getRanks(region, summonerID, maxage) {
		return this.get(region, "league/v3/positions/by-summoner/" + summonerID, {}, 86400, maxage);
	}
	getChampionMastery(region, summonerID, maxage) {
		return this.get(region, "champion-mastery/v3/champion-masteries/by-summoner/" + summonerID, {}, 86400, maxage);
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
				that.get(region, "static-data/v3/champions", { locale: "en_US", dataById: true, tags: "all" }, 0, 0).then((result) => {
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
				that.get(region, "static-data/v3/summoner-spells", { locale: "en_US", dataById: true, spellListData: "all", tags: "all" }, 0, 0).then((result) => {
					fs.writeFile(path, JSON.stringify(result), err => {
						UTILS.output("Cached version of " + region + " spells.json is expired or non-existant.");
						if (err) throw err;
						resolve(result);
					});
				}).catch(e => { reject(e); });
			}
		});
	}
	getRecentGames(region, accountID, maxage) {
		return this.get(region, "match/v3/matchlists/by-account/" + accountID + "/recent", {}, 1800, maxage);
	}
	getMatchInformation(region, gameID, maxage) {
		return this.get(region, "match/v3/matches/" + gameID, {}, 604800, maxage);
	}
	getMultipleMatchInformation(region, gameIDs, maxage) {
		let requests = [];
		for (let i in gameIDs) requests.push(this.getMatchInformation(region, gameIDs[i], maxage));
		return Promise.all(requests);
	}
	getLiveMatch(region, summonerID, maxage) {
		return this.get(region, "spectator/v3/active-games/by-summoner/" + summonerID, {}, 60, maxage);
	}
	getMMR(region, summonerID, maxage) {
		return this.get(region, "league/v3/mmr-af/by-summoner/" + summonerID, {}, 120, maxage);
	}
	getStatus(region, maxage) {
		return this.get(region, "status/v3/shard-data", {}, 60, maxage);
	}
	clearCache() {
		const filenames = fs.readdirSync("./data/static-api-cache/");
		for (let b in filenames) {
			fs.unlinkSync("./data/static-api-cache/" + filenames[b]);
		}
	}
	createShortcut(uid, from, to) {
		return this.getIAPI("createshortcut/" + uid, { from, to });
	}
	removeShortcut(uid, from) {
		return this.getIAPI("removeshortcut/" + uid, { from });
	}
	getShortcut(uid, from) {
		return this.getIAPI("getshortcut/" + uid, { from });
	}
	getShortcuts(uid) {
		return this.getIAPI("getshortcuts/" + uid, {});
	}
}
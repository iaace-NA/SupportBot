"use strict";
const UTILS = new (require("../utils.js"))();
const fs = require("fs");
const REQUEST = require("request");
const XRegExp = require("xregexp");
const agentOptions = { ca: fs.readFileSync("../data/keys/ca.crt"), timeout: 120000 };
const tags = {
	match: "match",//matches, timelines
	matchhistory: "matchlist",//matchlists
	cmr: "cmr",//champions, masteries, runes
	leagues: "league",//leagues, challenger, master
	ranks: "league",//by summoner id
	summoner: "summonerid",//summoners by name or id
	account: "accountid",//summoners by account id
	cm: "championmastery",//summoner champion mastery
	spectator: "spectator",
	status: "status",
	tpv: "tpv"
};
module.exports = class LOLAPI {
	constructor(INIT_CONFIG, request_id) {
		this.CONFIG = INIT_CONFIG;
		this.request_id = request_id;
		if (!UTILS.exists(this.CONFIG)) throw new Error("config.json required to access riot api.");
		else if (!UTILS.exists(this.CONFIG.RIOT_API_KEY) || this.CONFIG.RIOT_API_KEY === "") throw new Error("config.json RIOT_API_KEY required to access riot api.");
		this.request = REQUEST;
		this.address = "https://" + this.CONFIG.API_ADDRESS;
		this.port = this.CONFIG.API_PORT;
	}
	ping() {
		return new Promise((resolve, reject) => {
			const now = new Date().getTime();
			this.getIAPI("ping", {}).then(answer => {
				answer.started = now;
				answer.ended = new Date().getTime();
				resolve(answer);
			}).catch(reject);
		});
	}
	get(region, path, tag, options, cachetime, maxage, parseJSON = true) {
		let that = this;
		return new Promise((resolve, reject) => {
			UTILS.assert(UTILS.exists(region), "API get: region not specified");
			UTILS.assert(UTILS.exists(cachetime), "API get: cachetime not specified");
			UTILS.assert(UTILS.exists(maxage), "API get: maxage not specified");
			UTILS.assert(UTILS.exists(tag), "API get: tag not specified");
			let endpoint = "/lol/" + path + "?iapimaxage=" + maxage + "&iapirequest_id=" + this.request_id;
			for (let i in options) {
				endpoint += "&" + i + "=" + encodeURIComponent(options[i]);
			}
			const iurl = this.address + ":" + this.port + "/lol/" + region + "/" + cachetime + "/" + maxage + "/" + this.request_id + "/" + tag + "/?k=" + encodeURIComponent(this.CONFIG.API_KEY) + "&endpoint=" + encodeURIComponent(endpoint);
			this.request({ url: iurl, agentOptions }, (error, response, body) => {
				if (UTILS.exists(error)) {
					reject(error);
				}
				else {
					try {
						if (parseJSON) {
							const answer = JSON.parse(body);
							if (UTILS.exists(answer.status)) UTILS.output(iurl + " : " + body);
							UTILS.assert(typeof(answer) === "object");
							resolve(answer);
						}
						else resolve(body);
					}
					catch (e) {
						reject(e);
					}
				}
			});
		});
	}
	getIAPI(path, options, response_expected = true, json_expected = true) {//get internal API
		let that = this;
		options.k = this.CONFIG.API_KEY;
		return new Promise((resolve, reject) => {
			let url = this.address + ":" + this.port + "/" + path;
			let paramcount = 0;
			for (let i in options) {
				if (paramcount == 0) url += "?" + i + "=" + encodeURIComponent(options[i]);
				else url += "&" + i + "=" + encodeURIComponent(options[i]);
				++paramcount;
			}
			this.request({ url , agentOptions }, (error, response, body) => {
				if (!response_expected) {
					resolve();
					return;
				}
				if (UTILS.exists(error)) {
					reject(error);
				}
				else if (response.statusCode !== 200) {
					reject(response.statusCode);
				}
				else {
					try {
						//UTILS.debug(body, true);
						if (json_expected) {
							const answer = JSON.parse(body);
							UTILS.output("IAPI req: " + url);
							resolve(answer);
						}
						else {
							resolve(body);
						}
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
						else UTILS.debug(url);
						resolve(answer);
					}
					catch (e) {
						reject(e);
					}
				}
			});
		});
	}
	getStaticChampionsNew(region, locale = "en_US") {
		UTILS.debug("STATIC CHAMPIONS: " + region);
		return new Promise((resolve, reject) => {
			this.getStatic("realms/" + this.CONFIG.REGIONS_REVERSE[region].toLowerCase() + ".json").then(realm => {
				this.getStatic("cdn/" + realm.v + "/data/" + locale + "/champion.json").then(cd => {//champion data
					for (let b in cd.data) {
						cd.data[cd.data[b].key] = cd.data[b];//add key as duplicate of data
						delete cd.data[b];//delete original
					}
					resolve(cd);
				}).catch(reject);
			}).catch(reject);
		});
	}
	getStaticSummonerSpellsNew(region, locale = "en_US") {
		UTILS.output("STATIC SPELLS: " + region);
		return new Promise((resolve, reject) => {
			this.getStatic("realms/" + this.CONFIG.REGIONS_REVERSE[region].toLowerCase() + ".json").then(realm => {
				this.getStatic("cdn/" + realm.v + "/data/" + locale + "/summoner.json").then(sd => {//spell data
					for (let b in sd.data) {
						sd.data[sd.data[b].key] = sd.data[b];//add key as duplicate of data
						delete sd.data[b];//delete original
					}
					resolve(sd);
				}).catch(reject);
			}).catch(reject);
		});
	}
	getSummonerIDFromName(region, username, maxage) {
		return new Promise((resolve, reject) => {
			if(!(new XRegExp("^[0-9\\p{L} _\\.]+$").test(username))) {
				UTILS.debug("username " + username + " didn't pass regex filter");
				return resolve({ status: "username didn't pass regex filter" });
			}
			username = username.toLowerCase();
			this.get(region, "summoner/v4/summoners/by-name/" + encodeURIComponent(username), tags.summoner, {}, this.CONFIG.API_CACHETIME.GET_SUMMONER_ID_FROM_NAME, maxage).then(answer => {
				resolve(answer.name === ("rtbf" + answer.id) ? { status: "GDPR right to be forgotten" } : answer);
			}).catch(reject);
		});
	}
	getMultipleSummonerIDFromName(region, usernames, maxage) {
		let that = this;
		let requests = [];
		if (this.CONFIG.API_SEQUENTIAL) {
			for (let i in usernames) requests.push(function () { return that.getSummonerIDFromName(region, usernames[i], maxage); });
			return UTILS.sequential(requests);
		}
		else {
			for (let i in usernames) requests.push(that.getSummonerIDFromName(region, usernames[i], maxage));
			return Promise.all(requests);
		}
	}
	getSummonerFromSummonerID(region, id, maxage) {
		if (id === null) return new Promise((resolve, reject) => resolve({}));
		return new Promise((resolve, reject) => {
			this.get(region, "summoner/v4/summoners/" + id, tags.summoner, {}, this.CONFIG.API_CACHETIME.GET_SUMMONER_FROM_SUMMONER_ID, maxage).then(answer => {
				resolve(answer.name === ("rtbf" + answer.id) ? { status: "GDPR right to be forgotten" } : answer);
			}).catch(reject);
		});
	}
	getMultipleSummonerFromSummonerID(region, ids, maxage) {
		let that = this;
		let requests = [];
		if (this.CONFIG.API_SEQUENTIAL) {
			for (let i in ids) requests.push(function () { return that.getSummonerFromSummonerID(region, ids[i], maxage); });
			return UTILS.sequential(requests);
		}
		else {
			for (let i in ids) requests.push(that.getSummonerFromSummonerID(region, ids[i], maxage));
			return Promise.all(requests);
		}
	}
	getRanks(region, summonerID, maxage) {
		if (summonerID === null) return new Promise((resolve, reject) => { resolve([]); });
		return this.get(region, "league/v4/positions/by-summoner/" + summonerID, tags.ranks, {}, this.CONFIG.API_CACHETIME.GET_RANKS, maxage);
	}
	getMultipleRanks(region, summonerIDs, maxage) {
		let that = this;
		let requests = [];
		for (let i in summonerIDs) requests.push(that.getRanks(region, summonerIDs[i], maxage));
		return Promise.all(requests);
	}
	getChampionMastery(region, summonerID, maxage) {
		if (summonerID === null) return new Promise((resolve, reject) => { resolve([]); });
		return this.get(region, "champion-mastery/v4/champion-masteries/by-summoner/" + summonerID, tags.cm, {}, this.CONFIG.API_CACHETIME.GET_CHAMPION_MASTERY, maxage);
	}
	getMultipleChampionMastery(region, summonerIDs, maxage) {
		let that = this;
		let requests = [];
		for (let i in summonerIDs) requests.push(that.getChampionMastery(region, summonerIDs[i], maxage));
		return Promise.all(requests);
	}
	getRecentGames(region, accountID, maxage, limit = 20) {
		return new Promise((resolve, reject) => {
			this.get(region, "match/v4/matchlists/by-account/" + accountID, tags.matchhistory, { endIndex: 100 }, this.CONFIG.API_CACHETIME.GET_RECENT_GAMES, maxage).then(matchlist => {
				matchlist.matches = matchlist.matches.slice(0, limit);
				matchlist.endIndex = matchlist.matches.length;
				resolve(matchlist);
			}).catch(reject);
		});
	}
	getMultipleRecentGames(region, accountIDs, maxage) {
		let that = this;
		let requests = [];
		if (this.CONFIG.API_SEQUENTIAL) {
			for (let i in accountIDs) requests.push(function () { return that.getRecentGames(region, accountIDs[i], maxage); });
			return UTILS.sequential(requests);
		}
		else {
			for (let i in accountIDs) requests.push(that.getRecentGames(region, accountIDs[i], maxage));
			return Promise.all(requests);
		}
	}
	getMatchInformation(region, gameID, maxage) {
		return this.get(region, "match/v4/matches/" + gameID, tags.match, {}, this.CONFIG.API_CACHETIME.GET_MATCH_INFORMATION, maxage);
	}
	getMultipleMatchInformation(region, gameIDs, maxage) {
		let that = this;
		let requests = [];
		if (this.CONFIG.API_SEQUENTIAL) {
			for (let i in gameIDs) requests.push(function () { return that.getMatchInformation(region, gameIDs[i], maxage); });
			return UTILS.sequential(requests);
		}
		else {
			for (let i in gameIDs) requests.push(that.getMatchInformation(region, gameIDs[i], maxage));
			return Promise.all(requests);
		}
	}
	getLiveMatch(region, summonerID, maxage) {
		return this.get(region, "spectator/v4/active-games/by-summoner/" + summonerID, tags.spectator, {}, this.CONFIG.API_CACHETIME.GET_LIVE_MATCH, maxage);
	}
	getThirdPartyCode(region, summonerID, maxage) {
		return this.get(region, "platform/v4/third-party-code/by-summoner/" + summonerID, tags.tpv, {}, this.CONFIG.API_CACHETIME.THIRD_PARTY_CODE, maxage, false);
	}
	getMMR(region, summonerID, maxage) {
		return this.get(region, "league/v4/mmr-af/by-summoner/" + summonerID, "afmmr", {}, this.CONFIG.API_CACHETIME.GET_MMR, maxage);
	}
	getStatus(region, maxage) {
		return this.get(region, "status/v3/shard-data", tags.status, {}, this.CONFIG.API_CACHETIME.GET_STATUS, maxage);
	}
	getChallengerRanks(region, queue, maxage) {
		return this.get(region, "league/v4/challengerleagues/by-queue/" + queue, tags.leagues, {}, this.CONFIG.API_CACHETIME.GET_CHALLENGERS, maxage);
	}
	getSummonerCard(region, username) {
		const that = this;
		return new Promise((resolve, reject) => {
			that.getSummonerIDFromName(region, username, this.CONFIG.API_MAXAGE.SUMMONER_CARD.SUMMONER_ID).then(result => {
				result.region = region;
				result.guess = username;
				if (!UTILS.exists(result.id)) reject();
				that.getRanks(region, result.id, this.CONFIG.API_MAXAGE.SUMMONER_CARD.RANKS).then(result2 => {
					Promise.all(result2.map(r => that.getChallengerRanks(region, r.queueType, this.CONFIG.API_MAXAGE.SUMMONER_CARD.CHALLENGERS))).then(result5 => {
						that.getChampionMastery(region, result.id, this.CONFIG.API_MAXAGE.SUMMONER_CARD.CHAMPION_MASTERY).then(result3 => {
							that.getLiveMatch(region, result.id, this.CONFIG.API_MAXAGE.SUMMONER_CARD.LIVE_MATCH).then(result4 => {
								resolve([result, result2, result3, result4, result5]);
							}).catch(reject);
						}).catch(reject);
					}).catch(reject);
				}).catch(reject);
			}).catch(reject);
		});
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
	removeAllShortcuts(uid) {
		return this.getIAPI("removeallshortcuts/" + uid);
	}
	getShortcut(uid, from) {
		return this.getIAPI("getshortcut/" + uid, { from });
	}
	getShortcuts(uid) {
		return this.getIAPI("getshortcuts/" + uid, {});
	}
	getVerifiedAccounts(uid) {
		return this.getIAPI("getverified/" + uid, {});
	}
	setVerifiedAccount(uid, region, summonerID, expiry) {
		return this.getIAPI("setverified/" + uid, { from: region + ":" + summonerID, to: expiry });
	}
	checkVerifiedAccount(uid, region, summonerID) {
		return new Promise((resolve, reject) => {
			this.getIAPI("getverified/" + uid, {}).then(result => {
				resolve(UTILS.exists(result.verifiedAccounts[region + ":" + summonerID]));
			}).catch(reject);
		});
	}
	terminate() {
		this.getIAPI("terminate_request/" + this.request_id, {}, false).catch();
	}
	IAPIEval(script) {
		return this.getIAPI("eval/" + encodeURIComponent(script), {});
	}
	getLink(uid) {
		return this.getIAPI("getlink/" + uid, {});
	}
	setLink(uid, username) {
		return this.getIAPI("setlink/" + uid, { link: username });
	}
	banUser(uid, reason, date, issuer, issuer_tag, issuer_avatarURL) {
		return this.getIAPI("ban", { id: uid, user: true, date, reason, issuer, issuer_tag, issuer_avatarURL });
	}
	banServer(sid, reason, date, issuer, issuer_tag, issuer_avatarURL) {
		return this.getIAPI("ban", { id: sid, user: false, date, reason, issuer, issuer_tag, issuer_avatarURL });
	}
	warnUser(uid, reason, issuer, issuer_tag, issuer_avatarURL) {
		return this.getIAPI("warn", { id: uid, user: true, reason, issuer, issuer_tag, issuer_avatarURL, notify: true });
	}
	warnServer(sid, reason, issuer, issuer_tag, issuer_avatarURL) {
		return this.getIAPI("warn", { id: sid, user: false, reason, issuer, issuer_tag, issuer_avatarURL, notify: true });
	}
	noteUser(uid, reason, issuer) {
		return this.getIAPI("warn", { id: uid, user: true, reason, issuer, notify: false });
	}
	noteServer(sid, reason, issuer) {
		return this.getIAPI("warn", { id: sid, user: false, reason, issuer, notify: false });
	}
	unbanUser(uid, issuer, issuer_tag, issuer_avatarURL) {
		return this.getIAPI("unban", { id: uid, user: true, issuer, issuer_tag, issuer_avatarURL });
	}
	unbanServer(sid, issuer, issuer_tag, issuer_avatarURL) {
		return this.getIAPI("unban", { id: sid, user: false, issuer, issuer_tag, issuer_avatarURL });
	}
	userHistory(uid, complete = true) {
		return complete ? this.getIAPI("gethistory", { id: uid, user: true }) : this.getIAPI("gethistory", { id: uid, user: true, limit: 10 });
	}
	serverHistory(sid, complete = true) {
		return complete ? this.getIAPI("gethistory", { id: sid, user: false }) : this.getIAPI("gethistory", { id: sid, user: false, limit: 10 });
	}
	getActions(uid, complete = false) {
		return complete ? this.getIAPI("getactions", { id: uid }) : this.getIAPI("getactions", { id: uid, limit: 10 });
	}
	getPreferences(sid) {
		return this.getIAPI("getpreferences", { id: sid });
	}
	checkPreferences(sid) {
		return this.getIAPI("existspreferences", { id: sid });
	}
	setPreferences(sid, prop, val, type) {
		return this.getIAPI("setpreferences", { id: sid, prop, val, type });
	}
	resetPreferences(sid) {
		return this.getIAPI("resetpreferences", { id: sid });
	}
}

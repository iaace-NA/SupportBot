"use strict";
let ta = require("./timeago.js");
let seq = require("./promise-sequential.js");
let child_process = require("child_process");
String.prototype.replaceAll = function(search, replacement) {
	let target = this;
	return target.replace(new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replacement);
}
String.prototype.count = function(search) {
	return (this.match(new RegExp(search, "g")) || []).length;
}
String.prototype.indexOfInstance = function(searchString, index) {
	let answer = -1;
	for (let i = 0, count = 0; i < this.length - searchString.length; ++i) {
		if (this.substring(i, i + searchString.length) == searchString) {
			++count;
			if (count == index) answer = i;
		}
	}
	return answer;
}
Number.prototype.pad = function(size) {
	let s = String(this);
	while (s.length < (size || 2)) {s = "0" + s;}
	return s;
}
Number.prototype.round = function(decimal = 0) {
	return decimal < 0 ? Math.round(this * Math.pow(10, decimal)) / Math.pow(10, decimal) : this.toFixed(decimal);
}
module.exports = class UTILS {
	output(t) {//general utility function
		if (this.exists(t)) {
			let n = new Date().toISOString().slice(0, 19).replace('T', ' ');;
			console.log(n + "." + new Date().getMilliseconds().pad(3) + " " + (this.exists(process.env.SHARD_ID) ? "$" + process.env.SHARD_ID : "") + ": " + t);
		}
	}
	debug(t, override) {
		if (this.exists(override)) {
			if (override) this.output(t);
		}
		else if (process.env.DEBUG == "true") this.output(t);
	}
	exists(anyObject) {//general utility function
		if (anyObject !== null && anyObject !== undefined) return true;
		else return false;
	}
	numberWithCommas(x) {//general utility function
		if (this.exists(x)) {
			let parts = x.toString().split(".");
			parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
			return parts.join(".");
		}
		else return "";
	}
	round(num, decimal = 0) {
		return decimal < 0 ? Math.round(num * Math.pow(10, decimal)) / Math.pow(10, decimal) : num.toFixed(decimal);
	}
	assert(condition, message) {
		if (typeof (condition) != "boolean") {
			console.trace();
			throw new Error("asserting non boolean value: " + typeof (condition));
		}
		if (!condition) {
			console.trace();
			throw new Error("assertion false" + (this.exists(message) ? ": " + message : ""));
		}
		return true;
	}
	ago(date) {
		return ta.ago(date);
	}
	until(date) {
		const now = new Date().getTime();
		let answer = ta.ago(now - (date.getTime() - now));
		answer = answer.substring(0, answer.length - 4);
		return answer;
	}
	duration(now, date) {
		now = now.getTime();
		let answer = ta.ago(now - (date.getTime() - now));
		answer = answer.substring(0, answer.length - 4);
		return answer;
	}
	teamParticipant(summonerID, match) {
		const participantID = match.participantIdentities.find(pI => pI.player.summonerId == summonerID).participantId;
		const stats = match.participants.find(p => p.participantId == participantID);
		return stats;
	}
	findParticipantIdentityFromPID(match, pid) {
		return match.participantIdentities.find(pI => pI.participantId == pid);
	}
	stats(summonerID, match) {
		return this.teamParticipant(summonerID, match).stats;
	}
	KDA(summonerID, match) {
		return this.KDAFromStats(this.stats(summonerID, match));
	}
	KDAFromStats(stats) {
		return {
			K: stats.kills,
			D: stats.deaths,
			A: stats.assists,
			KDA: (stats.kills + stats.assists) / stats.deaths,
			KD: stats.kills / stats.deaths,
			KDANoPerfect: (stats.kills + stats.assists) / (stats.deaths === 0 ? 1 : stats.deaths),
			KDNoPerfect: stats.kills / (stats.deaths === 0 ? 1 : stats.deaths),
			inverseKDA: stats.deaths / ((stats.kills + stats.assists === 0) ? 1 : (stats.kills + stats.assists))
		};
	}
	determineWin(summonerID, match) {
		const participantID = match.participantIdentities.find(pI => pI.player.summonerId == summonerID).participantId;
		const teamID = match.participants.find(p => p.participantId == participantID).teamId;
		return match.teams.find(t => t.teamId == teamID).win == "Win";
	}
	english(text) {
		return text.split("_").map(t => t.substring(0, 1).toUpperCase() + t.substring(1).toLowerCase()).join(" ");
	}
	standardTimestamp(sec) {
		let mins = Math.floor(parseInt(sec) / 60);
		let hours = Math.floor(parseInt(mins) / 60);
		mins = mins % 60;
		let secs = Math.floor(parseInt(sec) % 60);
		if (secs < 10) secs = "0" + secs;
		if (mins < 10) mins = "0" + mins;
		if (hours < 10) hours = "0" + hours;
		if (hours == "00") return mins + ":" + secs;
		else return hours + ":" + mins + ":" + secs;
	}
	gold(number) {
		number /= 1000;
		return number.toFixed(1) + "k";
	}
	masteryPoints(number) {
		number /= 1000;
		return Math.round(number) + "k";
	}
	level(summonerID, match) {
		return this.stats(summonerID, match).championLevel;
	}
	preferredTextChannel(client, collection, type, names, permissions) {
		for (let i = 0; i < names.length; ++i) {
			let candidate = collection.find(ch => {
				if (ch.type === type && ch.name.toLowerCase() === names[i].toLowerCase() && ch.permissionsFor(client.user).has(permissions)) return true;
			});
			if (this.exists(candidate)) return candidate;
		}
		return collection.find(ch => ch.type === type && ch.permissionsFor(client.user).has(permissions));
	}
	trim(network) {
		let count = 0;
		for (let a in network) for (let b in network[a]) if (network[a][b] < 2) { delete network[a][b]; ++count; }
		return count;
	}
	getGroup(candidate, graph, visited = {}) {//traverse graph
		//this.output("candidate: " + candidate);
		for (let b in graph[candidate]) {
			if (!this.exists(visited[b])) {
				visited[b] = true;
				this.getGroup(b, graph, visited);
			}
		}
		let answer = [];
		for (let b in visited) answer.push(b);
		answer.sort();
		return answer;
	}
	sequential(tasks) {
		return seq(tasks);
	}
	inferLane(role, lane, spell1Id, spell2Id) {//top=1, jungle=2, mid=3, support=4, bot=5
		if (spell1Id == 11 || spell2Id == 11 || lane == "JUNGLE") return 2;
		else if (lane == "BOTTOM") {
			if (role == "DUO_SUPPORT") return 4;
			else return 5;
		}
		else if (lane == "TOP") return 1;
		else if (lane == "MIDDLE" || lane == "MID") return 3;
		else return 0;
	}
	opgg(region, username) {
		this.assert(this.exists(username), "opgg link generator: username doesn't exist");
		this.assert(this.exists(region), "opgg link generator: region doesn't exist");
		if (region == "KR") region = "www";//account for kr region special www opgg link
		return "http://" + region + ".op.gg/summoner/userName=" + encodeURIComponent(username);
	}
	shortRank(info) {
		//****** unranked
		//XXXXXX unranked
		//██████ unranked
		//I4P+00 Provisional rank
		//G↑W--- Gold promotion, 1 win
		//G2 +00 Gold 2, 0 LP
		//G2 +56 Gold 2, 56LP
		//G2↑ L- Gold 2 promotion, 1 loss
		//C +256 Challenger, 256LP
		//C+1256 Challenger 1256 LP
		if (!this.exists(info)) return "******";
		let answer = "";
		answer += info.tier[0];
		if (this.exists(info.miniSeries)) {//series
			if (info.miniSeries.progress.length == 5) {//BO5
				answer += "↑" + info.miniSeries.progress.substring(0, info.miniSeries.progress.length - 1).replaceAll("N", "-");
			}
			else {//BO3
				answer += { "I": "1", "II": "2", "III": "3", "IV": "4" }[info.rank] + "↑ " + info.miniSeries.progress.substring(0, info.miniSeries.progress.length - 1).replaceAll("N", "-");
			}
		}
		else {//no series
			let LP = info.leaguePoints;
			if (info.tier == "MASTER") {//master/grandmaster (unlimited LP)
				answer = "MA";
				if (LP < 0) answer += " -";
				else if (LP < 100) answer += " +";
				else answer += "+";
			}
			else if (info.tier == "GRANDMASTER") {
				answer = "GM";
				if (LP < 0) answer += " -";
				else if (LP < 100) answer += " +";
				else answer += "+";
			}
			else if (info.tier[0] == "C") {//challenger
				if (LP < 0) answer += "  -";
				else if (LP < 100) answer += "  +";
				else if (LP < 1000) answer += " +";
				else answer += "+";
			}
			else {
				answer += { "I": "1", "II": "2", "III": "3", "IV": "4" }[info.rank];
				if (info.wins + info.losses >= 8) answer += " ";
				else answer += "P";//placements, less than 10 games
				if (LP < 0) answer += "-";//negative
				else if (LP < 100) answer += "+";//less than 100
				else answer += "+";//=100
			}
			LP = Math.abs(LP).pad(2);
			answer += LP;
		}
		return answer;
	}
	getSingleChampionMastery(all, singleID) {
		return this.exists(all.find(cmi => cmi.championId == singleID)) ? all.find(cmi => cmi.championId == singleID).championLevel : 0;
	}
	KDAFormat(num) {
		if (isNaN(num) || num == Infinity) return "Perfect";
		else return num.toFixed(2);
	}
	KPFormat(num) {
		if (isNaN(num)) return 0;
		else return Math.round(num);
	}
	iMMR(rank) {//internal MMR Representation
		/*
		Iron 4, 0LP: 100
		Iron 3, 0LP: 200
		Iron 2, 0LP: 300
		Iron 1, 0LP: 400
		Bronze 4, 0LP: 500
		Silver 4, 0LP: 900
		Gold 4, 0LP: 1300
		Platinum 4, 0LP: 1700
		Diamond 4, 0LP: 2100
		Master, 0LP: 2500
		Grandmaster, 500LP: 2600
		Challenger, 1000LP: 2700
		*/
		let answer = { IRON: 100, BRONZE: 500, SILVER: 900, GOLD: 1300, PLATINUM: 1700, DIAMOND: 2100, MASTER: 2500, GRANDMASTER: 2500, CHALLENGER: 2500 }[rank.tier];
		if (answer != 2500) {
			answer += { IV: 0, III: 100, II: 200, I: 300 }[rank.rank];
			answer += rank.leaguePoints;
		}
		else answer += rank.leaguePoints / 5;//magic number constant: 500 LP = 1 iMMR div
		return answer;
	}
	iMMRtoEnglish(mmr) {
		//6-char representation
		mmr = parseInt(mmr);
		if (mmr < 100) return "******";
		let answer = "";
		if (mmr < 500) answer += "I";
		else if (mmr < 900) answer += "B";
		else if (mmr < 1300) answer += "S";
		else if (mmr < 1700) answer += "G";
		else if (mmr < 2100) answer += "P";
		else if (mmr < 2500) answer += "D";
		else if (mmr < 2600) answer += "MA";
		else if (mmr < 2700) answer += "GM";//arbitrary MA/GM threshold @ 500LP
		else answer += "C";//arbitrary MG/C threshold @ 1000LP
		let LP;
		if (mmr < 2500) {//4 div tiers
			answer += ["4", "3", "2", "1"][Math.floor(((mmr - 100) % 400) / 100)];
			LP = " +" + Math.round(mmr % 100).pad(2);
			answer += LP;
		}
		else {
			LP = this.round((mmr - 2500) * 5);
			if (mmr < 2700) {//MA/GM
				if (LP < 100) answer += " +" + LP.pad(2);
				else if (LP < 1000) answer += "+" + LP;
				else answer += "+" + LP;
			}
			else {//challenger
				if (LP < 1000) answer += " +" + LP;
				else answer += "+" + LP;
			}
		}
		return answer;
	}
	decodeEnglishToIMMR(text) {
		const answer = internal_calc();
		return (isNaN(answer) || !this.exists(answer)) ? null : answer;
		function internal_calc() {
			text.replaceAll(" ", "");//remove spaces
			text = text.toLowerCase();//all lowercase
			const TIERS = ["b", "s", "g", "p", "d", "m", "c"];
			const T_IMMR = [300, 800, 1300, 1800, 2300, 2600, 2800];
			const tier_index = TIERS.indexOf(text[0]);
			if (tier_index === -1) return null;//tier not detected
			if (text.length === 1) return T_IMMR[TIERS.indexOf(text[0])];//tier only
			else {//tier, div, [LP]
				const div = parseInt(text[1]);
				if (text.length === 2) {//tier, div
					if (tier_index < 5) {//below master
						if (div > 5 || div < 1) return null;
						else return T_IMMR[tier_index] + ((3 - div) * 100);
					}
					else return null;
				}
				else if (tier_index >= 5) {//tier, LP master/challenger
					let LP = parseInt(text.substring(1));//must be >= 0
					if (LP < 0) return null;
					else if (tier_index == 5) return T_IMMR[tier_index] + (LP / 5);
					else return T_IMMR[tier_index] - 200 + (LP / 5);
				}
				else {//tier, div, LP
					let LP = parseInt(text.substring(2));
					if (LP > 100 || LP < 0) return null;//must be between 0 and 100
					return T_IMMR[tier_index] + ((3 - div) * 100) + LP;
				}
			}
		}
	}
	summonersRiftMMR(rank) {
		let individual_iMMR = 0;
		let individual_games = 0;
		for (let c in rank) {//queue
			if (rank[c].queueType !== "RANKED_FLEX_TT") {
				individual_iMMR += this.iMMR(rank[c]) * (rank[c].wins + rank[c].losses);
				individual_games += rank[c].wins + rank[c].losses;
			}
		}
		return individual_games == 0 ? 0 : individual_iMMR / individual_games;
	}
	twistedTreelineMMR(rank) {
		let individual_iMMR = 0;
		let individual_games = 0;
		for (let c in rank) {//queue
			if (rank[c].queueType === "RANKED_FLEX_TT") {
				individual_iMMR += this.iMMR(rank[c]) * (rank[c].wins + rank[c].losses);
				individual_games += rank[c].wins + rank[c].losses;
			}
		}
		return individual_games == 0 ? 0 : individual_iMMR / individual_games;
	}
	averageUserMMR(rank) {
		let individual_iMMR = 0;
		let individual_games = 0;
		for (let c in rank) {//queue
			individual_iMMR += this.iMMR(rank[c]) * (rank[c].wins + rank[c].losses);
			individual_games += rank[c].wins + rank[c].losses;
		}
		return individual_games == 0 ? 0 : individual_iMMR / individual_games;
	}
	averageMatchMMR(ranks) {
		let total_iMMR = 0;
		let total_users = 0;
		for (let b in ranks) {//user
			const individual_weighted_MMR = this.averageUserMMR(ranks[b]);
			if (individual_weighted_MMR > 0) {
				++total_users;
				total_iMMR += individual_weighted_MMR;
			}
		}
		return total_users === 0 ? 0 : total_iMMR / total_users;
	}
	copy(obj) {//no functions
		return JSON.parse(JSON.stringify(obj));
	}
	removeAllOccurances(arr, deletable) {
		let deleted = 0;
		if (typeof(deletable) === "function") {
			for (let i = 0; i < arr.length; ++i) {
				if (deletable(arr[i])) {
					arr.splice(i, 1);
					--i;
					++deleted;
				}
			}
		}
		else {
			while (arr.indexOf(deletable) != -1) {
				arr.splice(arr.indexOf(deletable), 1);
				++deleted;
			}
		}
		return deleted;//number of deleted items
	}
	defaultChannelNames() {
		return ["general", "bot", "bots", "bot-commands", "botcommands", "commands", "league", "lol", "supportbot", "support-bot", "games", "spam"];
	}
	durationParse(duration) {
		let multiplier = duration.substring(duration.length - 1, duration.length).toUpperCase();
		if (multiplier == "D") multiplier = 24 * 60 * 60 * 1000;//days
		else if (multiplier == "H") multiplier = 60 * 60 * 1000;//hours
		else return NaN;
		return parseInt(duration) * multiplier;
	}
	presentLobby(pre_usernames) {
		let present = [];//users present
		let join_detected = false, leave_detected = false;
		const join_suffix = " joined the lobby";
		const leave_suffix = " left the lobby";
		for (let i = 0; i < pre_usernames.length; ++i) {
			if (pre_usernames[i].substring(pre_usernames[i].length - join_suffix.length) === join_suffix) join_detected = true;
			else if (pre_usernames[i].substring(pre_usernames[i].length - leave_suffix.length) === leave_suffix) leave_detected = true;
			else if (join_detected && leave_detected) break;//all necessary results recorded
			//else;//chat message
		}
		if (join_detected) {//champ select mode
			for (let i = 0; i < pre_usernames.length; ++i) {
				if (pre_usernames[i].substring(pre_usernames[i].length - join_suffix.length) === join_suffix) {
					present.push(pre_usernames[i].substring(0, pre_usernames[i].length - join_suffix.length).trim());//user joined, add to attendance
				}
				else if (pre_usernames[i].substring(pre_usernames[i].length - leave_suffix.length) === leave_suffix) {
					this.removeAllOccurances(present, pre_usernames[i].substring(0, pre_usernames[i].length - leave_suffix.length).trim());//user left, delete from attendance
				}
				//else;//chat message
			}
		}
		else if (leave_detected) {//end game mode
			for (let i = 0; i < pre_usernames.length; ++i) {
				if (pre_usernames[i].substring(pre_usernames[i].length - leave_suffix.length) === leave_suffix) {
					present.push(pre_usernames[i].substring(0, pre_usernames[i].length - leave_suffix.length).trim());//user left, add to attendance
				}
				//else;//chat message
			}
		}
		/*
		if (join) lobby/champ select, so joins add to usernames queried and leaves remove from usernames queried
		if (leave) end game screen, so leaves add to usernames queried
		*/
		return present;
	}
	map(x, in_min, in_max, out_min, out_max) {
		return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
	}
	constrain(x, min, max) {
		if (x <= min) return min;
		else if (x >= max) return max;
		return x;
	}
	conditionalFormat(text, surrounds, condition = true) {
		return condition ? surrounds + text + surrounds : text;
	}
	accessLevel(CONFIG, msg, uid) {//uid optional
		if (!this.exists(uid)) uid = msg.author.id;
		if (this.exists(CONFIG.OWNER_DISCORD_IDS[uid]) && CONFIG.OWNER_DISCORD_IDS[uid].active) return CONFIG.CONSTANTS.BOTOWNERS;//if it's an owner id
		const MEMBER = uid === msg.author.id ? msg.member : msg.guild.members.get(uid);
		if (!this.exists(MEMBER)) return CONFIG.CONSTANTS.NORMALMEMBERS;//PM
		else if (MEMBER.id === msg.guild.ownerID) return CONFIG.CONSTANTS.SERVEROWNERS;
		else if (MEMBER.hasPermission(["BAN_MEMBERS", "KICK_MEMBERS", "MANAGE_MESSAGES", "MANAGE_ROLES", "MANAGE_CHANNELS"])) return CONFIG.CONSTANTS.ADMINISTRATORS;
		else if (MEMBER.hasPermission(["KICK_MEMBERS", "MANAGE_MESSAGES"])) return CONFIG.CONSTANTS.MODERATORS;
		else if (this.exists(MEMBER.roles.find(r => r.name.toLowerCase() === "bot commander"))) return CONFIG.CONSTANTS.BOTCOMMANDERS;
		else return CONFIG.CONSTANTS.NORMALMEMBERS;
	}
	generateTeams(summoners) {//generates all possible teams
		/*summoners is an array of summoner objects from the API
		00000 00000: 0: invalid
		00000 11111: 31: valid
		00001 00000: 32: invalid
		11111 00000: 992: valid
		11111 00001: 993: invalid
		team 0 is always the larger team
		*/
		let combinations = [];
		let min_team_size = Math.trunc(summoners.length / 2);
		let max_team_size = Math.ceil(summoners.length / 2);
		for (let i = 0; i < Math.pow(2, summoners.length); ++i) {
			const candidate = i.toString(2).padStart(summoners.length, "0");
			if (candidate.count("1") == min_team_size) combinations.push(candidate);
		}
		return min_team_size === max_team_size ? combinations.slice(0, combinations.length / 2) : combinations;
	}
	calculateTeamStatistics(mathjs, team, data) {
		/*
		team = "1100010011"
		data = []
		*/
		let temp = {
			raw: [[], []],//raw values
			min: [0, 0],//minimum values
			med: [0, 0],//median
			max: [0, 0],//maximum values
			avg: [0, 0],//team averages
			stdev: [0, 0],//standard deviation
			sum: [0, 0],//team_0 sum, team_1 sum
			diff: 0,//absolute difference of sum
			abs: 0//team 0 - team 1
		}
		for (let i = 0; i < team.length; ++i) {
			temp.sum[parseInt(team[i])] += data[i];
			temp.raw[parseInt(team[i])].push(data[i]);
		}
		for (let t = 0; t < 2; ++t) {
			temp.min[t] = mathjs.min(temp.raw[t]);
			temp.max[t] = mathjs.max(temp.raw[t]);
			temp.avg[t] = mathjs.mean(temp.raw[t]);
			temp.med[t] = mathjs.median(temp.raw[t]);
			temp.stdev[t] = mathjs.std(temp.raw[t], "uncorrected");//σ: population standard deviation
		}
		temp.diff = temp.sum[0] - temp.sum[1];//team 0 - team 1
		temp.abs = Math.abs(temp.sum[0] - temp.sum[1]);
		return temp;
	}
	randomOf(choices) {
		return choices[Math.trunc(Math.random() * choices.length)];
	}
	randomInt(a, b) {//[a, b)
		a = Math.ceil(a);
		b = Math.floor(b);
		return Math.trunc(Math.random() * (b - a)) + a;
	}
	disciplinaryStatus(docs) {
		const now = new Date().getTime();
		let active_ban = -1;//-1 = no ban, 0 = perma, other = temp ban
		for (let b in docs) {
			if (docs[b].ban && docs[b].active) {
				const ban_date = new Date(docs[b].date);
				if (ban_date.getTime() == 0) {
					active_ban = 0;
					break;
				}
				else if (ban_date.getTime() > now) {
					if (ban_date.getTime() > active_ban) active_ban = ban_date.getTime();
				}
			}
		}
		let recent_ban = false;
		for (let b in docs) {
			if (docs[b].ban) {
				const ban_date = new Date(docs[b].date);
				if (now - (180 * 24 * 60 * 60 * 1000) < ban_date.getTime()) {//180 day
					recent_ban = true;
					break;
				}
			}
		}
		let recent_warning = false;
		for (let b in docs) {
			if (!docs[b].ban && docs[b].reason.substring(0, 9) == ":warning:") {
				const warn_date = new Date(docs[b].date);
				if (now - (180 * 24 * 60 * 60 * 1000) < warn_date.getTime()) {//180 day
					recent_warning = true;
					break;
				}
			}
		}
		let most_recent_note;
		for (let i = 0; i < docs.length; ++i) {
			if (!docs[i].ban && docs[i].reason.substring(0, 20) == ":information_source:") {
				most_recent_note = docs[i].reason;
				break;
			}
		}
		return { active_ban, recent_ban, recent_warning, most_recent_note };
	}
	disciplinaryStatusString(status, user) {
		this.assert(this.exists(user), "UTILS.dSS(status, user): user doesn't exist");
		let answer = user ? "User: " : "Server: ";
		if (status.active_ban == -1 && !status.recent_ban && !status.recent_warning) answer += ":white_check_mark: Good standing.";
		else {
			if (status.active_ban >= 0) {
				if (status.active_ban == 0) answer += ":no_entry: Permabanned";
				else answer += ":no_entry: Temporarily banned until " + this.until(new Date(status.active_ban));
			}
			else {
				if (status.recent_ban && status.recent_warning) answer += ":warning: Recently banned\n:warning: Recently warned";
				else if (status.recent_warning) answer += ":warning: Recently warned";
				else if (status.recent_ban) answer += ":warning: Recently banned";
			}
		}
		if (this.exists(status.most_recent_note)) answer += "\nMost recent note: " + status.most_recent_note;
		return answer;
	}
	isInt(x) {
		x = x + "";
		let valid = false;
		for (let i = 0; i < x.length; ++i) {
			if (!isNaN(parseInt(x[i]))) valid = true;
			else return false;
		}
		return valid;
	}
	embedRaw(richembed) {
		return { author: this.exists(richembed.author) ? this.copy(richembed.author) : undefined,
		color: richembed.color,
		description: richembed.description,
		fields: this.exists(richembed.fields) ? this.copy(richembed.fields) : undefined,
		footer: this.exists(richembed.footer) ? this.copy(richembed.footer) : undefined,
		image: this.exists(richembed.image) ? this.copy(richembed.image) : undefined,
		thumbnail: this.exists(richembed.thumbnail) ? this.copy(richembed.thumbnail) : undefined,
		timestamp: this.exists(richembed.timestamp) ? new Date(richembed.timestamp) : undefined,
		title: richembed.title,
		url: richembed.url };
	}
	expectNumber(str) {
		let newStr = "";
		for (let i = 0; i < str.length; ++i) {
			if (!isNaN(parseInt(str[i]))) {
				newStr += str[i];
			}
		}
		newStr = parseInt(newStr);
		if (isNaN(newStr)) return NaN;
		else return newStr;
	}
	parseQuery(queryString) {//do not pass in full URL
		var query = {};
		var pairs = (queryString[0] === '?' ? queryString.substr(1) : queryString).split('&');
		for (var i = 0; i < pairs.length; i++) {
			var pair = pairs[i].split('=');
			if (this.exists(query[decodeURIComponent(pair[0])])) {//already exists, so must be a set
				if (typeof(query[decodeURIComponent(pair[0])]) !== "object") {//is not an array yet
					query[decodeURIComponent(pair[0])] = [query[decodeURIComponent(pair[0])]];//make array
				}
				query[decodeURIComponent(pair[0])].push(pair[1]);//put at end of array
			}
			else query[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
		}
		return query;
	}
	aggregateClientEvals(client, arr) {//numerical only
		let par = [];
		let that = this;
		for (let b of arr) {
			par.push(new Promise((resolve, reject) => {
				client.shard.broadcastEval(b[0]).then(r => {
					resolve(that.exists(b[1]) ? b[1](r) : r);
				}).catch(reject);
			}));
		}
		return Promise.all(par);
	}
	generateGraph(mathjs, raw, height = 5, width = 35) {
		let answer = "";
		let min = raw[0][0];//start time
		let max = raw[raw.length - 1][0];//end time
		const y_vals = raw.map(point => point[1]);
		const y_min = mathjs.min(y_vals);
		const y_max = mathjs.max(y_vals);
		const raw_normalized = raw.map(point => {
			point[1] = this.map(point[1], y_min, y_max, 0, 1);
			return point;
		});
		for (let r = 0; r < height; ++r) {
			answer += "\n";
			for (let i = 0; i < width; ++i) {
				const targetTime = this.map(i, 0, width, min, max);
				let closestTimeLeft = min;
				let closestHealthLeft = raw_normalized[0][1];
				let closestTimeRight = max;
				let closestHealthRight = raw_normalized[raw_normalized.length - 1][1];
				for (let j = 1; j < raw_normalized.length; ++j) {
					if (raw_normalized[j][0] >= targetTime) {
						closestTimeLeft = raw_normalized[j - 1][0];
						closestHealthLeft = raw_normalized[j - 1][1];
						closestTimeRight = raw_normalized[j][0];
						closestHealthRight = raw_normalized[j][1];
						break;
					}
				}
				let slope = (closestHealthRight - closestHealthLeft) / (closestTimeRight - closestTimeLeft);
				let healthValue = (slope * (targetTime - closestTimeRight)) + closestHealthRight;
				//output("(" + r + "," + i + ") is " + healthValue);
				if (healthValue >= 0.95 - (r * 0.2)) {
					answer += "█";
				}
				else if (healthValue < 0.95 - (r * 0.2) && healthValue >= 1 - ((r + 1) * 0.2)) {
					answer += "▄";
				}
				else {
					answer += " ";
				}
			}
			if (r === 0) answer += y_max;
			else if (r === height - 1) answer += y_min;
		}
		return "```" + answer + "```";
	}
	strictParseInt(str) {
		let ans = ""
		for (let i = 0; i < str.length; ++i) {
			const temp = parseInt(str[i]);
			if (!isNaN(temp)) ans += temp;
			else return NaN;
		}
		return parseInt(ans);
	}
	gnuPlotGoldAdvantageGraph(array_of_points, x_size = 50, y_size = 18) {//[{x, y}, ...]
		let that = this;
		return new Promise((resolve, reject) => {
			const wincmd = "-Command \"\\\"" + array_of_points.map(p => p.x + " " + p.y).join("`n") + "\\\" | gnuplot -e \\\"set terminal dumb " + x_size + " " + y_size + "; set xlabel 'Minutes'; set tics scale 0; plot '-' with filledcurves y=0 notitle\\\"\"";
			const linuxcmd = "printf \"" + array_of_points.map(p => p.x + " " + p.y).join("\\n") + "\" | gnuplot -e \"set terminal dumb " + x_size + " " + y_size + "; set xlabel 'Minutes'; set tics scale 0; plot '-' with filledcurves y=0 notitle\"";
			if (process.platform === "win32") {
				child_process.exec("powershell.exe", [wincmd], { timeout: 1000, shell: "powershell.exe" }, (err, stdout, stderr) => {
					if (err) reject(err);
					if (that.exists(stderr) && stderr != "") reject(stderr);
					else resolve(stdout);
				});
			}
			else {
				child_process.exec(linuxcmd, { timeout: 1000 }, (err, stdout, stderr) => {
					if (err) reject(err);
					if (that.exists(stderr) && stderr != "") reject(stderr);
					else resolve(stdout);
				});
			}
		});
	}
}

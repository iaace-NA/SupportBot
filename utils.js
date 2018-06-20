"use strict";
let ta = require("./timeago.js");
let seq = require("./promise-sequential.js");
String.prototype.replaceAll = function(search, replacement) {
	let target = this;
	return target.replace(new RegExp(search, 'g'), replacement);
}
Number.prototype.pad = function(size) {
	let s = String(this);
	while (s.length < (size || 2)) {s = "0" + s;}
	return s;
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
		return Math.round(num * Math.pow(10, decimal)) / Math.pow(10, decimal);
	}
	assert(condition) {
		if (typeof (condition) != "boolean") throw new Error("asserting non boolean value: " + typeof (condition));
		if (!condition) throw new Error("assertion false");
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
		const stats = this.stats(summonerID, match);
		return {
			K: stats.kills,
			D: stats.deaths,
			A: stats.assists,
			KDA: (stats.kills + stats.assists) / stats.deaths,
			KD: stats.kills / stats.deaths
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
		return this.round(number, 1) + "k";
	}
	level(summonerID, match) {
		return this.stats(summonerID, match).championLevel;
	}
	indexOfInstance(string, searchString, index) {
		let answer = -1;
		for (let i = 0, count = 0; i < string.length - searchString.length; ++i) {
			if (string.substring(i, i + searchString.length) == searchString) {
				++count;
				if (count == index) answer = i;
			}
		}
		return answer;
	}
	preferredTextChannel(client, collection, type, names, permissions) {
		for (let i = 0; i < names.length; ++i) {
			let candidate = collection.find(ch => {
				if (ch.type === type && ch.name.toLowerCase() === names[i].toLowerCase() && ch.permissionsFor(client.user).has(permissions)) return true;
			});
			if (this.exists(candidate)) return candidate;
		}
		return collection.find(ch => { if (ch.type === type && ch.permissionsFor(client.user).has(permissions)) return true; });
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
		return "http://" + region + ".op.gg/summoner/userName=" + encodeURIComponent(username);
	}
	shortRank(info) {
		//****** unranked
		//██████ unranked
		//G↑W--- Gold promotion, 1 win
		//G2 +00 Gold 2, 0 LP
		//G2 +56 Gold 2, 56LP
		//G2↑ L_ Gold 2 promotion, 1 loss
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
				answer += { "I": "1", "II": "2", "III": "3", "IV": "4", "V": "5" }[info.rank] + "↑ " + info.miniSeries.progress.substring(0, info.miniSeries.progress.length - 1).replaceAll("N", "-");
			}
		}
		else {//no series
			let LP = info.leaguePoints;
			if (info.tier[0] == "C" || info.tier[0] == "M") {//challenger or master (unlimited LP)
				if (LP < 0) answer += "  -";
				else if (LP < 100) answer += "  +";
				else if (LP < 1000) answer += " +";
				else answer += "+";
			}
			else {
				answer += { "I": "1", "II": "2", "III": "3", "IV": "4", "V": "5" }[info.rank];
				if (LP < 0) answer += " -";
				else if (LP < 100) answer += " +";
				else answer += "+";
			}
			LP = Math.abs(LP);
			if (LP >= 10) answer += LP;
			else answer += "0" + LP;
		}
		return answer;
	}
	getSingleChampionMastery(all, singleID) {
		return this.exists(all.find(cmi => cmi.championId == singleID)) ? all.find(cmi => cmi.championId == singleID).championLevel : 0;
	}
	KDAFormat(num) {
		if (isNaN(num) || num == Infinity) return "Perfect";
		else return this.round(num, 2).toFixed("2");
	}
	KPFormat(num) {
		if (isNaN(num)) return 0;
		else return this.round(num, 0);
	}
	iMMR(rank) {//internal MMR Representation
		/*
		Bronze 5, 0LP: 100
		Bronze 4, 0LP: 200
		Bronze 3, 0LP: 300
		Bronze 2, 0LP: 400
		Bronze 1, 0LP: 500
		Silver 5, 0LP: 600
		Gold 5, 0LP: 1100
		Platinum 5, 0LP: 1600
		Diamond 5, 0LP: 2100
		Master, 0LP: 2600
		Challenger, 1000LP: 2800
		*/
		let answer = { BRONZE: 100, SILVER: 600, GOLD: 1100, PLATINUM: 1600, DIAMOND: 2100, MASTER: 2600, CHALLENGER: 2600 }[rank.tier];
		if (answer != 2600) {
			answer += { V: 0, IV: 100, III: 200, II: 300, I: 400 }[rank.rank];
			answer += rank.leaguePoints;
		}
		else answer += rank.leaguePoints / 5;//magic number constant: 500 LP = 1 iMMR div
		return answer;
	}
	iMMRtoEnglish(mmr) {
		//6-char representation
		if (mmr < 100) return "******";
		let answer = "";
		if (mmr < 600) answer += "B";
		else if (mmr < 1100) answer += "S";
		else if (mmr < 1600) answer += "G";
		else if (mmr < 2100) answer += "P";
		else if (mmr < 2600) answer += "D";
		else if (mmr < 2700) answer += "M";//arbitrary M/C threshold
		else answer += "C";
		let LP;
		if (mmr < 2600) {
			answer += ["5", "4", "3", "2", "1"][Math.floor(((mmr - 100) % 500) / 100)];
			LP = " +" + this.round(mmr % 100).pad(2);
			answer += LP;
		}
		else {
			LP = this.round((mmr - 2600) * 5);
			if (LP < 100) answer += "  +" + LP.pad(2);
			else if (LP < 1000) answer += " +" + LP;
			else answer += "+" + LP;
		}
		return answer;
	}
	averageUserMMR(rank) {
		let individual_iMMR = 0;
		let individual_games = 0;
		for (let c in rank) {//queue
			individual_iMMR += this.iMMR(rank) * (rank.wins + rank.losses);
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
		while (arr.indexOf(deletable) != -1) arr.splice(arr.indexOf(deletable), 1);
	}
	defaultChannelNames() {
		return ["general", "bot", "bots", "bot-commands", "botcommands", "commands", "league", "lol", "games", "spam"];
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
	conditionalFormat(text, surrounds, condition = true) {
		return condition ? surrounds + text + surrounds : text;
	}
}

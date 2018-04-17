"use strict";
let ta = require("./timeago.js");
let seq = require("./promise-sequential.js");
String.prototype.replaceAll = function(search, replacement) {
	let target = this;
	return target.replace(new RegExp(search, 'g'), replacement);
};
module.exports = class UTILS {
	output(t) {//general utility function
		if (this.exists(t)) {
			let n = new Date().toISOString().slice(0, 19).replace('T', ' ');;
			console.log(n + " : " + t);
		}
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
	round(num, decimal) {
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
	teamParticipant(summonerID, match) {
		const participantID = match.participantIdentities.find(pI => { return pI.player.summonerId == summonerID; }).participantId;
		const stats = match.participants.find(p => { return p.participantId == participantID; });
		return stats;
	}
	findParticipantIdentityFromPID(match, pid) {
		return match.participantIdentities.find(pI => { return pI.participantId == pid; });
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
		const participantID = match.participantIdentities.find(pI => { return pI.player.summonerId == summonerID; }).participantId;
		const teamID = match.participants.find(p => { return p.participantId == participantID; }).teamId;
		return match.teams.find(t => { return t.teamId == teamID; }).win == "Win";
	}
	english(text) {
		return text.split("_").map(t => { return t.substring(0, 1).toUpperCase() + t.substring(1).toLowerCase(); }).join(" ");
	}
	standardTimestamp(sec) {
		let mins = Math.floor(parseInt(sec) / 60);
		let hours = Math.floor(parseInt(mins) / 60);
		mins = mins % 60;
		let secs = Math.floor(parseInt(sec) % 60);
		if (secs < 10) {
			secs = "0" + secs;
		}
		if (mins < 10) {
			mins = "0" + mins;
		}
		if (hours < 10) {
			hours = "0" + hours
		}
		if (hours == "00") {
			return mins + ":" + secs;
		}
		else {
			return hours + ":" + mins + ":" + secs;
		}
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
}

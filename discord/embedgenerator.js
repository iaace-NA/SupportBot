"use strict";
const Discord = require("discord.js");
//let ta = require("time-ago")();
const UTILS = new (require("../utils.js"))();
module.exports = class EmbedGenrator {
	constructor() { }
	test() {
		let newEmbed = new Discord.RichEmbed();
		newEmbed.setTitle("Test");
		newEmbed.setDescription("description");
		return newEmbed;
	}
	summoner(CONFIG, apiobj) {
		if (!UTILS.exists(summoner.id)) {
			let newEmbed = new Discord.RichEmbed();
			newEmbed.setTitle("This summoner does not exist.");
			newEmbed.setDescription("Please revise your request.");
			return newEmbed;
		}
		let newEmbed = new Discord.RichEmbed();
		newEmbed.setAuthor(apiobj.name);
		newEmbed.setThumbnail(CONFIG.STATIC.S_ICONS + apiobj.profileIconId + ".png");
		newEmbed.setDescription("Level " + apiobj.summonerLevel + "\nSummoner ID: " + apiobj.id + "\nAccount ID: " + apiobj.accountId);
		newEmbed.setTimestamp(new Date(apiobj.revisionDate));
		newEmbed.setFooter("Last change detected at ");
		return newEmbed;
	}
	detailedSummoner(CONFIG, summoner, ranks) {
		if (!UTILS.exists(summoner.id)) {
			let newEmbed = new Discord.RichEmbed();
			newEmbed.setTitle("This summoner does not exist.");
			newEmbed.setDescription("Please revise your request.");
			return newEmbed;
		}
		let newEmbed = new Discord.RichEmbed();
		newEmbed.setAuthor(summoner.name);
		newEmbed.setThumbnail(CONFIG.STATIC.S_ICONS + summoner.profileIconId + ".png");
		newEmbed.setDescription("Level " + summoner.summonerLevel);
		for (let b in ranks) {
			newEmbed.addField(ranks[b].queueType + ": " + ranks[b].tier + " " + ranks[b].rank + " " + ranks[b].leaguePoints + "LP", (ranks[b].wins + ranks[b].losses) + "G = " + ranks[b].wins + "W + " + ranks[b].losses + "L\nWin Rate: " + UTILS.round(100 * ranks[b].wins / (ranks[b].wins + ranks[b].losses), 2) + "%");
		}
		newEmbed.setTimestamp(new Date(summoner.revisionDate));
		newEmbed.setFooter("Last change detected at ");
		return newEmbed;
	}
}

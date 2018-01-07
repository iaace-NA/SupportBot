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
		if (!UTILS.exists(apiobj.id)) {
			let newEmbed = new Discord.RichEmbed();
			newEmbed.setTitle("This summoner does not exist.");
			newEmbed.setDescription("Please revise your request.");
			return newEmbed;
		}
		let newEmbed = new Discord.RichEmbed();
		newEmbed.setAuthor(apiobj.name);
		newEmbed.setThumbnail("https://ddragon.leagueoflegends.com/cdn/" + CONFIG.STATIC.n.profileicon + "/img/profileicon/" + apiobj.profileIconId + ".png");
		newEmbed.setDescription("Level " + apiobj.summonerLevel + "\nSummoner ID: " + apiobj.id + "\nAccount ID: " + apiobj.accountId);
		newEmbed.setTimestamp(new Date(apiobj.revisionDate));
		newEmbed.setFooter("Last change detected at ");
		return newEmbed;
	}
	detailedSummoner(CONFIG, summoner, ranks, region) {
		if (!UTILS.exists(summoner.id)) {
			let newEmbed = new Discord.RichEmbed();
			newEmbed.setTitle("This summoner does not exist.");
			newEmbed.setDescription("Please revise your request.");
			return newEmbed;
		}
		let newEmbed = new Discord.RichEmbed();
		newEmbed.setAuthor(summoner.name);
		newEmbed.setThumbnail("https://ddragon.leagueoflegends.com/cdn/" + CONFIG.STATIC.n.profileicon + "/img/profileicon/" + summoner.profileIconId + ".png");
		newEmbed.setDescription("Level " + summoner.summonerLevel);
		for (let b in ranks) {
			newEmbed.addField({
				"RANKED_FLEX_SR": "Flex 5v5",
				"RANKED_SOLO_5x5": "Solo 5v5",
				"RANKED_FLEX_TT": "Flex 3v3"
			}[ranks[b].queueType] + ": " + ranks[b].tier.substring(0, 1) + ranks[b].tier.substring(1).toLowerCase() + " " + ranks[b].rank + " " + ranks[b].leaguePoints + "LP", (ranks[b].wins + ranks[b].losses) + "G = " + ranks[b].wins + "W + " + ranks[b].losses + "L\nWin Rate: " + UTILS.round(100 * ranks[b].wins / (ranks[b].wins + ranks[b].losses), 2) + "%");
		}
		newEmbed.addField("Other 3rd party services", "[op.gg](https://" + region + ".op.gg/summoner/userName=" + encodeURIComponent(summoner.name) + ")\t[lolnexus](https://lolnexus.com/" + region + "/search?name=" + encodeURIComponent(summoner.name) + "&region=" + region + ")\t[quickfind](https://quickfind.kassad.in/profile/" + region + "/" + encodeURIComponent(summoner.name) + ")\t[lolking](https://lolking.net/summoner/" + region + "/" + summoner.id + "/" + encodeURIComponent(summoner.name) + "#/profile)\t[lolprofile](https://lolprofile.net/summoner/" + region + "/" + encodeURIComponent(summoner.name) + "#update)\t[matchhistory](https://matchhistory." + region + ".leagueoflegends.com/en/#match-history/" + CONFIG.REGIONS[region.toUpperCase()].toUpperCase() + "/" + summoner.accountId + ")");
		newEmbed.setTimestamp(new Date(summoner.revisionDate));
		newEmbed.setFooter("Last change detected at ");
		return newEmbed;
	}
}

"use strict";
const Discord = require("discord.js");
const UTILS = new (require("../utils.js"))();
const queues = {
	"0": "Custom",
	"70": "SR One for All",
	"72": "HA 1v1 Snowdown Showdown",
	"73": "HA 2v2 Snowdown Showdown",
	"75": "SR 6v6 Hexakill",
	"76": "SR URF",
	"78": "HA One For All: Mirror",
	"83": "SR Co-op vs AI URF",
	"98": "TT 6v6 Hexakill",
	"100": "BB 5v5 ARAM",
	"310": "SR Nemesis",
	"313": "SR Black Market Brawlers",
	"317": "CS Definitely Not Dominion",
	"325": "SR All Random",
	"400": "SR Draft",
	"420": "SR Ranked Solo",
	"430": "SR Blind",
	"440": "SR Ranked Flex",
	"450": "HA ARAM",
	"460": "TT Blind",
	"470": "TT Ranked Flex",
	"600": "SR Blood Hunt",
	"610": "CR Dark Star: Singularity",
	"800": "TT Co-op vs AI Intermediate",
	"810": "TT Co-op vs AI Intro",
	"820": "TT Co-op vs AI Beginner",
	"830": "SR Co-op vs AI Intro",
	"840": "SR Co-op vs AI Beginner",
	"850": "SR Co-op vs AI Intermediate",
	"900": "SR ARURF",
	"910": "CS Ascension",
	"920": "HA Legend of the Poro King",
	"940": "SR Nexus Siege",
	"950": "SR Doom Bots Voting",
	"960": "SR Doom Bots Standard",
	"980": "VCP Star Guardian Invasion: Normal",
	"990": "VCP Star Guardian Invasion: Onslaught",
	"1000": "O Project: Hunters",
	"1010": "SR Snow ARURF"
};
module.exports = class EmbedGenrator {
	constructor() { }
	test() {
		let newEmbed = new Discord.RichEmbed();
		newEmbed.setTitle("Test");
		newEmbed.setDescription("description");
		return newEmbed;
	}
	summoner(CONFIG, apiobj) {
		let newEmbed = new Discord.RichEmbed();
		if (!UTILS.exists(apiobj.id)) {
			newEmbed.setTitle("This summoner does not exist.");
			newEmbed.setDescription("Please revise your request.");
			newEmbed.setColor([255, 0, 0]);
			return newEmbed;
		}
		newEmbed.setAuthor(apiobj.name);
		newEmbed.setThumbnail("https://ddragon.leagueoflegends.com/cdn/" + CONFIG.STATIC.n.profileicon + "/img/profileicon/" + apiobj.profileIconId + ".png");
		newEmbed.setDescription("Level " + apiobj.summonerLevel + "\nSummoner ID: " + apiobj.id + "\nAccount ID: " + apiobj.accountId);
		newEmbed.setTimestamp(new Date(apiobj.revisionDate));
		newEmbed.setFooter("Last change detected at ");
		return newEmbed;
	}
	detailedSummoner(CONFIG, summoner, ranks, championmastery, region) {
		let newEmbed = new Discord.RichEmbed();
		if (!UTILS.exists(summoner.id)) {
			newEmbed.setTitle("This summoner does not exist.");
			newEmbed.setDescription("Please revise your request.");
			newEmbed.setColor([255, 0, 0]);
			return newEmbed;
		}
		newEmbed.setAuthor(summoner.name);
		newEmbed.setThumbnail("https://ddragon.leagueoflegends.com/cdn/" + CONFIG.STATIC.n.profileicon + "/img/profileicon/" + summoner.profileIconId + ".png");
		newEmbed.setDescription("Level " + summoner.summonerLevel);
		for (let b in ranks) {
			newEmbed.addField({
				"RANKED_FLEX_SR": "Flex 5v5",
				"RANKED_SOLO_5x5": "Solo 5v5",
				"RANKED_FLEX_TT": "Flex 3v3"
			}[ranks[b].queueType] + ": " + ranks[b].tier.substring(0, 1) + ranks[b].tier.substring(1).toLowerCase() + " " + ranks[b].rank + " " + ranks[b].leaguePoints + "LP", (ranks[b].wins + ranks[b].losses) + "G = " + ranks[b].wins + "W + " + ranks[b].losses + "L\nWin Rate: " + UTILS.round(100 * ranks[b].wins / (ranks[b].wins + ranks[b].losses), 2) + "%", true);
		}
		let cm_description = [];
		let cm_total = 0;
		for (let i = 0; i < championmastery.length; ++i) {
			if (i < 3) cm_description.push("`M" + championmastery[i].championLevel + "` " + CONFIG.STATIC.CHAMPIONS[championmastery[i].championId].name + ": `" + UTILS.numberWithCommas(championmastery[i].championPoints) + "`pts");
			cm_total += championmastery[i].championLevel;
		}
		if (cm_description.length > 0) newEmbed.addField("Champion Mastery: " + cm_total, cm_description.join("\n"));
		newEmbed.addField("Other 3rd party services", "[op.gg](https://" + region + ".op.gg/summoner/userName=" + encodeURIComponent(summoner.name) + ") [lolnexus](https://lolnexus.com/" + region + "/search?name=" + encodeURIComponent(summoner.name) + "&region=" + region + ") [quickfind](https://quickfind.kassad.in/profile/" + region + "/" + encodeURIComponent(summoner.name) + ") [lolking](https://lolking.net/summoner/" + region + "/" + summoner.id + "/" + encodeURIComponent(summoner.name) + "#/profile) [lolprofile](https://lolprofile.net/summoner/" + region + "/" + encodeURIComponent(summoner.name) + "#update) [matchhistory](https://matchhistory." + region + ".leagueoflegends.com/en/#match-history/" + CONFIG.REGIONS[region.toUpperCase()].toUpperCase() + "/" + summoner.accountId + ") [wol](https://wol.gg/stats/" + region + "/" + encodeURIComponent(summoner.name) + "/)");
		newEmbed.setTimestamp(new Date(summoner.revisionDate));
		newEmbed.setFooter("Last change detected at ");
		return newEmbed;
	}
	match(CONFIG, summoner, match_meta, matches) {//should show 5 most recent games
		let newEmbed = new Discord.RichEmbed();

		newEmbed.setTitle("Recent Games");
		newEmbed.setAuthor(summoner.name, "https://ddragon.leagueoflegends.com/cdn/" + CONFIG.STATIC.n.profileicon + "/img/profileicon/" + summoner.profileIconId + ".png");
		for (let i = 0; i < match_meta.length && i < 5; ++i) {
			const KDA = UTILS.KDA(summoner.id, matches[i]);
			const stats = UTILS.stats(summoner.id, matches[i]);
			newEmbed.addField((UTILS.determineWin(summoner.id, matches[i]) ? "<:win:409617613161758741>" : "<:loss:409618158165688320>") + " " + CONFIG.STATIC.CHAMPIONS[match_meta[i].champion].name + " " + (UTILS.english(match_meta[i].role) == "None" ? "" : UTILS.english(match_meta[i].role)) + " " + UTILS.english(match_meta[i].lane), "lv. `" + stats.champLevel + "`\t`" + KDA.K + "/" + KDA.D + "/" + KDA.A + "`\tKDA:`" + (UTILS.round(KDA.KDA, 2) == "Infinity" ? "Perfect" : UTILS.round(KDA.KDA, 2)) + "`\tcs:`" + (stats.totalMinionsKilled + stats.neutralMinionsKilled) + "`\tg:`" + UTILS.gold(stats.goldEarned) + "`\n" + queues[matches[i].queueId + ""] + "\t`" + UTILS.standardTimestamp(matches[i].gameDuration) + "`\t" + UTILS.ago(new Date(match_meta[i].timestamp)));
			// champion
			// match result
			// queue
			// level
			//[items]
			// KDA
			// cs
			// gold
			// length
			// time
			// lane
			// role
		}
		return newEmbed;
	}
	detailedMatch(CONFIG, summoner, match_meta, match) {//should show detailed information about 1 game
		let newEmbed = new Discord.RichEmbed();
		newEmbed.setAuthor(summoner.name);
		if (UTILS.exists(match.status)) {
			newEmbed.setTitle("This summoner has no recent matches.");
			newEmbed.setColor([255, 0, 0]);
			return newEmbed;
		}
		newEmbed.setTitle(queues[match.queueId]);
		newEmbed.setDescription("Match Length: " + UTILS.standardTimestamp(match.gameDuration));
		newEmbed.setTimestamp(new Date(match_meta.timestamp));
		newEmbed.setFooter("Match played " + UTILS.ago(new Date(match_meta.timestamp)) + " at: ");
		let teams = {};
		for (let b in match.participants) {
			if (!UTILS.exists(teams[match.participants[b].teamId])) {
				teams[match.participants[b].teamId] = [];
			}
			teams[match.participants[b].teamId].push(match.participants[b]);
		}
		let team_count = 0;
		for (let b in teams) {
			++team_count;
			newEmbed.addField((match.teams.find(t => { return teams[b][0].teamId == t.teamId; }).win == "Win" ? "<:win:409617613161758741>" : "<:loss:409618158165688320>") + "Team " + team_count, "`" + teams[b].reduce((total, increment) => { return total + increment.stats.kills; }, 0) + "/" + teams[b].reduce((total, increment) => { return total + increment.stats.deaths; }, 0) + "/" + teams[b].reduce((total, increment) => { return total + increment.stats.assists; }, 0) + "`");
			for (let c in teams[b]) {
				newEmbed.addField(match.participantIdentities.find(pI => { return pI.participantId == teams[b][c].participantId; }).player.summonerName, "`" + teams[b][c].stats.kills + "/" + teams[b][c].stats.deaths + "/" + teams[b][c].stats.assists + "`");
			}
		}
		//champion
		// match result
		// queue
		//level
		//[items]
		// KDA
		//cs
		//gold
		// length
		// time
		//lane
		//role
		//team KDA
		//team CS
		return newEmbed;
	}
	liveMatch(CONFIG, summoner, match) {//show current match information
		let newEmbed = new Discord.RichEmbed();
		newEmbed.setAuthor(summoner.name);
		if (UTILS.exists(match.status)) {
			newEmbed.setTitle("This summoner is currently not in a match.");
			newEmbed.setColor([255, 0, 0]);
			return newEmbed;
		}
		newEmbed.setTitle(queues[match.gameQueueConfigId]);
		newEmbed.setDescription("Match Time: " + UTILS.standardTimestamp(match.gameLength + 180));
		let teams = {};
		for (let b in match.participants) {
			if (!UTILS.exists(teams[match.participants[b].teamId])) {
				teams[match.participants[b].teamId] = [];
			}
			teams[match.participants[b].teamId].push(match.participants[b]);
		}
		let team_count = 1;
		let player_count = 0;
		for (let b in teams) {
			let team_description = "";
			let ban_description = [];
			for (let c in teams[b]) {
				team_description += "__" + teams[b][c].summonerName;
				team_description += "__: " + CONFIG.STATIC.CHAMPIONS[teams[b][c].championId].name;
				team_description += "\t`" + CONFIG.STATIC.SUMMONERSPELLS[teams[b][c].spell1Id].name + "`\t`" + CONFIG.STATIC.SUMMONERSPELLS[teams[b][c].spell2Id].name + "`";
				if (UTILS.exists(match.bannedChampions[player_count])) {
					ban_description.push(CONFIG.STATIC.CHAMPIONS[match.bannedChampions[player_count].championId].name);
				}
				team_description += "\n";
				++player_count;
			}
			team_description += "Bans: " + ban_description.join(", ");
			newEmbed.addField("Team " + team_count, team_description);
			++team_count;
		}
		return newEmbed;
	}
}

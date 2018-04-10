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
	"1010": "SR Snow ARURF",
	"1020": "SR One for All"
};
const RANK_ORDER = ["BRONZE", "SILVER", "GOLD", "PLATINUM", "DIAMOND", "MASTER", "CHALLENGER"];
const RANK_COLOR = [[153, 51, 0], [179, 179, 179], [255, 214, 51], [102, 255, 204], [179, 240, 255], [255, 153, 255], [255, 0, 0]];
module.exports = class EmbedGenrator {
	constructor() { }
	test() {
		let newEmbed = new Discord.RichEmbed();
		newEmbed.setTitle("Test");
		newEmbed.setDescription("description");
		return newEmbed;
	}
	help(CONFIG) {
		let newEmbed = new Discord.RichEmbed();
		newEmbed.setTitle("Discord Commands");
		newEmbed.setDescription("Terms of Service:\n- Don't be a bot on a user account and use SupportBot.\n- Don't abuse bugs. If you find a bug, please report it to us.\n- Don't spam useless feedback\n- If you do not want to use SupportBot, let us know and we'll opt you out of our services.\n- We reserve the right to ban users and servers from using SupportBot at our discretion.\nFor additional help, please visit <" + CONFIG.HELP_SERVER_INVITE_LINK + ">\n\n<required parameter> [optional parameter]");
		newEmbed.addField(CONFIG.DISCORD_COMMAND_PREFIX + "help", "Displays this information card.");
		newEmbed.addField(CONFIG.DISCORD_COMMAND_PREFIX + "invite", "Provides information on how to add SupportBot to a different server.");
		newEmbed.addField(CONFIG.DISCORD_COMMAND_PREFIX + "ping", "Checks SupportBot response time.");
		newEmbed.addField(CONFIG.DISCORD_COMMAND_PREFIX + "link <region> <username>", "If your LoL ign is different from your discord username, you can set your LoL ign using this command, and SupportBot will remember it.");
		newEmbed.addField(CONFIG.DISCORD_COMMAND_PREFIX + "getlink", "Aliases:\n`" + CONFIG.DISCORD_COMMAND_PREFIX + "gl`\n\nTells you what LoL username you currently have registered with SupportBot.");
		newEmbed.addField(CONFIG.DISCORD_COMMAND_PREFIX + "unlink", "Aliases:\n`" + CONFIG.DISCORD_COMMAND_PREFIX + "removelink`\n\nSupportBot forgets your preferred username and region.");
		newEmbed.addField("<region> [username]", "Displays summoner information.");
		newEmbed.addField("matchhistory <region> [username]", "Aliases:\n`mh <region> [username]`\n\nDisplays basic information about the 5 most recent games played.");
		newEmbed.addField("matchhistory<number> <region> [username]", "Aliases:\n`mh<number> <region> [username]`\n\nDisplays detailed information about one of your most recently played games.");
		newEmbed.addField("livegame <region> [username]", "Aliases:\n`lg <region> [username]`\n`currentgame <region> [username]`\n`cg <region> [username]`\n`livematch <region> [username]`\n`lm <region> [username]`\n`currentmatch <region> [username]`\n`cm <region> [username]`\n\nShows information about a game currently being played.");
		newEmbed.setFooter("SupportBot " + CONFIG.VERSION);
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
		let highest_rank = -1;
		for (let b in ranks) {
			let description = (ranks[b].wins + ranks[b].losses) + "G = " + ranks[b].wins + "W + " + ranks[b].losses + "L\nWin Rate: " + UTILS.round(100 * ranks[b].wins / (ranks[b].wins + ranks[b].losses), 2) + "%";
			if (UTILS.exists(ranks[b].miniSeries)) description += "\nSeries in Progress: `" + ranks[b].miniSeries.progress.replaceAll("N", "_") + "`";
			newEmbed.addField({
				"RANKED_FLEX_SR": "Flex 5v5",
				"RANKED_SOLO_5x5": "Solo 5v5",
				"RANKED_FLEX_TT": "Flex 3v3"
			}[ranks[b].queueType] + ": " + ranks[b].tier.substring(0, 1) + ranks[b].tier.substring(1).toLowerCase() + " " + ranks[b].rank + " " + ranks[b].leaguePoints + "LP", description, true);
			highest_rank = (RANK_ORDER.indexOf(ranks[b].tier) > highest_rank ? RANK_ORDER.indexOf(ranks[b].tier) : highest_rank);
		}
		if (highest_rank > -1) newEmbed.setColor(RANK_COLOR[highest_rank]);
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
			const teamParticipant = UTILS.teamParticipant(summoner.id, matches[i]);
			let teams = {};
			for (let b in matches[i].participants) {
				if (!UTILS.exists(teams[matches[i].participants[b].teamId])) teams[matches[i].participants[b].teamId] = [];
				teams[matches[i].participants[b].teamId].push(matches[i].participants[b]);
			}
			const tK = teams[teamParticipant.teamId].reduce((total, increment) => { return total + increment.stats.kills; }, 0);
			const tD = teams[teamParticipant.teamId].reduce((total, increment) => { return total + increment.stats.deaths; }, 0);
			const tA = teams[teamParticipant.teamId].reduce((total, increment) => { return total + increment.stats.assists; }, 0);
			newEmbed.addField((UTILS.determineWin(summoner.id, matches[i]) ? "<:win:409617613161758741>" : "<:loss:409618158165688320>") + " " + CONFIG.STATIC.CHAMPIONS[match_meta[i].champion].name + " " + (UTILS.english(match_meta[i].role) == "None" ? "" : UTILS.english(match_meta[i].role)) + " " + UTILS.english(match_meta[i].lane), "lv. `" + stats.champLevel + "`\t`" + KDA.K + "/" + KDA.D + "/" + KDA.A + "`\tKDR:`" + (UTILS.round(KDA.KD, 2) == "Infinity" ? "Perfect" : UTILS.round(KDA.KD, 2)) + "`\tKDA:`" + (UTILS.round(KDA.KDA, 2) == "Infinity" ? "Perfect" : UTILS.round(KDA.KDA, 2)) + "` `" + UTILS.round((100 * (KDA.A + KDA.K)) / tK, 0) + "%`\tcs:`" + (stats.totalMinionsKilled + stats.neutralMinionsKilled) + "`\tg:`" + UTILS.gold(stats.goldEarned) + "`\n" + queues[matches[i].queueId + ""] + "\t`" + UTILS.standardTimestamp(matches[i].gameDuration) + "`\t" + UTILS.ago(new Date(match_meta[i].timestamp + (matches[i].gameDuration * 1000))));
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
			//KP
		}
		return newEmbed;
	}
	detailedMatch(CONFIG, summoner, match_meta, match) {//should show detailed information about 1 game
		let newEmbed = new Discord.RichEmbed();
		newEmbed.setAuthor(summoner.name, "https://ddragon.leagueoflegends.com/cdn/" + CONFIG.STATIC.n.profileicon + "/img/profileicon/" + summoner.profileIconId + ".png");
		if (UTILS.exists(match.status)) {
			newEmbed.setTitle("This summoner has no recent matches.");
			newEmbed.setColor([255, 0, 0]);
			return newEmbed;
		}
		newEmbed.setTitle(queues[match.queueId]);
		newEmbed.setDescription("Match Length: " + UTILS.standardTimestamp(match.gameDuration));
		newEmbed.setTimestamp(new Date(match_meta.timestamp + (match.gameDuration * 1000)));
		newEmbed.setFooter("Match played " + UTILS.ago(new Date(match_meta.timestamp + (match.gameDuration * 1000))) + " at: ");
		let teams = {};
		for (let b in match.participants) {
			if (!UTILS.exists(teams[match.participants[b].teamId])) teams[match.participants[b].teamId] = [];
			teams[match.participants[b].teamId].push(match.participants[b]);
		}
		let team_count = 0;
		for (let b in teams) {
			++team_count;
			const tK = teams[b].reduce((total, increment) => { return total + increment.stats.kills; }, 0);
			const tD = teams[b].reduce((total, increment) => { return total + increment.stats.deaths; }, 0);
			const tA = teams[b].reduce((total, increment) => { return total + increment.stats.assists; }, 0);
			const tKP = UTILS.round((tA * 100) / (tK * (teams[b].length - 1)), 0);
			newEmbed.addField((match.teams.find(t => { return teams[b][0].teamId == t.teamId; }).win == "Win" ? "<:win:409617613161758741>" : "<:loss:409618158165688320>") + "Team " + team_count, "Σlv.`" + teams[b].reduce((total, increment) => { return total + increment.stats.champLevel; }, 0) + "`\t`" + tK + "/" + tD + "/" + tA + "`\tKDR:`" + (UTILS.round((tK / tD), 2) == "Infinity" ? "Perfect" : UTILS.round((tK / tD), 2)) + "`\tKDA:`" + (UTILS.round(((tK + tA) / tD), 2) == "Infinity" ? "Perfect" : UTILS.round(((tK + tA) / tD), 2)) + "` `" + tKP + "%`\tΣcs:`" + teams[b].reduce((total, increment) => { return total + increment.stats.totalMinionsKilled + increment.stats.neutralMinionsKilled; }, 0) + "`\tΣg:`" + UTILS.gold(teams[b].reduce((total, increment) => { return total + increment.stats.goldEarned; }, 0)) + "`");
			for (let c in teams[b]) {
				let p = teams[b][c];
				newEmbed.addField("__" + match.participantIdentities.find(pI => { return pI.participantId == p.participantId; }).player.summonerName + "__: " + CONFIG.STATIC.CHAMPIONS[p.championId].name + " " + (UTILS.english(p.timeline.role) == "None" ? "" : UTILS.english(p.timeline.role)) + " " + UTILS.english(p.timeline.lane), "lv. `" + p.stats.champLevel + "`\t`" + p.stats.kills + "/" + p.stats.deaths + "/" + p.stats.assists + "`\tKDR:`" + (UTILS.round(p.stats.kills / p.stats.deaths, 2) == "Infinity" ? "Perfect" : UTILS.round(p.stats.kills / p.stats.deaths, 2)) + "`\tKDA:`" + (UTILS.round(((p.stats.kills + p.stats.assists) / p.stats.deaths), 2) == "Infinity" ? "Perfect" : UTILS.round(((p.stats.kills + p.stats.assists) / p.stats.deaths), 2)) + "` `" + UTILS.round((100 * (p.stats.assists + p.stats.kills)) / tK, 0) + "%`\tcs:`" + (p.stats.totalMinionsKilled + p.stats.neutralMinionsKilled) + "`\tg:`" + UTILS.gold(p.stats.goldEarned) + "`");
			}
		}
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
		// team KDA
		// team CS
		// KP
		return newEmbed;
	}
	liveMatch(CONFIG, summoner, match) {//show current match information
		let newEmbed = new Discord.RichEmbed();
		newEmbed.setAuthor(summoner.name, "https://ddragon.leagueoflegends.com/cdn/" + CONFIG.STATIC.n.profileicon + "/img/profileicon/" + summoner.profileIconId + ".png");
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
				team_description += "__: " + CONFIG.STATIC.CHAMPIONS[teams[b][c].championId].name + "\t";
				if (exists(CONFIG.SPELL_EMOJIS[teams[b][c].spell1Id])) team_description += CONFIG.STATIC.SPELL_EMOJIS[teams[b][c].spell1Id];
				else team_description += "`" + CONFIG.STATIC.SUMMONERSPELLS[teams[b][c].spell1Id].name + "`";
				if (exists(CONFIG.SPELL_EMOJIS[teams[b][c].spell2Id])) team_description += CONFIG.STATIC.SPELL_EMOJIS[teams[b][c].spell2Id];
				else team_description += "\t`" + CONFIG.STATIC.SUMMONERSPELLS[teams[b][c].spell2Id].name + "`";
				if (UTILS.exists(match.bannedChampions[player_count])) {
					try {
						ban_description.push(CONFIG.STATIC.CHAMPIONS[match.bannedChampions[player_count].championId].name);
					}
					catch (e) {
						UTILS.output("Champion lookup failed for champion id " + match.bannedChampions[player_count].championId);
					}
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
	mmr(CONFIG, summoner, mmr) {
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
		newEmbed.addField("Official MMR Data", "Tier: " + UTILS.english(mmr.tier) + "\nMMR: `" + mmr.mmr + "`\n" + mmr.analysis);
		if (RANK_ORDER.indexOf(mmr.tier) != -1) newEmbed.setColor(RANK_COLOR[RANK_ORDER.indexOf(mmr.tier)]);
		newEmbed.setFooter("This information is subject to very frequent change.");
		return newEmbed;
	}
}

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
	"700": "SR Clash",
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
const PREMADE_EMOJIS = ["", ":regional_indicator_a:", ":b:", ":regional_indicator_c:"];
module.exports = class EmbedGenerator {
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
		newEmbed.addField("<region> [username]", "Aliases:\n`<op.gg link>`\n\nDisplays summoner information.");
		newEmbed.addField("matchhistory <region> [username]", "Aliases:\n`mh <region> [username]`\n\nDisplays basic information about the 5 most recent games played.");
		newEmbed.addField("matchhistory<number> <region> [username]", "Aliases:\n`mh<number> <region> [username]`\n\nDisplays detailed information about one of your most recently played games.");
		newEmbed.addField("livegame <region> [username]", "Aliases:\n`lg <region> [username]`\n`currentgame <region> [username]`\n`cg <region> [username]`\n`livematch <region> [username]`\n`lm <region> [username]`\n`currentmatch <region> [username]`\n`cm <region> [username]`\n\nShows information about a game currently being played.");
		newEmbed.addField("service status <region>", "Aliases:\n`servicestatus <region>`\n`status <region>`\n`ss <region>\n\nShows information on the uptime of LoL services in a region.");
		newEmbed.setFooter("SupportBot " + CONFIG.VERSION);
		return newEmbed;
	}
	summoner(CONFIG, apiobj) {//lsd command
		let newEmbed = new Discord.RichEmbed();
		if (!UTILS.exists(apiobj.id)) {
			newEmbed.setAuthor(apiobj.guess);
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
	detailedSummoner(CONFIG, summoner, ranks, championmastery, region, match) {//region username command
		let newEmbed = new Discord.RichEmbed();
		if (!UTILS.exists(summoner.id)) {
			newEmbed.setAuthor(summoner.guess);
			newEmbed.setTitle("This summoner does not exist.");
			newEmbed.setDescription("Please revise your request.");
			newEmbed.setColor([255, 0, 0]);
			return newEmbed;
		}
		newEmbed.setAuthor(summoner.name);
		newEmbed.setThumbnail("https://ddragon.leagueoflegends.com/cdn/" + CONFIG.STATIC.n.profileicon + "/img/profileicon/" + summoner.profileIconId + ".png");
		if (UTILS.exists(match.status)) newEmbed.setDescription("Level " + summoner.summonerLevel);
		else if (match.gameStartTime != 0) newEmbed.setDescription("Level " + summoner.summonerLevel + "\n__**Playing:**__ **" + CONFIG.STATIC.CHAMPIONS[match.participants.find(p => { return p.summonerId == summoner.id; }).championId].name + "** on " + queues[match.gameQueueConfigId] + " for `" + UTILS.standardTimestamp((new Date().getTime() - match.gameStartTime) / 1000) + "`");
		else newEmbed.setDescription("Level " + summoner.summonerLevel + "\n__**Game Loading:**__ **" + CONFIG.STATIC.CHAMPIONS[match.participants.find(p => { return p.summonerId == summoner.id; }).championId].name + "** on " + queues[match.gameQueueConfigId]);
		let highest_rank = -1;
		for (let b in ranks) {
			let description = (ranks[b].wins + ranks[b].losses) + "G = " + ranks[b].wins + "W + " + ranks[b].losses + "L\nWin Rate: " + UTILS.round(100 * ranks[b].wins / (ranks[b].wins + ranks[b].losses), 2) + "%";
			if (UTILS.exists(ranks[b].miniSeries)) description += "\nSeries in Progress: " + ranks[b].miniSeries.progress.replaceAll("N", ":grey_question:").replaceAll("W", CONFIG.EMOJIS.win).replaceAll("L", CONFIG.EMOJIS.loss);
			newEmbed.addField(CONFIG.EMOJIS.ranks[RANK_ORDER.indexOf(ranks[b].tier)] + {
				"RANKED_FLEX_SR": "Flex 5v5",
				"RANKED_SOLO_5x5": "Solo 5v5",
				"RANKED_FLEX_TT": "Flex 3v3"
			}[ranks[b].queueType] + ": " + UTILS.english(ranks[b].tier) + " " + ranks[b].rank + " " + ranks[b].leaguePoints + "LP", description, true);
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
		newEmbed.addField("Other 3rd party services", "[op.gg](" + UTILS.opgg(region, summoner.name) + ") [lolnexus](https://lolnexus.com/" + region + "/search?name=" + encodeURIComponent(summoner.name) + "&region=" + region + ") [quickfind](https://quickfind.kassad.in/profile/" + region + "/" + encodeURIComponent(summoner.name) + ") [lolking](https://lolking.net/summoner/" + region + "/" + summoner.id + "/" + encodeURIComponent(summoner.name) + "#/profile) [lolprofile](https://lolprofile.net/summoner/" + region + "/" + encodeURIComponent(summoner.name) + "#update) [matchhistory](https://matchhistory." + region + ".leagueoflegends.com/en/#match-history/" + CONFIG.REGIONS[region.toUpperCase()].toUpperCase() + "/" + summoner.accountId + ") [wol](https://wol.gg/stats/" + region + "/" + encodeURIComponent(summoner.name) + "/)");
		newEmbed.setTimestamp(new Date(summoner.revisionDate));
		newEmbed.setFooter("Last change detected at ");
		return newEmbed;
	}
	match(CONFIG, summoner, match_meta, matches) {//should show 5 most recent games
		let newEmbed = new Discord.RichEmbed();

		newEmbed.setTitle("Recent Games");
		newEmbed.setAuthor(summoner.name, "https://ddragon.leagueoflegends.com/cdn/" + CONFIG.STATIC.n.profileicon + "/img/profileicon/" + summoner.profileIconId + ".png");
		let common_teammates = {};
		/*{
			"name": {
				w: 0,
				l: 0
			}
		}*/
		let all_results = [];
		let all_KDA = {
			K: 0,
			D: 0,
			A: 0
		};
		for (let i = 0; i < match_meta.length && i < 20; ++i) {
			const KDA = UTILS.KDA(summoner.id, matches[i]);
			const stats = UTILS.stats(summoner.id, matches[i]);
			const teamParticipant = UTILS.teamParticipant(summoner.id, matches[i]);
			let teams = {};
			for (let b in matches[i].participants) {
				if (!UTILS.exists(teams[matches[i].participants[b].teamId])) teams[matches[i].participants[b].teamId] = [];
				teams[matches[i].participants[b].teamId].push(matches[i].participants[b]);
			}
			for (let b in teams[teamParticipant.teamId]) {
				const tmPI = UTILS.findParticipantIdentityFromPID(matches[i], teams[teamParticipant.teamId][b].participantId);
				if (tmPI.player.summonerId === summoner.id) continue;
				if (!UTILS.exists(common_teammates[tmPI.player.summonerName])) common_teammates[tmPI.player.summonerName] = { w: 0, l: 0 };
				if (UTILS.determineWin(summoner.id, matches[i])) common_teammates[tmPI.player.summonerName].w += 1;
				else common_teammates[tmPI.player.summonerName].l += 1;
			}
			if (i < 5) {//printing limit
				const tK = teams[teamParticipant.teamId].reduce((total, increment) => { return total + increment.stats.kills; }, 0);
				const tD = teams[teamParticipant.teamId].reduce((total, increment) => { return total + increment.stats.deaths; }, 0);
				const tA = teams[teamParticipant.teamId].reduce((total, increment) => { return total + increment.stats.assists; }, 0);
				let summoner_spells = "";
				if (UTILS.exists(CONFIG.SPELL_EMOJIS[teamParticipant.spell1Id])) summoner_spells += CONFIG.SPELL_EMOJIS[teamParticipant.spell1Id];
				else summoner_spells += "`" + CONFIG.STATIC.SUMMONERSPELLS[teamParticipant.spell1Id].name + "`";
				if (UTILS.exists(CONFIG.SPELL_EMOJIS[teamParticipant.spell2Id])) summoner_spells += CONFIG.SPELL_EMOJIS[teamParticipant.spell2Id];
				else summoner_spells += "\t`" + CONFIG.STATIC.SUMMONERSPELLS[teamParticipant.spell2Id].name + "`";
				newEmbed.addField((UTILS.determineWin(summoner.id, matches[i]) ? "<:win:409617613161758741>" : "<:loss:409618158165688320>") + " " + summoner_spells + "\t" + CONFIG.EMOJIS.lanes[UTILS.inferLane(match_meta[i].role, match_meta[i].lane, teamParticipant.spell1Id, teamParticipant.spell2Id)] + " " + CONFIG.STATIC.CHAMPIONS[match_meta[i].champion].name, "lv. `" + stats.champLevel + "`\t`" + KDA.K + "/" + KDA.D + "/" + KDA.A + "`\tKDR:`" + (UTILS.round(KDA.KD, 2) == "Infinity" ? "Perfect" : UTILS.round(KDA.KD, 2)) + "`\tKDA:`" + (UTILS.round(KDA.KDA, 2) == "Infinity" ? "Perfect" : UTILS.round(KDA.KDA, 2)) + "` `" + UTILS.round((100 * (KDA.A + KDA.K)) / tK, 0) + "%`\tcs:`" + (stats.totalMinionsKilled + stats.neutralMinionsKilled) + "`\tg:`" + UTILS.gold(stats.goldEarned) + "`\n" + queues[matches[i].queueId + ""] + "\t`" + UTILS.standardTimestamp(matches[i].gameDuration) + "`\t" + UTILS.ago(new Date(match_meta[i].timestamp + (matches[i].gameDuration * 1000))));
			}
			all_results.push(UTILS.determineWin(summoner.id, matches[i]));
			all_KDA.K += KDA.K;
			all_KDA.D += KDA.D;
			all_KDA.A += KDA.A;
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
			// KP
		}
		const total_wins = all_results.reduce((total, increment) => { return total + (increment ? 1 : 0); }, 0);
		const total_losses = all_results.reduce((total, increment) => { return total + (increment ? 0 : 1); }, 0);
		all_KDA.KDA = (all_KDA.K + all_KDA.A) / all_KDA.D;
		if (all_results.length > 5) newEmbed.addField("Older Match Results", all_results.slice(5).map(r => { return r ? CONFIG.EMOJIS.win : CONFIG.EMOJIS.loss; }).join("") + "->Oldest");
		newEmbed.setDescription(all_results.length + "G = " + total_wins + "W + " + total_losses + "L\nWin Rate: " + UTILS.round(100 * total_wins / (total_wins + total_losses), 2) + "%\nKDA:`" + (UTILS.round(all_KDA.KDA, 2) == "Infinity" ? "Perfect" : UTILS.round(all_KDA.KDA, 2)) + "`");
		let rpw = [];//recently played with
		for (let b in common_teammates) rpw.push([b, common_teammates[b].w, common_teammates[b].l]);
		rpw.sort((a, b) => { return b[1] + b[2] - a[1] - a[2]; });
		let rpws = [];//recently played with string
		for (let i = 0; i < rpw.length; ++i) if (rpw[i][1] + rpw[i][2] > 1) rpws.push("__[" + rpw[i][0] + "](" + UTILS.opgg(CONFIG.REGIONS_REVERSE[summoner.region], rpw[i][0]) + ")__: " + rpw[i][1] + "W + " + rpw[i][2] + "L");
		if (rpws.length == 0) rpws.push("No one");
		newEmbed.addField("Recently Played With", rpws.join("\n"));
		return newEmbed;
	}
	detailedMatch(CONFIG, summoner, match_meta, match) {//should show detailed information about 1 game
		let newEmbed = new Discord.RichEmbed();
		newEmbed.setAuthor(summoner.name, "https://ddragon.leagueoflegends.com/cdn/" + CONFIG.STATIC.n.profileicon + "/img/profileicon/" + summoner.profileIconId + ".png");
		if (UTILS.exists(match.status)) {
			newEmbed.setAuthor(summoner.guess);
			newEmbed.setTitle("This summoner has no recent matches.");
			newEmbed.setColor([255, 0, 0]);
			return newEmbed;
		}
		newEmbed.setTitle(queues[match.queueId]);
		newEmbed.setDescription("Match Length: `" + UTILS.standardTimestamp(match.gameDuration) + "`");
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
			const tKP = UTILS.round(100 * (tK + tA) / (tK * teams[b].length), 0);
			newEmbed.addField((match.teams.find(t => { return teams[b][0].teamId == t.teamId; }).win == "Win" ? CONFIG.EMOJIS["win"] : CONFIG.EMOJIS["loss"]) + "Team " + team_count, "Σlv.`" + teams[b].reduce((total, increment) => { return total + increment.stats.champLevel; }, 0) + "`\t`" + tK + "/" + tD + "/" + tA + "`\tKDR:`" + (UTILS.round((tK / tD), 2) == "Infinity" ? "Perfect" : UTILS.round((tK / tD), 2)) + "`\tKDA:`" + (UTILS.round(((tK + tA) / tD), 2) == "Infinity" ? "Perfect" : UTILS.round(((tK + tA) / tD), 2)) + "` `" + tKP + "%`\tΣcs:`" + teams[b].reduce((total, increment) => { return total + increment.stats.totalMinionsKilled + increment.stats.neutralMinionsKilled; }, 0) + "`\tΣg:`" + UTILS.gold(teams[b].reduce((total, increment) => { return total + increment.stats.goldEarned; }, 0)) + "`");
			teams[b].sort((a, b) => { return UTILS.inferLane(a.timeline.role, a.timeline.lane, a.spell1Id, a.spell2Id) - UTILS.inferLane(b.timeline.role, b.timeline.lane, b.spell1Id, b.spell2Id); });
			for (let c in teams[b]) {
				let p = teams[b][c];
				let summoner_spells = "";
				if (UTILS.exists(CONFIG.SPELL_EMOJIS[p.spell1Id])) summoner_spells += CONFIG.SPELL_EMOJIS[p.spell1Id];
				else summoner_spells += "`" + CONFIG.STATIC.SUMMONERSPELLS[p.spell1Id].name + "`";
				if (UTILS.exists(CONFIG.SPELL_EMOJIS[p.spell2Id])) summoner_spells += CONFIG.SPELL_EMOJIS[p.spell2Id];
				else summoner_spells += "\t`" + CONFIG.STATIC.SUMMONERSPELLS[p.spell2Id].name + "`";
				const username = match.participantIdentities.find(pI => { return pI.participantId == p.participantId; }).player.summonerName;
				const lane = CONFIG.EMOJIS.lanes[UTILS.inferLane(p.timeline.role, p.timeline.lane, p.spell1Id, p.spell2Id)];
				newEmbed.addField(summoner_spells + " " + lane + "__" + username + "__:  " + CONFIG.STATIC.CHAMPIONS[p.championId].name, "[" + CONFIG.EMOJIS["op.gg"] + "](" + UTILS.opgg(CONFIG.REGIONS_REVERSE[summoner.region], username) + ")" + "lv. `" + p.stats.champLevel + "`\t`" + p.stats.kills + "/" + p.stats.deaths + "/" + p.stats.assists + "`\tKDR:`" + (UTILS.round(p.stats.kills / p.stats.deaths, 2) == "Infinity" ? "Perfect" : UTILS.round(p.stats.kills / p.stats.deaths, 2)) + "`\tKDA:`" + (UTILS.round(((p.stats.kills + p.stats.assists) / p.stats.deaths), 2) == "Infinity" ? "Perfect" : UTILS.round(((p.stats.kills + p.stats.assists) / p.stats.deaths), 2)) + "` `" + UTILS.round((100 * (p.stats.assists + p.stats.kills)) / tK, 0) + "%`\tcs:`" + (p.stats.totalMinionsKilled + p.stats.neutralMinionsKilled) + "`\tg:`" + UTILS.gold(p.stats.goldEarned) + "`");
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
			newEmbed.setAuthor(summoner.guess);
			newEmbed.setTitle("This summoner is currently not in a match.");
			newEmbed.setColor([255, 0, 0]);
			return newEmbed;
		}
		newEmbed.setTitle(queues[match.gameQueueConfigId]);
		if (match.gameStartTime != 0) newEmbed.setDescription("Match Time: `" + UTILS.standardTimestamp((new Date().getTime() - match.gameStartTime) / 1000) + "`");
		else newEmbed.setDescription("Match not started.");
		let teams = {};
		for (let b in match.participants) {
			if (!UTILS.exists(teams[match.participants[b].teamId])) teams[match.participants[b].teamId] = [];
			teams[match.participants[b].teamId].push(match.participants[b]);
		}
		let team_count = 1;
		let player_count = 0;
		for (let b in teams) {
			let team_description = "";
			let ban_description = [];
			for (let c in teams[b]) {
				if (UTILS.exists(CONFIG.SPELL_EMOJIS[teams[b][c].spell1Id])) team_description += CONFIG.SPELL_EMOJIS[teams[b][c].spell1Id];
				else team_description += "`" + CONFIG.STATIC.SUMMONERSPELLS[teams[b][c].spell1Id].name + "`";
				if (UTILS.exists(CONFIG.SPELL_EMOJIS[teams[b][c].spell2Id])) team_description += CONFIG.SPELL_EMOJIS[teams[b][c].spell2Id];
				else team_description += "\t`" + CONFIG.STATIC.SUMMONERSPELLS[teams[b][c].spell2Id].name + "`";
				team_description += "\t__[" + teams[b][c].summonerName + "](" + UTILS.opgg(CONFIG.REGIONS_REVERSE[summoner.region], teams[b][c].summonerName) + ")";
				team_description += "__: " + CONFIG.STATIC.CHAMPIONS[teams[b][c].championId].name;
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
	liveMatchPremade(CONFIG, summoner, match, matches, ranks) {//show current match information
		let newEmbed = new Discord.RichEmbed();
		newEmbed.setAuthor(summoner.name, "https://ddragon.leagueoflegends.com/cdn/" + CONFIG.STATIC.n.profileicon + "/img/profileicon/" + summoner.profileIconId + ".png");
		if (UTILS.exists(match.status)) {
			newEmbed.setAuthor(summoner.guess);
			newEmbed.setTitle("This summoner is currently not in a match.");
			newEmbed.setColor([255, 0, 0]);
			return newEmbed;
		}
		newEmbed.setTitle(queues[match.gameQueueConfigId]);
		if (match.gameStartTime != 0) newEmbed.setDescription("Match Time: `" + UTILS.standardTimestamp((new Date().getTime() - match.gameStartTime) / 1000) + "`");
		else newEmbed.setDescription("Match not started.");
		let common_teammates = {};
		/*{
			"username1": {
				"username2": 4
			}
		}*/
		let teams = {};
		for (let b in match.participants) {
			if (!UTILS.exists(teams[match.participants[b].teamId])) teams[match.participants[b].teamId] = [];
			const flex_5 = ranks[b].find(r => { return r.queueType === "RANKED_FLEX_SR"; });
			const flex_3 = ranks[b].find(r => { return r.queueType === "RANKED_FLEX_TT"; });
			const solo = ranks[b].find(r => { return r.queueType === "RANKED_SOLO_5x5"; });
			const divs = { "I": "1", "II": "2", "III": "3", "IV": "4", "V": "5" };
			if (UTILS.exists(flex_5)) match.participants[b].flex5 = UTILS.shortRank(flex_5);
			else match.participants[b].flex5 = "`______`";
			if (UTILS.exists(flex_3)) match.participants[b].flex3 = UTILS.shortRank(flex_3);
			else match.participants[b].flex3 = "`______`";
			if (UTILS.exists(solo)) match.participants[b].solo = UTILS.shortRank(solo);
			else match.participants[b].solo = "`______`";
			teams[match.participants[b].teamId].push(match.participants[b]);
			common_teammates[match.participants[b].summonerName] = {};
		}
		for (let b in matches) {
			for (let c in matches[b].participantIdentities) {
				const tC = matches[b].participantIdentities[c];
				if (!UTILS.exists(common_teammates[tC.player.summonerName])) common_teammates[tC.player.summonerName] = {};
				for (let d in matches[b].participantIdentities) {
					const tD = matches[b].participantIdentities[d];
					if (tC.player.summonerId != tD.player.summonerId) { //same guy check
						if (!UTILS.exists(common_teammates[tC.player.summonerName][tD.player.summonerName])) common_teammates[tC.player.summonerName][tD.player.summonerName] = 1;
						else common_teammates[tC.player.summonerName][tD.player.summonerName] += 1;
					}
				}
			}
		}
		let team_count = 1;
		let player_count = 0;
		for (let b in teams) {//team
			let team_description = "";
			let ban_description = [];
			let networks = [];
			for (let c in teams[b]) networks.push(UTILS.getGroup(teams[b][c].summonerName, common_teammates));
			let premade_str = networks.map(g => { return g.join(","); });
			let premade_letter = {};
			for (let c in premade_str){ 
				if (!UTILS.exists(premade_letter[premade_str[c]])) {
					premade_letter[premade_str[c]] = 1;
				}
				else premade_letter[premade_str[c]] += 1;
			}
			let premade_number = 1;
			for (let c in premade_letter) {
				if (premade_letter[c] == 1) premade_letter[c] = 0;
				else {
					premade_letter[c] = premade_number;
					premade_number++;
				}
			}
			team_description += ":x::x:\t`SOLO Q` `FLEX 5` `FLEX 3`\n";
			for (let c in teams[b]) {//player on team
				if (UTILS.exists(CONFIG.SPELL_EMOJIS[teams[b][c].spell1Id])) team_description += CONFIG.SPELL_EMOJIS[teams[b][c].spell1Id];
				else team_description += "`" + CONFIG.STATIC.SUMMONERSPELLS[teams[b][c].spell1Id].name + "`";
				if (UTILS.exists(CONFIG.SPELL_EMOJIS[teams[b][c].spell2Id])) team_description += CONFIG.SPELL_EMOJIS[teams[b][c].spell2Id];
				else team_description += "\t`" + CONFIG.STATIC.SUMMONERSPELLS[teams[b][c].spell2Id].name + "`";
				team_description += "\t" + teams[b][c].solo + " " + teams[b][c].flex5 + " " + teams[b][c].flex3;
				team_description += " __" + PREMADE_EMOJIS[premade_letter[premade_str[c]]];
				team_description += "[" + teams[b][c].summonerName + "](" + UTILS.opgg(CONFIG.REGIONS_REVERSE[summoner.region], teams[b][c].summonerName) + ")";
				team_description += "__: " + CONFIG.STATIC.CHAMPIONS[teams[b][c].championId].name;
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
	notify(CONFIG, content, author) {
		let newEmbed = new Discord.RichEmbed();
		newEmbed.setColor([255, 255, 0]);
		newEmbed.setTitle("Important message from SupportBot staff");
		newEmbed.setURL(CONFIG.HELP_SERVER_INVITE_LINK);
		newEmbed.setAuthor(author.username, author.displayAvatarURL);
		newEmbed.setDescription(content);
		newEmbed.setTimestamp();
		newEmbed.setFooter("Message sent ");
		return newEmbed;
	}
	status(status_object) {
		let newEmbed = new Discord.RichEmbed();
		newEmbed.setTitle(status_object.name);//region
		newEmbed.setURL("http://status.leagueoflegends.com/#" + status_object.slug);
		let status_color = [0, 255, 0];//green
		for (let b in status_object.services) {
			if (status_object.services[b].status !== "online") status_color = [255, 255, 0];
			if (status_object.services[b].status === "offline") {
				status_color = [255, 0, 0];
				break;
			}
		}
		newEmbed.setColor(status_color);
		for (let b in status_object.services) {
			let service_description = "";
			if (status_object.services[b].incidents.length > 0) {
				service_description += status_object.services[b].incidents.reduce((str, incident) => {
					if (incident.updates.length > 0) return str + incident.updates.map(update => { return "**" + update.severity + "**: " + update.content }).join("\n") + "\n";
					else return str;
				}, "");
			}
			if (service_description === "") service_description = "*No incidents to report.*";
			newEmbed.addField(status_object.services[b].name + ": " + status_object.services[b].status, service_description);
		}
		newEmbed.setTimestamp();
		newEmbed.setThumbnail("https://cdn.discordapp.com/attachments/423261885262069771/433465885420945409/cby4p-fp0aj-0.png");
		return newEmbed;
	}
}

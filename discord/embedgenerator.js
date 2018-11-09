"use strict";
const Discord = require("discord.js");
const UTILS = new (require("../utils.js"))();
const mathjs = require("mathjs");
const crypto = require("crypto");
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
	"980": "VP Star Guardian Invasion: Normal",
	"990": "VP Star Guardian Invasion: Onslaught",
	"1000": "OC Project: Hunters",
	"1010": "SR Snow ARURF",
	"1020": "SR One for All",
	"1030": "OE Intro",
	"1040": "OE Cadet",
	"1050": "OE Crewmember",
	"1060": "OE Captain",
	"1070": "OE Onslaught",
	"1200": "NB Nexus Blitz"
};
const MMR_JOKES = [
	["We recommend using a mouse and keyboard when playing League of Legends.",//below bronze
	"Brush, the grassy areas around Summoner's Rift, hides you from enemies.",
	"The monsters in the jungle won't hurt you unless you attack them.",
	"Normals are a less competitive environment to practice your skills.",
	"Never play League of Legends under the influence.",
	"Wards save lives.",
	"\"gg\" stands for \"Good golly!\"",
	"Try \"Co-op vs. AI Intermediate\" for a challenge!",
	"There are 3 lanes (top, mid, bot) and 5 roles (top, jungle, mid, support, bot) in a typical Summoner's Rift game.",
	"Use right click to move around!",
	"Press D to dance.",
	"LOOOOOL",
	"Unfortunate.",
	"We recommend using a mouse and keyboard when playing League of Legends.",
	"You can only attack the nexus after you've destroyed the nexus turrets.",
	"Enemies have a red health bar.",
	"Make sure you have /all chat enabled. Enemies give the best advice and encouragement.",
	"We had to make elo work with negative numbers because of you.",
	"Don't worry, we've always ignored all \"Intentionally Feeding\" reports on your account.",
	"There is no I in team, but there is one in Iron.",
	"You should try charity instead.",
	"We see you've improved a lot!"],
	["You want another account now, don't you?",//bronze
	"League of Legends is a team game.",
	"Don't waste a Summoner Spell on Smite. You can't use Smite on champions.",
	"Even bots use their Summoner Spells.",
	"Can't get demoted to Bronze if you never pass Silver promos.",
	"At least you're not Diamond.",
	"You can buy items in the shop.",
	"Having vision is important! Find missing enemies by exploring Fog of War.",
	"Killing the Dragon or Baron grants your team some buffs!",
	"Your teams are holding you back.",
	"Level up your ultimate `R` ability when you reach level 6 in game!",
	"Consider learning new champions in Co-op vs. AI or Normal games.",
	"You can ban Master Yi in draft pick!",
	"If their team gets first blood, it's over. /ff at 15",
	"Your teammates aren't yet using the MIA ping for what its intended purpose is.",
	"The warding totem gives you free wards to place throughout the entire game!"],
	["Zhonya's Hourglass cannot be activated while dead.",//silver
	"You're beautiful the way you are!",
	"You gain the benefits of items right when you buy them. No need to equip!",
	"Use Flash to engage and earn more kills per minute.",
	"Keep your eyes peeled for Evelynn when she's invisible.",
	"Remember to kite enemy champions when playing a ranged carry.",
	"Ranged champions should hold their ground to deal the most damage in the shortest amount of time.",
	"At least you're not bronze.",
	"You are secretly a diamond smurf.",
	"Smite is a key Summoner Spell for jungling allowing you to farm effectively.",
	"The less time you spend dead, the more time you can spend playing League in color."],
	["Be like Daenerys: secure kills and still get three dragons.",//gold
	"sudo apt-get gud",
	"Smite is a key Summoner Spell for jungling, allowing you to farm effectively.",
	"The enemy Nexus is worth 50g.",
	"Have you tried...not dying?",
	"What is dead may never die, like your MMR.",
	"Vision is important, but don't ward alone if your enemies are visible on the map.",
	"At least you're not silver.",
	"Hey, at least you know how to use /all chat."],
	["They say Platinum is a precious metal. Clearly they haven't seen you play.",//platinum
	"At least you're not Gold.",
	"Your lack of skins is holding you back.",
	"We're sorry you've been subjected to the real ELO hell.",
	"You're almost there! Just a few more promos and you'll stop hating your own Lee Sins!",
	"Always run back to base when you're losing a team fight.",
	"Consider watching a \"How not to play LoL\" stream.",
	"Almost time for a montage video!"],
	["People rage at you when you don't carry in normals, huh?",//diamond
	"Let the salt flow through you.",
	"\"You shall not pass!\" - Voldemort, Star Wars",
	"Forged in the fires of Mount Targon, only promos can break you.",
	"If you keep playing like this, you'll be Bronze one day. Keep it up!",
	"Ah, so you're the guy smurfing in normals.",
	"I heard diamonds were hard...what happened to you?",
	"At least you're not plat.",
	"Don't get that excited. Diamond 5 is garbage.",
	"You're closer to bronze than you are to Diamond 3.",
	"Does it even matter if no one thinks you deserve it?",
	"You worked really hard for it- that is, to get enough money to pay for this boost."],
	["Baited and outsmarted.",//master
	"Boost Anomaly detected!",
	"Ask your friends if they'd rather you be a Pokémon Master.",
	"You've ascended Mount Targon six times. It's got nothing on Mount Everest, though. Keep climbing!",
	"You must feel good about destroying egos...unless, of course, you got boosted.",
	"You should consider coaching--and boosting other Challenger hopefuls, too.",
	"You're so metal, even Mordekaiser would crumple under your might.",
	"At least you're not diamond."],
	["Never seen someone get boosted all the way to Challenger before. Must've been expensive.",//challenger
	"Hey qt!",
	"Losing is not an option.",
	"Challenjour!",
	"When's your AMA?",
	"Tell us when you join a pro team. We'll send you a Poro plushie to celebrate.",
	"Party like a former pro League rock star!"]
];
const RANK_ORDER = ["BRONZE", "SILVER", "GOLD", "PLATINUM", "DIAMOND", "MASTER", "CHALLENGER"];
const RANK_COLOR = [[153, 51, 0], [179, 179, 179], [255, 214, 51], [0, 255, 152], [179, 240, 255], [255, 153, 255], [255, 0, 0]];
const IMMR_THRESHOLD = [100, 600, 1100, 1600, 2100, 2600, 2700];
const MMR_THRESHOLD = [400, 1150, 1400, 1650, 1900, 2150, 2400];//starting MMRs for each tier
const PREMADE_EMOJIS = ["", "\\💙", "\\💛", "\\💚"];
const HORIZONTAL_SEPARATOR = "------------------------------";
const VERIFIED_ICON = "✅";
const TAB = " ";
function getMatchTags(summonerID, match) {
	let answer = [];
	if (!UTILS.exists(summonerID)) return answer;//bot
	if (match.gameDuration < 300) return answer;
	const stats = UTILS.stats(summonerID, match);
	if (stats.largestMultiKill === 3) answer.push("TRIPLE");
	else if (stats.largestMultiKill === 4) answer.push("QUADRA");
	else if (stats.largestMultiKill >= 5) answer.push("PENTA");
	const pID = UTILS.teamParticipant(summonerID, match).participantId;
	const m_level = UTILS.findParticipantIdentityFromPID(match, pID);
	if (m_level === 0) answer.push("First_Time");
	else if (m_level === 1) answer.push("\"First_Time\"");
	let sortable_all = UTILS.copy(match);//match with both teams
	const teamID = UTILS.teamParticipant(summonerID, match).teamId;
	for (let b in sortable_all.participants) {
		const KDA = UTILS.KDAFromStats(sortable_all.participants[b].stats);
		sortable_all.participants[b].stats.KDA = KDA.KDA;
		sortable_all.participants[b].stats.KDANoPerfect = KDA.KDANoPerfect;
		sortable_all.participants[b].stats.KDNoPerfect = KDA.KDNoPerfect;
		sortable_all.participants[b].stats.inverseKDA = KDA.inverseKDA;
		sortable_all.participants[b].stats.totalCS = sortable_all.participants[b].stats.totalMinionsKilled + sortable_all.participants[b].stats.neutralMinionsKilled;
		sortable_all.participants[b].stats.damageTaken = sortable_all.participants[b].stats.totalDamageTaken + sortable_all.participants[b].stats.damageSelfMitigated;
		sortable_all.participants[b].stats.KP = KDA.K + KDA.A;
		sortable_all.participants[b].stats.inverseDeaths = -KDA.D;
	}
	let sortable_team = UTILS.copy(sortable_all);//match with ally team only
	UTILS.removeAllOccurances(sortable_team.participants, p => p.teamId !== teamID);
	const criteria = [{ statName: "totalCS", designation: "Most_CS", direct: true },
	{ statName: "totalDamageDealtToChampions" , designation: "Most_Champion_Damage", direct: true },
	{ statName: "totalDamageDealt", designation: "Most_Damage", direct: true },
	{ statName: "visionScore", designation: "Most_Vision", direct: true },
	{ statName: "assists", designation: "Selfless", direct: true },
	{ statName: "inverseKDA", designation: "Heavy", direct: true },
	{ statName: "damageDealtToObjectives", designation: "Objective_Focused", direct: true },
	{ statName: "damageTaken", designation: "Most_Damage_Taken", direct: true },
	{ statName: "KP", designation: "Highest_KP", direct: true },
	{ statName: "timeCCingOthers", designation: "Most_CC", direct: true },
	{ statName: "largestKillingSpree", designation: "Scary", direct: true },
	{ statName: "inverseDeaths", designation: "Slippery", direct: true },
	{ statName: "goldEarned", designation: "Most_Gold", direct: true },
	{ statName: "KDANoPerfect", designation: "KDA", direct: false },
	{ statName: "KDNoPerfect", designation: "KD", direct: false }];//simple, single stat criteria only
	let non_direct = [];
	for (let c in criteria) {
		UTILS.assert(UTILS.exists(sortable_all.participants[0].stats[criteria[c].statName]));
		sortable_all.participants.sort((a, b) => b.stats[criteria[c].statName] - a.stats[criteria[c].statName]);
		sortable_team.participants.sort((a, b) => b.stats[criteria[c].statName] - a.stats[criteria[c].statName]);
		//UTILS.debug(criteria[c].statName + ": " + sortable_all.participants.map(p => p.participantId + ":" + p.stats[criteria[c].statName]).join(", "));
		//UTILS.debug("team " + criteria[c].statName + ": " + sortable_team.participants.map(p => p.participantId + ":" + p.stats[criteria[c].statName]).join(", "));
		if (criteria[c].direct) {
			if (sortable_all.participants[0].participantId === pID) answer.push(criteria[c].designation);
			else if (sortable_team.participants[0].participantId === pID) answer.push("*" + criteria[c].designation);
		}
		else {
			if (sortable_team.participants[0].participantId === pID) non_direct.push(criteria[c].designation);
		}
	}
	if ((non_direct.indexOf("KDA") !== -1 && non_direct.indexOf("KD") !== -1) || (answer.indexOf("*Most_Champion_Damage") !== -1 || answer.indexOf("Most_Champion_Damage") !== -1)) answer.push("Carry");
	const win = UTILS.determineWin(summonerID, match);
	const ally_K = sortable_team.participants.reduce((total, increment) => total + increment.stats.kills, 0);
	const enemy_K = sortable_all.participants.reduce((total, increment) => total + increment.stats.kills, 0) - ally_K;
	if (win && (ally_K + enemy_K >= 5) && (ally_K >= (enemy_K * 3)) && match.gameDuration < (30 * 60)) answer.push("Easy");
	if ((ally_K + enemy_K) >= (match.gameDuration / 30)) answer.push("Bloody");
	if (match.teams[0].inhibitorKills > 0 && match.teams[1].inhibitorKills > 0) answer.push("Close");
	return answer;
}
module.exports = class EmbedGenerator {
	constructor() { }
	test() {
		let newEmbed = new Discord.RichEmbed();
		newEmbed.setAuthor("Author \\🇺🇸");
		newEmbed.setTitle("Test 🇺🇸");
		newEmbed.setDescription("description 🇺🇸");
		newEmbed.addField("field title 🇺🇸", "field desc 🇺🇸");
		newEmbed.setFooter("Footer 🇺🇸");
		return newEmbed;
	}
	help(CONFIG) {
		let newEmbed = new Discord.RichEmbed();
		newEmbed.setTitle("Discord Commands");
		newEmbed.setDescription("Terms of Service:\n- Don't be a bot on a user account and use SupportBot.\n- Don't abuse bugs. If you find a bug, please report it to us.\n- Don't spam useless feedback\n- If you do not want to use SupportBot, let us know and we'll opt you out of our services.\n- We reserve the right to ban users and servers from using SupportBot at our discretion.\nFor additional help, please visit <" + CONFIG.HELP_SERVER_INVITE_LINK + ">\n\n<required parameter> [optional parameter]");
		newEmbed.addField("`" + CONFIG.DISCORD_COMMAND_PREFIX + "help`", "Displays this information card.\n" + HORIZONTAL_SEPARATOR);
		newEmbed.addField("`" + CONFIG.DISCORD_COMMAND_PREFIX + "invite`", "Provides information on how to add SupportBot to a different server.\n" + HORIZONTAL_SEPARATOR);
		newEmbed.addField("`" + CONFIG.DISCORD_COMMAND_PREFIX + "link <region> <username>`", "If your LoL ign is different from your discord username, you can set your LoL ign using this command, and SupportBot will remember it.\n" + HORIZONTAL_SEPARATOR);
		newEmbed.addField("`" + CONFIG.DISCORD_COMMAND_PREFIX + "unlink`", "Aliases:\n`" + CONFIG.DISCORD_COMMAND_PREFIX + "removelink`\n\nSupportBot forgets your preferred username and region.\n" + HORIZONTAL_SEPARATOR);
		newEmbed.addField("`<region> [username]`", "Aliases:\n`<op.gg link>`\n\nDisplays summoner information.\n" + HORIZONTAL_SEPARATOR);
		newEmbed.addField("`matchhistory <region> [username]`", "Aliases:\n`mh <region> [username]`\n\nDisplays basic information about the 5 most recent games played.\n" + HORIZONTAL_SEPARATOR);
		newEmbed.addField("`matchhistory<number> <region> [username]`", "Aliases:\n`mh<number> <region> [username]`\n\nDisplays detailed information about one of your most recently played games.\n" + HORIZONTAL_SEPARATOR);
		newEmbed.addField("`livegame <region> [username]`", "Aliases:\n`lg <region> [username]`\n`currentgame <region> [username]`\n`cg <region> [username]`\n`livematch <region> [username]`\n`lm <region> [username]`\n`currentmatch <region> [username]`\n`cm <region> [username]`\n\nShows information about a game currently being played.\n" + HORIZONTAL_SEPARATOR);
		newEmbed.addField("`service status <region>`", "Aliases:\n`servicestatus <region>`\n`status <region>`\n`ss <region>`\n\nShows information on the uptime of LoL services in a region.\n" + HORIZONTAL_SEPARATOR);
		newEmbed.addField("`multi <region> <comma separated list of usernames/lobby text>`", "Aliases:\n`m <region> <list of usernames or lobby text>`\n\nCompares multiple summoners in a region against each other.\n" + HORIZONTAL_SEPARATOR);
		newEmbed.addField("`fairteamgenerator <region> <comma separated list of usernames/lobby text>`", "Aliases:\n`ftg <region> <list of usernames or lobby text>`\n\nGenerates fair teams from a list of summoners.\n" + HORIZONTAL_SEPARATOR);
		newEmbed.addField("`" + CONFIG.DISCORD_COMMAND_PREFIX + "shortcuts`", "Displays a list of nicknames you've set for friends with hard to spell names. Visit https://supportbot.tk/ for more information on this family of commands.\n" + HORIZONTAL_SEPARATOR);
		newEmbed.addField("`" + CONFIG.DISCORD_COMMAND_PREFIX + "setting <setting name> <value>`", "Set server preferences for: prefix, auto-opgg, force-prefix, release-notifications. See our website for more details.");
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
		newEmbed.setDescription("Level " + apiobj.summonerLevel + "\npuuid: `" + apiobj.puuid + "`\nSummoner ID: `" + apiobj.id + "`\nAccount ID: `" + apiobj.accountId + "`");
		newEmbed.setTimestamp(new Date(apiobj.revisionDate));
		newEmbed.setFooter("Last change detected at ");
		return newEmbed;
	}
	detailedSummoner(CONFIG, summoner, ranks, championmastery, region, match, challengers, verified) {//region username command
		let newEmbed = new Discord.RichEmbed();
		if (!UTILS.exists(summoner.id)) {
			newEmbed.setAuthor(summoner.guess);
			newEmbed.setTitle("This summoner does not exist.");
			newEmbed.setDescription("Please revise your request.");
			newEmbed.setColor([255, 0, 0]);
			return newEmbed;
		}
		newEmbed.setAuthor(summoner.name + (verified ? VERIFIED_ICON : ""), undefined, UTILS.opgg(region, summoner.name));
		newEmbed.setThumbnail("https://ddragon.leagueoflegends.com/cdn/" + CONFIG.STATIC.n.profileicon + "/img/profileicon/" + summoner.profileIconId + ".png");
		if (UTILS.exists(match.status)) newEmbed.setDescription("Level " + summoner.summonerLevel);
		else {
			const game_type = match.gameType == "CUSTOM_GAME" ? "Custom" : queues[match.gameQueueConfigId];
			if (match.gameStartTime != 0) newEmbed.setDescription("Level " + summoner.summonerLevel + "\n__**Playing:**__ **" + CONFIG.STATIC.CHAMPIONS[match.participants.find(p => p.summonerName === summoner.name).championId].emoji + "** on " + game_type + " for `" + UTILS.standardTimestamp((new Date().getTime() - match.gameStartTime) / 1000) + "`");
			else newEmbed.setDescription("Level " + summoner.summonerLevel + "\n__**Game Loading:**__ **" + CONFIG.STATIC.CHAMPIONS[match.participants.find(p => p.summonerName === summoner.name).championId].emoji + "** on " + game_type);
		}
		const will = (region === "NA" && summoner.id == 50714503) ? true : false;
		let highest_rank = -1;
		for (let i = 0; i < ranks.length; ++i) {
			let description = (ranks[i].wins + ranks[i].losses) + "G (" + UTILS.round(100 * ranks[i].wins / (ranks[i].wins + ranks[i].losses), 2) + "%) = " + ranks[i].wins + "W + " + ranks[i].losses + "L";
			if (UTILS.exists(ranks[i].miniSeries)) description += "\nSeries in Progress: " + ranks[i].miniSeries.progress.replaceAll("N", "\\➖").replaceAll("W", CONFIG.EMOJIS.win).replaceAll("L", CONFIG.EMOJIS.loss);
			let title = CONFIG.EMOJIS.ranks[RANK_ORDER.indexOf(ranks[i].tier)] + {
				"RANKED_FLEX_SR": "Flex 5v5",
				"RANKED_SOLO_5x5": "Solo 5v5",
				"RANKED_FLEX_TT": "Flex 3v3"
			}[ranks[i].queueType] + ": ";
			title += UTILS.english(ranks[i].tier) + " ";
			if (ranks[i].tier != "CHALLENGER") title += ranks[i].rank + " ";
			else {
				challengers[i].entries.sort((a, b) => b.leaguePoints - a.leaguePoints);//sort by LP
				const candidate = challengers[i].entries.findIndex(cr => summoner.id == cr.playerOrTeamId);//find placing
				if (candidate != -1) title += "#" + (candidate + 1) + " ";//add placing if index found
			}
			title += ranks[i].leaguePoints + "LP";
			newEmbed.addField((will ? "~~" : "") + title + (will ? "~~" : ""), (will ? "~~" : "") + description + (will ? "~~" : ""), true);
			if (RANK_ORDER.indexOf(ranks[i].tier) > highest_rank) highest_rank = RANK_ORDER.indexOf(ranks[i].tier);
		}
		if (highest_rank > -1) newEmbed.setColor(RANK_COLOR[highest_rank]);
		if (will) {
			const challenger_rank = UTILS.randomInt(5, 200);
			const fake_games = UTILS.randomInt(200, 700);
			const fake_wins = UTILS.randomInt(fake_games / 2, fake_games);
			const fake_losses = fake_games - fake_wins;
			const fake_wr = UTILS.round(100 * fake_wins / (fake_wins + fake_losses), 2);
			const challenger_LP = UTILS.round(UTILS.map(fake_wr, 50, 100, 500, 1000));
			newEmbed.addField("<:Challenger:437262128282599424> Challenger ~#" + challenger_rank + " " + challenger_LP + "LP", fake_games + "G (" + fake_wr + "%) = " + fake_wins + "W + " + fake_losses + "L", true);
			newEmbed.setColor(RANK_COLOR[RANK_COLOR.length - 1]);
		}
		let cm_description = [];
		let cm_total = 0;
		for (let i = 0; i < championmastery.length; ++i) {
			if (i < 3) cm_description.push("`M" + championmastery[i].championLevel + "` " + CONFIG.STATIC.CHAMPIONS[championmastery[i].championId].emoji + " `" + UTILS.numberWithCommas(championmastery[i].championPoints) + "`pts");
			cm_total += championmastery[i].championLevel;
		}
		if (cm_description.length > 0) newEmbed.addField("Champion Mastery: " + cm_total, cm_description.join("\t") + "\n[op.gg](" + UTILS.opgg(region, summoner.name) + ") [lolnexus](https://lolnexus.com/" + region + "/search?name=" + encodeURIComponent(summoner.name) + "&region=" + region + ") [quickfind](https://quickfind.kassad.in/profile/" + region + "/" + encodeURIComponent(summoner.name) + ") [lolprofile](https://lolprofile.net/summoner/" + region + "/" + encodeURIComponent(summoner.name) + "#update) [matchhistory](https://matchhistory." + region + ".leagueoflegends.com/en/#match-history/" + CONFIG.REGIONS[region.toUpperCase()].toUpperCase() + "/" + summoner.accountId + ") [wol](https://wol.gg/stats/" + region + "/" + encodeURIComponent(summoner.name) + "/) [mmr?](https://" + region + ".whatismymmr.com/" + encodeURIComponent(summoner.name) + ")");
		newEmbed.setTimestamp(new Date(summoner.revisionDate));
		newEmbed.setFooter("Last change detected at ");
		return newEmbed;
	}
	match(CONFIG, summoner, match_meta, matches, verified) {//should show 5 most recent games
		let newEmbed = new Discord.RichEmbed();
		newEmbed.setAuthor(summoner.name + (verified ? VERIFIED_ICON : ""), "https://ddragon.leagueoflegends.com/cdn/" + CONFIG.STATIC.n.profileicon + "/img/profileicon/" + summoner.profileIconId + ".png", UTILS.opgg(CONFIG.REGIONS_REVERSE[summoner.region], summoner.name));
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
		let all_lanes = [0, 0, 0, 0, 0, 0];
		let all_lanes_w = [0, 0, 0, 0, 0, 0];
		let all_lanes_l = [0, 0, 0, 0, 0, 0];
		let all_lanes_KDA = [UTILS.copy(all_KDA), UTILS.copy(all_KDA), UTILS.copy(all_KDA), UTILS.copy(all_KDA), UTILS.copy(all_KDA), UTILS.copy(all_KDA)];
		let all_champions = {};
		let new_champion = {
			w: 0,
			l: 0,
			K: 0,
			D: 0,
			A: 0
		};
		let individual_match_description = [];
		let lane_record = [];//ordered, sequential
		let champion_record = [];//ordered, sequential
		for (let i = 0; i < match_meta.length && i < 20; ++i) {
			const KDA = UTILS.KDA(summoner.id, matches[i]);
			const stats = UTILS.stats(summoner.id, matches[i]);
			const teamParticipant = UTILS.teamParticipant(summoner.id, matches[i]);
			let teams = {};
			let lane = UTILS.inferLane(match_meta[i].role, match_meta[i].lane, teamParticipant.spell1Id, teamParticipant.spell2Id);
			lane_record.push(lane);
			champion_record.push(match_meta[i].champion);
			const win = UTILS.determineWin(summoner.id, matches[i]);
			++all_lanes[lane];
			win ? ++all_lanes_w[lane] : ++all_lanes_l[lane];
			all_results.push(win);
			if (!UTILS.exists(all_champions[match_meta[i].champion])) all_champions[match_meta[i].champion] = UTILS.copy(new_champion);
			win ? ++all_champions[match_meta[i].champion].w : ++all_champions[match_meta[i].champion].l;
			all_champions[match_meta[i].champion].K += KDA.K;
			all_champions[match_meta[i].champion].D += KDA.D;
			all_champions[match_meta[i].champion].A += KDA.A;
			for (let b in all_KDA) all_KDA[b] += KDA[b];
			for (let b in all_lanes_KDA[lane]) all_lanes_KDA[lane][b] += KDA[b];
			for (let b in matches[i].participants) {
				if (!UTILS.exists(teams[matches[i].participants[b].teamId])) teams[matches[i].participants[b].teamId] = [];
				teams[matches[i].participants[b].teamId].push(matches[i].participants[b]);
			}
			for (let b in teams[teamParticipant.teamId]) {
				const tmPI = UTILS.findParticipantIdentityFromPID(matches[i], teams[teamParticipant.teamId][b].participantId);
				if (tmPI.player.summonerId === summoner.id) continue;
				if (!UTILS.exists(common_teammates[tmPI.player.summonerName])) common_teammates[tmPI.player.summonerName] = { w: 0, l: 0 };
				if (win) common_teammates[tmPI.player.summonerName].w += 1;
				else common_teammates[tmPI.player.summonerName].l += 1;
			}
			if (i < 5) {//printing limit
				const tK = teams[teamParticipant.teamId].reduce((total, increment) => total + increment.stats.kills, 0);
				const tD = teams[teamParticipant.teamId].reduce((total, increment) => total + increment.stats.deaths, 0);
				const tA = teams[teamParticipant.teamId].reduce((total, increment) => total + increment.stats.assists, 0);
				let summoner_spells = "";
				if (UTILS.exists(CONFIG.SPELL_EMOJIS[teamParticipant.spell1Id])) summoner_spells += CONFIG.SPELL_EMOJIS[teamParticipant.spell1Id];
				else summoner_spells += "`" + CONFIG.STATIC.SUMMONERSPELLS[teamParticipant.spell1Id].name + "`";
				if (UTILS.exists(CONFIG.SPELL_EMOJIS[teamParticipant.spell2Id])) summoner_spells += CONFIG.SPELL_EMOJIS[teamParticipant.spell2Id];
				else summoner_spells += "\t`" + CONFIG.STATIC.SUMMONERSPELLS[teamParticipant.spell2Id].name + "`";
				individual_match_description.push([(win ? "<:win:409617613161758741>" : "<:loss:409618158165688320>") + " " + CONFIG.STATIC.CHAMPIONS[match_meta[i].champion].emoji + CONFIG.EMOJIS.lanes[lane] + " " + summoner_spells + " `" + UTILS.standardTimestamp(matches[i].gameDuration) + "` " + queues[matches[i].queueId + ""] + " " + UTILS.ago(new Date(match_meta[i].timestamp + (matches[i].gameDuration * 1000))), "__lv.__ `" + stats.champLevel + "`\t`" + KDA.K + "/" + KDA.D + "/" + KDA.A + "`\t__KDR:__`" + UTILS.KDAFormat(KDA.KD) + "`\t__KDA:__`" + UTILS.KDAFormat(KDA.KDA) + "` `" + UTILS.KPFormat((100 * (KDA.A + KDA.K)) / tK) + "%`\t__cs:__`" + (stats.totalMinionsKilled + stats.neutralMinionsKilled) + "`\t__g:__`" + UTILS.gold(stats.goldEarned) + "`\n" + getMatchTags(summoner.id, matches[i]).map(s => "`" + s + "`").join(TAB + " ")]);
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
			// KP
		}
		let all_champions_a = [];
		for (let b in all_champions) {
			all_champions[b].id = b;
			all_champions_a.push(all_champions[b]);
		}
		all_champions_a.sort((a, b) => b.w + b.l - a.w - a.l);
		all_KDA.KDA = (all_KDA.K + all_KDA.A) / all_KDA.D;
		for (let b in all_lanes_KDA) all_lanes_KDA[b].KDA = (all_lanes_KDA[b].K + all_lanes_KDA[b].A) / all_lanes_KDA[b].D;
		let lane_description = [];
		for (let i = 0; i <= 5; ++i) if (all_lanes[i] > 0) lane_description.push([CONFIG.EMOJIS.lanes[i] + all_lanes[i] + "G (" + UTILS.round(100 * all_lanes_w[i] / (all_lanes_w[i] + all_lanes_l[i]), 0) + "%) = " + all_lanes_w[i] + "W + " + all_lanes_l[i] + "L\tKDA:`" + UTILS.KDAFormat(all_lanes_KDA[i].KDA) + "`", all_lanes[i]]);
		lane_description.sort((a, b) => b[1] - a[1]);
		lane_description = lane_description.map(s => s[0]);
		const total_wins = all_results.reduce((total, increment) => total + (increment ? 1 : 0), 0);
		const total_losses = all_results.reduce((total, increment) => total + (increment ? 0 : 1), 0);
		newEmbed.addField("Recent Games", all_results.length + "G (" + UTILS.round(100 * total_wins / (total_wins + total_losses), 0) + "%) = " + total_wins + "W + " + total_losses + "L " + "\tKDA:`" + UTILS.KDAFormat(all_KDA.KDA) + "`\n" + lane_description.join("\n"), true);
		newEmbed.addField("Recent Champions", all_champions_a.map(c => CONFIG.STATIC.CHAMPIONS[c.id].emoji + (c.w + c.l) + "G (" + UTILS.round(100 * c.w / (c.w + c.l), 0) + "%) = " + c.w + "W + " + c.l + "L\tKDA:`" + UTILS.KDAFormat((c.K + c.A) / c.D) + "`").slice(0, 7).join("\n"), true);
		for (let i = 0; i < individual_match_description.length; ++i) newEmbed.addField(individual_match_description[i][0], individual_match_description[i][1]);
		if (all_results.length > 5) newEmbed.addField("Old Match Results", all_results.slice(5, 13).map(r => r ? CONFIG.EMOJIS.win : CONFIG.EMOJIS.loss).join("") + "\n" + lane_record.slice(5, 13).map(l => CONFIG.EMOJIS.lanes[l]).join("") + "\n" + champion_record.slice(5, 13).map(c => CONFIG.STATIC.CHAMPIONS[c].emoji).join(""), true);
		if (all_results.length > 12) newEmbed.addField("Older Match Results", all_results.slice(13).map(r => r ? CONFIG.EMOJIS.win : CONFIG.EMOJIS.loss).join("") + "\n" + lane_record.slice(13).map(l => CONFIG.EMOJIS.lanes[l]).join("") + "\n" + champion_record.slice(13).map(c => CONFIG.STATIC.CHAMPIONS[c].emoji).join(""), true);
		let rpw = [];//recently played with
		for (let b in common_teammates) rpw.push([b, common_teammates[b].w, common_teammates[b].l]);
		rpw.sort((a, b) => b[1] + b[2] - a[1] - a[2]);
		let rpws = [];//recently played with string
		for (let i = 0; i < rpw.length; ++i) if (rpw[i][1] + rpw[i][2] > 1) rpws.push((rpw[i][1] + rpw[i][2]) + "G (" + UTILS.round(100 * rpw[i][1] / (rpw[i][1] + rpw[i][2]), 0) + "%) = " + rpw[i][1] + "W + " + rpw[i][2] + "L: __[" + rpw[i][0] + "](" + UTILS.opgg(CONFIG.REGIONS_REVERSE[summoner.region], rpw[i][0]) + ")__");
		if (rpws.length == 0) rpws.push("No one");
		newEmbed.addField("Top 10 Recently Played With", rpws.slice(0, 10).join("\n"));
		return newEmbed;
	}
	detailedMatch(CONFIG, summoner, match_meta, match, ranks, masteries, summoner_participants, verified) {//should show detailed information about 1 game
		let newEmbed = new Discord.RichEmbed();
		newEmbed.setAuthor(summoner.name + (verified ? VERIFIED_ICON : ""), "https://ddragon.leagueoflegends.com/cdn/" + CONFIG.STATIC.n.profileicon + "/img/profileicon/" + summoner.profileIconId + ".png", UTILS.opgg(CONFIG.REGIONS_REVERSE[summoner.region], summoner.name));
		if (UTILS.exists(match.status)) {
			newEmbed.setAuthor(summoner.guess);
			newEmbed.setTitle("This summoner has no recent matches.");
			newEmbed.setColor([255, 0, 0]);
			return newEmbed;
		}
		const avg_iMMR = UTILS.averageMatchMMR(ranks);
		for (let i = 0; i < IMMR_THRESHOLD.length; ++i) if (avg_iMMR >= IMMR_THRESHOLD[i]) newEmbed.setColor(RANK_COLOR[i]);
		UTILS.output("average iMMR is " + UTILS.round(avg_iMMR) + " or " + UTILS.iMMRtoEnglish(avg_iMMR));
		newEmbed.setTitle(queues[match.queueId] + " `" + UTILS.standardTimestamp(match.gameDuration) + "`");
		newEmbed.setTimestamp(new Date(match_meta.timestamp + (match.gameDuration * 1000)));
		newEmbed.setFooter("Match played " + UTILS.ago(new Date(match_meta.timestamp + (match.gameDuration * 1000))) + " at: ");
		let teams = {};
		for (let b in match.participantIdentities) {
			const pI = match.participantIdentities[b];
			const flex_5 = ranks[b].find(r => r.queueType === "RANKED_FLEX_SR");
			const flex_3 = ranks[b].find(r => r.queueType === "RANKED_FLEX_TT");
			const solo = ranks[b].find(r => r.queueType === "RANKED_SOLO_5x5");
			pI.flex5 = "`" + UTILS.shortRank(flex_5) + "`";
			pI.flex3 = "`" + UTILS.shortRank(flex_3) + "`";
			pI.solo = "`" + UTILS.shortRank(solo) + "`";
			pI.mastery = UTILS.getSingleChampionMastery(masteries[b], match.participants.find(p => p.participantId == pI.participantId).championId);
		}
		for (let b in match.participants) {
			if (!UTILS.exists(teams[match.participants[b].teamId])) teams[match.participants[b].teamId] = [];
			teams[match.participants[b].teamId].push(match.participants[b]);
		}
		let team_count = 0;
		for (let b in teams) {
			++team_count;
			const tK = teams[b].reduce((total, increment) => total + increment.stats.kills, 0);
			const tD = teams[b].reduce((total, increment) => total + increment.stats.deaths, 0);
			const tA = teams[b].reduce((total, increment) => total + increment.stats.assists, 0);
			const tKP = UTILS.round(100 * (tK + tA) / (tK * teams[b].length), 0);
			newEmbed.addField((match.teams.find(t => teams[b][0].teamId == t.teamId).win == "Win" ? CONFIG.EMOJIS["win"] : CONFIG.EMOJIS["loss"]) + "Team " + team_count + " Bans: " + match.teams.find(t => t.teamId == b).bans.map(b => b.championId == -1 ? ":x:" : CONFIG.STATIC.CHAMPIONS[b.championId].emoji).join(""), "__Σlv.__ `" + teams[b].reduce((total, increment) => total + increment.stats.champLevel, 0) + "`\t`" + tK + "/" + tD + "/" + tA + "`\t__KDR:__`" + UTILS.KDAFormat(tK / tD) + "`\t__KDA:__`" + UTILS.KDAFormat((tK + tA) / tD) + "` `" + tKP + "%`\t__Σcs:__`" + teams[b].reduce((total, increment) => total + increment.stats.totalMinionsKilled + increment.stats.neutralMinionsKilled, 0) + "`\t__Σg:__`" + UTILS.gold(teams[b].reduce((total, increment) => total + increment.stats.goldEarned, 0)) + "`");
			teams[b].sort((a, b) => UTILS.inferLane(a.timeline.role, a.timeline.lane, a.spell1Id, a.spell2Id) - UTILS.inferLane(b.timeline.role, b.timeline.lane, b.spell1Id, b.spell2Id));
			for (let c in teams[b]) {
				let p = teams[b][c];
				let pI = match.participantIdentities.find(pI => pI.participantId == p.participantId);
				let summoner_spells = "";
				if (UTILS.exists(pI.player.summonerId)) {//not a bot
					if (UTILS.exists(CONFIG.SPELL_EMOJIS[p.spell1Id])) summoner_spells += CONFIG.SPELL_EMOJIS[p.spell1Id];
					else summoner_spells += "`" + CONFIG.STATIC.SUMMONERSPELLS[p.spell1Id].name + "`";
					if (UTILS.exists(CONFIG.SPELL_EMOJIS[p.spell2Id])) summoner_spells += CONFIG.SPELL_EMOJIS[p.spell2Id];
					else summoner_spells += "\t`" + CONFIG.STATIC.SUMMONERSPELLS[p.spell2Id].name + "`";
				}
				else summoner_spells = ":x::x:";//bot
				const username = pI.player.summonerName;
				const lane = CONFIG.EMOJIS.lanes[UTILS.inferLane(p.timeline.role, p.timeline.lane, p.spell1Id, p.spell2Id)];
				newEmbed.addField(CONFIG.STATIC.CHAMPIONS[p.championId].emoji + lane + summoner_spells + " " + pI.solo + " ¦ " + pI.flex5 + " ¦ " + pI.flex3 + " ¦ `M" + pI.mastery + "` lv. `" + (UTILS.exists(pI.player.summonerId) ? summoner_participants.find(p => p.id == pI.player.summonerId).summonerLevel : 0) + "` __" + (pI.player.summonerId == summoner.id ? "**" + username + "**" : username) + "__" + (pI.player.summonerId == summoner.id && verified ? "\\" + VERIFIED_ICON : ""), "[opgg](" + UTILS.opgg(CONFIG.REGIONS_REVERSE[summoner.region], username) + ") " + "__lv.__ `" + p.stats.champLevel + "`\t`" + p.stats.kills + "/" + p.stats.deaths + "/" + p.stats.assists + "`\t__KDR:__`" + UTILS.KDAFormat(p.stats.kills / p.stats.deaths) + "`\t__KDA:__`" + UTILS.KDAFormat((p.stats.kills + p.stats.assists) / p.stats.deaths) + "` `" + UTILS.KPFormat((100 * (p.stats.assists + p.stats.kills)) / tK) + "%`\t__cs:__`" + (p.stats.totalMinionsKilled + p.stats.neutralMinionsKilled) + "`\t__g:__`" + UTILS.gold(p.stats.goldEarned) + "`\n" + getMatchTags(pI.player.summonerId, match).map(s => "`" + s + "`").join(TAB + " "));
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
	liveMatchPremade(CONFIG, summoner, match, matches, ranks, masteries, summoner_participants, verified, trim = true, newlogic = true) {//show current match information
		let newEmbed = new Discord.RichEmbed();
		newEmbed.setAuthor(summoner.name + (verified ? VERIFIED_ICON : ""), "https://ddragon.leagueoflegends.com/cdn/" + CONFIG.STATIC.n.profileicon + "/img/profileicon/" + summoner.profileIconId + ".png", UTILS.opgg(CONFIG.REGIONS_REVERSE[summoner.region], summoner.name));
		if (UTILS.exists(match.status)) {
			newEmbed.setAuthor(summoner.guess);
			newEmbed.setTitle("This summoner is currently not in a match.");
			newEmbed.setColor([255, 0, 0]);
			return newEmbed;
		}
		const avg_iMMR = UTILS.averageMatchMMR(ranks);
		UTILS.output("average iMMR is " + UTILS.round(avg_iMMR) + " or " + UTILS.iMMRtoEnglish(avg_iMMR));
		for (let i = 0; i < IMMR_THRESHOLD.length; ++i) if (avg_iMMR >= IMMR_THRESHOLD[i]) newEmbed.setColor(RANK_COLOR[i]);
		const game_type = match.gameType == "CUSTOM_GAME" ? "Custom" : queues[match.gameQueueConfigId];
		if (match.gameStartTime != 0) newEmbed.setTitle(game_type + " `" + UTILS.standardTimestamp((new Date().getTime() - match.gameStartTime) / 1000) + "`");
		else newEmbed.setTitle(game_type + " `GAME LOADING`");
		let common_teammates = {};
		/*{
			"username1": {
				"username2": 4
			}
		}*/
		let teams = {};
		for (let b in match.participants) {
			if (!UTILS.exists(teams[match.participants[b].teamId])) teams[match.participants[b].teamId] = [];
			const flex_5 = ranks[b].find(r => r.queueType === "RANKED_FLEX_SR");
			const flex_3 = ranks[b].find(r => r.queueType === "RANKED_FLEX_TT");
			const solo = ranks[b].find(r => r.queueType === "RANKED_SOLO_5x5");
			match.participants[b].flex5 = UTILS.shortRank(flex_5);
			match.participants[b].flex3 = UTILS.shortRank(flex_3);
			match.participants[b].solo = UTILS.shortRank(solo);
			match.participants[b].mastery = UTILS.getSingleChampionMastery(masteries[b], match.participants[b].championId);
			teams[match.participants[b].teamId].push(match.participants[b]);
			common_teammates[match.participants[b].summonerName] = {};
		}
		if (newlogic) {//new logic
			for (let b in matches) {
				let teams_private = {};
				for (let c in matches[b].participants) {
					if (!UTILS.exists(teams_private[matches[b].participants[c].teamId])) teams_private[matches[b].participants[c].teamId] = [];
					teams_private[matches[b].participants[c].teamId].push(matches[b].participants[c]);
				}
				for (let c in teams_private) teams_private[c] = teams_private[c].map(p => matches[b].participantIdentities.find(pI => pI.participantId === p.participantId));
				for (let c in teams_private) {//team of pIs
					for (let d in teams_private[c]) {//individual pI
						const dsn = teams_private[c][d].player.summonerName;
						if (!UTILS.exists(common_teammates[dsn])) common_teammates[dsn] = {};
						for (let e in teams_private[c]) {
							const esn = teams_private[c][e].player.summonerName;
							if (!UTILS.exists(common_teammates[dsn][esn])) common_teammates[dsn][esn] = 1;
							else common_teammates[dsn][esn] += 1;
						}
					}
				}
			}
		}
		else {//old logic
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
		}
		if (trim) UTILS.debug(UTILS.trim(common_teammates) + " premade entries trimmed.");
		let team_count = 1;
		let player_count = 0;
		for (let b in teams) {//team
			let team_description_c1 = "";
			let team_description_c2 = "";
			let ban_description = [];
			let networks = teams[b].map(t => UTILS.getGroup(t.summonerName, common_teammates));//for everyone on the team, put the premade group in the network array
			let premade_str = networks.map(g => g.join(","));//array of comma delimited network strings
			let premade_letter = {};//object of network strings
			for (let c in premade_str) {
				if (!UTILS.exists(premade_letter[premade_str[c]])) premade_letter[premade_str[c]] = 1;//if the network doesn't exist as a key in premade_letter, assign 1 to it
				else ++premade_letter[premade_str[c]];//otherwise it exists, and add 1 to it
			}
			let premade_number = 1;
			for (let c in premade_letter) {//for each unique network in premade_letter
				if (premade_letter[c] == 1) premade_letter[c] = 0;//not a premade (group size 1)
				else {
					premade_letter[c] = premade_number;//assign a premade symbol index
					premade_number++;//increment the index
				}
			}
			for (let c in teams[b]) {//player on team
				if (UTILS.exists(CONFIG.SPELL_EMOJIS[teams[b][c].spell1Id])) team_description_c1 += CONFIG.SPELL_EMOJIS[teams[b][c].spell1Id];
				else team_description_c1 += "`" + CONFIG.STATIC.SUMMONERSPELLS[teams[b][c].spell1Id].name + "`";
				if (UTILS.exists(CONFIG.SPELL_EMOJIS[teams[b][c].spell2Id])) team_description_c1 += CONFIG.SPELL_EMOJIS[teams[b][c].spell2Id];
				else team_description_c1 += "\t`" + CONFIG.STATIC.SUMMONERSPELLS[teams[b][c].spell2Id].name + "`";
				team_description_c1 += " `" + teams[b][c].solo + " " + teams[b][c].flex5 + " " + teams[b][c].flex3 + "`\n";
				team_description_c2 += "`M" + teams[b][c].mastery + "`" + CONFIG.STATIC.CHAMPIONS[teams[b][c].championId].emoji;
				team_description_c2 += "`" + summoner_participants.find(p => p.id == teams[b][c].summonerId).summonerLevel + "`";
				team_description_c2 += " " + PREMADE_EMOJIS[premade_letter[premade_str[c]]];
				team_description_c2 += teams[b][c].summonerId == summoner.id ? "**" : "";//bolding
				team_description_c2 += "__[" + teams[b][c].summonerName + "](" + UTILS.opgg(CONFIG.REGIONS_REVERSE[summoner.region], teams[b][c].summonerName) + ")__";
				team_description_c2 += (teams[b][c].summonerId == summoner.id && verified) ? "\\" + VERIFIED_ICON : "";
				team_description_c2 += teams[b][c].summonerId == summoner.id ? "**" : "";//bolding
				if (UTILS.exists(match.bannedChampions[player_count])) {
					ban_description.push(match.bannedChampions[player_count].championId == -1 ? ":x:" : CONFIG.STATIC.CHAMPIONS[match.bannedChampions[player_count].championId].emoji);
				}
				team_description_c2 += "\n";
				++player_count;
			}
			UTILS.debug("team_description_c1 length: " + team_description_c1.length);
			UTILS.debug("team_description_c2 length: " + team_description_c2.length);
			newEmbed.addField(":x::x: `SOLOQ ¦FLEX5 ¦FLEX3`", team_description_c1, true);
			newEmbed.addField("Bans: " + ban_description.join(""), team_description_c2, true);
			++team_count;
		}
		return newEmbed;
	}
	mmr(CONFIG, summoner, verified) {
		let newEmbed = new Discord.RichEmbed();
		if (!UTILS.exists(summoner.id)) {
			newEmbed.setTitle("This summoner does not exist.");
			newEmbed.setDescription("Please revise your request.");
			newEmbed.setColor([255, 0, 0]);
			return newEmbed;
		}
		let tier, jokeNumber;
		let mmr = UTILS.randomInt(-1, MMR_THRESHOLD.length);//pick a tier
		if (mmr === -1) UTILS.randomInt(-100, MMR_THRESHOLD[0])
		else if (mmr < MMR_THRESHOLD.length - 1) mmr = UTILS.randomInt(MMR_THRESHOLD[mmr], MMR_THRESHOLD[mmr + 1]);//-100 to 400
		else UTILS.randomInt(MMR_THRESHOLD[mmr], MMR_THRESHOLD[mmr] + 300);
		if (mmr < MMR_THRESHOLD[0]) {
			tier = UTILS.randomOf(["WOOD", "CLOTH", "IRON", "PLASTIC", "PAPER", "COPPER", "CARDBOARD", "LEAD", "DIRT", "GARBAGE"]);
			jokeNumber = 0;
		} else if (mmr < MMR_THRESHOLD[1]) {//bronze
			tier = RANK_ORDER[0];
			jokeNumber = 1;
		} else if (mmr < MMR_THRESHOLD[2]) {//silver
			tier = RANK_ORDER[1];
			jokeNumber = 2;
		} else if (mmr < MMR_THRESHOLD[3]) {//gold
			tier = RANK_ORDER[2];
			jokeNumber = 3;
		} else if (mmr < MMR_THRESHOLD[4]) {//plat
			tier = RANK_ORDER[3];
			jokeNumber = 4;
		} else if (mmr < MMR_THRESHOLD[5]) {//dia
			tier = RANK_ORDER[4];
			jokeNumber = 5;
		} else if (mmr < MMR_THRESHOLD[6]) {//master
			tier = RANK_ORDER[5];
			jokeNumber = 6;
		} else {//challenger
			tier = RANK_ORDER[6];
			jokeNumber = 7;
		}
		const analysis = UTILS.randomOf(MMR_JOKES[jokeNumber]);
		newEmbed.setAuthor(summoner.name + (verified ? VERIFIED_ICON : ""), null, UTILS.opgg(CONFIG.REGIONS_REVERSE[summoner.region], summoner.name));
		newEmbed.setThumbnail("https://ddragon.leagueoflegends.com/cdn/" + CONFIG.STATIC.n.profileicon + "/img/profileicon/" + summoner.profileIconId + ".png");
		newEmbed.setDescription("Level " + summoner.summonerLevel);
		newEmbed.addField("MMR Data", "Tier: " + UTILS.english(tier) + "\nMMR: `" + mmr + "`\n" + analysis);
		if (RANK_ORDER.indexOf(tier) != -1) newEmbed.setColor(RANK_COLOR[RANK_ORDER.indexOf(tier)]);
		newEmbed.setFooter("This information does not reflect this summoner's actual MMR.");
		return newEmbed;
	}
	notify(CONFIG, content, username, displayAvatarURL, release) {
		let newEmbed = new Discord.RichEmbed();
		newEmbed.setColor([255, 255, 0]);
		newEmbed.setTitle("Important message from SupportBot staff");
		newEmbed.setURL(CONFIG.HELP_SERVER_INVITE_LINK);
		newEmbed.setAuthor(username, displayAvatarURL);
		newEmbed.setDescription(content);
		if (release) newEmbed.addField("To disable this kind of release notif,", "Use the command `Lsetting release-notifications off`");
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
					if (incident.updates.length > 0) return str + incident.updates.map(update => "**" + update.severity + "**: " + update.content).join("\n") + "\n";
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
	multiSummoner(CONFIG, region, summoners, ranks, masteries, match_metas, matches) {
		let newEmbed = new Discord.RichEmbed();
		newEmbed.setTitle("Multiple Summoner Comparison");
		let response_str = [];
		for (let i = 0; i < summoners.length; ++i) {
			if (UTILS.exists(summoners[i].status)) {
				response_str.push("The requested summoner does not exist.");
				continue;
			}
			let individual_description = "`";
			individual_description += UTILS.shortRank(ranks[i].find(r => r.queueType === "RANKED_SOLO_5x5")) + " ";
			individual_description += UTILS.shortRank(ranks[i].find(r => r.queueType === "RANKED_FLEX_SR")) + " ";
			individual_description += UTILS.shortRank(ranks[i].find(r => r.queueType === "RANKED_FLEX_TT")) + " ";
			let results = [];
			let all_KDA = {
				K: 0,
				D: 0,
				A: 0
			};
			for (let b in match_metas[i].matches) {//iterate through match meta for 1 summoner
				const indv_match = matches.find(m => match_metas[i].matches[b].gameId == m.gameId);
				results.push(UTILS.determineWin(summoners[i].id, indv_match));
				const KDA = UTILS.KDA(summoners[i].id, indv_match);
				for (let b in all_KDA) all_KDA[b] += KDA[b];
			}
			let streak_count = 1;
			const streak_result = results[0];
			for (let j = 1; j < results.length; ++j) {
				if (streak_result == results[j]) streak_count++;
				else break;
			}
			individual_description += streak_count.pad(2) + (streak_result ? "Ws " : "Ls ");//streak information
			const total_wins = results.reduce((total, increment) => total + (increment ? 1 : 0), 0).pad(2);
			const total_losses = results.reduce((total, increment) => total + (increment ? 0 : 1), 0).pad(2);
			individual_description += total_wins + "W/" + total_losses + "L ";//20 game W/L record
			individual_description += "@ " + UTILS.KDAFormat((all_KDA.K + all_KDA.A) / all_KDA.D) + "` ";
			for (let j = 0; j < 3; ++j) {//top 3 champion masteries
				individual_description += j < masteries[i].length ? CONFIG.STATIC.CHAMPIONS[masteries[i][j].championId].emoji : ":x:";
			}
			individual_description += " lv. `" + summoners[i].summonerLevel + "`";
			individual_description += " [" + summoners[i].name + "](" + UTILS.opgg(region, summoners[i].name) + ")";
			UTILS.debug("individual_description length: " + individual_description.length);
			response_str.push(individual_description);
		}
		for (let i = 0; i < response_str.length;) {
			let field_str = "";
			for (; i < response_str.length; ++i) {
				if (field_str.length + response_str[i].length < 1024) field_str += response_str[i] + "\n";
				else break;
			}
			newEmbed.addField("`SOLOQ |FLEX5 |FLEX3` W/L-Streak, 20G W/L, 20G KDA, Best Champs", field_str.substring(0, field_str.length - 1));
		}
		return newEmbed;
		//SOLO Q|FLEX 5|FLEX 3 [MH1][MH2][MH3][MH4][W]W/[L]L KDA: [KDA][C1][C2][C3] lv. [lv.][username w/ op.gg]
		//6     7      7      1 25   25   25   25   2 2  2 2 4    6     26  26  26 5    3    48
		//SOLO Q|FLEX 5|FLEX 3 [W]W/[L]L [KDA][C1][C2][C3] lv. [lv.][username w/ op.gg]
		//6     7      7      1 2 2  2 2 6     26  26  26 5    3    48
		//SOLO Q|FLEX 5|FLEX 3 [S#][R]s [W]W/[L]L [KDA][C1][C2][C3] lv. [lv.][username w/ op.gg]
		//6     7      7      1 2   1 2  2 2  2 2 6     26  26  26 5    3    48


		//SOLO Q|FLEX 5|FLEX 3 [S#][R]s [W]W/[L]L [KDA][C1][C2][C3] lv. [lv.][username w/ op.gg]
		//SOLO Q|FLEX 5|FLEX 3 [S#][R]s [W]W/[L]L [KDA][C1][C2][C3] lv. [lv.][username w/ op.gg]
		//SOLO Q|FLEX 5|FLEX 3 [S#][R]s [W]W/[L]L [KDA][C1][C2][C3] lv. [lv.][username w/ op.gg]
		//SOLO Q|FLEX 5|FLEX 3 [S#][R]s [W]W/[L]L [KDA][C1][C2][C3] lv. [lv.][username w/ op.gg]
		//SOLO Q|FLEX 5|FLEX 3 [S#][R]s [W]W/[L]L [KDA][C1][C2][C3] lv. [lv.][username w/ op.gg]
	}
	fairTeam(CONFIG, region, summoners, ranks, masteries, debug_mode = false) {
		function formatDescriptionString(team, side) {
			return debug_mode ? "**Min:** `" + UTILS.numberWithCommas(team.min[side]) + "` **Med:** `" + UTILS.numberWithCommas(team.med[side]) + "` **Max:** `" + UTILS.numberWithCommas(team.max[side]) + "`\n**μ:** `" + UTILS.numberWithCommas(UTILS.round(team.avg[side], 2)) + "` **Δμ:** `" + UTILS.numberWithCommas(UTILS.round(team.avg[side] - team.avg[1 - side], 2)) + "` **σ:** `" + UTILS.numberWithCommas(UTILS.round(team.stdev[side], 2)) + "`\n**Σ:** `" + UTILS.numberWithCommas(team.sum[side]) + "` **Δ:** `" + UTILS.numberWithCommas(team.sum[side] - team.sum[1 - side]) + "` **%Δ:** `" + UTILS.round((100 * (team.sum[side] - team.sum[1 - side])) / (team.sum[0] + team.sum[1]), 2) + "`" : "";
		}
		function formatDescriptionStringLarge(team, side) {
			return debug_mode ? "**Min:** `" + UTILS.masteryPoints(team.min[side]) + "` **Med:** `" + UTILS.masteryPoints(team.med[side]) + "` **Max:** `" + UTILS.masteryPoints(team.max[side]) + "`\n**μ:** `" + UTILS.masteryPoints(team.avg[side]) + "` **Δμ:** `" + UTILS.masteryPoints(team.avg[side] - team.avg[1 - side]) + "` **σ:** `" + UTILS.masteryPoints(team.stdev[side]) + "`\n**Σ:** `" + UTILS.masteryPoints(team.sum[side]) + "` **Δ:** `" + UTILS.masteryPoints(team.sum[side] - team.sum[1 - side]) + "` **%Δ:** `" + UTILS.round((100 * (team.sum[side] - team.sum[1 - side])) / (team.sum[0] + team.sum[1]), 2) + "`" : "";
		}
		function formatDescriptionStringRanks(team, side) {
			return debug_mode ? "**Min:** `" + UTILS.iMMRtoEnglish(team.min[side]) + "` **Med:** `" + UTILS.iMMRtoEnglish(team.med[side]) + "` **Max:** `" + UTILS.iMMRtoEnglish(team.max[side]) + "`\n**μ:** `" + UTILS.iMMRtoEnglish(team.avg[side]) + "` **Δμ:** `" + UTILS.numberWithCommas(UTILS.round(team.avg[side] - team.avg[1 - side], 0)) + "LP` **σ:** `" + UTILS.numberWithCommas(UTILS.round(team.stdev[side], 2)) + "LP`\n**Σ:** `" + UTILS.numberWithCommas(UTILS.round(team.sum[side], 0)) + "LP` **Δ:** `" + UTILS.numberWithCommas(UTILS.round(team.sum[side] - team.sum[1 - side], 0)) + "LP` **%Δ:** `" + UTILS.round((100 * (team.sum[side] - team.sum[1 - side])) / (team.sum[0] + team.sum[1]), 2) + "`" : "";
		}
		function sideOfMap(diff, team_number) {
			return team_number === 0 ? diff > 0 ? "Purple " + CONFIG.EMOJIS.purple : "Blue " + CONFIG.EMOJIS.blue : diff > 0 ? "Blue " + CONFIG.EMOJIS.blue : "Purple " + CONFIG.EMOJIS.purple;
		}
		let newEmbed = new Discord.RichEmbed();
		newEmbed.setTitle("Fair Team Generator");
		const TEAM_COMBINATIONS = UTILS.generateTeams(summoners);//array of binary team arrangements

		let team_by_level = [];//array of stats objects
		for (let b in TEAM_COMBINATIONS) team_by_level.push(UTILS.calculateTeamStatistics(mathjs, TEAM_COMBINATIONS[b], summoners.map(s => s.summonerLevel)));
		const team_by_level_lowest_diff = mathjs.min(team_by_level.map(t => t.abs));
		const team_by_level_best = team_by_level.findIndex(t => t.abs === team_by_level_lowest_diff);//team arrangement index
		let team_by_level_description = [[], []];
		for (let i = 0; i < TEAM_COMBINATIONS[team_by_level_best].length; ++i) {
			const individual_description = "lv. `" + summoners[i].summonerLevel + "` " + summoners[i].name;
			team_by_level_description[TEAM_COMBINATIONS[team_by_level_best][i] === "0" ? 0 : 1].push([summoners[i].summonerLevel, individual_description]);
		}
		for (let i = 0; i < team_by_level_description.length; ++i) {
			team_by_level_description[i].sort((a, b) => b[0] - a[0]);
			team_by_level_description[i] = "**__Team " + sideOfMap(team_by_level[team_by_level_best].diff, i) + "__**\n" + team_by_level_description[i].map(d => d[1]).join("\n") + "\n" + formatDescriptionString(team_by_level[team_by_level_best], i);
			team_by_level_description[i] = team_by_level_description[i].trim();
		}
		newEmbed.addField("By Experience", team_by_level_description[0], true);
		newEmbed.addField("(Level) id: " + team_by_level_best, team_by_level_description[1], true);
		newEmbed.addBlankField(false);

		let team_by_highest_mastery = [];//array of stats objects
		for (let b in TEAM_COMBINATIONS) team_by_highest_mastery.push(UTILS.calculateTeamStatistics(mathjs, TEAM_COMBINATIONS[b], masteries.map(m => (m[0].championPoints || 0))));
		const team_by_highest_mastery_lowest_diff = mathjs.min(team_by_highest_mastery.map(t => t.abs));
		const team_by_highest_mastery_best = team_by_highest_mastery.findIndex(t => t.abs === team_by_highest_mastery_lowest_diff);//team arrangement index
		let team_by_highest_mastery_description = [[], []];
		for (let i = 0; i < TEAM_COMBINATIONS[team_by_highest_mastery_best].length; ++i) {
			const individual_description = CONFIG.STATIC.CHAMPIONS[masteries[i][0].championId].emoji + " `" + UTILS.masteryPoints(masteries[i][0].championPoints) + "` " + summoners[i].name;
			team_by_highest_mastery_description[TEAM_COMBINATIONS[team_by_highest_mastery_best][i] === "0" ? 0 : 1].push([masteries[i][0].championPoints, individual_description]);
		}
		for (let i = 0; i < team_by_highest_mastery_description.length; ++i) {
			team_by_highest_mastery_description[i].sort((a, b) => b[0] - a[0]);
			team_by_highest_mastery_description[i] = "**__Team " + sideOfMap(team_by_highest_mastery[team_by_highest_mastery_best].diff, i) + "__**\n" + team_by_highest_mastery_description[i].map(d => d[1]).join("\n") + "\n" + formatDescriptionStringLarge(team_by_highest_mastery[team_by_highest_mastery_best], i);
			team_by_highest_mastery_description[i] = team_by_highest_mastery_description[i].trim();
		}
		newEmbed.addField("By Experience", team_by_highest_mastery_description[0], true);
		newEmbed.addField("(Highest Mastery Champion) id: " + team_by_highest_mastery_best, team_by_highest_mastery_description[1], true);
		newEmbed.addBlankField(false);

		let team_by_total_mastery = [];//array of stats objects
		for (let b in TEAM_COMBINATIONS) team_by_total_mastery.push(UTILS.calculateTeamStatistics(mathjs, TEAM_COMBINATIONS[b], masteries.map(m => m.reduce((total, increment) => total + increment.championPoints, 0))));
		const team_by_total_mastery_lowest_diff = mathjs.min(team_by_total_mastery.map(t => t.abs));
		const team_by_total_mastery_best = team_by_total_mastery.findIndex(t => t.abs === team_by_total_mastery_lowest_diff);//team arrangement index
		let team_by_total_mastery_description = [[], []];
		for (let i = 0; i < TEAM_COMBINATIONS[team_by_total_mastery_best].length; ++i) {
			const individual_description = "`" + UTILS.masteryPoints(masteries[i].reduce((total, increment) => total + increment.championPoints, 0)) + "` " + summoners[i].name;
			team_by_total_mastery_description[TEAM_COMBINATIONS[team_by_total_mastery_best][i] === "0" ? 0 : 1].push([masteries[i].reduce((total, increment) => total + increment.championPoints, 0), individual_description]);
		}
		for (let i = 0; i < team_by_total_mastery_description.length; ++i) {
			team_by_total_mastery_description[i].sort((a, b) => b[0] - a[0]);
			team_by_total_mastery_description[i] = "**__Team " + sideOfMap(team_by_total_mastery[team_by_total_mastery_best].diff, i) + "__**\n" + team_by_total_mastery_description[i].map(d => d[1]).join("\n") + "\n" + formatDescriptionStringLarge(team_by_total_mastery[team_by_total_mastery_best], i);
			team_by_total_mastery_description[i] = team_by_total_mastery_description[i].trim();
		}
		newEmbed.addField("By Experience", team_by_total_mastery_description[0], true);
		newEmbed.addField("(Total Champion Mastery) id: " + team_by_total_mastery_best, team_by_total_mastery_description[1], true);
		newEmbed.addBlankField(false);

		let team_by_all_ranks = [];//array of stats objects
		let iMMR = [];
		for (let i = 0; i < ranks.length; ++i) {
			UTILS.debug("ranks[" + i + "] is " + JSON.stringify(ranks[i], null, "\t"));
			UTILS.assert(UTILS.exists(ranks[i]));
			UTILS.debug("iMMR[" + i + "] is " + UTILS.averageUserMMR(ranks[i]));
			UTILS.assert(UTILS.exists(UTILS.averageUserMMR(ranks[i])))
			if (UTILS.averageUserMMR(ranks[i]) < 100) iMMR.push(600);
			else iMMR.push(UTILS.averageUserMMR(ranks[i]));
		}
		UTILS.debug(JSON.stringify(iMMR, null, "\t"));
		for (let b in TEAM_COMBINATIONS) team_by_all_ranks.push(UTILS.calculateTeamStatistics(mathjs, TEAM_COMBINATIONS[b], iMMR));
		const team_by_all_ranks_lowest_diff = mathjs.min(team_by_all_ranks.map(t => t.abs));
		UTILS.debug("rank lowest diff is " + team_by_all_ranks_lowest_diff);
		const team_by_all_ranks_best = team_by_all_ranks.findIndex(t => t.abs === team_by_all_ranks_lowest_diff);//team arrangement index
		UTILS.debug("rank lowest diff index is " + team_by_all_ranks_best);
		let team_by_all_ranks_description = [[], []];
		for (let i = 0; i < TEAM_COMBINATIONS[team_by_all_ranks_best].length; ++i) {
			const individual_description = "`" + UTILS.iMMRtoEnglish(UTILS.averageUserMMR(ranks[i])) + "` " + summoners[i].name;
			team_by_all_ranks_description[TEAM_COMBINATIONS[team_by_all_ranks_best][i] === "0" ? 0 : 1].push([UTILS.averageUserMMR(ranks[i]), individual_description]);
		}
		for (let i = 0; i < team_by_all_ranks_description.length; ++i) {
			team_by_all_ranks_description[i].sort((a, b) => b[0] - a[0]);
			team_by_all_ranks_description[i] = "**__Team " + sideOfMap(team_by_all_ranks[team_by_all_ranks_best].diff, i) + "__**\n" + team_by_all_ranks_description[i].map(d => d[1]).join("\n") + "\n" + formatDescriptionStringRanks(team_by_all_ranks[team_by_all_ranks_best], i);
			team_by_all_ranks_description[i] = team_by_all_ranks_description[i].trim();
		}
		newEmbed.addField("By Skill", team_by_all_ranks_description[0], true);
		newEmbed.addField("(All Ranks) id: " + team_by_all_ranks_best, team_by_all_ranks_description[1], true);
		newEmbed.addBlankField(false);

		let team_by_sr_ranks = [];//array of stats objects
		let sr_iMMR = [];
		for (let i = 0; i < ranks.length; ++i) {
			UTILS.debug("ranks[" + i + "] is " + JSON.stringify(ranks[i], null, "\t"));
			UTILS.assert(UTILS.exists(ranks[i]));
			UTILS.debug("sr_iMMR[" + i + "] is " + UTILS.summonersRiftMMR(ranks[i]));
			UTILS.assert(UTILS.exists(UTILS.summonersRiftMMR(ranks[i])))
			if (UTILS.summonersRiftMMR(ranks[i]) < 100) sr_iMMR.push(600);
			else sr_iMMR.push(UTILS.summonersRiftMMR(ranks[i]));
		}
		UTILS.debug(JSON.stringify(sr_iMMR, null, "\t"));
		for (let b in TEAM_COMBINATIONS) team_by_sr_ranks.push(UTILS.calculateTeamStatistics(mathjs, TEAM_COMBINATIONS[b], sr_iMMR));
		const team_by_sr_ranks_lowest_diff = mathjs.min(team_by_sr_ranks.map(t => t.abs));
		UTILS.debug("rank lowest diff is " + team_by_sr_ranks_lowest_diff);
		const team_by_sr_ranks_best = team_by_sr_ranks.findIndex(t => t.abs === team_by_sr_ranks_lowest_diff);//team arrangement index
		UTILS.debug("rank lowest diff index is " + team_by_sr_ranks_best);
		let team_by_sr_ranks_description = [[], []];
		for (let i = 0; i < TEAM_COMBINATIONS[team_by_sr_ranks_best].length; ++i) {
			const individual_description = "`" + UTILS.iMMRtoEnglish(UTILS.summonersRiftMMR(ranks[i])) + "` " + summoners[i].name;
			team_by_sr_ranks_description[TEAM_COMBINATIONS[team_by_sr_ranks_best][i] === "0" ? 0 : 1].push([UTILS.summonersRiftMMR(ranks[i]), individual_description]);
		}
		for (let i = 0; i < team_by_sr_ranks_description.length; ++i) {
			team_by_sr_ranks_description[i].sort((a, b) => b[0] - a[0]);
			team_by_sr_ranks_description[i] = "**__Team " + sideOfMap(team_by_sr_ranks[team_by_sr_ranks_best].diff, i) + "__**\n" + team_by_sr_ranks_description[i].map(d => d[1]).join("\n") + "\n" + formatDescriptionStringRanks(team_by_sr_ranks[team_by_sr_ranks_best], i);
			team_by_sr_ranks_description[i] = team_by_sr_ranks_description[i].trim();
		}
		newEmbed.addField("By Skill", team_by_sr_ranks_description[0], true);
		newEmbed.addField("(Summoner's Rift Ranks) id: " + team_by_sr_ranks_best, team_by_sr_ranks_description[1], true);
		newEmbed.addBlankField(false);

		if (summoners.length <= 6) {
			let team_by_tt_ranks = [];//array of stats objects
			let tt_iMMR = [];
			for (let i = 0; i < ranks.length; ++i) {
				UTILS.debug("ranks[" + i + "] is " + JSON.stringify(ranks[i], null, "\t"));
				UTILS.assert(UTILS.exists(ranks[i]));
				UTILS.debug("tt_iMMR[" + i + "] is " + UTILS.twistedTreelineMMR(ranks[i]));
				UTILS.assert(UTILS.exists(UTILS.twistedTreelineMMR(ranks[i])))
				if (UTILS.twistedTreelineMMR(ranks[i]) < 100) tt_iMMR.push(600);
				else tt_iMMR.push(UTILS.twistedTreelineMMR(ranks[i]));
			}
			UTILS.debug(JSON.stringify(tt_iMMR, null, "\t"));
			for (let b in TEAM_COMBINATIONS) team_by_tt_ranks.push(UTILS.calculateTeamStatistics(mathjs, TEAM_COMBINATIONS[b], tt_iMMR));
			const team_by_tt_ranks_lowest_diff = mathjs.min(team_by_tt_ranks.map(t => t.abs));
			UTILS.debug("rank lowest diff is " + team_by_tt_ranks_lowest_diff);
			const team_by_tt_ranks_best = team_by_tt_ranks.findIndex(t => t.abs === team_by_tt_ranks_lowest_diff);//team arrangement index
			UTILS.debug("rank lowest diff index is " + team_by_tt_ranks_best);
			let team_by_tt_ranks_description = [[], []];
			for (let i = 0; i < TEAM_COMBINATIONS[team_by_tt_ranks_best].length; ++i) {
				const individual_description = "`" + UTILS.iMMRtoEnglish(UTILS.twistedTreelineMMR(ranks[i])) + "` " + summoners[i].name;
				team_by_tt_ranks_description[TEAM_COMBINATIONS[team_by_tt_ranks_best][i] === "0" ? 0 : 1].push([UTILS.twistedTreelineMMR(ranks[i]), individual_description]);
			}
			for (let i = 0; i < team_by_tt_ranks_description.length; ++i) {
				team_by_tt_ranks_description[i].sort((a, b) => b[0] - a[0]);
				team_by_tt_ranks_description[i] = "**__Team " + sideOfMap(team_by_tt_ranks[team_by_tt_ranks_best].diff, i) + "__**\n" + team_by_tt_ranks_description[i].map(d => d[1]).join("\n") + "\n" + formatDescriptionStringRanks(team_by_tt_ranks[team_by_tt_ranks_best], i);
				team_by_tt_ranks_description[i] = team_by_tt_ranks_description[i].trim();
			}
			newEmbed.addField("By Skill", team_by_tt_ranks_description[0], true);
			newEmbed.addField("(Twisted Treeline Ranks) id: " + team_by_tt_ranks_best, team_by_tt_ranks_description[1], true);
			newEmbed.addBlankField(false);
		}

		debug_mode = true;//force random statistics on
		let team_by_random = [];//array of stats objects
		let random_iMMR = [];
		for (let i = 0; i < ranks.length; ++i) {
			UTILS.debug("ranks[" + i + "] is " + JSON.stringify(ranks[i], null, "\t"));
			UTILS.assert(UTILS.exists(ranks[i]));
			UTILS.debug("random_iMMR[" + i + "] is " + UTILS.averageUserMMR(ranks[i]));
			UTILS.assert(UTILS.exists(UTILS.averageUserMMR(ranks[i])))
			if (UTILS.averageUserMMR(ranks[i]) < 100) random_iMMR.push(600);
			else random_iMMR.push(UTILS.averageUserMMR(ranks[i]));
		}
		UTILS.debug(JSON.stringify(random_iMMR, null, "\t"));
		for (let b in TEAM_COMBINATIONS) team_by_random.push(UTILS.calculateTeamStatistics(mathjs, TEAM_COMBINATIONS[b], random_iMMR));
		const team_by_random_best = UTILS.randomInt(0, TEAM_COMBINATIONS.length);//team arrangement index
		let team_by_random_description = [[], []];
		for (let i = 0; i < TEAM_COMBINATIONS[team_by_random_best].length; ++i) {
			const individual_description = "`" + UTILS.iMMRtoEnglish(UTILS.averageUserMMR(ranks[i])) + "` lv. `" + summoners[i].summonerLevel + "` " + summoners[i].name;
			team_by_random_description[TEAM_COMBINATIONS[team_by_random_best][i] === "0" ? 0 : 1].push([UTILS.averageUserMMR(ranks[i]), individual_description]);
		}
		for (let i = 0; i < team_by_random_description.length; ++i) {
			team_by_random_description[i].sort((a, b) => b[0] - a[0]);
			team_by_random_description[i] = "**__Team " + sideOfMap(team_by_random[team_by_random_best].diff, i) + "__**\n" + team_by_random_description[i].map(d => d[1]).join("\n") + "\n" + formatDescriptionStringRanks(team_by_random[team_by_random_best], i);
			team_by_random_description[i] = team_by_random_description[i].trim();
		}
		newEmbed.addField("Random", team_by_random_description[0], true);
		newEmbed.addField("(Level/Rank information displayed) id: " + team_by_random_best, team_by_random_description[1], true);
		return newEmbed;
	}
	serverBan(CONFIG, server, reason, date, issuer_tag, issuer_avatarURL) {
		let newEmbed = new Discord.RichEmbed();
		if (date == 0) {
			newEmbed.setTitle("This server (" + server.name + ") has been permanently banned from using SupportBot");
			newEmbed.setColor([1, 1, 1]);
			newEmbed.addField("Duration", "Permanent", true);
		}
		else {
			const date_date = new Date(date);
			newEmbed.setTitle("This server (" + server.name + ") has been temporarily suspended from using SupportBot");
			newEmbed.setColor([255, 0, 0]);
			newEmbed.addField("Duration", UTILS.until(date_date), true);
			newEmbed.setFooter("This suspension expires at");
			newEmbed.setTimestamp(date_date);
		}
		newEmbed.addField("While this ban is effective", "SupportBot will ignore all messages sent from this server.", true);
		newEmbed.addField("Help", "If you believe this is a mistake, please visit " + CONFIG.HELP_SERVER_INVITE_LINK + " and state your case to an admin.", true);
		newEmbed.setAuthor(issuer_tag, issuer_avatarURL);
		newEmbed.setDescription("The reason given was: " + reason);
		return newEmbed;
	}
	userBan(CONFIG, reason, date, issuer_tag, issuer_avatarURL) {
		let newEmbed = new Discord.RichEmbed();
		if (date == 0) {
			newEmbed.setTitle("You have been permanently banned from using SupportBot");
			newEmbed.setColor([1, 1, 1]);
			newEmbed.addField("Duration", "Permanent", true);
		}
		else {
			const date_date = new Date(date);
			newEmbed.setTitle("You have been temporarily suspended from using SupportBot");
			newEmbed.setColor([255, 0, 0]);
			newEmbed.addField("Duration", UTILS.until(date_date), true);
			newEmbed.setFooter("This suspension expires at");
			newEmbed.setTimestamp(date_date);
		}
		newEmbed.addField("While this ban is effective", "SupportBot will ignore all messages sent from your account.", true);
		newEmbed.addField("Help", "If you believe this is a mistake, please visit " + CONFIG.HELP_SERVER_INVITE_LINK + " and state your case to an admin.", true);
		newEmbed.setAuthor(issuer_tag, issuer_avatarURL);
		newEmbed.setDescription("The reason given was: " + reason);
		return newEmbed;
	}
	serverWarn(CONFIG, server, reason, issuer_tag, issuer_avatarURL) {
		let newEmbed = new Discord.RichEmbed();
		newEmbed.setTitle("This is an official warning for your server (" + server.name + ")");
		newEmbed.setTimestamp();
		newEmbed.setColor([255, 255, 0]);
		newEmbed.addField("This server can be temporarily or permanently banned from using SupportBot", "if you continue to violate our policies.", true);
		newEmbed.addField("No further action is required from anyone.", "Please ensure everyone is familiar with our Terms and Conditions, which you can read about by sending `" + CONFIG.DISCORD_COMMAND_PREFIX + "help`. For more assistance, please visit " + CONFIG.HELP_SERVER_INVITE_LINK + " .", true);
		newEmbed.setAuthor(issuer_tag, issuer_avatarURL);
		newEmbed.setDescription("The reason given was: " + reason);
		return newEmbed;
	}
	userWarn(CONFIG, reason, issuer_tag, issuer_avatarURL) {
		let newEmbed = new Discord.RichEmbed();
		newEmbed.setTitle("This is an official warning");
		newEmbed.setColor([255, 255, 0]);
		newEmbed.setTimestamp();
		newEmbed.addField("You can be temporarily or permanently banned from using SupportBot", "if you continue to violate our policies.", true);
		newEmbed.addField("No further action is required from you.", "Please ensure you are familiar with our Terms and Conditions, which you can read about by sending `" + CONFIG.DISCORD_COMMAND_PREFIX + "help`. For more assistance, please visit " + CONFIG.HELP_SERVER_INVITE_LINK + " .", true);
		newEmbed.setAuthor(issuer_tag, issuer_avatarURL);
		newEmbed.setDescription("The reason given was: " + reason);
		return newEmbed;
	}
	serverUnban(CONFIG, server, issuer_tag, issuer_avatarURL) {
		let newEmbed = new Discord.RichEmbed();
		newEmbed.setTitle("This server (" + server.name + ") has been unbanned");
		newEmbed.setColor([0, 255, 0]);
		newEmbed.setTimestamp();
		newEmbed.addField("Please ensure you are familiar with our Terms and Conditions", "which you can read about by sending `" + CONFIG.DISCORD_COMMAND_PREFIX + "help`. For more assistance, please visit " + CONFIG.HELP_SERVER_INVITE_LINK + " .");
		newEmbed.setAuthor(issuer_tag, issuer_avatarURL);
		return newEmbed;
	}
	userUnban(CONFIG, issuer_tag, issuer_avatarURL) {
		let newEmbed = new Discord.RichEmbed();
		newEmbed.setTitle("You have been unbanned");
		newEmbed.setColor([0, 255, 0]);
		newEmbed.setTimestamp();
		newEmbed.addField("Please ensure you are familiar with our Terms and Conditions", "which you can read about by sending `" + CONFIG.DISCORD_COMMAND_PREFIX + "help`. For more assistance, please visit " + CONFIG.HELP_SERVER_INVITE_LINK + " .");
		newEmbed.setAuthor(issuer_tag, issuer_avatarURL);
		return newEmbed;
	}
	disciplinaryHistory(CONFIG, id, user, docs) {
		let newEmbed = new Discord.RichEmbed();
		newEmbed.setTitle("Disciplinary History");
		const status = UTILS.disciplinaryStatus(docs);
		if (status.active_ban == 0) {
			newEmbed.setColor([1, 1, 1]);
			newEmbed.setDescription("This " + (user ? "user" : "server") + " has an active permanent ban.\nHere are the 10 most recent events:");
		}
		else if (status.active_ban == -1) {
			if (status.recent_warning) {
				newEmbed.setColor([255, 255, 0]);
				newEmbed.setDescription("This " + (user ? "user" : "server") + " has been warned recently.\nHere are the 10 most recent events:");
			}
			else {
				newEmbed.setColor([0, 255, 0]);
				newEmbed.setDescription("This " + (user ? "user" : "server") + " has no active bans.\nHere are the 10 most recent events:");
			}
		}
		else {
			newEmbed.setColor([255, 0, 0]);
			newEmbed.setDescription("This " + (user ? "user" : "server") + " has an active temporary ban. It expires in " + UTILS.until(new Date(status.active_ban)) + ".\nHere are the 10 most recent events:");
		}
		for (let i = 0; i < docs.length && i < 10; ++i) {
			newEmbed.addField("By " + CONFIG.OWNER_DISCORD_IDS[docs[i].issuer_id].name + ", " + UTILS.ago(new Date(docs[i].id_timestamp)) + (docs[i].ban && docs[i].active ? (new Date(docs[i].date).getTime() == 0 ? ", Permanent Ban" : ", Ban Expires in " + UTILS.until(new Date(docs[i].date))) : ""), docs[i].reason);
		}
		newEmbed.setAuthor(id);
		return newEmbed;
	}
	actionReport(CONFIG, id, docs) {
		let newEmbed = new Discord.RichEmbed();
		newEmbed.setTitle("Administrative Actions Report");
		newEmbed.setDescription("Showing 10 most recent events:");
		newEmbed.setAuthor(CONFIG.OWNER_DISCORD_IDS[id].name + " (" + id + ")");
		for (let i = 0; i < docs.length && i < 10; ++i) {
			let description = docs[i].user ? "uid" : "sid" + ": " + docs[i].target_id + ", ";
			description += UTILS.ago(new Date(docs[i].id_timestamp)) + ", ";
			if (docs[i].ban) {
				description += new Date(docs[i].date).getTime() == 0 ? "Permanent Ban Issued" : "Temporary Ban Issued, duration " + UTILS.duration(new Date(docs[i].id_timestamp), new Date(docs[i].date));
			}
			else if (docs[i].reason.substring(0, 9) == ":warning:") description += "Warning Issued";
			else if (docs[i].reason.substring(0, 15) == ":no_entry_sign:") description += "Bans Cleared (unbanned)";
			else description += "Note Added";
			newEmbed.addField(description, docs[i].reason);
		}
		return newEmbed;
	}
	mastery(CONFIG, summoner, championmastery, region, verified) {
		let newEmbed = new Discord.RichEmbed();
		if (!UTILS.exists(summoner.id)) {
			newEmbed.setAuthor(summoner.guess);
			newEmbed.setTitle("This summoner does not exist.");
			newEmbed.setDescription("Please revise your request.");
			newEmbed.setColor([255, 0, 0]);
			return newEmbed;
		}
		newEmbed.setAuthor(summoner.name + (verified ? VERIFIED_ICON : ""), "https://ddragon.leagueoflegends.com/cdn/" + CONFIG.STATIC.n.profileicon + "/img/profileicon/" + summoner.profileIconId + ".png", UTILS.opgg(region, summoner.name));
		newEmbed.setTitle("Individual Champion Mastery");
		let cm_description = [];
		let cm_total = 0;
		let cms_total = 0;
		for (let i = 0; i < championmastery.length; ++i) {
			cm_description.push("#`" + (i + 1).pad(2) + "`. `M" + championmastery[i].championLevel + "` " + CONFIG.STATIC.CHAMPIONS[championmastery[i].championId].emoji + " `" + UTILS.masteryPoints(championmastery[i].championPoints) + "`pts");
			cm_total += championmastery[i].championLevel;
			cms_total += championmastery[i].championPoints;
		}
		newEmbed.setDescription("Total Mastery Level: " + cm_total + "\nTotal Mastery Score: " + UTILS.masteryPoints(cms_total));
		const SECTION_LENGTH = 15;
		if (cm_description.length > 0) {
			const sections = Math.trunc(cm_description.length / SECTION_LENGTH) + 1;
			for (let i = 0; i < sections && i < 6; ++i) newEmbed.addField("#" + ((i * SECTION_LENGTH) + 1) + " - #" + ((i + 1) * SECTION_LENGTH), cm_description.slice(i * SECTION_LENGTH, (i + 1) * SECTION_LENGTH).join("\n"), true);
		}
		newEmbed.setFooter("Showing a maximum of 90 champions");
		return newEmbed;
	}
	feedback(CONFIG, type, destination, msg, user_history, server_history, usertag) {
		/*type = 0: general message from user (destination 1)
		type = 1: complaint (destination 1->2)
		type = 2: praise (destination 1->2)
		type = 3: suggestion (destination 1->2)
		type = 4: question (destination 1)
		type = 5: general message to user (destination 0)
		destination = 0: user PM
		destination = 1: admin channel
		destination = 2: public
		(t, d)
		(0, 1): user to admin channel
		(1-3, 1): feedback awaiting public approval in admin channel
		X(1-3, 2): feedback approved, to be published publicly. handled by function below, reviewFeedback()
		X(1-3, 0): feedback approved, to be sent to original user. handled by function below, reviewFeedback()
		(4, 1): question submitted to admin channel
		(5, 0): management to user
		(5, 1): management to user admin channel audit
		*/
		let newEmbed = new Discord.RichEmbed();
		newEmbed.setAuthor(msg.author.tag + (msg.PM ? " via PM" : " from server " + msg.guild.name + "::" + msg.guild.id), msg.author.displayAvatarURL);
		newEmbed.setTimestamp();
		newEmbed.setTitle("Message from a user");
		newEmbed.setDescription(msg.cleanContent);
		if (type === 0) {//Lsay
			newEmbed.setColor("#ffffff");//white
		}
		else if (type === 1) {//Lcomplain
			newEmbed.setColor("#ff0000");//red
			newEmbed.setFooter(CONFIG.FEEDBACK.COMPLAINT_CID + ":" + msg.author.id + ":" + msg.author.username);
		}
		else if (type === 2) {//Lpraise
			newEmbed.setColor("#00ff00");//green
			newEmbed.setFooter(CONFIG.FEEDBACK.PRAISE_CID + ":" + msg.author.id + ":" + msg.author.username);
		}
		else if (type === 3) {//Lsuggest
			newEmbed.setColor("#0000ff");//blue
			newEmbed.setFooter(CONFIG.FEEDBACK.SUGGESTION_CID + ":" + msg.author.id + ":" + msg.author.username);
		}
		else if (type === 4) {//Lask/Lquestion
			newEmbed.setColor("#ff00ff");//magenta (yellow reserved for warnings)
		}
		else if (type === 5) {
			newEmbed.setAuthor(msg.author.username, msg.author.displayAvatarURL);
			newEmbed.setTitle("Message from management to " + usertag);//reset title
			if (destination === 0) {
				newEmbed.setURL(CONFIG.HELP_SERVER_INVITE_LINK);
				newEmbed.addField("This is a private conversation with management.", "You can reply to this message by sending `" + CONFIG.DISCORD_COMMAND_PREFIX + "say <your response goes here>`");
				newEmbed.setDescription(msg.cleanContent.substring(msg.cleanContent.indexOfInstance(" ", 2) + 1) + "\n\n" + CONFIG.OWNER_DISCORD_IDS[msg.author.id].flags);
			}
			else if (destination === 1) {
				newEmbed.setDescription(msg.cleanContent.substring(msg.cleanContent.indexOfInstance(" ", 2) + 1));
			}
		}//Lmail
		if (type < 5) {
			let user_status = UTILS.disciplinaryStatusString(UTILS.disciplinaryStatus(user_history), true);
			let server_status = UTILS.exists(server_history) ? "\n" + UTILS.disciplinaryStatusString(UTILS.disciplinaryStatus(server_history), false) : "";
			newEmbed.addField("Background Checks", user_status + server_status);
			if (destination === 1) {
				newEmbed.addField("Responses", "Send message response: `" + CONFIG.DISCORD_COMMAND_PREFIX + "mail " + msg.author.id + " <text>`\nBan: `" + CONFIG.DISCORD_COMMAND_PREFIX + "banuser " + msg.author.id + " <duration> <reason>`\nWarn: `" + CONFIG.DISCORD_COMMAND_PREFIX + "warnuser " + msg.author.id + " <reason>`\nNote: `" + CONFIG.DISCORD_COMMAND_PREFIX + "noteuser " + msg.author.id + " <reason>`");
			}
		}
		return newEmbed;
	}
	reviewFeedback(CONFIG, msg, approver, approved) {
		if (!UTILS.exists(msg.embeds[0])) return 1;//no embed detected
		if (!UTILS.exists(msg.embeds[0].footer) || !UTILS.exists(msg.embeds[0].footer.text)) return 2;//not approvable
		const c_location = msg.embeds[0].footer.text.indexOf(":");
		const c_location2 = msg.embeds[0].footer.text.indexOfInstance(":", 2);
		if (c_location == -1 || c_location2 == -1) return 3;//not approvable
		if (approved) {
			let public_e = new Discord.RichEmbed(msg.embeds[0]);
			let edit = new Discord.RichEmbed(msg.embeds[0]);
			let user = new Discord.RichEmbed(msg.embeds[0]);
			const cid = msg.embeds[0].footer.text.substring(0, c_location);
			const uid = msg.embeds[0].footer.text.substring(c_location + 1, c_location2);
			const username = msg.embeds[0].footer.text.substring(c_location2 + 1);
			public_e.setFooter("Approved by " + approver.username, approver.displayAvatarURL);
			public_e.fields = [];
			public_e.setAuthor(username, public_e.author.icon_url);
			edit.setFooter("Approved by " + approver.username, approver.displayAvatarURL);
			edit.fields = [];
			edit.addField("Responses", "Send message response: `" + CONFIG.DISCORD_COMMAND_PREFIX + "mail " + uid + "`\nNote: `" + CONFIG.DISCORD_COMMAND_PREFIX + "noteuser " + uid + " <reason>`");
			user.setAuthor(username, msg.embeds[0].author.icon, msg.embeds[0].author.url);
			user.setFooter("Approved by " + approver.username, approver.displayAvatarURL);
			user.fields = [];
			user.setTitle("Your feedback was reviewed by our staff and approved for public viewing on our server- click to join");
			user.setURL("https://discord.gg/57Z8Npg");
			public_e.setAuthor(username, user.author.icon_url);
			return { to_user: user, to_user_uid: uid, edit, to_public: public_e, to_public_cid: cid };
		}
		else return {};
	}
	raw(embed_object) {
		return new Discord.RichEmbed(embed_object);
	}
	verify(CONFIG, summoner, uid) {
		let newEmbed = new Discord.RichEmbed();
		newEmbed.setTitle("Verify ownership of LoL account");
		const now = new Date().getTime();
		let code = now + "-" + uid + "-" + summoner.puuid;
		code = now + "-" + crypto.createHmac("sha256", CONFIG.TPV_KEY).update(code).digest("hex");
		newEmbed.setDescription("Your code is: ```" + code + "```");
		newEmbed.addField("If you have already followed the instructions below, there is a problem with the code you provided.", "Reread the instructions below and try again.");
		newEmbed.addField("Instructions", "See the below image to save the code provided above to your account. Once you have done this, send the `" + CONFIG.DISCORD_COMMAND_PREFIX + "verify <region> <ign>` command again within the next 5 minutes after first **__waiting 30 seconds__**.");
		newEmbed.setImage("https://supportbot.tk/f/tpv.png");//tpv tutorial image
		newEmbed.setFooter("This code does not need to be kept secret.");
		return newEmbed;
	}
	debug(CONFIG, client, iapi_stats, c_eval) {
		let newEmbed = new Discord.RichEmbed();
		let serverbans = 0, userbans = 0;
		newEmbed.setTimestamp();
		const now = new Date().getTime();
		for (let b in CONFIG.BANS.USERS) {
			if (CONFIG.BANS.USERS[b] == 0 || CONFIG.BANS.USERS[b] > now) ++userbans;
		}
		for (let b in CONFIG.BANS.SERVERS) {
			if (CONFIG.BANS.SERVERS[b] == 0 || CONFIG.BANS.SERVERS[b] > now) ++serverbans;
		}
		newEmbed.setAuthor("Shard $" + process.env.SHARD_ID);
		newEmbed.setTitle("Diagnostic Information");
		newEmbed.addField("System", "iAPI request rate: " + UTILS.round(iapi_stats["0"].total_rate, 1) + " req/min\niAPI total requests: " + iapi_stats["0"].total_count + "\nNode.js " + process.versions.node + "\nNODE_ENV: " + process.env.NODE_ENV + "\nSoftware Version: " + CONFIG.VERSION + "\nShards configured: " + CONFIG.SHARD_COUNT);
		newEmbed.addField("Uptime Information", "Time since last disconnect: " + UTILS.round(client.uptime / 3600000.0, 2) + " hours\nTime since last restart: " + UTILS.round(process.uptime() / 3600.0, 2) + " hours\nIAPI time since last restart: " + UTILS.round(iapi_stats.uptime / 3600.0, 2) + " hours");
		newEmbed.addField("Discord Load", "Guilds: " + c_eval[0] + "\nUsers: " + c_eval[1] + "\nMembers: " + c_eval[2] + "\nBanned Servers: " + serverbans + "\nBanned Users: " + userbans);
		newEmbed.setColor(255);
		return newEmbed;
	}
}

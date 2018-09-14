"use strict";
let embedgenerator = new (require("./embedgenerator.js"))();
let textgenerator = new (require("./textgenerator.js"))();
let child_process = require("child_process");
const UTILS = new (require("../utils.js"))();
let LOLAPI = require("./lolapi.js");
let Profiler = require("../timeprofiler.js");
module.exports = function (CONFIG, client, msg, wsapi, sendToChannel, preferences, ACCESS_LEVEL) {
	if (msg.author.bot || msg.author.id === client.user.id) return;//ignore all messages from [BOT] users and own messages
	if (UTILS.exists(msg.guild) && !msg.channel.permissionsFor(client.user).has(["VIEW_CHANNEL", "SEND_MESSAGES"])) return;//dont read messages that can't be responded to
	if (!UTILS.exists(CONFIG.BANS) || !UTILS.exists(CONFIG.BANS.USERS) || !UTILS.exists(CONFIG.BANS.SERVERS)) return UTILS.output("message " + msg.id + " could not be processed because ban data has not been loaded yet");
	if (UTILS.exists(CONFIG.BANS.USERS[msg.author.id]) && (CONFIG.BANS.USERS[msg.author.id] == 0 || CONFIG.BANS.USERS[msg.author.id] > msg.createdTimestamp)) return;//ignore messages from banned users
	if (UTILS.exists(msg.guild) && UTILS.exists(CONFIG.BANS.SERVERS[msg.guild.id])) {
		if (CONFIG.BANS.SERVERS[msg.guild.id] == 0) {//permanent ban
			reply(":no_entry: This server is banned from using SupportBot. Please visit " + CONFIG.HELP_SERVER_INVITE_LINK + " for assistance.", () => {
				msg.guild.leave().catch(console.error);//leave server
			}, () => {
				msg.guild.leave().catch(console.error);//leave server
			});
		}
		else if (CONFIG.BANS.SERVERS[msg.guild.id] > msg.createdTimestamp);//temporary ban
		return;
	}//ignore messages from banned servers

	const msg_receive_time = new Date().getTime();
	let request_profiler = new Profiler("r#" + msg.id)
	let lolapi = new LOLAPI(CONFIG, msg.id);
	request_profiler.mark("lolapi instantiated");

	command(["supportbotprefix "], true, CONFIG.CONSTANTS.ADMINISTRATORS, (original, index, parameter) => {
		const candidate = parameter.trim().toLowerCase();
		if (candidate.length > 100) return reply(":x: This prefix is too long.");
		preferences.set("prefix", candidate).then(() => reply(":white_check_mark: The prefix was set to " + candidate)).catch(reply);
	});
	command(["supportbotprefix"], false, CONFIG.CONSTANTS.ADMINISTRATORS, (original, index) => {
		preferences.set("prefix", "").then(() => reply(":white_check_mark: Prefixless operation enabled")).catch(reply);
	});
	command([preferences.get("prefix") + "owner", preferences.get("prefix") + "owners"], false, false, (original, index) => {
		reply(textgenerator.owners(CONFIG));
	});
	//respondable server message or PM
	command([preferences.get("prefix") + "banuser "], true, CONFIG.CONSTANTS.BOTOWNERS, (original, index, parameter) => {
		//Lbanuser <uid> <duration> <reason>
		const id = parameter.substring(0, parameter.indexOf(" "));
		const reason = parameter.substring(UTILS.indexOfInstance(parameter, " ", 2) + 1);
		let duration = parameter.substring(UTILS.indexOfInstance(parameter, " ", 1) + 1, UTILS.indexOfInstance(parameter, " ", 2));
		duration = duration == "0" ? duration = 0 : UTILS.durationParse(duration);
		if (isNaN(duration)) return reply(":x: The duration is invalid.");
		const end_date = duration == 0 ? 0 : new Date().getTime() + duration;
		if (id.length < 1 || reason.length < 1 || typeof(duration) != "number") return reply(":x: The id, duration, or reason could not be found.");
		if (id == msg.author.id) return reply(":x: You cannot ban yourself.");
		if (id == client.user.id) return reply(":x: You cannot ban me.");
		if (isOwner(id, false)) return reply(":x: The id you are trying to ban has elevated permissions.");
		lolapi.banUser(id, reason, end_date, msg.author.id, msg.author.tag, msg.author.displayAvatarURL).then(result => {
			sendToChannel(CONFIG.LOG_CHANNEL_ID, ":no_entry: User banned, id " + id + " by " + msg.author.tag + " for : " + reason);
			reply(":no_entry: User banned, id " + id + " by " + msg.author.tag + " for : " + reason);
		}).catch(console.error);
	});
	command([preferences.get("prefix") + "banserver "], true, CONFIG.CONSTANTS.BOTOWNERS, (original, index, parameter) => {
		//Lbanserver <sid> <duration> <reason>
		const id = parameter.substring(0, parameter.indexOf(" "));
		const reason = parameter.substring(UTILS.indexOfInstance(parameter, " ", 2) + 1);
		let duration = parameter.substring(UTILS.indexOfInstance(parameter, " ", 1) + 1, UTILS.indexOfInstance(parameter, " ", 2));
		duration = duration == "0" ? duration = 0 : UTILS.durationParse(duration);
		if (isNaN(duration)) return reply(":x: The duration is invalid.");
		const end_date = duration == 0 ? 0 : new Date().getTime() + duration;
		if (id.length < 1 || reason.length < 1 || typeof(duration) != "number") return reply(":x: The id, duration, or reason could not be found.");
		lolapi.banServer(id, reason, end_date, msg.author.id, msg.author.tag, msg.author.displayAvatarURL).then(result => {
			sendToChannel(CONFIG.LOG_CHANNEL_ID, ":no_entry: Server banned, id " + id + " by " + msg.author.tag + " for " + duration + ": " + reason);
			reply(":no_entry: Server banned, id " + id + " by " + msg.author.tag + " for " + duration + ": " + reason);
		}).catch(console.error);
	});
	command([preferences.get("prefix") + "warnuser "], true, CONFIG.CONSTANTS.BOTOWNERS, (original, index, parameter) => {
		//Lwarnuser <uid> <reason>
		const id = parameter.substring(0, parameter.indexOf(" "));
		const reason = parameter.substring(parameter.indexOf(" ") + 1);
		if (id.length < 1 || reason.length < 1) return reply(":x: The id or the reason could not be found.");
		if (id == msg.author.id) return reply(":x: You cannot warn yourself.");
		if (id == client.user.id) return reply(":x: You cannot warn me.");
		lolapi.warnUser(id, reason, msg.author.id, msg.author.tag, msg.author.displayAvatarURL).then(result => {
			sendToChannel(CONFIG.LOG_CHANNEL_ID, ":warning: User warned, id " + id + " by " + msg.author.tag + ": " + reason);
			reply(":warning: User warned, id " + id + " by " + msg.author.tag + ": " + reason);
		}).catch(console.error);
	});
	command([preferences.get("prefix") + "warnserver "], true, CONFIG.CONSTANTS.BOTOWNERS, (original, index, parameter) => {
		//Lwarnserver <uid> <reason>
		const id = parameter.substring(0, parameter.indexOf(" "));
		const reason = parameter.substring(parameter.indexOf(" ") + 1);
		if (id.length < 1 || reason.length < 1) return reply(":x: The id or the reason could not be found.");
		lolapi.warnServer(id, reason, msg.author.id, msg.author.tag, msg.author.displayAvatarURL).then(result => {
			sendToChannel(CONFIG.LOG_CHANNEL_ID, ":warning: Server warned, id " + id + " by " + msg.author.tag + ": " + reason);
			reply(CONFIG.LOG_CHANNEL_ID, ":warning: Server warned, id " + id + " by " + msg.author.tag + ": " + reason);
		}).catch(console.error);
	});
	command([preferences.get("prefix") + "noteuser "], true, CONFIG.CONSTANTS.BOTOWNERS, (original, index, parameter) => {
		//Lnoteuser <uid> <reason>
		const id = parameter.substring(0, parameter.indexOf(" "));
		const reason = parameter.substring(parameter.indexOf(" ") + 1);
		if (id.length < 1 || reason.length < 1) return reply(":x: The id or the reason could not be found.");
		lolapi.noteUser(id, reason, msg.author.id).then(result => {
			reply(":information_source: User note added, id " + id + " by " + msg.author.tag + ": " + reason);
			sendToChannel(CONFIG.LOG_CHANNEL_ID, ":information_source: User note added, id " + id + " by " + msg.author.tag + ": " + reason);
		}).catch(console.error);
	});
	command([preferences.get("prefix") + "noteserver "], true, CONFIG.CONSTANTS.BOTOWNERS, (original, index, parameter) => {
		//Lnoteserver <sid> <reason>
		const id = parameter.substring(0, parameter.indexOf(" "));
		const reason = parameter.substring(parameter.indexOf(" ") + 1);
		if (id.length < 1 || reason.length < 1) return reply(":x: The id or the reason could not be found.");
		lolapi.noteServer(id, reason, msg.author.id).then(result => {
			reply(":information_source: Server note added, id " + id + " by " + msg.author.tag + ": " + reason);
			sendToChannel(CONFIG.LOG_CHANNEL_ID, ":information_source: Server note added, id " + id + " by " + msg.author.tag + ": " + reason);
		}).catch(console.error);
	});
	command([preferences.get("prefix") + "userhistory "], true, CONFIG.CONSTANTS.BOTOWNERS, (original, index, parameter) => {
		//Luserhistory <uid>
		lolapi.userHistory(parameter).then(results => {
			replyEmbed(embedgenerator.disciplinaryHistory(CONFIG, parameter, true, results[parameter]));
		}).catch();
	});
	command([preferences.get("prefix") + "serverhistory "], true, CONFIG.CONSTANTS.BOTOWNERS, (original, index, parameter) => {
		//Lserverhistory <sid>
		lolapi.serverHistory(parameter).then(results => {
			replyEmbed(embedgenerator.disciplinaryHistory(CONFIG, parameter, false, results[parameter]));
		}).catch();
	});
	command([preferences.get("prefix") + "unbanserver "], true, CONFIG.CONSTANTS.BOTOWNERS, (original, index, parameter) => {
		//Lunbanserver <sid>
		lolapi.unbanServer(parameter, msg.author.id, msg.author.tag, msg.author.displayAvatarURL).then(result => {
			reply(":no_entry_sign: Server unbanned, id " + parameter + " by " + msg.author.tag);
			sendToChannel(CONFIG.LOG_CHANNEL_ID, ":no_entry_sign: Server unbanned, id " + parameter + " by " + msg.author.tag);
		}).catch(console.error);
	});
	command([preferences.get("prefix") + "unbanuser "], true, CONFIG.CONSTANTS.BOTOWNERS, (original, index, parameter) => {
		//Lunbanuser <uid>
		lolapi.unbanUser(parameter, msg.author.id, msg.author.tag, msg.author.displayAvatarURL).then(result => {
			reply(":no_entry_sign: User unbanned, id " + parameter + " by " + msg.author.tag);
			sendToChannel(CONFIG.LOG_CHANNEL_ID, ":no_entry_sign: User unbanned, id " + parameter + " by " + msg.author.tag);
		}).catch(console.error);
	});
	command([preferences.get("prefix") + "actionreport "], true, CONFIG.CONSTANTS.BOTOWNERS, (original, index, parameter) => {
		//Lactionreport <uid>
		if (!UTILS.exists(CONFIG.OWNER_DISCORD_IDS[parameter])) return reply(":x: This user is not a current or previously registered admin.");
		lolapi.getActions(parameter).then(results => {
			replyEmbed(embedgenerator.actionReport(CONFIG, parameter, results[parameter]));
		}).catch();
	});
	command([preferences.get("prefix") + "permissionstest", preferences.get("prefix") + "pt"], false, false, () => {
		reply("You have " + (isOwner(undefined, false) ? "owner" : "normal") + " permissions.");
	});
	command([preferences.get("prefix") + "permissionstest ", preferences.get("prefix") + "pt "], true, false, () => {
		if (msg.mentions.users.size != 1) return reply(":x: A user must be mentioned.");
		reply(msg.mentions.users.first().tag + " has " + (isOwner(msg.mentions.users.first().id, false) ? "owner" : "normal") + " permissions.");
	});
	command([preferences.get("prefix") + "stats"], false, CONFIG.CONSTANTS.BOTOWNERS, () => {
		reply("This is shard " + process.env.SHARD_ID);
	});
	command([preferences.get("prefix") + "ping"], false, false, () => {
		reply("command to response time: ", nMsg => textgenerator.ping_callback(msg, nMsg));
	});
	command(["iping"], false, false, () => {
		lolapi.ping().then(times => reply(textgenerator.internal_ping(times))).catch(console.error);
	});
	command([preferences.get("prefix") + "ping "], true, false, function (original, index, parameter) {
		reply("you said: " + parameter);
	});
	command([preferences.get("prefix") + "eval "], true, CONFIG.CONSTANTS.BOTOWNERS, function (original, index, parameter) {
		try {
			reply("```" + eval(parameter) + "```");
		}
		catch (e) {
			reply("```" + e + "```");
		}
	});
	command(["iapi eval "], true, CONFIG.CONSTANTS.BOTOWNERS, (original, index, parameter) => {
		lolapi.IAPIEval(parameter).then(result => reply("```" + result.string + "```")).catch(console.error);
	});
	command([preferences.get("prefix") + "notify "], true, CONFIG.CONSTANTS.BOTOWNERS, (original, index, parameter) => {
		wsapi.lnotify(msg.author.username, msg.author.displayAvatarURL, parameter);
	});
	command([preferences.get("prefix") + "testembed"], false, false, () => {
		replyEmbed(embedgenerator.test());
	});
	command([preferences.get("prefix") + "sd ", preferences.get("prefix") + "summonerdebug "], true, false, (original, index, parameter) => {
		lolapi.getSummonerIDFromName(assertRegion(parameter.substring(0, parameter.indexOf(" "))), parameter.substring(parameter.indexOf(" ") + 1), CONFIG.API_MAXAGE.SD).then(result => {
			result.guess = parameter.substring(parameter.indexOf(" ") + 1);
			replyEmbed(embedgenerator.summoner(CONFIG, result));
		}).catch(console.error);
	});
	command([preferences.get("prefix") + "link "], true, false, (original, index, parameter) => {
		let region = assertRegion(parameter.substring(0, parameter.indexOf(" ")));
		if (msg.mentions.users.size == 0) {
			lolapi.getSummonerIDFromName(region, parameter.substring(parameter.indexOf(" ") + 1), CONFIG.API_MAXAGE.LINK).then(summoner => {
				summoner.region = region;
				summoner.guess = parameter.substring(parameter.indexOf(" ") + 1);
				if (UTILS.exists(summoner.status)) return reply(":x: The username appears to be invalid.");
				lolapi.setLink(msg.author.id, summoner.name).then(result => {
					result.success ? reply(":white_check_mark: Your discord account is now linked to " + summoner.name) : reply(":x: Something went wrong.");
				}).catch(console.error);
			}).catch(console.error);
		}
		else if (msg.mentions.users.size == 1 && isOwner()) {
			lolapi.getSummonerIDFromName(region, parameter.substring(parameter.indexOf(" ") + 1, parameter.indexOf(" <")), CONFIG.API_MAXAGE.LINK).then(summoner => {
				summoner.region = region;
				summoner.guess = parameter.substring(parameter.indexOf(" ") + 1, parameter.indexOf(" <"));
				if (UTILS.exists(summoner.status)) return reply(":x: The username appears to be invalid. Follow the format: `" + preferences.get("prefix") + "link <region> <username> <@mention>`");
				lolapi.setLink(msg.mentions.users.first().id, summoner.name).then(result => {
					result.success ? reply(":white_check_mark: " + msg.mentions.users.first().tag + "'s discord account is now linked to " + summoner.name) : reply(":x: Something went wrong.");
				}).catch(console.error);
			}).catch(console.error);
		}
	});
	command([preferences.get("prefix") + "unlink", preferences.get("prefix") + "removelink"], false, false, (original, index) => {
		lolapi.setLink(msg.author.id, "").then(result => {
			result.success ? reply(":white_check_mark: Your discord account is no longer associated with any username. We'll try to use your discord username when you use a username-optional LoL stats command.") : reply(":x: Something went wrong.");
		}).catch(console.error);
	});
	command([preferences.get("prefix") + "unlink ", preferences.get("prefix") + "removelink "], true, CONFIG.CONSTANTS.BOTOWNERS, (original, index) => {
		if (!UTILS.exists(msg.mentions.users.first())) return reply(":x: No user mention specified.");
		lolapi.setLink(msg.mentions.users.first().id, "").then(result => {
			result.success ? reply(":white_check_mark: " + msg.mentions.users.first().tag + "'s discord account is no longer associated with any username.") : reply(":x: Something went wrong.");
		}).catch(console.error);
	});
	command([preferences.get("prefix") + "gl", preferences.get("prefix") + "getlink"], false, false, (original, index) => {
		lolapi.getLink(msg.author.id).then(result => {
			if (UTILS.exists(result.username) && result.username != "") reply(":white_check_mark: You're `" + result.username + "`");
			else reply(":x: No records for user id " + msg.author.id);
		}).catch(console.error);
	});
	command([preferences.get("prefix") + "gl ", preferences.get("prefix") + "getlink "], true, CONFIG.CONSTANTS.BOTOWNERS, (original, index) => {
		if (!UTILS.exists(msg.mentions.users.first())) return reply(":x: No user mention specified.");
		lolapi.getLink(msg.mentions.users.first().id).then(result => {
			if (UTILS.exists(result.username) && result.username != "") reply(":white_check_mark: " + msg.mentions.users.first().tag + " is `" + result.username + "`");
			else reply(":x: No records for user id " + msg.mentions.users.first().id);
		}).catch(console.error);
	});
	command([preferences.get("prefix") + "invite"], false, false, (original, index) => {
		reply("This is the link to add SupportBot to other servers: <" + CONFIG.BOT_ADD_LINK + ">\nAdding it requires the \"Manage Server\" permission.");
	});
	command([preferences.get("prefix") + "help"], false, false, (original, index) => {
		reply(":white_check_mark: A PM has been sent to you with information on how to use SupportBot.");
		replyEmbedToAuthor(embedgenerator.help(CONFIG));
	});
	command([preferences.get("prefix") + "setshortcut ", preferences.get("prefix") + "ss ", preferences.get("prefix") + "createshortcut ", preferences.get("prefix") + "addshortcut "], true, false, (original, index, parameter) => {
		if (parameter[0] !== "$") return reply(":x: The shortcut must begin with an `$`. Please try again.");
		if (parameter.indexOf(" ") === -1) return reply(":x: The shortcut word and the username must be separated by a space. Please try again.");
		if (parameter.length > 60) return reply(":x: The shortcut name or the username is too long.");
		const from = parameter.substring(1, parameter.indexOf(" ")).toLowerCase();
		if (from.length === 0) return reply(":x: The shortcut name was not specified. Please try again.");
		const to = parameter.substring(parameter.indexOf(" ") + 1);
		if (to.length === 0) return reply(":x: The username was not specified. Please try again.");
		lolapi.createShortcut(msg.author.id, from, to).then(result => {
			if (result.success) reply(":white_check_mark: `$" + from + "` will now point to `" + to + "`.");
			else reply(":x: You can only have up to 50 shortcuts. Please remove some and try again.");
		}).catch(console.error);
	});
	command([preferences.get("prefix") + "removeshortcut ", preferences.get("prefix") + "rs ", preferences.get("prefix") + "deleteshortcut ", preferences.get("prefix") + "ds "], true, false, (original, index, parameter) => {
		if (parameter[0] !== "$") return reply(":x: The shortcut must begin with an `$`. Please try again.");
		const from = parameter.substring(1).toLowerCase();
		if (from.length === 0) return reply(":x: The shortcut name was not specified. Please try again.");
		lolapi.removeShortcut(msg.author.id, from).then(result => {
			if (result.success) reply(":white_check_mark: `$" + from + "` removed (or it did not exist already).");
		}).catch(console.error);
	});
	command([preferences.get("prefix") + "shortcuts", preferences.get("prefix") + "shortcut"], false, false, (original, index) => {
		lolapi.getShortcuts(msg.author.id).then(result => {
			reply(textgenerator.shortcuts(CONFIG, result));
		}).catch(console.error);
	});
	command([preferences.get("prefix") + "removeallshortcuts"], false, false, (original, index) => {
		lolapi.removeAllShortcuts(msg.author.id).then(result => {
			reply(":white_check_mark: All shortcuts were removed.")
		}).catch(console.error);
	});
	if (preferences.get("auto_opgg")) {
		command(["http://"], true, false, (original, index, parameter) => {
			const region = assertRegion(parameter.substring(0, parameter.indexOf(".")), false);
			if (parameter.substring(parameter.indexOf(".") + 1, parameter.indexOf(".") + 6) == "op.gg") {
				let username = decodeURIComponent(msg.content.substring(msg.content.indexOf("userName=") + "userName=".length));
				lolapi.getSummonerCard(region, username).then(result => {
					replyEmbed(embedgenerator.detailedSummoner(CONFIG, result[0], result[1], result[2], parameter.substring(0, parameter.indexOf(".")), result[3]));
				}).catch();
			}
		});
	}
	command(forcePrefix(["service status ", "servicestatus ", "ss ", "status "]), true, false, (original, index, parameter) => {
		let region = assertRegion(parameter);
		lolapi.getStatus(region, 60).then((status_object) => {
			replyEmbed(embedgenerator.status(status_object));
		}).catch(console.error);
	});
	commandGuessUsername(forcePrefix([""]), false, (region, username, parameter, guess_method) => {
		lolapi.getSummonerCard(region, username).then(result => {
			replyEmbed(embedgenerator.detailedSummoner(CONFIG, result[0], result[1], result[2], CONFIG.REGIONS_REVERSE[region], result[3], result[4]));
		}).catch(e => {
			if (UTILS.exists(e)) console.error(e);
			reply(":x: No results for `" + username + "`." + suggestLink(guess_method));
		});
	});
	commandGuessUsername(forcePrefix(["mh ", "matchhistory "]), false, (region, username, parameter, guess_method) => {
		request_profiler.mark("mh command recognized");
		lolapi.getSummonerIDFromName(region, username, CONFIG.API_MAXAGE.MH.SUMMONER_ID).then(result => {
			result.region = region;
			if (!UTILS.exists(result.accountId)) return reply(":x: No recent matches found for `" + username + "`." + suggestLink(guess_method));
			lolapi.getRecentGames(region, result.accountId, CONFIG.API_MAXAGE.MH.RECENT_GAMES).then(matchhistory => {
				if (!UTILS.exists(matchhistory.matches) || matchhistory.matches.length == 0) return reply("No recent matches found for `" + username + "`." + suggestLink(guess_method));
				lolapi.getMultipleMatchInformation(region, matchhistory.matches.map(m =>  m.gameId), CONFIG.API_MAXAGE.MH.MULTIPLE_MATCH).then(matches => {
					request_profiler.begin("generating embed");
					const answer = embedgenerator.match(CONFIG, result, matchhistory.matches, matches);
					request_profiler.end("generating embed");
					UTILS.debug(request_profiler.endAll());
					replyEmbed(answer);
				}).catch(console.error);
			}).catch(console.error);
		}).catch(console.error);
	});
	command(forcePrefix(["compare ", "multi ", "m ", "c "]), true, false, (original, index, parameter) => {
		request_profiler.mark("multi command recognized");
		request_profiler.begin("parsing usernames");
		let region = assertRegion(parameter.substring(0, parameter.indexOf(" ")), index < 2);
		let pre_usernames;
		if (parameter.indexOf("\n") != -1) pre_usernames = UTILS.presentLobby(parameter.substring(parameter.indexOf(" ") + 1).split("\n"));//lobby text formatting
		else if (parameter.indexOf(",") != -1) pre_usernames = parameter.substring(parameter.indexOf(" ") + 1).split(",").map(s => s.trim());//CSV
		else pre_usernames = [parameter.substring(parameter.indexOf(" ") + 1)];//single username
		if (pre_usernames.length > 10) {
			reply(":warning: There are too many usernames to get data for. Only the first 10 results will be displayed.");
			pre_usernames = pre_usernames.slice(0, 10);
		}
		if (pre_usernames.length < 1) return reply(":x: There are not enough usernames to get data for.");
		request_profiler.end("parsing usernames");
		UTILS.debug(request_profiler.endAll());
		Promise.all(pre_usernames.map(u => {
			return new Promise((resolve, reject) => {
				if (u[0] !== "$") resolve(u);
				else {
					lolapi.getShortcut(msg.author.id, u.substring(1)).then(result => {
						resolve(result[u.substring(1)]);
					}).catch(result => {
						resolve(u.substring(1));
					});
				}
			});
		})).then(usernames => {
			lolapi.getMultipleSummonerIDFromName(region, usernames, CONFIG.API_MAXAGE.MULTI.MULTIPLE_SUMMONER_ID).then(summoners => {
				const ids = summoners.map(s => s.id);
				lolapi.getMultipleRanks(region, ids, CONFIG.API_MAXAGE.MULTI.MULTIPLE_RANKS).then(ranks => {
					lolapi.getMultipleChampionMastery(region, ids, CONFIG.API_MAXAGE.MULTI.MULTIPLE_MASTERIES).then(masteries => {
						lolapi.getMultipleRecentGames(region, summoners.map(s => s.accountId), CONFIG.API_MAXAGE.MULTI.MULTIPLE_RECENT_GAMES).then(mhA => {
							let mIDA = [];//match id array;
							for (let b in mhA) for (let c in mhA[b].matches) if (mIDA.indexOf(mhA[b].matches[c].gameId) == -1) mIDA.push(mhA[b].matches[c].gameId);
							lolapi.getMultipleMatchInformation(region, mIDA, CONFIG.API_MAXAGE.MULTI.MULTIPLE_MATCH).then(matches => {
								replyEmbed(embedgenerator.multiSummoner(CONFIG, CONFIG.REGIONS_REVERSE[region], summoners, ranks, masteries, mhA, matches));
							}).catch(console.error);
						}).catch(console.error);
					}).catch(console.error);
				}).catch(console.error);
			}).catch(console.error);
		}).catch(console.error);
	});
	command(forcePrefix(["fairteamgenerator ", "teamgenerator ", "tg ", "ftg ", "ftgd ", "tgd "]), true, false, (original, index, parameter) => {
		const debug_mode = index > 3;
		request_profiler.mark("ftg command recognized");
		request_profiler.begin("parsing usernames");
		let region = assertRegion(parameter.substring(0, parameter.indexOf(" ")), index < 2);
		let pre_usernames;
		if (parameter.indexOf("\n") != -1) pre_usernames = UTILS.presentLobby(parameter.substring(parameter.indexOf(" ") + 1).split("\n"));//lobby text formatting
		else if (parameter.indexOf(",") != -1) pre_usernames = parameter.substring(parameter.indexOf(" ") + 1).split(",").map(s => s.trim());//CSV
		else pre_usernames = [parameter.substring(parameter.indexOf(" ") + 1)];//single username
		if (pre_usernames.length > 10) {
			reply(":warning: There are too many usernames to get data for. Only the first 10 results will be displayed.");
			pre_usernames = pre_usernames.slice(0, 10);
		}
		if (pre_usernames.length < 3) return reply(":x: There are not enough usernames to get data for.");
		request_profiler.end("parsing usernames");
		request_profiler.begin("api requests");
		Promise.all(pre_usernames.map(u => {
			return new Promise((resolve, reject) => {
				if (u[0] !== "$") resolve(u);
				else {
					lolapi.getShortcut(msg.author.id, u.substring(1)).then(result => {
						resolve(result[u.substring(1)]);
					}).catch(result => {
						resolve(u.substring(1));
					});
				}
			});
		})).then(usernames => {
			lolapi.getMultipleSummonerIDFromName(region, usernames, CONFIG.API_MAXAGE.FTG.MULTIPLE_SUMMONER_ID).then(summoners => {
				const ids = summoners.map(s => s.id);
				lolapi.getMultipleRanks(region, ids, CONFIG.API_MAXAGE.FTG.MULTIPLE_RANKS).then(ranks => {
					lolapi.getMultipleChampionMastery(region, ids, CONFIG.API_MAXAGE.FTG.MULTIPLE_MASTERIES).then(masteries => {
						request_profiler.end("api requests");
						request_profiler.begin("generate embed");
						replyEmbed(embedgenerator.fairTeam(CONFIG, CONFIG.REGIONS_REVERSE[region], summoners, ranks, masteries, debug_mode));
						request_profiler.end("generate embed");
						UTILS.debug(request_profiler.endAll());
					}).catch(console.error);
				}).catch(console.error);
			}).catch(console.error);
		}).catch(console.error);
	});
	commandGuessUsername(forcePrefix(["lg ", "livegame ", "cg ", "currentgame ", "livematch ", "lm ", "currentmatch ", "cm "]), false, (region, username, parameter) => {//new
		request_profiler.mark("lg command recognized");
		//reply(":warning:We are processing the latest information for your command: if this message does not update within 5 minutes, try the same command again. Thank you for your patience.", nMsg => {
		lolapi.getSummonerIDFromName(region, username, CONFIG.API_MAXAGE.LG.SUMMONER_ID).then(result => {
			result.region = region;
			result.guess = username;
			if (!UTILS.exists(result.id)) return reply(":x: No username found for `" + username + "`." + suggestLink(guess_method));
			lolapi.getLiveMatch(region, result.id, CONFIG.API_MAXAGE.LG.LIVE_MATCH).then(match => {
				if (UTILS.exists(match.status)) return reply(":x: No current matches found for `" + username + "`." + suggestLink(guess_method));
				lolapi.getMultipleSummonerFromSummonerID(region, match.participants.map(p => p.summonerId), CONFIG.API_MAXAGE.LG.OTHER_SUMMONER_ID).then(pSA => {//participant summoner array
					lolapi.getMultipleRecentGames(region, pSA.map(pS => pS.accountId), CONFIG.API_MAXAGE.LG.RECENT_GAMES).then(mhA => {//matchhistory array
						let mIDA = [];//match id array;
						for (let b in mhA) for (let c in mhA[b].matches) if (mIDA.indexOf(mhA[b].matches[c].gameId) == -1) mIDA.push(mhA[b].matches[c].gameId);
						lolapi.getMultipleMatchInformation(region, mIDA, CONFIG.API_MAXAGE.LG.MULTIPLE_MATCH).then(matches => {
							lolapi.getMultipleRanks(region, pSA.map(p => p.id), CONFIG.API_MAXAGE.LG.MULTIPLE_RANKS).then(ranks => {
								lolapi.getMultipleChampionMastery(region, pSA.map(p => p.id), CONFIG.API_MAXAGE.LG.MULTIPLE_MASTERIES).then(masteries => {
									//nMsg.edit("", { embed: embedgenerator.liveMatchPremade(CONFIG, result, match, matches, ranks, masteries, pSA) }).catch();
									request_profiler.begin("generating embed");
									const newEmbed = embedgenerator.liveMatchPremade(CONFIG, result, match, matches, ranks, masteries, pSA);
									request_profiler.end("generating embed");
									UTILS.debug(request_profiler.endAll());
									replyEmbed(newEmbed, () => {
										//replyEmbed(embedgenerator.liveMatchPremade(CONFIG, result, match, matches, ranks, masteries, pSA, false, true));
									});
									//replyEmbed(embedgenerator.liveMatchPremade(CONFIG, result, match, matches, ranks, masteries, pSA, false));//untrimmed output
								}).catch();
							}).catch();
						});
					}).catch(console.error);
				}).catch(console.error);
			}).catch(console.error);
		}).catch(console.error);
		//});
	});
	commandGuessUsernameNumber(forcePrefix(["mh", "matchhistory"]), false, (region, username, number, guess_method) => {
		request_profiler.mark("dmh command recognized");
		lolapi.getSummonerIDFromName(region, username, CONFIG.API_MAXAGE.DMH.SUMMONER_ID).then(result => {
			result.region = region;
			result.guess = username;
			if (!UTILS.exists(result.accountId)) return reply(":x: No recent matches found for `" + username + "`." + suggestLink(guess_method));
			lolapi.getRecentGames(region, result.accountId, CONFIG.API_MAXAGE.DMH.RECENT_GAMES).then(matchhistory => {
				if (!UTILS.exists(matchhistory.matches) || matchhistory.matches.length == 0) return reply(":x: No recent matches found for `" + username + "`." + suggestLink(guess_method));
				if (number < 1 || number > 20 || !UTILS.exists(matchhistory.matches[number - 1])) return reply(":x: This number is out of range.");
				lolapi.getMatchInformation(region, matchhistory.matches[number - 1].gameId, CONFIG.API_MAXAGE.DMH.MATCH_INFORMATION).then(match => {
					const pIDA = match.participantIdentities.map(pI => {
						if (UTILS.exists(pI.player.summonerId)) return pI.player.summonerId;
						else return null;//bot account
					});//participant (summoner) ID array
					lolapi.getMultipleRanks(region, pIDA, CONFIG.API_MAXAGE.DMH.MULTIPLE_RANKS).then(ranks => {
						lolapi.getMultipleChampionMastery(region, pIDA, CONFIG.API_MAXAGE.DMH.MULTIPLE_MASTERIES).then(masteries => {
							lolapi.getMultipleSummonerFromSummonerID(region, pIDA, CONFIG.API_MAXAGE.DMH.OTHER_SUMMONER_ID).then(pSA => {
								request_profiler.begin("generating embed");
								const answer = embedgenerator.detailedMatch(CONFIG, result, matchhistory.matches[number - 1], match, ranks, masteries, pSA);
								request_profiler.end("generating embed");
								UTILS.debug(request_profiler.endAll());
								replyEmbed(answer);
							});
						});
					}).catch();
				}).catch(console.error);
			}).catch(console.error);
		}).catch(console.error);
	});
	commandGuessUsername(forcePrefix(["championmastery ", "mastery "]), false, (region, username, parameter) => {
		lolapi.getSummonerIDFromName(region, username, CONFIG.API_MAXAGE.CM.SUMMONER_ID).then(result => {
			lolapi.getChampionMastery(region, result.id, CONFIG.API_MAXAGE.CM.CHAMPION_MASTERY).then(cm => {
				replyEmbed(embedgenerator.mastery(CONFIG, result, cm, CONFIG.REGIONS_REVERSE[region]));
			}).catch(console.error);
		}).catch(console.error);
	});
	/*
	commandGuessUsername(["mmr "], false, (region, username, parameter) => {
		lolapi.getSummonerIDFromName(region, username).then(result => {
			result.region = region;
			lolapi.getMMR(region, result.id).then(mmr => {
				replyEmbed(embedgenerator.mmr(CONFIG, result, mmr));
			}).catch();
		});
	});*/

	if (UTILS.exists(msg.guild)) {//respondable server message only
		command([preferences.get("prefix") + "shutdown"], false, CONFIG.CONSTANTS.BOTOWNERS, () => {
			reply(":white_check_mark: shutdown initiated", shutdown, shutdown);
		});
		command([preferences.get("prefix") + "restart"], false, CONFIG.CONSTANTS.BOTOWNERS, () => {
			reply(":white_check_mark: restart initiated", restart, restart);
		});
		/*
		command([preferences.get("prefix") + "refresh", preferences.get("prefix") + "clearcache"], false, CONFIG.CONSTANTS.BOTOWNERS, () => {
			reply(":white_check_mark: restart initiated + clearing cache", step2, step2);
			function step2() {
				lolapi.clearCache();
				restart();
			}
		});*/
		command([preferences.get("prefix") + "setting auto-opgg on", preferences.get("prefix") + "setting auto-opgg off"], false, CONFIG.CONSTANTS.MODERATORS, (original, index) => {
			const new_setting = index === 0 ? true : false;
			UTILS.debug("index is " + index + ", type of index is " + typeof(index) + ", new_setting is " + new_setting);
			preferences.set("auto_opgg", new_setting).then(() => reply(":white_check_mark: " + (new_setting ? "SupportBot will automatically show summoner information when an op.gg link is posted." : "SupportBot will not show summoner information when an op.gg link is posted."))).catch(reply);
		});
		command([preferences.get("prefix") + "setting force-prefix on", preferences.get("prefix") + "setting force-prefix off"], false, CONFIG.CONSTANTS.ADMINISTRATORS, (original, index) => {
			const new_setting = index === 0 ? true : false;
			UTILS.debug("index is " + index + ", type of index is " + typeof(index) + ", new_setting is " + new_setting);
			preferences.set("force_prefix", new_setting).then(() => reply(":white_check_mark: " + (new_setting ? "SupportBot will require prefixes on all LoL commands." : "SupportBot will not require prefixes on all LoL commands."))).catch(reply);
		});
	}
	else {//PM/DM only
	}

	function command(trigger_array,//array of command aliases, prefix needs to be included
		parameters_expected,//boolean
		elevated_permissions,//requires owner permissions
		callback) {//optional callback only if successful
		for (let i = 0; i < trigger_array.length; ++i) {
			if (parameters_expected && msg.content.trim().toLowerCase().substring(0, trigger_array[i].length) === trigger_array[i].toLowerCase()) {
				if (elevated_permissions && !is(elevated_permissions)) return false;
				else {
					if (elevated_permissions === CONFIG.CONSTANTS.BOTOWNERS) sendToChannel(CONFIG.LOG_CHANNEL_ID, msg.author.tag + " used " + msg.cleanContent);
					if (UTILS.exists(callback)) {
						try {
							callback(trigger_array[i], i, msg.content.trim().substring(trigger_array[i].length));
						}
						catch (e) {
							console.error(e);
						}
					}
				}
			}
			else if (!parameters_expected && msg.content.trim().toLowerCase() === trigger_array[i].toLowerCase()) {
				if (elevated_permissions && !is(elevated_permissions)) return false;
				else {
					if (elevated_permissions === CONFIG.CONSTANTS.BOTOWNERS) sendToChannel(CONFIG.LOG_CHANNEL_ID, msg.author.tag + " used " + msg.cleanContent);
					if (UTILS.exists(callback)) {
						try {
							callback(trigger_array[i], i);
						}
						catch (e) {
							console.error(e);
						}
					}
				}
			}
		}
	}

	function commandGuessUsername(trigger_array,//array of command aliases, prefix needs to be included
		elevated_permissions,//requires owner permissions
		callback) {//optional callback only if successful
		/*returns (region, username, parameter, username guess method)
		username guess method 0: username provided
		username guess method 1: shortcut provided
		username guess method 2: link
		username guess method 3: implicit discord username
		username guess method 4: explicit discord mention
		username guess method 5: recently used command
		*/
		command(trigger_array, true, elevated_permissions, (original, index, parameter) => {
			try {//username explicitly provided
				const region = assertRegion(parameter.substring(0, parameter.indexOf(" ")), false);//see if there is a region
				if (parameter.substring(parameter.indexOf(" ") + 1).length < 35) {//longest query should be less than 35 characters
					if (msg.mentions.users.size == 1) {
						lolapi.getLink(msg.mentions.users.first().id).then(result => {
							let username = msg.mentions.users.first().username;//suppose the link doesn't exist in the database
							if (UTILS.exists(result.username) && result.username != "") username = result.username;//link exists
							callback(region, username, parameter, 4);
						}).catch(console.error);
					}
					else if (parameter.substring(parameter.indexOf(" ") + 1)[0] == "$") {
						lolapi.getShortcut(msg.author.id, parameter.substring(parameter.indexOf(" ") + 1).toLowerCase().substring(1)).then(result => {
							callback(region, result[parameter.substring(parameter.indexOf(" ") + 1).toLowerCase().substring(1)], parameter.substring(0, parameter.indexOf(" ")), 1);
						}).catch(e => {
							if (e) reply(":x: An error has occurred. The shortcut may not exist.");
						});
					}
					else if (parameter.substring(parameter.indexOf(" ") + 1) == "^") {
						msg.channel.fetchMessages({ before: msg.id, limit: 30 }).then(msgs => {
							msgs = msgs.array();
							let username;
							for (let i = 0; i < msgs.length; ++i) {
								if (msgs[i].author.id == client.user.id && //message was sent by bot
									msgs[i].embeds.length == 1 && //embedded response
									UTILS.exists(msgs[i].embeds[0].author) && //author present
									UTILS.exists(msgs[i].embeds[0].author.url) && //url present
									msgs[i].embeds[0].author.url.substring(msgs[i].embeds[0].author.url.indexOf(".") + 1, msgs[i].embeds[0].author.url.indexOf(".") + 25) == "op.gg/summoner/userName=") {//http://na.op.gg/summoner/userName=iaace
									username = decodeURIComponent(msgs[i].embeds[0].author.url.substring(msgs[i].embeds[0].author.url.indexOf("/summoner/userName=") + 19));
									break;
								}
							}
							if (!UTILS.exists(username)) reply(":x: Could not find a recent username queried.");
							else callback(region, username, parameter.substring(0, parameter.indexOf(" ")), 5);
						}).catch(console.error);
					}
					else callback(region, parameter.substring(parameter.indexOf(" ") + 1), parameter.substring(0, parameter.indexOf(" ")), 0);
				}
			}
			catch (e) {//username not provided
				try {
					const region = assertRegion(parameter, false);
					lolapi.getLink(msg.author.id).then(result => {
						let username = msg.author.username;//suppose the link doesn't exist in the database
						if (UTILS.exists(result.username) && result.username != "") {
							username = result.username;//link exists
							callback(region, username, parameter, 2);
						}
						else callback(region, username, parameter, 3);
					}).catch(console.error);
				}
				catch (e) { }
			}
		});
	}

	function commandGuessUsernameNumber(trigger_array,//array of command aliases, prefix needs to be included
		elevated_permissions,//requires owner permissions
		callback) {//optional callback only if successful
		/*returns (region, username, number, username guess method)
		username guess method 0: username provided
		username guess method 1: shortcut provided
		username guess method 2: link
		username guess method 3: implicit discord username
		username guess method 4: explicit discord mention
		username guess method 5: recently used command
		*/
		command(trigger_array, true, elevated_permissions, (original, index, parameter) => {
			const number = parseInt(parameter.substring(0, parameter.indexOf(" ")));
			if (isNaN(number)) return;
			try {//username explicitly provided
				const region = assertRegion(parameter.substring(UTILS.indexOfInstance(parameter, " ", 1) + 1, UTILS.indexOfInstance(parameter, " ", 2)), false);//see if there is a region
				if (parameter.substring(UTILS.indexOfInstance(parameter, " ", 2) + 1).length < 35) {//longest query should be less than 35 characters
					if (msg.mentions.users.size == 1) {
						lolapi.getLink(msg.mentions.users.first().id).then(result => {
							let username = msg.mentions.users.first().username;//suppose the link doesn't exist in the database
							if (UTILS.exists(result.username) && result.username != "") username = result.username;//link exists
							callback(region, username, number, 4);
						}).catch(console.error);
					}
					else if (parameter.substring(UTILS.indexOfInstance(parameter, " ", 2) + 1)[0] == "$") {
						lolapi.getShortcut(msg.author.id, parameter.substring(UTILS.indexOfInstance(parameter, " ", 2) + 1).toLowerCase().substring(1)).then(result => {
							callback(region, result[parameter.substring(UTILS.indexOfInstance(parameter, " ", 2) + 1).toLowerCase().substring(1)], number, 1);
						}).catch(e => {
							if (e) reply(":x: An error has occurred. The shortcut may not exist.");
						});
					}
					else if (parameter.substring(UTILS.indexOfInstance(parameter, " ", 2) + 1) == "^") {
						msg.channel.fetchMessages({ before: msg.id, limit: 30 }).then(msgs => {
							msgs = msgs.array();
							let username;
							for (let i = 0; i < msgs.length; ++i) {
								if (msgs[i].author.id == client.user.id && //message was sent by bot
									msgs[i].embeds.length == 1 && //embedded response
									UTILS.exists(msgs[i].embeds[0].author) && //author present
									UTILS.exists(msgs[i].embeds[0].author.url) && //url present
									msgs[i].embeds[0].author.url.substring(msgs[i].embeds[0].author.url.indexOf(".") + 1, msgs[i].embeds[0].author.url.indexOf(".") + 25) == "op.gg/summoner/userName=") {//http://na.op.gg/summoner/userName=iaace
									username = decodeURIComponent(msgs[i].embeds[0].author.url.substring(msgs[i].embeds[0].author.url.indexOf("/summoner/userName=") + 19));
									break;
								}
							}
							if (!UTILS.exists(username)) reply(":x: Could not find a recent username queried.");
							else callback(region, username, number, 5);
						}).catch(console.error);
					}
					else callback(region, parameter.substring(UTILS.indexOfInstance(parameter, " ", 2) + 1), number, 0);
				}
			}
			catch (e) {//username not provided
				try {
					const region = assertRegion(parameter.substring(parameter.indexOf(" ") + 1), false);
					lolapi.getLink(msg.author.id).then(result => {
						let username = msg.author.username;//suppose the link doesn't exist in the database
						if (UTILS.exists(result.username) && result.username != "") {
							username = result.username;//link exists
							callback(region, username, number, 2);
						}
						else callback(region, username, number, 3);
					}).catch(console.error);
				}
				catch (e) { }
			}
		});
	}
	function is(PLEVEL, candidate = msg.author.id, notify = true) {
		if (candidate === msg.author.id) {
			if (ACCESS_LEVEL >= PLEVEL) return true;
			else if (notify) {
				if (PLEVEL === CONFIG.CONSTANTS.BOTOWNERS);//do not notify when this permission fails
				else if (PLEVEL === CONFIG.CONSTANTS.SERVEROWNERS) reply(":x: Server Owner permissions required. You must be the owner of this server to use this command.");
				else if (PLEVEL === CONFIG.CONSTANTS.ADMINISTRATORS) reply(":x: Server Administrator permissions required.");
				else if (PLEVEL === CONFIG.CONSTANTS.MODERATORS) reply(":x: Server Moderator permissions required.");
				else if (PLEVEL === CONFIG.CONSTANTS.BOTCOMMANDERS) reply(":x: Bot Commander permissions required.");
				else;//normal member permissions
			}
			return false;
		}
		else {
			const other_ACCESS_LEVEL = UTILS.accessLevel(CONFIG, msg);
			return other_ACCESS_LEVEL >= PLEVEL;//never notifies
		}
	}
	function isOwner(candidate = msg.author.id, notify = true) {
		const answer = UTILS.exists(CONFIG.OWNER_DISCORD_IDS[candidate]) && CONFIG.OWNER_DISCORD_IDS[candidate].active;
		if (!answer) {
			UTILS.output("insufficient permissions");
			printMessage();
			if (notify) msg.channel.send(":x: Owner permissions required. Ask for help at " + CONFIG.HELP_SERVER_INVITE_LINK + " .").catch(console.error);
		}
		return answer;
	}
	function reply(reply_text, callback, errorCallback) {
		printMessage();
		lolapi.terminate();
		console.log("reply (" + (new Date().getTime() - msg_receive_time) + "ms): " + reply_text + "\n");
		msg.channel.send(reply_text, { split: true }).then((nMsg) => {
			if (UTILS.exists(callback)) callback(nMsg);
		}).catch((e) => {
			console.error(e);
			if (UTILS.exists(errorCallback)) errorCallback(e);
		});
	}

	function replyToAuthor(reply_text, callback, errorCallback) {
		printMessage();
		lolapi.terminate();
		console.log("reply to author (" + (new Date().getTime() - msg_receive_time) + "ms): " + reply_text + "\n");
		msg.author.send(reply_text, { split: true }).then((nMsg) => {
			if (UTILS.exists(callback)) callback(nMsg);
		}).catch((e) => {
			console.error(e);
			if (UTILS.exists(errorCallback)) errorCallback(e);
		});
	}

	function replyEmbed(reply_embed, callback, errorCallback) {
		if (UTILS.exists(msg.guild) && !msg.channel.permissionsFor(client.user).has(["EMBED_LINKS"])) {//doesn't have permission to embed links in server
			lolapi.terminate();
			reply(":x: I cannot respond to your request without the \"embed links\" permission.");
		}
		else {//has permission to embed links, or is a DM/PM
			printMessage();
			lolapi.terminate();
			console.log("reply embedded (" + (new Date().getTime() - msg_receive_time) + "ms)\n");
			msg.channel.send("", { embed: reply_embed }).then((nMsg) => {
				if (UTILS.exists(callback)) callback(nMsg);
			}).catch((e) => {
				console.error(e);
				if (UTILS.exists(errorCallback)) errorCallback(e);
			});
		}
	}

	function replyEmbedToAuthor(reply_embed, callback, errorCallback) {
		printMessage();
		lolapi.terminate();
		console.log("reply embedded to author (" + (new Date().getTime() - msg_receive_time) + "ms)\n");
		msg.author.send("", { embed: reply_embed }).then((nMsg) => {
			if (UTILS.exists(callback)) callback(nMsg);
		}).catch((e) => {
			console.error(e);
			if (UTILS.exists(errorCallback)) errorCallback(e);
		});
	}

	function printMessage() {
		const basic = msg.id + "\ncontent: " + msg.content +
			"\nauthor: " + msg.author.tag + " :: " + msg.author.id +
			"\nchannel: " + msg.channel.name + " :: " + msg.channel.id;
		if (UTILS.exists(msg.guild)) UTILS.output("received server message :: " + basic + "\nguild: " + msg.guild.name + " :: " + msg.guild.id);
		else {
			UTILS.output("received PM/DM message :: " + basic);
		}
	}
	function assertRegion(test_string, notify = true) {
		if (!UTILS.exists(CONFIG.REGIONS[test_string.toUpperCase()])) {
			if (notify) reply(":x: You need to specify a region.");
			throw new Error("Region not specified");
		}
		else {
			return CONFIG.REGIONS[test_string.toUpperCase()];
		}
	}
	function suggestLink(guess_method) {
		return guess_method === 3 ? " We tried using your discord username but could not find a summoner with the same name. Let us know what your LoL username is using `" + CONFIG.DISCORD_COMMAND_PREFIX + "link <region> <ign>` and we'll remember it for next time!" : "";
	}
	function forcePrefix(triggers) {
		return triggers.map(t => preferences.get("force_prefix") ? preferences.get("prefix") + t : t);
	}
	function shutdown() {
		sendToChannel(CONFIG.LOG_CHANNEL_ID, ":x: Shutdown initiated.");
		client.user.setStatus("invisible").then(step2).catch(step2);
		function step2() {
			client.destroy().catch();
			UTILS.output("reached shutdown point");
			setTimeout(function () {
				child_process.spawnSync("pm2", ["stop", "all"]);
			}, 5000);
		}
	}
	function restart() {
		sendToChannel(CONFIG.LOG_CHANNEL_ID, ":repeat: Restart initiated.");
		client.user.setStatus("invisible").then(step2).catch(step2);
		function step2() {
			client.destroy().catch();
			UTILS.output("reached restart point");
			setTimeout(function () {
				child_process.spawnSync("pm2", ["restart", "all"]);
			}, 5000);
		}
	}
}

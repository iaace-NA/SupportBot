"use strict";
let embedgenerator = new (require("./embedgenerator.js"))();
let textgenerator = new (require("./textgenerator.js"))();
let child_process = require("child_process");
const UTILS = new (require("../utils.js"))();
let LOLAPI = require("./lolapi.js");
let Profiler = require("../timeprofiler.js");
module.exports = function (CONFIG, client, msg, wsapi) {
	if (msg.author.bot || msg.author.id === client.user.id) return;//ignore all messages from [BOT] users and own messages
	if (UTILS.exists(msg.guild) && !msg.channel.permissionsFor(client.user).has(["VIEW_CHANNEL", "SEND_MESSAGES"])) return;//dont read messages that can't be responded to
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

	//respondable server message or PM
	command([CONFIG.DISCORD_COMMAND_PREFIX + "banuser "], true, true, (original, index, parameter) => {
		//Lbanuser <uid> <duration> <reason>
		const id = parameter.substring(0, parameter.indexOf(" "));
		const reason = parameter.substring(UTILS.indexOfInstance(parameter, " ", 2) + 1);
		let duration = parameter.substring(UTILS.indexOfInstance(parameter, " ", 1) + 1, UTILS.indexOfInstance(parameter, " ", 2));
		if (duration == "0") duration = 0;
		else {
			let multiplier = duration.substring(duration.length - 1, duration.length);
			if (multiplier == "D") multiplier = 24 * 60 * 60 * 1000;
			else if (multiplier == "H") multiplier = 60 * 60 * 1000;
			else return reply(":x: The duration is invalid.");
			duration = parseInt(duration) * multiplier;
		}
		const end_date = duration == 0 ? 0 : new Date().getTime() + duration;
		if (id.length < 1 || reason.length < 1 || typeof(duration) != "number") return reply(":x: The id, duration, or reason could not be found.");
		if (id == msg.author.id) return reply(":x: You cannot ban yourself.");
		if (id == client.user.id) return reply(":x: You cannot ban me.");
		if (isOwner(id, false)) return reply(":x: The id you are trying to ban has elevated permissions.");
		lolapi.banUser(id, reason, end_date, msg.author.id, msg.author.tag, msg.author.displayAvatarURL).then(result => {
			sendToChannel(CONFIG.LOG_CHANNEL_ID, ":no_entry: User banned, id " + id + " by " + msg.author.tag + " for : " + reason);
		}).catch(console.error);
	});
	command([CONFIG.DISCORD_COMMAND_PREFIX + "banserver "], true, true, (original, index, parameter) => {
		//Lbanserver <sid> <duration> <reason>
		const id = parameter.substring(0, parameter.indexOf(" "));
		const reason = parameter.substring(UTILS.indexOfInstance(parameter, " ", 2) + 1);
		let duration = parameter.substring(UTILS.indexOfInstance(parameter, " ", 1) + 1, UTILS.indexOfInstance(parameter, " ", 2));
		if (duration == "0") duration = 0;
		else {
			let multiplier = duration.substring(duration.length - 1, duration.length);
			if (multiplier == "D") multiplier = 24 * 60 * 60 * 1000;
			else if (multiplier == "H") multiplier = 60 * 60 * 1000;
			else return reply(":x: The duration is invalid.");
			duration = parseInt(duration) * multiplier;
		}
		const end_date = duration == 0 ? 0 : new Date().getTime() + duration;
		if (id.length < 1 || reason.length < 1 || typeof(duration) != "number") return reply(":x: The id, duration, or reason could not be found.");
		lolapi.banServer(id, reason, date, msg.author.id, msg.author.tag, msg.author.displayAvatarURL).then(result => {
			sendToChannel(CONFIG.LOG_CHANNEL_ID, ":no_entry: Server banned, id " + id + " by " + msg.author.tag + ": " + reason);
		}).catch(console.error);
	});
	command([CONFIG.DISCORD_COMMAND_PREFIX + "warnuser "], true, true, (original, index, parameter) => {
		const id = parameter.substring(0, parameter.indexOf(" "));
		const reason = parameter.substring(parameter.indexOf(" ") + 1);
		if (id.length < 1 || reason.length < 1) return reply(":x: The id or the reason could not be found.");
		sendToChannel(CONFIG.LOG_CHANNEL_ID, ":warning: User warned, id " + id + " by " + msg.author.tag + ": " + reason);
	});
	command([CONFIG.DISCORD_COMMAND_PREFIX + "warnserver "], true, true, (original, index, parameter) => {
		const id = parameter.substring(0, parameter.indexOf(" "));
		const reason = parameter.substring(parameter.indexOf(" ") + 1);
		if (id.length < 1 || reason.length < 1) return reply(":x: The id or the reason could not be found.");
		sendToChannel(CONFIG.LOG_CHANNEL_ID, ":warning: User warned, id " + id + " by " + msg.author.tag + ": " + reason);
	});
	command([CONFIG.DISCORD_COMMAND_PREFIX + "noteuser "], true, true, (original, index, parameter) => {
		const id = parameter.substring(0, parameter.indexOf(" "));
		const reason = parameter.substring(parameter.indexOf(" ") + 1);
		if (id.length < 1 || reason.length < 1) return reply(":x: The id or the reason could not be found.");
		sendToChannel(CONFIG.LOG_CHANNEL_ID, ":information_source: User note added, id " + id + " by " + msg.author.tag + ": " + reason);
	});
	command([CONFIG.DISCORD_COMMAND_PREFIX + "noteserver "], true, true, (original, index, parameter) => {
		const id = parameter.substring(0, parameter.indexOf(" "));
		const reason = parameter.substring(parameter.indexOf(" ") + 1);
		if (id.length < 1 || reason.length < 1) return reply(":x: The id or the reason could not be found.");
		sendToChannel(CONFIG.LOG_CHANNEL_ID, ":information_source: User note added, id " + id + " by " + msg.author.tag + ": " + reason);
	});
	command([CONFIG.DISCORD_COMMAND_PREFIX + "userhistory "], true, true, (original, index, parameter) => {
		s
	});
	command([CONFIG.DISCORD_COMMAND_PREFIX + "serverhistory "], true, true, (original, index, parameter) => {
		s
	});
	command([CONFIG.DISCORD_COMMAND_PREFIX + "unbanserver "], true, true, (original, index, parameter) => {
		const id = parameter.substring(0, parameter.indexOf(" "));
		const reason = parameter.substring(parameter.indexOf(" ") + 1);
		if (id.length < 1 || reason.length < 1) return reply(":x: The id or the reason could not be found.");
		sendToChannel(CONFIG.LOG_CHANNEL_ID, ":information_source: User note added, id " + id + " by " + msg.author.tag + ": " + reason);
	});
	command([CONFIG.DISCORD_COMMAND_PREFIX + "unbanuser "], true, true, (original, index, parameter) => {
		const id = parameter.substring(0, parameter.indexOf(" "));
		const reason = parameter.substring(parameter.indexOf(" ") + 1);
		if (id.length < 1 || reason.length < 1) return reply(":x: The id or the reason could not be found.");
		sendToChannel(CONFIG.LOG_CHANNEL_ID, ":information_source: User note added, id " + id + " by " + msg.author.tag + ": " + reason);
	});
	command([CONFIG.DISCORD_COMMAND_PREFIX + "permissionstest", CONFIG.DISCORD_COMMAND_PREFIX + "pt"], false, false, () => {
		reply("You have " + (isOwner(undefined, false) ? "owner" : "normal") + " permissions.");
	});
	command([CONFIG.DISCORD_COMMAND_PREFIX + "permissionstest ", CONFIG.DISCORD_COMMAND_PREFIX + "pt "], true, false, () => {
		if (msg.mentions.users.size != 1) return reply(":x: A user must be mentioned.");
		reply(msg.mentions.users.first().tag + " has " + (isOwner(msg.mentions.users.first().id, false) ? "owner" : "normal") + " permissions.");
	});
	command([CONFIG.DISCORD_COMMAND_PREFIX + "stats"], false, true, () => {
		reply("This is shard " + process.env.SHARD_ID);
	});
	command([CONFIG.DISCORD_COMMAND_PREFIX + "ping"], false, false, () => {
		reply("command to response time: ", nMsg => textgenerator.ping_callback(msg, nMsg));
	});
	command(["iping"], false, false, () => {
		lolapi.ping().then(times => reply(textgenerator.internal_ping(times))).catch(console.error);
	});
	command([CONFIG.DISCORD_COMMAND_PREFIX + "ping "], true, false, function (original, index, parameter) {
		reply("you said: " + parameter);
	});
	command([CONFIG.DISCORD_COMMAND_PREFIX + "eval "], true, true, function (original, index, parameter) {
		try {
			reply("```" + eval(parameter) + "```");
		}
		catch (e) {
			reply("```" + e + "```");
		}
	});
	command(["iapi eval "], true, true, (original, index, parameter) => {
		lolapi.IAPIEval(parameter).then(result => reply("```" + result.string + "```")).catch(console.error);
	});
	command([CONFIG.DISCORD_COMMAND_PREFIX + "notify "], true, true, (original, index, parameter) => {
		wsapi.lnotify(msg.author.username, msg.author.displayAvatarURL, parameter);
	});
	command([CONFIG.DISCORD_COMMAND_PREFIX + "testembed"], false, false, () => {
		reply_embed(embedgenerator.test());
	});
	command([CONFIG.DISCORD_COMMAND_PREFIX + "sd ", CONFIG.DISCORD_COMMAND_PREFIX + "summonerdebug "], true, false, (original, index, parameter) => {
		lolapi.getSummonerIDFromName(assert_region(parameter.substring(0, parameter.indexOf(" "))), parameter.substring(parameter.indexOf(" ") + 1), CONFIG.API_MAXAGE.SD).then(result => {
			result.guess = parameter.substring(parameter.indexOf(" ") + 1);
			reply_embed(embedgenerator.summoner(CONFIG, result));
		}).catch(console.error);
	});
	command([CONFIG.DISCORD_COMMAND_PREFIX + "link "], true, false, (original, index, parameter) => {
		let region = assert_region(parameter.substring(0, parameter.indexOf(" ")));
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
				if (UTILS.exists(summoner.status)) return reply(":x: The username appears to be invalid. Follow the format: `" + CONFIG.DISCORD_COMMAND_PREFIX + "link <region> <username> <@mention>`");
				lolapi.setLink(msg.mentions.users.first().id, summoner.name).then(result => { 
					result.success ? reply(":white_check_mark: " + msg.mentions.users.first().tag + "'s discord account is now linked to " + summoner.name) : reply(":x: Something went wrong.");
				}).catch(console.error);
			}).catch(console.error);
		}
	});
	command([CONFIG.DISCORD_COMMAND_PREFIX + "unlink", CONFIG.DISCORD_COMMAND_PREFIX + "removelink"], false, false, (original, index) => {
		lolapi.setLink(msg.author.id, "").then(result => {
			result.success ? reply(":white_check_mark: Your discord account is no longer associated with any username. We'll try to use your discord username when you use a username-optional LoL stats command.") : reply(":x: Something went wrong.");
		}).catch(console.error);
	});
	command([CONFIG.DISCORD_COMMAND_PREFIX + "unlink ", CONFIG.DISCORD_COMMAND_PREFIX + "removelink "], true, true, (original, index) => {
		if (!UTILS.exists(msg.mentions.users.first())) return reply(":x: No user mention specified.");
		lolapi.setLink(msg.mentions.users.first().id, "").then(result => {
			result.success ? reply(":white_check_mark: " + msg.mentions.users.first().tag + "'s discord account is no longer associated with any username.") : reply(":x: Something went wrong.");
		}).catch(console.error);
	});
	command([CONFIG.DISCORD_COMMAND_PREFIX + "gl", CONFIG.DISCORD_COMMAND_PREFIX + "getlink"], false, false, (original, index) => {
		lolapi.getLink(msg.author.id).then(result => {
			if (UTILS.exists(result.username) && result.username != "") reply(":white_check_mark: You're `" + result.username + "`");
			else reply(":x: No records for user id " + msg.author.id);
		}).catch(console.error);
	});
	command([CONFIG.DISCORD_COMMAND_PREFIX + "gl ", CONFIG.DISCORD_COMMAND_PREFIX + "getlink "], true, true, (original, index) => {
		if (!UTILS.exists(msg.mentions.users.first())) return reply(":x: No user mention specified.");
		lolapi.getLink(msg.mentions.users.first().id).then(result => {
			if (UTILS.exists(result.username) && result.username != "") reply(":white_check_mark: " + msg.mentions.users.first().tag + " is `" + result.username + "`");
			else reply(":x: No records for user id " + msg.mentions.users.first().id);
		}).catch(console.error);
	});
	command([CONFIG.DISCORD_COMMAND_PREFIX + "invite"], false, false, (original, index) => {
		reply("This is the link to add SupportBot to other servers: <" + CONFIG.BOT_ADD_LINK + ">\nAdding it requires the \"Manage Server\" permission.");
	});
	command([CONFIG.DISCORD_COMMAND_PREFIX + "help"], false, false, (original, index) => {
		reply(":white_check_mark: A PM has been sent to you with information on how to use SupportBot.");
		reply_embed_to_author(embedgenerator.help(CONFIG));
	});
	command([CONFIG.DISCORD_COMMAND_PREFIX + "setshortcut ", CONFIG.DISCORD_COMMAND_PREFIX + "ss ", CONFIG.DISCORD_COMMAND_PREFIX + "createshortcut ", CONFIG.DISCORD_COMMAND_PREFIX + "cs ", CONFIG.DISCORD_COMMAND_PREFIX + "addshortcut "], true, false, (original, index, parameter) => {
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
	command([CONFIG.DISCORD_COMMAND_PREFIX + "removeshortcut ", CONFIG.DISCORD_COMMAND_PREFIX + "rs ", CONFIG.DISCORD_COMMAND_PREFIX + "deleteshortcut ", CONFIG.DISCORD_COMMAND_PREFIX + "ds "], true, false, (original, index, parameter) => {
		if (parameter[0] !== "$") return reply(":x: The shortcut must begin with an `$`. Please try again.");
		const from = parameter.substring(1).toLowerCase();
		if (from.length === 0) return reply(":x: The shortcut name was not specified. Please try again.");
		lolapi.removeShortcut(msg.author.id, from).then(result => {
			if (result.success) reply(":white_check_mark: `$" + from + "` removed (or it did not exist already).");
		}).catch(console.error);
	});
	command([CONFIG.DISCORD_COMMAND_PREFIX + "shortcuts", CONFIG.DISCORD_COMMAND_PREFIX + "shortcut"], false, false, (original, index) => {
		lolapi.getShortcuts(msg.author.id).then(result => {
			reply(textgenerator.shortcuts(CONFIG, result));
		}).catch(console.error);
	});
	command([CONFIG.DISCORD_COMMAND_PREFIX + "removeallshortcuts"], false, false, (original, index) => {
		lolapi.removeAllShortcuts(msg.author.id).then(result => {
			reply(":white_check_mark: All shortcuts were removed.")
		}).catch(console.error);
	});
	command(["http://"], true, false, (original, index, parameter) => {
		const region = assert_region(parameter.substring(0, parameter.indexOf(".")), false);
		if (parameter.substring(parameter.indexOf(".") + 1, parameter.indexOf(".") + 6) == "op.gg") {
			let username = decodeURIComponent(msg.content.substring(msg.content.indexOf("userName=") + "userName=".length));
			lolapi.getSummonerCard(region, username).then(result => {
				reply_embed(embedgenerator.detailedSummoner(CONFIG, result[0], result[1], result[2], parameter.substring(0, parameter.indexOf(".")), result[3]));
			}).catch();
		}
	});
	command(["service status ", "servicestatus ", "ss ", "status "], true, false, (original, index, parameter) => {
		let region = assert_region(parameter);
		lolapi.getStatus(region, 60).then((status_object) => {
			reply_embed(embedgenerator.status(status_object));
		}).catch(console.error);
	});
	commandGuessUsername([""], false, (region, username, parameter) => {
		lolapi.getSummonerCard(region, username).then(result => {
			reply_embed(embedgenerator.detailedSummoner(CONFIG, result[0], result[1], result[2], parameter, result[3]));
		}).catch(() => reply(":x: No results for `" + username + "`. Please revise your request."));
	});
	commandGuessUsername(["mh ", "matchhistory "], false, (region, username, parameter) => {
		request_profiler.mark("mh command recognized");
		lolapi.getSummonerIDFromName(region, username, CONFIG.API_MAXAGE.MH.SUMMONER_ID).then(result => {
			result.region = region;
			if (!UTILS.exists(result.accountId)) return reply(":x: No recent matches found for `" + username + "`.");
			lolapi.getRecentGames(region, result.accountId, CONFIG.API_MAXAGE.MH.RECENT_GAMES).then(matchhistory => {
				if (!UTILS.exists(matchhistory.matches) || matchhistory.matches.length == 0) return reply("No recent matches found for `" + username + "`.");
				lolapi.getMultipleMatchInformation(region, matchhistory.matches.map(m =>  m.gameId), CONFIG.API_MAXAGE.MH.MULTIPLE_MATCH).then(matches => {
					request_profiler.begin("generating embed");
					const answer = embedgenerator.match(CONFIG, result, matchhistory.matches, matches);
					request_profiler.end("generating embed");
					UTILS.debug(request_profiler.endAll());
					reply_embed(answer);
				}).catch(console.error);
			}).catch(console.error);
		}).catch(console.error);
	});
	command(["m ", "multi ", "c ", "compare "], true, false, (original, index, parameter) => {
		request_profiler.mark("multi command recognized");
		request_profiler.begin("parsing usernames");
		let region = assert_region(parameter.substring(0, parameter.indexOf(" ")));
		let pre_usernames;
		if (parameter.indexOf("\n") != -1) {//lobby text formatting
			pre_usernames = parameter.substring(parameter.indexOf(" ") + 1).split("\n");
			let present = [];//users present
			let join_detected = false, leave_detected = false;
			let joins = [], leaves = [];
			const join_suffix = " joined the lobby";
			const leave_suffix = " left the lobby";
			for (let i = 0; i < pre_usernames.length; ++i) {
				if (pre_usernames[i].substring(pre_usernames[i].length - join_suffix.length) === join_suffix) join_detected = true;
				else if (pre_usernames[i].substring(pre_usernames[i].length - leave_suffix.length) === leave_suffix) leave_detected = true;
				else if (join_detected && leave_detected) break;//all necessary results recorded
				else;//chat message
			}
			if (join_detected) {//champ select mode
				UTILS.debug("champ select mode");
				for (let i = 0; i < pre_usernames.length; ++i) {
					if (pre_usernames[i].substring(pre_usernames[i].length - join_suffix.length) === join_suffix) {
						present.push(pre_usernames[i].substring(0, pre_usernames[i].length - join_suffix.length).trim());//user joined, add to attendance
					}
					else if (pre_usernames[i].substring(pre_usernames[i].length - leave_suffix.length) === leave_suffix) {
						UTILS.removeAllOccurances(present, pre_usernames[i].substring(0, pre_usernames[i].length - leave_suffix.length).trim());//user left, delete from attendance
					}
					else;//chat message
				}
			}
			else if (leave_detected) {//end game mode
				UTILS.debug("end game lobby mode");
				for (let i = 0; i < pre_usernames.length; ++i) {
					if (pre_usernames[i].substring(pre_usernames[i].length - leave_suffix.length) === leave_suffix) {
						present.push(pre_usernames[i].substring(0, pre_usernames[i].length - leave_suffix.length).trim());//user left, add to attendance
					}
					else;//chat message
				}
			}
			UTILS.debug("attending: " + JSON.stringify(present));
			/*
			if (join) lobby/champ select, so joins add to usernames queried and leaves remove from usernames queried
			if (leave) end game screen, so leaves add to usernames queried
			*/
			pre_usernames = present;
		}
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
								reply_embed(embedgenerator.multiSummoner(CONFIG, CONFIG.REGIONS_REVERSE[region], summoners, ranks, masteries, mhA, matches));
							}).catch(console.error);
						}).catch(console.error);
					}).catch(console.error);
				}).catch(console.error);
			}).catch(console.error);
		}).catch(console.error);
	});
	commandGuessUsername(["lg ", "livegame ", "cg ", "currentgame ", "livematch ", "lm ", "currentmatch ", "cm "], false, (region, username, parameter) => {//new
		request_profiler.mark("lg command recognized");
		//reply(":warning:We are processing the latest information for your command: if this message does not update within 5 minutes, try the same command again. Thank you for your patience.", nMsg => {
		lolapi.getSummonerIDFromName(region, username, CONFIG.API_MAXAGE.LG.SUMMONER_ID).then(result => {
			result.region = region;
			result.guess = username;
			if (!UTILS.exists(result.id)) return reply(":x: No username found for `" + username + "`.");
			lolapi.getLiveMatch(region, result.id, CONFIG.API_MAXAGE.LG.LIVE_MATCH).then(match => {
				if (UTILS.exists(match.status)) return reply(":x: No current matches found for `" + username + "`.");
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
									reply_embed(newEmbed, () => {
										//reply_embed(embedgenerator.liveMatchPremade(CONFIG, result, match, matches, ranks, masteries, pSA, false, true));
									});
									//reply_embed(embedgenerator.liveMatchPremade(CONFIG, result, match, matches, ranks, masteries, pSA, false));//untrimmed output
								}).catch();
							}).catch();
						});
					}).catch(console.error);
				}).catch(console.error);
			}).catch(console.error);
		}).catch(console.error);
		//});
	});
	commandGuessUsernameNumber(["mh", "matchhistory"], false, (region, username, number) => {
		request_profiler.mark("dmh command recognized");
		lolapi.getSummonerIDFromName(region, username, CONFIG.API_MAXAGE.DMH.SUMMONER_ID).then(result => {
			result.region = region;
			result.guess = username;
			if (!UTILS.exists(result.accountId)) return reply(":x: No recent matches found for `" + username + "`.");
			lolapi.getRecentGames(region, result.accountId, CONFIG.API_MAXAGE.DMH.RECENT_GAMES).then(matchhistory => {
				if (!UTILS.exists(matchhistory.matches) || matchhistory.matches.length == 0) return reply(":x: No recent matches found for `" + username + "`.");
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
								reply_embed(answer);
							});
						});
					}).catch();
				}).catch(console.error);
			}).catch(console.error);
		}).catch(console.error);
	});
	/*
	commandGuessUsername(["mmr "], false, (region, username, parameter) => {
		lolapi.getSummonerIDFromName(region, username).then(result => {
			result.region = region;
			lolapi.getMMR(region, result.id).then(mmr => {
				reply_embed(embedgenerator.mmr(CONFIG, result, mmr));
			}).catch();
		});
	});*/

	if (UTILS.exists(msg.guild)) {//respondable server message only
		command([CONFIG.DISCORD_COMMAND_PREFIX + "shutdown"], false, true, () => {
			reply(":white_check_mark: shutdown initiated", shutdown, shutdown);
		});
		command([CONFIG.DISCORD_COMMAND_PREFIX + "restart"], false, true, () => {
			reply(":white_check_mark: restart initiated", restart, restart);
		});
		command([CONFIG.DISCORD_COMMAND_PREFIX + "refresh", CONFIG.DISCORD_COMMAND_PREFIX + "clearcache"], false, true, () => {
			reply(":white_check_mark: restart initiated + clearing cache", step2, step2);
			function step2() {
				lolapi.clearCache();
				restart();
			}
		});
	}
	else {//PM/DM only
	}

	function command(trigger_array,//array of command aliases, prefix needs to be included
		parameters_expected,//boolean
		elevated_permissions,//requires owner permissions
		callback) {//optional callback only if successful
		for (let i in trigger_array) {
			if (parameters_expected && msg.content.trim().toLowerCase().substring(0, trigger_array[i].length) === trigger_array[i].toLowerCase()) {
				if (elevated_permissions && !isOwner()) return false
				else {
					if (elevated_permissions) sendToChannel(CONFIG.LOG_CHANNEL_ID, msg.author.tag + " used " + msg.cleanContent);
					if (UTILS.exists(callback)) {
						try {
							callback(trigger_array[i], i, msg.content.trim().substring(trigger_array[i].length));
						}
						catch (e) {
							console.error(e);
						}
					}
					return true;
				}
			}
			else if (!parameters_expected && msg.content.trim().toLowerCase() === trigger_array[i].toLowerCase()) {
				if (elevated_permissions && !isOwner()) return false;
				else {
					if (elevated_permissions) sendToChannel(CONFIG.LOG_CHANNEL_ID, msg.author.tag + " used " + msg.cleanContent);
					if (UTILS.exists(callback)) {
						try {
							callback(trigger_array[i], i);
						}
						catch (e) {
							console.error(e);
						}
					}
					return true;
				}
			}
		}
		return false;
	}

	function commandGuessUsername(trigger_array,//array of command aliases, prefix needs to be included
		elevated_permissions,//requires owner permissions
		callback) {//optional callback only if successful
		//returns (region, username, parameter)
		command(trigger_array, true, elevated_permissions, (original, index, parameter) => {
			try {//username provided
				const region = assert_region(parameter.substring(0, parameter.indexOf(" ")), false);//see if there is a region
				if (parameter.substring(parameter.indexOf(" ") + 1).length < 35) {
					if (parameter.substring(parameter.indexOf(" ") + 1)[0] == "$") {
						lolapi.getShortcut(msg.author.id, parameter.substring(parameter.indexOf(" ") + 1).toLowerCase().substring(1)).then(result => {
							callback(region, result[parameter.substring(parameter.indexOf(" ") + 1).toLowerCase().substring(1)], parameter.substring(0, parameter.indexOf(" ")));
						}).catch(e => {
							if (e) reply(":x: An error has occurred. The shortcut may not exist.");
						});
					}
					else callback(region, parameter.substring(parameter.indexOf(" ") + 1), parameter.substring(0, parameter.indexOf(" ")));
				}
			}
			catch (e) {//username not provided
				try {
					const region = assert_region(parameter, false);
					lolapi.getLink(msg.author.id).then(result => {
						let username = msg.author.username;//suppose the link doesn't exist in the database
						if (UTILS.exists(result.username) && result.username != "") username = result.username;//link exists
						callback(region, username, parameter);
					}).catch(console.error);
				}
				catch (e) { }
			}
		});
	}

	function commandGuessUsernameNumber(trigger_array,//array of command aliases, prefix needs to be included
		elevated_permissions,//requires owner permissions
		callback) {//optional callback only if successful
		//returns (region, username, number)
		command(trigger_array, true, elevated_permissions, (original, index, parameter) => {
			const number = parseInt(parameter.substring(0, parameter.indexOf(" ")));
			if (isNaN(number)) return;
			try {//username provided
				const region = assert_region(parameter.substring(UTILS.indexOfInstance(parameter, " ", 1) + 1, UTILS.indexOfInstance(parameter, " ", 2)), false);//see if there is a region
				if (parameter.substring(UTILS.indexOfInstance(parameter, " ", 2) + 1).length < 35) {
					if (parameter.substring(UTILS.indexOfInstance(parameter, " ", 2) + 1)[0] == "$") {
						lolapi.getShortcut(msg.author.id, parameter.substring(UTILS.indexOfInstance(parameter, " ", 2) + 1).toLowerCase().substring(1)).then(result => {
							callback(region, result[parameter.substring(UTILS.indexOfInstance(parameter, " ", 2) + 1).toLowerCase().substring(1)], number);
						}).catch(e => {
							if (e) reply(":x: An error has occurred. The shortcut may not exist.");
						});
					}
					else callback(region, parameter.substring(UTILS.indexOfInstance(parameter, " ", 2) + 1), number);
				}
			}
			catch (e) {//username not provided
				try {
					const region = assert_region(parameter.substring(parameter.indexOf(" ") + 1), false);
					lolapi.getLink(msg.author.id).then(result => {
						let username = msg.author.username;//suppose the link doesn't exist in the database
						if (UTILS.exists(result.username) && result.username != "") username = result.username;//link exists
						callback(region, username, number);
					}).catch(console.error);
				}
				catch (e) { }
			}
		});
	}
	function isOwner(candidate = msg.author.id, notify = true) {
		const answer = UTILS.exists(CONFIG.OWNER_DISCORD_IDS[candidate]) && CONFIG.OWNER_DISCORD_IDS[candidate];
		if (!answer) {
			UTILS.output("insufficient permissions");
			print_message();
			if (notify) msg.channel.send(":x: Owner permissions required. Ask for help at " + CONFIG.HELP_SERVER_INVITE_LINK + " .").catch(console.error);
		}
		return answer;
	}
	function reply(reply_text, callback, error_callback) {
		print_message();
		lolapi.terminate();
		console.log("reply (" + (new Date().getTime() - msg_receive_time) + "ms): " + reply_text + "\n");
		msg.channel.send(reply_text, { split: true }).then((nMsg) => {
			if (UTILS.exists(callback)) callback(nMsg);
		}).catch((e) => {
			console.error(e);
			if (UTILS.exists(error_callback)) error_callback(e);
		});
	}

	function reply_to_author(reply_text, callback, error_callback) {
		print_message();
		lolapi.terminate();
		console.log("reply to author (" + (new Date().getTime() - msg_receive_time) + "ms): " + reply_text + "\n");
		msg.author.send(reply_text, { split: true }).then((nMsg) => {
			if (UTILS.exists(callback)) callback(nMsg);
		}).catch((e) => {
			console.error(e);
			if (UTILS.exists(error_callback)) error_callback(e);
		});
	}

	function reply_embed(reply_embed, callback, error_callback) {
		if (UTILS.exists(msg.guild) && !msg.channel.permissionsFor(client.user).has(["EMBED_LINKS"])) {//doesn't have permission to embed links in server
			lolapi.terminate();
			reply(":x: I cannot respond to your request without the \"embed links\" permission.");
		}
		else {//has permission to embed links, or is a DM/PM
			print_message();
			lolapi.terminate();
			console.log("reply embedded (" + (new Date().getTime() - msg_receive_time) + "ms)\n");
			msg.channel.send("", { embed: reply_embed }).then((nMsg) => {
				if (UTILS.exists(callback)) callback(nMsg);
			}).catch((e) => {
				console.error(e);
				if (UTILS.exists(error_callback)) error_callback(e);
			});
		}
	}

	function reply_embed_to_author(reply_embed, callback, error_callback) {
		print_message();
		lolapi.terminate();
		console.log("reply embedded to author (" + (new Date().getTime() - msg_receive_time) + "ms)\n");
		msg.author.send("", { embed: reply_embed }).then((nMsg) => {
			if (UTILS.exists(callback)) callback(nMsg);
		}).catch((e) => {
			console.error(e);
			if (UTILS.exists(error_callback)) error_callback(e);
		});
	}

	function print_message() {
		const basic = msg.id + "\ncontent: " + msg.content +
			"\nauthor: " + msg.author.tag + " :: " + msg.author.id +
			"\nchannel: " + msg.channel.name + " :: " + msg.channel.id;
		if (UTILS.exists(msg.guild)) UTILS.output("received server message :: " + basic + "\nguild: " + msg.guild.name + " :: " + msg.guild.id);
		else {
			UTILS.output("received PM/DM message :: " + basic);
		}
	}
	function assert_region(test_string, notify = true) {
		if (!UTILS.exists(CONFIG.REGIONS[test_string.toUpperCase()])) {
			if (notify) reply(":x: You need to specify a region.");
			throw new Error("Region not specified");
		}
		else {
			return CONFIG.REGIONS[test_string.toUpperCase()];
		}
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
	function sendToChannel(cid, text) {//duplicated in shard.js
		const candidate = client.channels.get(cid);
		if (UTILS.exists(candidate)) return candidate.send(text).catch(console.error);
		else wsapi.sendTextToChannel(cid, text);
	}
}

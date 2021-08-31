"use strict";
let embedgenerator = new (require("./embedgenerator.js"))();
let textgenerator = new (require("./textgenerator.js"))();
let child_process = require("child_process");
const UTILS = new (require("../utils/utils.js"))();
let LOLAPI = require("../utils/lolapi.js");
let Profiler = require("../utils/timeprofiler.js");
let ctable = require("console.table");
const crypto = require("crypto");
module.exports = function (CONFIG, client, msg, wsapi, sendToChannel, sendEmbedToChannel, preferences, ACCESS_LEVEL, server_RL, user_RL) {
	if (msg.author.bot || msg.author.id === client.user.id) return;//ignore all messages from [BOT] users and own messages
	if (!msg.PM && !msg.channel.permissionsFor(client.user).has(["VIEW_CHANNEL", "SEND_MESSAGES"])) return;//dont read messages that can't be responded to
	if (!UTILS.exists(CONFIG.BANS) || !UTILS.exists(CONFIG.BANS.USERS) || !UTILS.exists(CONFIG.BANS.SERVERS)) {
		wsapi.getUserBans();
		wsapi.getServerBans();
		return UTILS.output("message " + msg.id + " could not be processed because ban data has not been loaded yet");
	}
	if (UTILS.exists(CONFIG.BANS.USERS[msg.author.id]) && (CONFIG.BANS.USERS[msg.author.id] == 0 || CONFIG.BANS.USERS[msg.author.id] > msg.createdTimestamp)) return;//ignore messages from banned users
	if (!msg.PM && UTILS.exists(CONFIG.BANS.SERVERS[msg.guild.id])) {
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
	let RL_activated = false;
	let request_profiler = new Profiler("r#" + msg.id)
	let lolapi = new LOLAPI(CONFIG, msg.id, wsapi);
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
	command([preferences.get("prefix") + "banuser ", preferences.get("prefix") + "shadowbanuser "], true, CONFIG.CONSTANTS.BOTOWNERS, (original, index, parameter) => {
		//Lbanuser <uid> <duration> <reason>
		const id = parameter.substring(0, parameter.indexOf(" "));
		const reason = parameter.substring(parameter.indexOfInstance(" ", 2) + 1);
		let duration = parameter.substring(parameter.indexOfInstance(" ", 1) + 1, parameter.indexOfInstance(" ", 2));
		duration = duration == "0" ? duration = 0 : UTILS.durationParse(duration);
		if (isNaN(duration)) return reply(":x: The duration is invalid.");
		const end_date = duration == 0 ? 0 : new Date().getTime() + duration;
		if (id.length < 1 || reason.length < 1 || typeof(duration) != "number") return reply(":x: The id, duration, or reason could not be found.");
		if (id == msg.author.id) return reply(":x: You cannot ban yourself.");
		if (id == client.user.id) return reply(":x: You cannot ban me.");
		if (isOwner(id, false)) return reply(":x: The id you are trying to ban has elevated permissions.");
		lolapi.banUser(id, reason, end_date, msg.author.id, msg.author.tag, msg.author.displayAvatarURL, index === 0).then(result => {
			sendToChannel(CONFIG.LOG_CHANNEL_ID, ":no_entry: User banned, id " + id + " by " + msg.author.tag + " for : " + reason);
			reply(":no_entry: User banned, id " + id + " by " + msg.author.tag + " for : " + reason);
		}).catch(console.error);
	});
	command([preferences.get("prefix") + "banserver ", preferences.get("prefix") + "shadowbanserver "], true, CONFIG.CONSTANTS.BOTOWNERS, (original, index, parameter) => {
		//Lbanserver <sid> <duration> <reason>
		const id = parameter.substring(0, parameter.indexOf(" "));
		const reason = parameter.substring(parameter.indexOfInstance(" ", 2) + 1);
		let duration = parameter.substring(parameter.indexOfInstance(" ", 1) + 1, parameter.indexOfInstance(" ", 2));
		duration = duration == "0" ? duration = 0 : UTILS.durationParse(duration);
		if (isNaN(duration)) return reply(":x: The duration is invalid.");
		const end_date = duration == 0 ? 0 : new Date().getTime() + duration;
		if (id.length < 1 || reason.length < 1 || typeof(duration) != "number") return reply(":x: The id, duration, or reason could not be found.");
		lolapi.banServer(id, reason, end_date, msg.author.id, msg.author.tag, msg.author.displayAvatarURL, index === 0).then(result => {
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
	if (preferences.get("feedback_enabled")) {
		command([preferences.get("prefix") + "complain ", preferences.get("prefix") + "praise ", preferences.get("prefix") + "suggest "], true, false, (original, index) => {
			lolapi.userHistory(msg.author.id).then(uH => {
				if (!msg.PM) lolapi.serverHistory(msg.guild.id).then(gH => step2(gH[msg.guild.id])).catch(console.error);
				else step2(null);
				function step2(gH) {
					sendEmbedToChannel(CONFIG.FEEDBACK.EXTERNAL_CID, embedgenerator.feedback(CONFIG, index + 1, 1, msg, uH[msg.author.id], gH), true);
					reply(":white_check_mark: Thank you for your feedback!");
				}
			}).catch(console.error);
		});
		command([preferences.get("prefix") + "question ", preferences.get("prefix") + "ask "], true, false, (original, index) => {
			lolapi.userHistory(msg.author.id).then(uH => {
				if (!msg.PM) lolapi.serverHistory(msg.guild.id).then(gH => step2(gH[msg.guild.id]));
				else step2(null);
				function step2(gH) {
					sendEmbedToChannel(CONFIG.FEEDBACK.EXTERNAL_CID, embedgenerator.feedback(CONFIG, 4, 1, msg, uH[msg.author.id], gH));
					reply(":white_check_mark: Thank you for your question! Someone from our staff will respond by SupportBot PM as soon as possible.");
				}
			});
		});
	}
	command([preferences.get("prefix") + "permissionstest", preferences.get("prefix") + "pt"], false, false, () => {
		reply("You have " + ["normal", "bot commander", "moderator", "server admin", "server owner", "bot owner"][ACCESS_LEVEL] + " permissions.");
	});
	command([preferences.get("prefix") + "permissionstest ", preferences.get("prefix") + "pt "], true, false, () => {
		if (msg.mentions.users.size != 1) return reply(":x: A user must be mentioned.");
		reply(msg.mentions.users.first().tag + " has " + ["normal", "bot commander", "moderator", "server admin", "server owner", "bot owner"][UTILS.accessLevel(CONFIG, msg, msg.mentions.users.first().id)] + " permissions.");
	});
	command([preferences.get("prefix") + "stats"], false, CONFIG.CONSTANTS.BOTOWNERS, () => {
		lolapi.stats().then(iapi_stats => {
			UTILS.aggregateClientEvals(client, [["this.guilds.size", r => r.reduce((prev, val) => prev + val, 0) + " (" + r.join(", ") + ")"],
				["this.users.size", r => r.reduce((prev, val) => prev + val, 0) + " (" + r.join(", ") + ")"],
				["this.guilds.map(g => g.memberCount).reduce((prev, val) => prev + val, 0)", r => r.reduce((prev, val) => prev + val, 0) + " (" + r.join(", ") + ")"]]).then(c_eval => {
				replyEmbed(embedgenerator.debug(CONFIG, client, iapi_stats, c_eval));
			});
		}).catch(console.error);
	});
	command([preferences.get("prefix") + "ping"], false, false, () => {
		reply("command to response time: ", nMsg => textgenerator.ping_callback(msg, nMsg));
	});
	command(["iping"], false, false, () => {
		lolapi.ping().then(times => reply(textgenerator.internal_ping(times))).catch(console.error);
	});
	command(["wping"], false, false, () => {
		wsapi.ping(times => reply(textgenerator.ws_ping(times)));
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
	command([preferences.get("prefix") + "echo "], true, CONFIG.CONSTANTS.BOTOWNERS, (original, index, parameter) => {
		reply(parameter);
		msg.delete().catch(console.error);
	});
	command([preferences.get("prefix") + "dmcid "], true, CONFIG.CONSTANTS.BOTOWNERS, (original, index, parameter) => {
		const cid = parameter.substring(0, parameter.indexOf(" "));
		const text = parameter.substring(parameter.indexOf(" ") + 1);
		sendToChannel(cid, text);
	});
	command(["iapi eval "], true, CONFIG.CONSTANTS.BOTOWNERS, (original, index, parameter) => {
		lolapi.IAPIEval(parameter).then(result => reply("```" + result.string + "```")).catch(console.error);
	});
	command([preferences.get("prefix") + "notify "], true, CONFIG.CONSTANTS.BOTOWNERS, (original, index, parameter) => {
		wsapi.lnotify(msg.author.username, msg.author.displayAvatarURL, parameter, false);
	});
	command([preferences.get("prefix") + "releasenotify "], true, CONFIG.CONSTANTS.BOTOWNERS, (original, index, parameter) => {
		wsapi.lnotify(msg.author.username, msg.author.displayAvatarURL, parameter, true);
	});
	command([preferences.get("prefix") + "testembed"], false, CONFIG.CONSTANTS.BOTOWNERS, () => {
		replyEmbed(embedgenerator.test("Original behavior"));
		replyEmbed([{ r: embedgenerator.test("t=0 only"), t: 0 }]);
		replyEmbed([{ r: embedgenerator.test("t=0"), t: 0 }, { r: embedgenerator.test("t=5000"), t: 5000 }, { r: embedgenerator.test("t=10000"), t: 10000 }, { r: embedgenerator.test("t=15000"), t: 15000 }]);
	});
	command([preferences.get("prefix") + "testreply"], false, CONFIG.CONSTANTS.BOTOWNERS, () => {
		reply("Original behavior");
		reply([{ r: "t=0 only", t: 0 }]);
		reply([{ r: "t=0", t: 0 }, { r: "t=5000", t: 5000 }, { r: "t=10000", t: 10000 }, { r: "t=15000", t: 15000 }]);
	});
	command(["immr "], true, CONFIG.CONSTANTS.BOTOWNERS, (original, index, parameter) => {
		reply(UTILS.decodeEnglishToIMMR(parameter));
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
		else if (parameter.indexOf(" ") === -1) return reply(":x: The shortcut word and the username must be separated by a space. Please try again.");
		else if (parameter.length > 60) return reply(":x: The shortcut name or the username is too long.");
		const from = parameter.substring(1, parameter.indexOf(" ")).toLowerCase();
		if (from.length === 0) return reply(":x: The shortcut name was not specified. Please try again.");
		const to = parameter.substring(parameter.indexOf(" ") + 1);
		if (to.length === 0) return reply(":x: The username was not specified. Please try again.");
		else if (parameter.substring(1).indexOf("$") !== -1) return reply(":x: The shortcut cannot contain more than 1 `$` character.");
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
	command([preferences.get("prefix") + "verify "], true, false, (original, index, parameter) => {
		let region = assertRegion(parameter.substring(0, parameter.indexOf(" ")));
		lolapi.getSummonerIDFromName(region, parameter.substring(parameter.indexOf(" ") + 1), CONFIG.API_MAXAGE.VERIFY.SUMMONER_ID).then(summoner => {
			summoner.region = region;
			summoner.guess = parameter.substring(parameter.indexOf(" ") + 1);
			if (UTILS.exists(summoner.status)) return reply(":x: The username appears to be invalid.");
			lolapi.getVerifiedAccounts(msg.author.id).then(result => {
				if (UTILS.exists(result.verifiedAccounts[summoner.puuid])) {
					reply(":white_check_mark: You have already linked your discord account to " + summoner.name + ". This will expire in " + UTILS.until(new Date(result.verifiedAccounts[summoner.puuid])) + ".");//verified
				}
				else {//not verified yet
					lolapi.getThirdPartyCode(region, summoner.id, CONFIG.API_MAXAGE.VERIFY.THIRD_PARTY_CODE).then(tpc => {
						let valid_code = 0;
						const tpc_timestamp_ms = parseInt(tpc.substring(0, tpc.indexOf("-")));
						const tpc_HMAC_input = tpc_timestamp_ms + "-" + msg.author.id + "-" + summoner.puuid;
						const tpc_HMAC_output = tpc.substring(tpc.indexOf("-") + 1);
						UTILS.debug("tpc_timestamp_ms: " + tpc_timestamp_ms);
						UTILS.debug("tpc_HMAC_input: " + tpc_HMAC_input);
						UTILS.debug("tpc_HMAC_output: " + tpc_HMAC_output);
						if (tpc_timestamp_ms < new Date().getTime() - (5 * 60 * 1000)) valid_code += 1;//not expired
						else if (tpc_HMAC_output !== crypto.createHmac("sha256", CONFIG.TPV_KEY).update(tpc_HMAC_input).digest("hex")) valid_code += 2;//same HMAC
						if (valid_code === 0) {
							lolapi.setVerifiedAccount(msg.author.id, summoner.puuid, region, new Date().getTime() + (365 * 24 * 60 * 60000)).then(result2 => {
								reply(":white_check_mark: You have linked your discord account to " + summoner.name + " for 1 year.");
							}).catch(console.error);
						}
						else {
							UTILS.debug("valid_code: " + valid_code);
							replyEmbed(embedgenerator.verify(CONFIG, summoner, msg.author.id));
						}
					}).catch();
				}
			}).catch(console.error);
		}).catch(console.error);
	});
	command([preferences.get("prefix") + "about", preferences.get("prefix") + "credits", preferences.get("prefix") + "acknowledgements", preferences.get("prefix") + "contributors", preferences.get("prefix") + "contributions"], false, false, (original, index) => reply(CONFIG.ACKNOWLEDGEMENTS));
	if (preferences.get("auto_opgg")) {
		command(["https://"], true, false, (original, index, parameter) => {
			let r_copy = parameter.substring(0, parameter.indexOf("."));
			if (r_copy === "www") r_copy = "kr";//handle www as kr region
			const region = assertRegion(r_copy, false);
			if (parameter.substring(parameter.indexOf(".") + 1, parameter.indexOf(".") + 6) == "op.gg") {
				let username = decodeURIComponent(msg.content.substring(msg.content.indexOf("userName=") + "userName=".length)).replaceAll("+", " ");//reformat spaces
				lolapi.getSummonerCard(region, username).then(result => {
					lolapi.checkVerifiedAccount(msg.author.id, result[5].puuid, region).then(verified => {
						replyEmbed(embedgenerator.detailedSummoner(CONFIG, result[5], result[1], result[2], r_copy, result[3], result[4], result[6], result[7], verified));
					}).catch(console.error);
				}).catch(console.error);
			}
		}, {immediatePRL: false});
	}
	command(forcePrefix(["service status ", "servicestatus ", "ss ", "status "]), true, false, (original, index, parameter) => {
		let region = assertRegion(parameter);
		lolapi.getStatus(region, 60).then((status_object) => {
			replyEmbed(embedgenerator.status(status_object));
		}).catch(console.error);
	});
	commandGuessUsername(forcePrefix([""]), false, (index, region, username, parameter, guess_method) => {
		lolapi.getSummonerCard(region, username).then(result => {
			lolapi.checkVerifiedAccount(msg.author.id, result[5].puuid, region).then(verified => {
				replyEmbed(embedgenerator.detailedSummoner(CONFIG, result[5], result[1], result[2], CONFIG.REGIONS_REVERSE[region], result[3], result[4], result[6], result[7], verified));
			}).catch(console.error);
		}).catch(e => {
			if (UTILS.exists(e)) console.error(e);
			reply(":x: No results for `" + username + "`." + suggestLink(guess_method));
		});
	});
	commandGuessUsername(forcePrefix(["mh ", "matchhistory ", "rmh ", "rankedmatchhistory "]), false, (index, region, username, parameter, guess_method) => {
		request_profiler.mark("mh command recognized");
		lolapi.getSummonerIDFromName(region, username, CONFIG.API_MAXAGE.MH.SUMMONER_ID).then(result => {
			result.region = region;
			if (!UTILS.exists(result.accountId)) return reply(":x: No recent matches found for `" + username + "`." + suggestLink(guess_method));
			lolapi.getRecentGames(region, result.accountId, CONFIG.API_MAXAGE.MH.RECENT_GAMES, undefined, index >= 2).then(matchhistory => {
				if (!UTILS.exists(matchhistory.matches) || matchhistory.matches.length == 0) return reply("No recent matches found for `" + username + "`." + suggestLink(guess_method));
				lolapi.getMultipleMatchInformation(region, matchhistory.matches.map(m => m.gameId), CONFIG.API_MAXAGE.MH.MULTIPLE_MATCH).then(matches => {
					lolapi.checkVerifiedAccount(msg.author.id, result.puuid, region).then(verified => {
						lolapi.getChampionMastery(region, result.id, CONFIG.API_MAXAGE.MH.CHAMPION_MASTERY).then(mastery => {
							request_profiler.begin("generating embed");
							const answer = embedgenerator.match(CONFIG, result, matchhistory.matches, matches, mastery, verified);
							request_profiler.end("generating embed");
							UTILS.debug(request_profiler.endAll());
							replyEmbed(answer);
						}).catch(console.error);
					}).catch(console.error);
				}).catch(console.error);
			}).catch(console.error);
		}).catch(console.error);
	});
	command(forcePrefix(["multi ", "m "]), true, false, (original, index, parameter) => {
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
				UTILS.removeAllOccurances(summoners, e => !UTILS.exists(e.id));
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
				UTILS.removeAllOccurances(summoners, e => !UTILS.exists(e.id));
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
	commandGuessUsername(forcePrefix(["lg ", "livegame ", "cg ", "currentgame ", "livematch ", "lm ", "currentmatch ", "cm "]), false, (index, region, username, parameter, guess_method) => {//new
		request_profiler.mark("lg command recognized");
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
						Promise.all([lolapi.getMultipleMatchInformation(region, mIDA, CONFIG.API_MAXAGE.LG.MULTIPLE_MATCH), lolapi.getMultipleRanks(region, pSA.map(p => p.id), CONFIG.API_MAXAGE.LG.MULTIPLE_RANKS), lolapi.getMultipleChampionMastery(region, pSA.map(p => p.id), CONFIG.API_MAXAGE.LG.MULTIPLE_MASTERIES), lolapi.checkVerifiedAccount(msg.author.id, result.puuid, region)]).then(parallel => {
							let matches = parallel[0];
							let ranks = parallel[1];
							let masteries = parallel[2];
							let verified = parallel[3];
							//nMsg.edit("", { embed: embedgenerator.liveMatchPremade(CONFIG, result, match, matches, ranks, masteries, pSA) }).catch();
							request_profiler.begin("generating embed");
							const newEmbed = embedgenerator.liveMatchPremade(CONFIG, result, match, matches, ranks, masteries, pSA, verified);
							request_profiler.end("generating embed");
							UTILS.debug("\n" + ctable.getTable(request_profiler.endAllCtable()));
							replyEmbed(newEmbed, () => {
								//replyEmbed(embedgenerator.liveMatchPremade(CONFIG, result, match, matches, ranks, masteries, pSA, false, true));
							});
								//replyEmbed(embedgenerator.liveMatchPremade(CONFIG, result, match, matches, ranks, masteries, pSA, false));//untrimmed output
						}).catch(console.error);
					}).catch(console.error);
				}).catch(console.error);
			}).catch(console.error);
		}).catch(console.error);
		//});
	});
	commandGuessUsername(forcePrefix(["fromlastgame ", "flg ", "fromrecentgames ", "fromrecentgame ", "frg "]), false, (index, region, username, parameter, guess_method) => {//new
		request_profiler.mark("flg command recognized");
		lolapi.getSummonerIDFromName(region, username, CONFIG.API_MAXAGE.FLG.SUMMONER_ID).then(result => {
			result.region = region;
			result.guess = username;
			if (!UTILS.exists(result.id)) return reply(":x: No username found for `" + username + "`." + suggestLink(guess_method));
			lolapi.getLiveMatch(region, result.id, CONFIG.API_MAXAGE.FLG.LIVE_MATCH).then(match => {
				if (UTILS.exists(match.status)) return reply(":x: No current matches found for `" + username + "`." + suggestLink(guess_method));
				lolapi.getMultipleSummonerFromSummonerID(region, match.participants.map(p => p.summonerId), CONFIG.API_MAXAGE.FLG.OTHER_SUMMONER_ID).then(pSA => {//participant summoner array
					lolapi.getRecentGames(region, result.accountId, CONFIG.API_MAXAGE.FLG.RECENT_GAMES, 20).then(mhA => {//matchhistory array
						Promise.all([lolapi.getMultipleMatchInformation(region, mhA.matches.map(m => m.gameId), CONFIG.API_MAXAGE.FLG.MULTIPLE_MATCH), lolapi.checkVerifiedAccount(msg.author.id, result.puuid, region)]).then(parallel => {
							let matches = parallel[0];
							let verified = parallel[1];
							request_profiler.begin("generating embed");
							const newEmbed = embedgenerator.fromLastGame(CONFIG, result, match, matches, pSA, verified);
							request_profiler.end("generating embed");
							UTILS.debug("\n" + ctable.getTable(request_profiler.endAllCtable()));
							replyEmbed(newEmbed);
						}).catch(console.error);
					}).catch(console.error);
				}).catch(console.error);
			}).catch(console.error);
		}).catch(console.error);
		//});
	});
	commandGuessUsernameNumber(forcePrefix(["mh", "matchhistory", "rmh", "rankedmatchhistory"]), false, (index, region, username, number, guess_method) => {
		request_profiler.mark("dmh command recognized");
		lolapi.getSummonerIDFromName(region, username, CONFIG.API_MAXAGE.DMH.SUMMONER_ID).then(result => {
			result.region = region;
			result.guess = username;
			if (!UTILS.exists(result.accountId)) return reply(":x: No recent matches found for `" + username + "`." + suggestLink(guess_method));
			lolapi.getRecentGames(region, result.accountId, CONFIG.API_MAXAGE.DMH.RECENT_GAMES, 100, index >= 2).then(matchhistory => {
				if (!UTILS.exists(matchhistory.matches) || matchhistory.matches.length == 0) return reply(":x: No recent matches found for `" + username + "`." + suggestLink(guess_method));
				if (number < 1 || number > 100 || !UTILS.exists(matchhistory.matches[number - 1])) return reply(":x: This number is out of range.");
				lolapi.getMatchInformation(region, matchhistory.matches[number - 1].gameId, CONFIG.API_MAXAGE.DMH.MATCH_INFORMATION).then(match => {
					const pIDA = match.participantIdentities.map(pI => {
						if (UTILS.exists(pI.player.summonerId)) return pI.player.summonerId;
						else return null;//bot account
					});//participant (summoner) ID array
					lolapi.getMatchTimeline(region, matchhistory.matches[number - 1].gameId, CONFIG.API_MAXAGE.DMH.MATCH_TIMELINE).then(timeline => {
						lolapi.getMultipleRanks(region, pIDA, CONFIG.API_MAXAGE.DMH.MULTIPLE_RANKS).then(ranks => {
							lolapi.getMultipleChampionMastery(region, pIDA, CONFIG.API_MAXAGE.DMH.MULTIPLE_MASTERIES).then(masteries => {
								lolapi.getMultipleSummonerFromSummonerID(region, pIDA, CONFIG.API_MAXAGE.DMH.OTHER_SUMMONER_ID).then(pSA => {
									lolapi.checkVerifiedAccount(msg.author.id, result.puuid, region).then(verified => {
										request_profiler.begin("generating embed");
										embedgenerator.detailedMatch(CONFIG, result, matchhistory.matches[number - 1], match, timeline, ranks, masteries, pSA, verified).then(answer => {
											replyEmbed(answer);
											request_profiler.end("generating embed");
											UTILS.debug("\n" + ctable.getTable(request_profiler.endAllCtable()));
										}).catch(console.error);
									}).catch(console.error);
								}).catch(console.error);
							}).catch(console.error);
						}).catch(console.error);
					}).catch(console.error);
				}).catch(console.error);
			}).catch(console.error);
		}).catch(console.error);
	});
	commandGuessUsername(forcePrefix(["championmastery ", "mastery "]), false, (index, region, username, parameter) => {
		lolapi.getSummonerIDFromName(region, username, CONFIG.API_MAXAGE.CM.SUMMONER_ID).then(result => {
			Promise.all([lolapi.getChampionMastery(region, result.id, CONFIG.API_MAXAGE.CM.CHAMPION_MASTERY), lolapi.checkVerifiedAccount(msg.author.id, result.puuid, region)]).then(parallel => {
				let cm = parallel[0];
				let verified = parallel[1];
				replyEmbed(embedgenerator.mastery(CONFIG, result, cm, CONFIG.REGIONS_REVERSE[region], verified));
			}).catch(console.error);
		}).catch(console.error);
	});
	commandGuessUsername(forcePrefix(["mmr "]), false, (index, region, username, parameter) => {
		lolapi.getSummonerIDFromName(region, username, CONFIG.API_MAXAGE.MMR_JOKE.SUMMONER_ID).then(result => {
			lolapi.checkVerifiedAccount(msg.author.id, result.puuid, region).then(verified => {
				result.region = region;
				result.guess = username;
				replyEmbed(embedgenerator.mmr(CONFIG, result, verified));
			}).catch(console.error);
		}).catch(console.error);
	});

	if (!msg.PM) {//respondable server message only
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
			preferences.set("auto_opgg", new_setting).then(() => reply(":white_check_mark: " + (new_setting ? "SupportBot will automatically show summoner information when an op.gg link is posted." : "SupportBot will not show summoner information when an op.gg link is posted."))).catch(reply);
		});
		command([preferences.get("prefix") + "setting force-prefix on", preferences.get("prefix") + "setting force-prefix off"], false, CONFIG.CONSTANTS.ADMINISTRATORS, (original, index) => {
			const new_setting = index === 0 ? true : false;
			preferences.set("force_prefix", new_setting).then(() => reply(":white_check_mark: " + (new_setting ? "SupportBot will require prefixes on all LoL commands." : "SupportBot will not require prefixes on all LoL commands."))).catch(reply);
		});
		command([preferences.get("prefix") + "setting release-notifications on", preferences.get("prefix") + "setting release-notifications off"], false, CONFIG.CONSTANTS.ADMINISTRATORS, (original, index) => {
			const new_setting = index === 0 ? true : false;
			preferences.set("release_notifications", new_setting).then(() => reply(":white_check_mark: " + (new_setting ? "SupportBot will show new release notifications." : "SupportBot will not show new release notifications."))).catch(reply);
		});
		command([preferences.get("prefix") + "setting global-feedback on", preferences.get("prefix") + "setting global-feedback off"], false, CONFIG.CONSTANTS.MODERATORS, (original, index) => {
			const new_setting = index === 0 ? true : false;
			preferences.set("feedback_enabled", new_setting).then(() => reply(":white_check_mark: " + (new_setting ? "SupportBot will allow the use of global feedback commands in this server." : "SupportBot will not allow the use of global feedback commands in this server."))).catch(reply);
		});
		command(["supportbot settings reset all"], false, CONFIG.CONSTANTS.ADMINISTRATORS, () => reply(":warning: You are about to reset all the preferences associated with this server. To confirm this action, please send the command: `supportbot settings reset all confirm`"));
		command(["supportbot settings reset all confirm"], false, CONFIG.CONSTANTS.ADMINISTRATORS, () => {
			preferences.resetToDefault().then(() => reply(":white_check_mark: This server's settings were reset to defaults.")).catch(reply);
		});
		command([preferences.get("prefix") + "mail "], true, CONFIG.CONSTANTS.BOTOWNERS, (original, index, parameter) => {
			const uid = parameter.substring(0, parameter.indexOf(" "))
			getUsernameFromUID(uid).then(usertag => {
				sendEmbedToChannel(CONFIG.FEEDBACK.EXTERNAL_CID, embedgenerator.feedback(CONFIG, 5, 1, msg, null, null, usertag));
				wsapi.embedPM(uid, embedgenerator.feedback(CONFIG, 5, 0, msg, null, null, usertag));
			}).catch(console.error);
		});
		command([preferences.get("prefix") + "approve "], true, CONFIG.CONSTANTS.BOTOWNERS, (original, index, parameter) => {
			const mid = parameter;
			if (!UTILS.isInt(mid)) return reply(":x: Message ID not recognizable.");
			msg.channel.fetchMessage(mid).then(approvable => {
				if (approvable.author.id != client.user.id) return reply(":x: Cannot approve messages not sent from this account.");
				const candidate = embedgenerator.reviewFeedback(CONFIG, approvable, msg.author, true);
				if (typeof(candidate) == "number") {
					UTILS.debug(CONFIG.DISCORD_COMMAND_PREFIX + "approve error type " + candidate);
					if (candidate == 1) return reply(":x: No embed found.");
					else return reply(":x: This type of message is not approvable.");
				}
				else {//success
					wsapi.embedPM(candidate.to_user_uid, candidate.to_user);//notify user of success
					approvable.edit({ embed: candidate.edit });//change internal feedback message
					sendEmbedToChannel(candidate.to_public_cid, candidate.to_public);//publish to public feedback channel
				}
			}).catch(e => reply(":x: Could not find the message. Check permissions and message id."));
		});
		command([preferences.get("prefix") + "deny "], true, CONFIG.CONSTANTS.BOTOWNERS, (original, index, parameter) => {
			const mid = parameter;
			if (!UTILS.isInt(mid)) return reply(":x: Message ID not recognizable.");
			msg.channel.fetchMessage(mid).then(approvable => {
				if (approvable.author.id != client.user.id) return reply(":x: Cannot approve messages not sent from this account.");
				const candidate = embedgenerator.reviewFeedback(CONFIG, approvable, msg.author, false);
				if (typeof(candidate) == "number") {
					UTILS.debug(CONFIG.DISCORD_COMMAND_PREFIX + "deny error type " + candidate);
					if (candidate == 1) return reply(":x: No embed found.");
					else return reply(":x: This type of message is not approvable.");
				}
				else {//success
					//do not notify user of success
					approvable.edit({ embed: candidate.edit });//change internal feedback message
					//do not publish to public feedback channel
				}
			}).catch(e => reply(":x: Could not find the message. Check permissions and message id."));
		});
	}
	else {//PM/DM only
		command([preferences.get("prefix") + "say "], true, false, (original, index, parameter) => {
			lolapi.userHistory(msg.author.id).then(uH => {
				sendEmbedToChannel(CONFIG.FEEDBACK.EXTERNAL_CID, embedgenerator.feedback(CONFIG, 0, 1, msg, uH[msg.author.id]));
				reply(":e_mail: Message delivered.");
			});
		});
	}

	function command(trigger_array,//array of command aliases, prefix needs to be included
		parameters_expected,//boolean
		elevated_permissions,//requires owner permissions
		callback,//optional callback only if successful
		options = {
			external: true,
			immediatePRL: true
		}) {//external call means not inside commandGuessUsername & commandGuessUsernameNumber
		UTILS.defaultObjectValues({external: true, immediatePRL: true}, options);
		for (let i = 0; i < trigger_array.length; ++i) {
			if (parameters_expected && msg.content.trim().toLowerCase().substring(0, trigger_array[i].length) === trigger_array[i].toLowerCase()) {
				if (options.external && options.immediatePRL && !processRateLimit()) return false;
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
						return true;
					}
				}
			}
			else if (!parameters_expected && msg.content.trim().toLowerCase() === trigger_array[i].toLowerCase()) {
				if (options.external && options.immediatePRL && !processRateLimit()) return false;
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
						return true;
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
					if (!processRateLimit()) return false;
					if (msg.mentions.users.size == 1) {
						lolapi.getLink(msg.mentions.users.first().id).then(result => {
							let username = msg.mentions.users.first().username;//suppose the link doesn't exist in the database
							if (UTILS.exists(result.username) && result.username != "") username = result.username;//link exists
							callback(index, region, username, parameter, 4);
						}).catch(console.error);
					}
					else if (parameter.substring(parameter.indexOf(" ") + 1)[0] == "$") {
						lolapi.getShortcut(msg.author.id, parameter.substring(parameter.indexOf(" ") + 1).toLowerCase().substring(1)).then(result => {
							callback(index, region, result[parameter.substring(parameter.indexOf(" ") + 1).toLowerCase().substring(1)], parameter.substring(0, parameter.indexOf(" ")), 1);
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
									msgs[i].embeds[0].author.url.substring(msgs[i].embeds[0].author.url.indexOf(".") + 1, msgs[i].embeds[0].author.url.indexOf(".") + 25) == "op.gg/summoner/userName=") {//https://na.op.gg/summoner/userName=iaace
									username = decodeURIComponent(msgs[i].embeds[0].author.url.substring(msgs[i].embeds[0].author.url.indexOf("/summoner/userName=") + 19));
									break;
								}
							}
							if (!UTILS.exists(username)) reply(":x: Could not find a recent username queried.");
							else callback(index, region, username, parameter.substring(0, parameter.indexOf(" ")), 5);
						}).catch(console.error);
					}
					else callback(index, region, parameter.substring(parameter.indexOf(" ") + 1), parameter.substring(0, parameter.indexOf(" ")), 0);
					return true;
				}
			}
			catch (e) {//username not provided
				try {
					const region = assertRegion(parameter, false);
					if (!processRateLimit()) return false;
					lolapi.getLink(msg.author.id).then(result => {
						let username = msg.author.username;//suppose the link doesn't exist in the database
						if (UTILS.exists(result.username) && result.username != "") {
							username = result.username;//link exists
							callback(index, region, username, parameter, 2);
						}
						else callback(index, region, username, parameter, 3);
					}).catch(console.error);
					return true;
				}
				catch (e) { return false; }
			}
		}, {external: false});
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
			if (isNaN(number)) return false;
			try {//username explicitly provided
				const region = assertRegion(parameter.substring(parameter.indexOfInstance(" ", 1) + 1, parameter.indexOfInstance(" ", 2)), false);//see if there is a region
				if (!processRateLimit()) return false;
				if (parameter.substring(parameter.indexOfInstance(" ", 2) + 1).length < 35) {//longest query should be less than 35 characters
					if (msg.mentions.users.size == 1) {
						lolapi.getLink(msg.mentions.users.first().id).then(result => {
							let username = msg.mentions.users.first().username;//suppose the link doesn't exist in the database
							if (UTILS.exists(result.username) && result.username != "") username = result.username;//link exists
							callback(index, region, username, number, 4);
						}).catch(console.error);
					}
					else if (parameter.substring(parameter.indexOfInstance(" ", 2) + 1)[0] == "$") {
						lolapi.getShortcut(msg.author.id, parameter.substring(parameter.indexOfInstance(" ", 2) + 1).toLowerCase().substring(1)).then(result => {
							callback(index, region, result[parameter.substring(parameter.indexOfInstance(" ", 2) + 1).toLowerCase().substring(1)], number, 1);
						}).catch(e => {
							if (e) reply(":x: An error has occurred. The shortcut may not exist.");
						});
					}
					else if (parameter.substring(parameter.indexOfInstance(" ", 2) + 1) == "^") {
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
							else callback(index, region, username, number, 5);
						}).catch(console.error);
					}
					else callback(index, region, parameter.substring(parameter.indexOfInstance(" ", 2) + 1), number, 0);
					return true;
				}
			}
			catch (e) {//username not provided
				try {
					const region = assertRegion(parameter.substring(parameter.indexOf(" ") + 1), false);
					if (!processRateLimit()) return false;
					lolapi.getLink(msg.author.id).then(result => {
						let username = msg.author.username;//suppose the link doesn't exist in the database
						if (UTILS.exists(result.username) && result.username != "") {
							username = result.username;//link exists
							callback(index, region, username, number, 2);
						}
						else callback(index, region, username, number, 3);
						return true;
					}).catch(console.error);
				}
				catch (e) { return false; }
			}
		}, {external: false});
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
		else {//retrieve access level for a different user
			const other_ACCESS_LEVEL = UTILS.accessLevel(CONFIG, msg);
			return other_ACCESS_LEVEL >= PLEVEL;//never notifies
		}
	}
	function isOwner(candidate = msg.author.id, notify = true) {
		const answer = UTILS.exists(CONFIG.OWNER_DISCORD_IDS[candidate]) && CONFIG.OWNER_DISCORD_IDS[candidate].active;
		if (!answer) {
			printMessage("insufficient permissions");
			if (notify) msg.channel.send(":x: Owner permissions required. Ask for help at " + CONFIG.HELP_SERVER_INVITE_LINK + " .").catch(console.error);
		}
		return answer;
	}
	function reply(reply_text, callback, errorCallback) {
		if (!RL_activated && !processRateLimit()) return;
		if (Array.isArray(reply_text)) {//[{r: string, t: 0}, {}]
			printMessage("reply (" + (new Date().getTime() - msg_receive_time) + "ms): " + reply_text[0].r + "\n");
			lolapi.terminate(msg, ACCESS_LEVEL, reply_text[0].r);
			msg.channel.send(reply_text[0].r, { split: true }).then((nMsg) => {
				if (UTILS.exists(callback)) callback(nMsg);
				for (let i = 1; i < reply_text.length; ++i) {
					setTimeout(() => {
						nMsg.edit(reply_text[i].r).catch(e => UTILS.debug(e));
					}, reply_text[i].t)
				}
			}).catch((e) => {
				console.error(e);
				if (UTILS.exists(errorCallback)) errorCallback(e);
			});
		}
		else {//just a string
			printMessage("reply (" + (new Date().getTime() - msg_receive_time) + "ms): " + reply_text + "\n");
			lolapi.terminate(msg, ACCESS_LEVEL, reply_text);
			msg.channel.send(reply_text, { split: true }).then((nMsg) => {
				if (UTILS.exists(callback)) callback(nMsg);
			}).catch((e) => {
				console.error(e);
				if (UTILS.exists(errorCallback)) errorCallback(e);
			});
		}
	}

	function replyToAuthor(reply_text, callback, errorCallback) {
		if (!RL_activated && !processRateLimit()) return;
		if (Array.isArray(reply_text)) {//[{r: string, t: 0}, {}]
			printMessage("reply to author (" + (new Date().getTime() - msg_receive_time) + "ms): " + reply_text[0].r + "\n");
			lolapi.terminate(msg, ACCESS_LEVEL, reply_text[0].r);
			msg.author.send(reply_text[0].r, { split: true }).then((nMsg) => {
				if (UTILS.exists(callback)) callback(nMsg);
				for (let i = 1; i < reply_text.length; ++i) {
					setTimeout(() => {
						nMsg.edit(reply_text[i].r).catch(e => UTILS.debug(e));
					}, reply_text[i].t)
				}
			}).catch((e) => {
				console.error(e);
				if (UTILS.exists(errorCallback)) errorCallback(e);
			});
		}
		else {
			printMessage("reply to author (" + (new Date().getTime() - msg_receive_time) + "ms): " + reply_text + "\n");
			lolapi.terminate(msg, ACCESS_LEVEL, reply_text);
			msg.author.send(reply_text, { split: true }).then((nMsg) => {
				if (UTILS.exists(callback)) callback(nMsg);
			}).catch((e) => {
				console.error(e);
				if (UTILS.exists(errorCallback)) errorCallback(e);
			});
		}
	}

	function replyEmbed(reply_embed, callback, errorCallback) {
		if (!RL_activated && !processRateLimit()) return;
		if (!msg.PM && !msg.channel.permissionsFor(client.user).has(["EMBED_LINKS"])) {//doesn't have permission to embed links in server
			lolapi.terminate(msg, ACCESS_LEVEL, ":x: I cannot respond to your request without the \"embed links\" permission.");
			reply(":x: I cannot respond to your request without the \"embed links\" permission.");
		}
		else {//has permission to embed links, or is a DM/PM
			if (Array.isArray(reply_embed)) {//[{r: embed_object, t: 0}, {}]
				printMessage("reply embedded (" + (new Date().getTime() - msg_receive_time) + "ms)\n");
				lolapi.terminate(msg, ACCESS_LEVEL, undefined, reply_embed[0].r);
				msg.channel.send("", { embed: reply_embed[0].r }).then((nMsg) => {
					if (UTILS.exists(callback)) callback(nMsg);
					for (let i = 1; i < reply_embed.length; ++i) {
						setTimeout(() => {
							nMsg.edit("", { embed: reply_embed[i].r }).catch(e => UTILS.debug(e));
						}, reply_embed[i].t);
					}
				}).catch((e) => {
					console.error(e);
					if (UTILS.exists(errorCallback)) errorCallback(e);
				});
			}
			else {
				printMessage("reply embedded (" + (new Date().getTime() - msg_receive_time) + "ms)\n");
				lolapi.terminate(msg, ACCESS_LEVEL, undefined, reply_embed);
				msg.channel.send("", { embed: reply_embed }).then((nMsg) => {
					if (UTILS.exists(callback)) callback(nMsg);
				}).catch((e) => {
					console.error(e);
					if (UTILS.exists(errorCallback)) errorCallback(e);
				});
			}
		}
	}

	function replyEmbedToAuthor(reply_embed, callback, errorCallback) {
		if (!RL_activated && !processRateLimit()) return;
		if (Array.isArray(reply_embed)) {
			printMessage("reply embedded to author (" + (new Date().getTime() - msg_receive_time) + "ms)\n");
			lolapi.terminate(msg, ACCESS_LEVEL, undefined, reply_embed[0].r);
			msg.author.send("", { embed: reply_embed[0].r }).then((nMsg) => {
				if (UTILS.exists(callback)) callback(nMsg);
				for (let i = 1; i < reply_embed.length; ++i) {
					setTimeout(() => {
						nMsg.edit("", { embed: reply_embed[i].r }).catch(e => UTILS.debug(e));
					}, reply_embed[i].t);
				}
			}).catch((e) => {
				console.error(e);
				if (UTILS.exists(errorCallback)) errorCallback(e);
			});
		}
		else {
			printMessage("reply embedded to author (" + (new Date().getTime() - msg_receive_time) + "ms)\n");
			lolapi.terminate(msg, ACCESS_LEVEL, undefined, reply_embed);
			msg.author.send("", { embed: reply_embed }).then((nMsg) => {
				if (UTILS.exists(callback)) callback(nMsg);
			}).catch((e) => {
				console.error(e);
				if (UTILS.exists(errorCallback)) errorCallback(e);
			});
		}
	}

	function printMessage(x = "") {
		let answer = x + "\n";
		const MSG_LEN = 50;
		let ctt;
		if (!msg.PM) {
			ctt = [{ content: msg.id, author: msg.author.id, P: ACCESS_LEVEL, channel: msg.channel.id, guild: msg.guild.id, size_region: msg.guild.memberCount }, { content: msg.cleanContent.substring(0, MSG_LEN), author: msg.author.tag, P: CONFIG.CONSTANTS.PERMISSION_LEVEL_REVERSE[ACCESS_LEVEL], channel: msg.channel.name, guild: msg.guild.name, size_region: msg.guild.region }];
		}
		else {
			ctt = [{ content: msg.id, author: msg.author.id, P: ACCESS_LEVEL, channel: msg.channel.id }, { content: msg.cleanContent.substring(0, MSG_LEN), author: msg.author.tag, P: CONFIG.CONSTANTS.PERMISSION_LEVEL_REVERSE[ACCESS_LEVEL], channel: msg.channel.name }];
		}
		for (let i = MSG_LEN; i < msg.cleanContent.length; i += MSG_LEN) ctt.push({ content: msg.cleanContent.substring(i, i + MSG_LEN) });
		answer += ctable.getTable(ctt);
		UTILS.output(answer);
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
		return preferences.get("force_prefix") ? triggers.map(t => preferences.get("prefix") + t) : triggers;
	}
	function processRateLimit() {
		//return true if valid. return false if limit reached.
		if (is(CONFIG.CONSTANTS.BOTOWNERS, msg.author.id, false)) return true;//owners bypass rate limits
		if (RL_activated) return;
		RL_activated = true;
		let valid = 0;//bitwise
		if (!msg.PM) {
			if (!server_RL.check()) {
				sendToChannel(CONFIG.RATE_LIMIT.CHANNEL_ID, ":no_entry::busts_in_silhouette: Server exceeded rate limit. uID: `" + msg.author.id + "` sID: `" + msg.guild.id + "`\n" + msg.author.tag + " on " + msg.guild.name + " attempted to use: " + msg.cleanContent.substring(0, 50));
				valid += 1;//bit 0
			}
		}
		if (!user_RL.check()) {
			sendToChannel(CONFIG.RATE_LIMIT.CHANNEL_ID, ":no_entry::bust_in_silhouette: User exceeded rate limit. uID: `" + msg.author.id + "` sID: `" + (msg.PM ? "N/A" : msg.guild.id) + "`\n" + msg.author.tag + " on " + (msg.PM ? "N/A" : msg.guild.name) + " attempted to use: " + msg.cleanContent.substring(0, 50));
			valid += 2;//bit 1
		}
		if (valid === 0) {
			if (!msg.PM) server_RL.add();
			user_RL.add();
		}
		else if (valid === 3) {//both rate limits reached
			if (!server_RL.warned && !user_RL.warned) {
				reply(":no_entry::alarm_clock::busts_in_silhouette::bust_in_silhouette: The server and user rate limits have been exceeded. Please wait a while before trying the next command.");
			}
			server_RL.warn();
			user_RL.warn();
		}
		else if (valid === 2) {//user rate limit reached
			if (!user_RL.warned) reply(":no_entry::alarm_clock::bust_in_silhouette: The user rate limits have been exceeded. Please wait a while before trying the next command.");
			user_RL.warn();
		}
		else if (valid === 1) {//server rate limit reached
			if (!server_RL.warned) reply(":no_entry::alarm_clock::busts_in_silhouette: The server rate limits have been exceeded. Please wait a while before trying the next command.");
			server_RL.warn();
		}
		return valid === 0;
	}
	function getUsernameFromUID(uid) {
		return new Promise((resolve, reject) => {
			if (UTILS.isInt(uid)) {
				client.shard.broadcastEval("let candidate_user = this.users.get(\"" + uid + "\"); candidate_user != undefined ? candidate_user.tag : null;").then(possible_usernames => {
					for (let b in possible_usernames) if (UTILS.exists(possible_usernames[b])) return resolve(possible_usernames[b]);
					resolve(uid);
				}).catch(reject);
			}
			else resolve(uid);
		});
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

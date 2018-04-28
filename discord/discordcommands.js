"use strict";
let embedgenerator = new (require("./embedgenerator.js"))();
let textgenerator = new (require("./textgenerator.js"))();
let child_process = require("child_process");
const UTILS = new (require("../utils.js"))();
let LOLAPI = require("./lolapi.js");
let request_id = 1;
module.exports = function (CONFIG, client, mode, msg, db) {
	if (msg.author.bot || msg.author.id === client.user.id) return;//ignore all messages from [BOT] users and own messages

	++request_id;
	const msg_receive_time = new Date().getTime();
	let lolapi = new LOLAPI(CONFIG, mode, request_id);
	if ((UTILS.exists(msg.guild) && msg.channel.permissionsFor(client.user).has(["VIEW_CHANNEL", "SEND_MESSAGES"])) || !UTILS.exists(msg.guild)) {//respondable server message or PM
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
		command([CONFIG.DISCORD_COMMAND_PREFIX + "notify "], true, true, (original, index, parameter) => {
			const notification = embedgenerator.notify(CONFIG, parameter, msg.author);
			client.guilds.forEach((g) => {
				let candidate = UTILS.preferredTextChannel(client, g.channels, "text", ["general", "bot", "bots", "bot-commands", "botcommands", "lol", "league", "spam"], ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS"]);
				if (UTILS.exists(candidate)) candidate.send("", { embed: notification }).catch(console.error);
			});
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
			lolapi.getSummonerIDFromName(region, parameter.substring(parameter.indexOf(" ") + 1), CONFIG.API_MAXAGE.LINK).then(result => {
				result.region = region;
				result.guess = parameter.substring(parameter.indexOf(" ") + 1);
				db.addLink(msg.author.id, result).then(() => { reply("Your discord account is now linked to " + result.name); }).catch((e) => { reply("Something went wrong."); throw e; });
			}).catch(console.error);
		});
		command([CONFIG.DISCORD_COMMAND_PREFIX + "unlink", CONFIG.DISCORD_COMMAND_PREFIX + "removelink"], false, false, (original, index) => {
			db.removeLink(msg.author.id).then(result => { reply(result); }).catch(e => { reply("An error has occurred."); throw e; });
		});
		command([CONFIG.DISCORD_COMMAND_PREFIX + "gl", CONFIG.DISCORD_COMMAND_PREFIX + "getlink"], false, false, (original, index) => {
			db.getLink(msg.author.id).then(result => {
				if (UTILS.exists(result)) reply("You're `" + result.name + "`");
				else reply("No records for " + msg.author.id);
			}).catch(console.error);
		});
		/*command([CONFIG.DISCORD_COMMAND_PREFIX + "cs", CONFIG.DISCORD_COMMAND_PREFIX + "cachesize"], false, false, (original, index) => {
			reply("The cache size is " + lolapi.cacheSize());
		});*/
		command([CONFIG.DISCORD_COMMAND_PREFIX + "invite"], false, false, (original, index) => {
			reply("This is the link to add SupportBot to other servers: <" + CONFIG.BOT_ADD_LINK + ">\nAdding it requires the \"Manage Server\" permission.");
		});
		command([CONFIG.DISCORD_COMMAND_PREFIX + "help"], false, false, (original, index) => {
			reply("A PM has been sent to you with information on how to use SupportBot.");
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
			}).catch(() => { reply("No results for `" + username + "`. Please revise your request."); });
		});
		commandGuessUsername(["mh ", "matchhistory "], false, (region, username, parameter) => {
			lolapi.getSummonerIDFromName(region, username, CONFIG.API_MAXAGE.MH.SUMMONER_ID).then(result => {
				result.region = region;
				if (!UTILS.exists(result.accountId)) return reply("No recent matches found for `" + username + "`.");
				lolapi.getRecentGames(region, result.accountId, CONFIG.API_MAXAGE.MH.RECENT_GAMES).then(matchhistory => {
					if (!UTILS.exists(matchhistory.matches) || matchhistory.matches.length == 0) return reply("No recent matches found for `" + username + "`.");
					lolapi.getMultipleMatchInformation(region, matchhistory.matches.map(m => { return m.gameId; }), CONFIG.API_MAXAGE.MH.MULTIPLE_MATCH).then(matches => {
						reply_embed(embedgenerator.match(CONFIG, result, matchhistory.matches, matches));
					}).catch(console.error);
				}).catch(console.error);
			}).catch(console.error);
		});
		/*commandGuessUsername(["lg ", "livegame ", "cg ", "currentgame ", "livematch ", "lm ", "currentmatch ", "cm "], false, (region, username, parameter) => {//old no premade detection
			lolapi.getSummonerIDFromName(region, username, 3600).then(result => {
				result.region = region;
				result.guess = username;
				if (!UTILS.exists(result.id)) return reply("No current matches found for `" + username + "`.");
				lolapi.getLiveMatch(region, result.id, 60).then(match => {
					reply_embed(embedgenerator.liveMatch(CONFIG, result, match));
				}).catch(console.error);
			}).catch(console.error);
		});*/
		commandGuessUsername(["lg ", "livegame ", "cg ", "currentgame ", "livematch ", "lm ", "currentmatch ", "cm "], false, (region, username, parameter) => {//new
			//reply(":warning:We are processing the latest information for your command: if this message does not update within 5 minutes, try the same command again. Thank you for your patience.", nMsg => {
				lolapi.getSummonerIDFromName(region, username, CONFIG.API_MAXAGE.LG.SUMMONER_ID).then(result => {
					result.region = region;
					result.guess = username;
					if (!UTILS.exists(result.id)) return reply("No username found for `" + username + "`.");
					lolapi.getLiveMatch(region, result.id, CONFIG.API_MAXAGE.LG.LIVE_MATCH).then(match => {
						if (UTILS.exists(match.status)) return reply("No current matches found for `" + username + "`.");
						lolapi.getMultipleSummonerFromSummonerID(region, match.participants.map(p => { return p.summonerId; }), CONFIG.API_MAXAGE.LG.OTHER_SUMMONER_ID).then(pSA => {//participant summoner array
							lolapi.getMultipleRecentGames(region, pSA.map(pS => { return pS.accountId; }), CONFIG.API_MAXAGE.LG.RECENT_GAMES).then(mhA => {//matchhistory array
								let mIDA = [];//match id array;
								for (let b in mhA) for (let c in mhA[b].matches) if (mIDA.indexOf(mhA[b].matches[c].gameId) == -1) mIDA.push(mhA[b].matches[c].gameId);
								lolapi.getMultipleMatchInformation(region, mIDA, CONFIG.API_MAXAGE.LG.MULTIPLE_MATCH).then(matches => {
									lolapi.getMultipleRanks(region, pSA.map(p => { return p.id; }), CONFIG.API_MAXAGE.LG.MULTIPLE_RANKS).then(ranks => {
										lolapi.getMultipleChampionMastery(region, pSA.map(p => { return p.id; }), CONFIG.API_MAXAGE.LG.MULTIPLE_MASTERIES).then(masteries => {
											//nMsg.edit("", { embed: embedgenerator.liveMatchPremade(CONFIG, result, match, matches, ranks, masteries, pSA) }).catch();
											reply_embed(embedgenerator.liveMatchPremade(CONFIG, result, match, matches, ranks, masteries, pSA), () => {
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
			lolapi.getSummonerIDFromName(region, username, CONFIG.API_MAXAGE.DMH.SUMMONER_ID).then(result => {
				result.region = region;
				result.guess = username;
				if (!UTILS.exists(result.accountId)) return reply("No recent matches found for `" + username + "`.");
				lolapi.getRecentGames(region, result.accountId, CONFIG.API_MAXAGE.DMH.RECENT_GAMES).then(matchhistory => {
					if (!UTILS.exists(matchhistory.matches) || matchhistory.matches.length == 0) return reply("No recent matches found for `" + username + "`.");
					if (number < 1 || number > 20 || !UTILS.exists(matchhistory.matches[number - 1])) return reply(":x: This number is out of range.");
					lolapi.getMatchInformation(region, matchhistory.matches[number - 1].gameId, CONFIG.API_MAXAGE.DMH.MATCH_INFORMATION).then(match => {
						const pIDA = match.participantIdentities.map(pI => {
							if (UTILS.exists(pI.player.summonerId)) return pI.player.summonerId;
							else return null;//bot account
						});//participant (summoner) ID array
						lolapi.getMultipleRanks(region, pIDA, CONFIG.API_MAXAGE.DMH.MULTIPLE_RANKS).then(ranks => {
							lolapi.getMultipleChampionMastery(region, pIDA, CONFIG.API_MAXAGE.DMH.MULTIPLE_MASTERIES).then(masteries => {
								lolapi.getMultipleSummonerFromSummonerID(region, pIDA, CONFIG.API_MAXAGE.DMH.OTHER_SUMMONER_ID).then(pSA => {
									reply_embed(embedgenerator.detailedMatch(CONFIG, result, matchhistory.matches[number - 1], match, ranks, masteries, pSA));
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
	}
	if (UTILS.exists(msg.guild) && msg.channel.permissionsFor(client.user).has(["VIEW_CHANNEL", "SEND_MESSAGES"])) {//respondable server message only
		command([CONFIG.DISCORD_COMMAND_PREFIX + "shutdown"], false, true, () => {
			reply("shutdown initiated", shutdown, shutdown);
		});
		command([CONFIG.DISCORD_COMMAND_PREFIX + "restart"], false, true, () => {
			reply("restart initiated", restart, restart);
		});
		command([CONFIG.DISCORD_COMMAND_PREFIX + "refresh", CONFIG.DISCORD_COMMAND_PREFIX + "clearcache"], false, true, () => {
			reply("restart initiated + clearing cache", step2, step2);
			function step2() {
				lolapi.clearCache();
				restart();
			}
		});
	}
	else if (!UTILS.exists(msg.guild)) {//PM/DM only
	}

	function command(trigger_array,//array of command aliases, prefix needs to be included
		parameters_expected,//boolean
		elevated_permissions,//requires owner permissions
		callback) {//optional callback only if successful
		for (let i in trigger_array) {
			if (parameters_expected && msg.content.trim().toLowerCase().substring(0, trigger_array[i].length) === trigger_array[i].toLowerCase()) {
				if (elevated_permissions && !UTILS.exists(CONFIG.OWNER_DISCORD_IDS[msg.author.id])) {
					UTILS.output("insufficient permissions");
					print_message();
					msg.channel.send("Owner permissions required. Ask for help.").catch(console.error);
					return false;
				}
				else {
					if (elevated_permissions) client.channels.get(CONFIG.LOG_CHANNEL_ID).send(msg.author.tag + " used " + msg.cleanContent).catch(console.error);
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
				if (elevated_permissions && !UTILS.exists(CONFIG.OWNER_DISCORD_IDS[msg.author.id])) {
					UTILS.output("insufficient permissions");
					print_message();
					msg.channel.send("Owner permissions required. Ask for help.").catch(console.error);
					return false;
				}
				else {
					if (elevated_permissions) client.channels.get(CONFIG.LOG_CHANNEL_ID).send(msg.author.tag + " used " + msg.cleanContent).catch(console.error);
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
							if (e) reply("An error has occurred. The shortcut may not exist.");
						});
					}
					else callback(region, parameter.substring(parameter.indexOf(" ") + 1), parameter.substring(0, parameter.indexOf(" ")));
				}
			}
			catch (e) {//username not provided
				try {
					const region = assert_region(parameter, false);
					db.getLink(msg.author.id).then(result => {
						let username = msg.author.username;//suppose the link doesn't exist in the database
						if (UTILS.exists(result)) username = result.name;//link exists
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
							if (e) reply("An error has occurred. The shortcut may not exist.");
						});
					}
					else callback(region, parameter.substring(UTILS.indexOfInstance(parameter, " ", 2) + 1), number);
				}
			}
			catch (e) {//username not provided
				try {
					const region = assert_region(parameter.substring(parameter.indexOf(" ") + 1), false);
					db.getLink(msg.author.id).then(result => {
						let username = msg.author.username;//suppose the link doesn't exist in the database
						if (UTILS.exists(result)) username = result.name;//link exists
						callback(region, username, number);
					}).catch(console.error);
				}
				catch (e) { }
			}
		});
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
			reply("I cannot respond to your request without the \"embed links\" permission.");
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
		if (UTILS.exists(msg.guild)) UTILS.output("received server message r#" + request_id + " :: " + basic + "\nguild: " + msg.guild.name + " :: " + msg.guild.id);
		else {
			UTILS.output("received PM/DM message r#" + request_id + " :: " + basic);
		}
	}
	function assert_region(test_string, notify = true) {
		if (!UTILS.exists(CONFIG.REGIONS[test_string.toUpperCase()])) {
			if (notify) reply("You need to specify a region.");
			throw new Error("Region not specified");
		}
		else {
			return CONFIG.REGIONS[test_string.toUpperCase()];
		}
	}
	function shutdown() {
		client.channels.get(CONFIG.LOG_CHANNEL_ID).send(":x:Shutdown initiated.").catch(console.error);
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
		client.channels.get(CONFIG.LOG_CHANNEL_ID).send(":repeat:Restart initiated.").catch(console.error);
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

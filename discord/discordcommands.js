"use strict";
let embedgenerator = new (require("./embedgenerator.js"))();
let textgenerator = new (require("./textgenerator.js"))();
let child_process = require("child_process");
const UTILS = new (require("../utils.js"))();
module.exports = function (CONFIG, client, lolapi, msg, db) {
	if (msg.author.bot || msg.author.id === client.user.id) return;//ignore all messages from [BOT] users and own messages

	if ((UTILS.exists(msg.guild) && msg.channel.permissionsFor(client.user).has(["READ_MESSAGES", "SEND_MESSAGES"])) || !UTILS.exists(msg.guild)) {//respondable server message or PM
		command([CONFIG.DISCORD_COMMAND_PREFIX + "ping"], false, false, () => {
			reply("command to response time: ", nMsg => textgenerator.ping_callback(msg, nMsg));
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
			lolapi.getSummonerIDFromName(assert_region(parameter.substring(0, parameter.indexOf(" "))), parameter.substring(parameter.indexOf(" ") + 1)).then(result => {
				reply_embed(embedgenerator.summoner(CONFIG, result));
			}).catch(console.error);
		});
		command([CONFIG.DISCORD_COMMAND_PREFIX + "link "], true, false, (original, index, parameter) => {
			let region = assert_region(parameter.substring(0, parameter.indexOf(" ")));
			lolapi.getSummonerIDFromName(region, parameter.substring(parameter.indexOf(" ") + 1)).then(result => {
				result.region = region;
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
		command([CONFIG.DISCORD_COMMAND_PREFIX + "cs", CONFIG.DISCORD_COMMAND_PREFIX + "cachesize"], false, false, (original, index) => {
			reply("The cache size is " + lolapi.cacheSize());
		});
		command([CONFIG.DISCORD_COMMAND_PREFIX + "invite"], false, false, (original, index) => {
			reply("This is the link to add SupportBot to other servers: <" + CONFIG.BOT_ADD_LINK + ">\nAdding it requires the \"Manage Server\" permission.");
		});
		command([CONFIG.DISCORD_COMMAND_PREFIX + "help"], false, false, (original, index) => {
			reply_embed(embedgenerator.help(CONFIG));
		});
		command(["http://"], true, false, (original, index, parameter) => {
			const region = assert_region(parameter.substring(0, parameter.indexOf(".")), false);
			if (parameter.substring(parameter.indexOf(".") + 1, parameter.indexOf(".") + 6) == "op.gg") {
				let username = decodeURIComponent(msg.content.substring(msg.content.indexOf("userName=") + "userName=".length));
				lolapi.getSummonerIDFromName(region, username).then(result => {
					result.region = region;
					lolapi.getRanks(region, result.id).then(result2 => {
						lolapi.getChampionMastery(region, result.id).then(result3 => {
							reply_embed(embedgenerator.detailedSummoner(CONFIG, result, result2, result3, parameter));
						}).catch(console.error);
					}).catch(console.error);
				}).catch(console.error);
			}
		});
		command(["service status ", "servicestatus ", "ss ", "status "], true, false, (original, index, parameter) => {
			let region = assert_region(parameter);
			lolapi.getStatus(region).then((status_object) => {
				reply_embed(embedgenerator.status(status_object));
			}).catch(console.error);
		});
		commandGuessUsername([""], false, (region, username, parameter) => {
			lolapi.getSummonerIDFromName(region, username).then(result => {
				result.region = region;
				lolapi.getRanks(region, result.id).then(result2 => {
					lolapi.getChampionMastery(region, result.id).then(result3 => {
						reply_embed(embedgenerator.detailedSummoner(CONFIG, result, result2, result3, parameter));
					});
				}).catch(console.error);
			}).catch();
		});
		commandGuessUsername(["mh ", "matchhistory "], false, (region, username, parameter) => {
			lolapi.getSummonerIDFromName(region, username).then(result => {
				result.region = region;
				lolapi.getRecentGames(region, result.accountId).then(matchhistory => {
					if (!UTILS.exists(matchhistory.matches) || matchhistory.matches.length == 0) reply("No recent matches found for `" + username + "`.");
					lolapi.getMultipleMatchInformation(region, matchhistory.matches.map(m => { return m.gameId; }).slice(0, 5)).then(matches => {
						reply_embed(embedgenerator.match(CONFIG, result, matchhistory.matches, matches));
					});
				});
			});
		});
		commandGuessUsername(["lg ", "livegame ", "cg ", "currentgame ", "livematch ", "lm ", "currentmatch ", "cm "], false, (region, username, parameter) => {
			lolapi.getSummonerIDFromName(region, username).then(result => {
				result.region = region;
				lolapi.getLiveMatch(region, result.id).then(match => {
					reply_embed(embedgenerator.liveMatch(CONFIG, result, match));
				});
			});
		});
		commandGuessUsernameNumber(["mh", "matchhistory"], false, (region, username, number) => {
			lolapi.getSummonerIDFromName(region, username).then(result => {
				result.region = region;
				lolapi.getRecentGames(region, result.accountId).then(matchhistory => {
					if (!UTILS.exists(matchhistory.matches) || matchhistory.matches.length == 0) reply("No recent matches found for `" + username + "`.");
					if (number < 1 || number > 20 || !UTILS.exists(matchhistory.matches[number - 1])) {
						reply(":x: This number is out of range.");
						return;
					}
					lolapi.getMatchInformation(region, matchhistory.matches[number - 1].gameId).then(match => {
						reply_embed(embedgenerator.detailedMatch(CONFIG, result, matchhistory.matches[number - 1], match));
					});
				});
			});
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
	if (UTILS.exists(msg.guild) && msg.channel.permissionsFor(client.user).has(["READ_MESSAGES", "SEND_MESSAGES"])) {//respondable server message only
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
		command(trigger_array, true, elevated_permissions, (original, index, parameter) => {
			try {//username provided
				const region = assert_region(parameter.substring(0, parameter.indexOf(" ")), false);//see if there is a region
				if (parameter.substring(parameter.indexOf(" ") + 1).length < 35) callback(region, parameter.substring(parameter.indexOf(" ") + 1), parameter.substring(0, parameter.indexOf(" ")));
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
		command(trigger_array, true, elevated_permissions, (original, index, parameter) => {
			const number = parseInt(parameter.substring(0, parameter.indexOf(" ")));
			if (isNaN(number)) return;
			try {//username provided
				const region = assert_region(parameter.substring(UTILS.indexOfInstance(parameter, " ", 1) + 1, UTILS.indexOfInstance(parameter, " ", 2)), false);//see if there is a region
				if (parameter.substring(UTILS.indexOfInstance(parameter, " ", 2) + 1).length < 35) callback(region, parameter.substring(UTILS.indexOfInstance(parameter, " ", 2) + 1), number);
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
		console.log("reply: " + reply_text + "\n");
		msg.channel.send(reply_text, { split: true }).then((nMsg) => {
			if (UTILS.exists(callback)) callback(nMsg);
		}).catch((e) => {
			console.error(e);
			if (UTILS.exists(error_callback)) error_callback(e);
		});
	}

	function reply_embed(reply_embed, callback, error_callback) {
		if (UTILS.exists(msg.guild) && !msg.channel.permissionsFor(client.user).has(["EMBED_LINKS"])) {//doesn't have permission to embed links in server
			reply("I cannot respond to your request without the \"embed links\" permission.");
		}
		else {//has permission to embed links, or is a DM/PM
			print_message();
			console.log("reply embedded\n");
			msg.channel.send("", { embed: reply_embed }).then((nMsg) => {
				if (UTILS.exists(callback)) callback(nMsg);
			}).catch((e) => {
				console.error(e);
				if (UTILS.exists(error_callback)) error_callback(e);
			});
		}
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

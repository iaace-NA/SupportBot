"use strict";
let embedgenerator = new (require("./embedgenerator.js"))();
let textgenerator = new (require("./textgenerator.js"))();
let child_process = require("child_process");
const UTILS = new (require("../utils.js"))();
module.exports = function (CONFIG, client, osuapi, msg) {
	if (msg.author.bot || msg.author.id === client.user.id) {//ignore all messages from [BOT] users and own messages
		return;
	}

	if (UTILS.exists(msg.guild) && msg.channel.permissionsFor(client.user).has(["READ_MESSAGES", "SEND_MESSAGES"])) {//server message, can read and write
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
		command([CONFIG.DISCORD_COMMAND_PREFIX + "testembed"], false, false, () => {
			reply_embed(embedgenerator.test());
		});
		command([CONFIG.DISCORD_COMMAND_PREFIX + "shutdown"], false, true, () => {
			reply("shutdown initiated", shutdown, shutdown);
		});
	}
	else {//PM/DM
		command([CONFIG.DISCORD_COMMAND_PREFIX + "ping"], false, false, () => {
			reply("command to response time: ", nMsg => textgenerator.ping_callback(msg, nMsg));
		});
		command([CONFIG.DISCORD_COMMAND_PREFIX + "ping "], true, false, function (original, index, parameter) {
			reply("you said: " + parameter);
		});
		command([CONFIG.DISCORD_COMMAND_PREFIX + "testembed"], false, false, () => {
			reply_embed(embedgenerator.test());
		});
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
					if (UTILS.exists(callback)) {
						callback(trigger_array[i], i, msg.content.trim().substring(trigger_array[i].length));
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
					if (UTILS.exists(callback)) {
						callback(trigger_array[i], i);
					}
					return true;
				}
			}
		}
		return false;
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
		if (UTILS.exists(msg.guild)) {
			UTILS.output("received server message :: " + basic + "\nguild: " + msg.guild.name + " :: " + msg.guild.id);
		}
		else {
			UTILS.output("received PM/DM message :: " + basic);
		}
	}
	function shutdown() {
		client.user.setStatus("invisible").then(step2).catch(step2);
		function step2(e) {
			if (UTILS.exists(e)) {
				console.error(e);
			}
			client.destroy().catch();
			UTILS.output("reached shutdown point");
			setTimeout(function () {
				child_process.spawnSync("pm2", ["stop", "all"]);
			}, 5000);
		}
	}
}
